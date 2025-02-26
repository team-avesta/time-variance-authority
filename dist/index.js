"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const ClockifyClient_1 = require("./services/ClockifyClient");
const TimeAnalyzer_1 = __importDefault(require("./services/TimeAnalyzer"));
const SlackNotifier_1 = require("./services/SlackNotifier");
const UserConfig_1 = __importDefault(require("./config/UserConfig"));
// Constants
const IST_TIMEZONE = "Asia/Kolkata";
// Initialize clients
const clockify = new ClockifyClient_1.ClockifyClient(process.env.CLOCKIFY_API_KEY || "");
const slack = new SlackNotifier_1.SlackNotifier(process.env.SLACK_BOT_TOKEN || "", process.env.SLACK_CHANNEL_ID || "");
const userConfig = new UserConfig_1.default(process.env.USERS);
const handler = async (event) => {
    var _a, _b;
    try {
        console.log("Event:", JSON.stringify(event));
        // Check if this is a monthly report
        const isMonthlyReport = (event === null || event === void 0 ? void 0 : event.reportType) === "monthly";
        // Calculate the time range
        let startTime, endTime, previousWorkday, weekNumber = 0; // Initialize weekNumber
        if (isMonthlyReport) {
            // For monthly report, get data from start of month to current week
            const now = event.testDate
                ? (0, moment_timezone_1.default)(event.testDate).tz("Asia/Kolkata")
                : (0, moment_timezone_1.default)().tz("Asia/Kolkata");
            startTime = now.clone().startOf("month");
            // Calculate week number (1-5) within the month
            weekNumber = Math.ceil(now.date() / 7);
            // End time should be end of the current date to include all entries
            const monthEnd = now.clone().endOf("month");
            endTime = moment_timezone_1.default.min(monthEnd, now.clone().endOf("day"));
            // Calculate working days in this period
            const holidays = (((_a = event.env) === null || _a === void 0 ? void 0 : _a.HOLIDAYS) || process.env.HOLIDAYS || "")
                .split(",")
                .map((d) => d.trim());
            const workingDays = await getWorkingDaysCount(startTime, endTime, holidays);
            console.log("Monthly report timing details:", {
                testDate: event.testDate || "none",
                startTimeIST: startTime.format("YYYY-MM-DD HH:mm:ss Z"),
                endTimeIST: endTime.format("YYYY-MM-DD HH:mm:ss Z"),
                startTimeUTC: startTime.utc().format("YYYY-MM-DD HH:mm:ss Z"),
                endTimeUTC: endTime.utc().format("YYYY-MM-DD HH:mm:ss Z"),
                workingDays,
                holidays,
            });
            previousWorkday = now;
        }
        else {
            // For daily report, get previous working day's data
            previousWorkday = await getPreviousWorkday((0, moment_timezone_1.default)().tz(IST_TIMEZONE), (process.env.HOLIDAYS || "").split(",").map((d) => d.trim()));
            // Keep IST date for business logic but use UTC boundaries for API
            const istDate = previousWorkday.clone();
            startTime = istDate.clone().utc().startOf("day");
            endTime = istDate.clone().utc().endOf("day");
        }
        console.log("Checking time entries:", {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isMonthlyReport,
        });
        // Get users based on report type
        const users = isMonthlyReport
            ? userConfig.getAllUsers() // Get all users for monthly report
            : userConfig.getEnabledUsers(); // Get only enabled users for daily report
        console.log("Selected users for report:", {
            totalUsers: users.length,
            teamCounts: users.reduce((acc, user) => {
                acc[user.team] = (acc[user.team] || 0) + 1;
                return acc;
            }, {}),
            teamCharlieUsers: users
                .filter((user) => user.team === "teamCharlie")
                .map((u) => u.name),
        });
        // Get workspace ID
        const workspaces = await clockify.getWorkspaces();
        const workspaceId = workspaces[0].id;
        console.log("Using workspace:", {
            id: workspaceId,
            users: users.length,
            reportType: isMonthlyReport ? "monthly" : "daily",
        });
        // Process users in batches to respect rate limits
        const batchSize = 5;
        const results = [];
        for (let i = 0; i < users.length; i += batchSize) {
            const userBatch = users.slice(i, i + batchSize);
            console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(users.length / batchSize)}`);
            const batchResults = await Promise.all(userBatch.map(async (user) => {
                try {
                    // Get time entries
                    const entries = await clockify.getTimeEntries(workspaceId, user.id, startTime, endTime);
                    // Format entries for analysis
                    const formattedEntries = entries.map((e) => ({
                        start: e.timeInterval.start,
                        end: e.timeInterval.end,
                        description: e.description || "",
                        project: e.project ? e.project.name : "",
                        task: e.task ? e.task.name : "",
                    }));
                    // Analyze entries
                    const analysis = TimeAnalyzer_1.default.analyzeEntries(formattedEntries, previousWorkday.toDate());
                    return {
                        user: user.name,
                        email: user.email,
                        team: user.team,
                        ...analysis,
                        entries: formattedEntries,
                    };
                }
                catch (error) {
                    console.error(`Error checking user ${user.name}:`, error);
                    return {
                        user: user.name,
                        error: error instanceof Error ? error.message : String(error),
                        totalHours: 0,
                        isMissing: true,
                        missingHours: 8,
                        suspiciousEntries: null,
                    };
                }
            }));
            results.push(...batchResults);
            // Small delay between batches to respect rate limits
            if (i + batchSize < users.length) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
        // Debug log final results before Slack
        console.log("DEBUG - Final results before Slack:", results.map((r) => ({
            user: r.user,
            totalHours: r.totalHours,
            isMissing: r.isMissing,
            missingHours: r.missingHours,
        })));
        // Send notification based on report type
        if (isMonthlyReport) {
            // Group results by team before sending monthly report
            const teams = userConfig.getTeams();
            const groupedResults = TimeAnalyzer_1.default.groupByTeam(results, teams);
            // Calculate total expected hours for the period
            const holidays = (((_b = event.env) === null || _b === void 0 ? void 0 : _b.HOLIDAYS) || process.env.HOLIDAYS || "")
                .split(",")
                .map((d) => d.trim());
            // Use the same date object we used for calculations
            const reportDate = event.testDate
                ? (0, moment_timezone_1.default)(event.testDate).tz("Asia/Kolkata")
                : (0, moment_timezone_1.default)().tz("Asia/Kolkata");
            // Recalculate the date range for this month
            const monthStart = reportDate.clone().startOf("month");
            const monthEnd = reportDate.clone().endOf("month");
            const currentDate = reportDate.clone();
            const finalEndDate = moment_timezone_1.default.min(monthEnd, currentDate);
            const workingDays = await getWorkingDaysCount(monthStart, finalEndDate, holidays);
            const expectedHoursPerDay = 8; // Standard working hours per day
            const totalExpectedHours = workingDays * expectedHoursPerDay;
            console.log("Expected hours calculation:", {
                reportMonth: reportDate.format("MMMM YYYY"),
                startDate: monthStart.format("YYYY-MM-DD"),
                endDate: finalEndDate.format("YYYY-MM-DD"),
                holidays: holidays,
                workingDays: workingDays,
                totalExpectedHours: totalExpectedHours,
            });
            // Send monthly report to Slack with expected hours using the correct date
            await slack.notifyMonthly(groupedResults, reportDate.toDate(), totalExpectedHours);
        }
        else {
            // Send daily report to Slack
            await slack.notifyBulk(results, previousWorkday.toDate());
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: isMonthlyReport
                    ? `Time Entry Summary for ${startTime.format("MMMM YYYY")} (Week ${weekNumber})`
                    : "Daily time entry check completed",
                date: previousWorkday.format("YYYY-MM-DD"),
                dayOfWeek: previousWorkday.format("dddd"),
                checkPeriod: {
                    start: startTime.toISOString(),
                    end: endTime.toISOString(),
                },
                results,
            }),
        };
    }
    catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Error in Time Warden",
                error: error instanceof Error ? error.message : String(error),
            }),
        };
    }
};
exports.handler = handler;
async function checkIfWorkingDay(date, holidays) {
    const dayOfWeek = date.day();
    const dateStr = date.format("YYYY-MM-DD");
    // Check if it's a weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
    }
    // Check if it's a holiday
    if (holidays.includes(dateStr)) {
        return false;
    }
    return true;
}
async function getPreviousWorkday(date, holidays) {
    let currentDate = date.clone().subtract(1, "day");
    while (!(await checkIfWorkingDay(currentDate, holidays))) {
        currentDate.subtract(1, "day");
    }
    return currentDate;
}
async function getWorkingDaysCount(startDate, endDate, holidays) {
    let workingDays = 0;
    let currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate, "day")) {
        if (await checkIfWorkingDay(currentDate, holidays)) {
            workingDays++;
        }
        currentDate.add(1, "day");
    }
    return workingDays;
}
//# sourceMappingURL=index.js.map