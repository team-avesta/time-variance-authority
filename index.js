const moment = require("moment-timezone");
const ClockifyClient = require("./services/ClockifyClient");
const timeAnalyzer = require("./services/TimeAnalyzer");
const SlackNotifier = require("./services/SlackNotifier");
const UserConfig = require("./config/UserConfig");

// Constants
const IST_TIMEZONE = "Asia/Kolkata";

// Initialize clients
const clockify = new ClockifyClient(process.env.CLOCKIFY_API_KEY);
const slack = new SlackNotifier(
  process.env.SLACK_BOT_TOKEN,
  process.env.SLACK_CHANNEL_ID
);
const userConfig = new UserConfig(process.env.USERS);

exports.handler = async (event) => {
  try {
    console.log("Event:", JSON.stringify(event));

    // Check if this is a monthly report
    const isMonthlyReport = event?.reportType === "monthly";

    // Calculate the time range
    let startTime, endTime, previousWorkday, weekNumber;
    if (isMonthlyReport) {
      // For monthly report, get data from start of month to current week
      const now = event.testDate
        ? moment(event.testDate).tz("Asia/Kolkata")
        : moment().tz("Asia/Kolkata");
      startTime = now.clone().startOf("month");

      // Calculate week number (1-5) within the month
      weekNumber = Math.ceil(now.date() / 7);

      // End time should be end of the current date to include all entries
      const monthEnd = now.clone().endOf("month");
      endTime = moment.min(monthEnd, now.clone().endOf("day"));

      // Calculate working days in this period
      const holidays = (event.env?.HOLIDAYS || process.env.HOLIDAYS || "")
        .split(",")
        .map((d) => d.trim());
      const workingDays = getWorkingDaysCount(startTime, endTime, holidays);

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
    } else {
      // For daily report, get previous working day's data
      previousWorkday = getPreviousWorkday(
        moment().tz(IST_TIMEZONE),
        (process.env.HOLIDAYS || "").split(",").map((d) => d.trim())
      );

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
      console.log(
        `Processing batch ${i / batchSize + 1} of ${Math.ceil(
          users.length / batchSize
        )}`
      );

      const batchResults = await Promise.all(
        userBatch.map(async (user) => {
          try {
            // Get time entries
            const entries = await clockify.getTimeEntries(
              workspaceId,
              user.id,
              startTime,
              endTime
            );

            // Format entries for analysis
            const formattedEntries = entries.map((e) => ({
              start: e.timeInterval.start,
              end: e.timeInterval.end,
              description: e.description || "",
              project: e.project ? e.project.name : "",
              task: e.task ? e.task.name : "",
            }));

            // Analyze entries
            const analysis = timeAnalyzer.analyzeEntries(
              formattedEntries,
              previousWorkday
            );

            return {
              user: user.name,
              email: user.email,
              team: user.team,
              ...analysis,
              entries: formattedEntries,
            };
          } catch (error) {
            console.error(`Error checking user ${user.name}:`, error);
            return {
              user: user.name,
              error: error.message,
            };
          }
        })
      );

      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + batchSize < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Debug log final results before Slack
    console.log(
      "DEBUG - Final results before Slack:",
      results.map((r) => ({
        user: r.user,
        totalHours: r.totalHours,
        isMissing: r.isMissing,
        missingHours: r.missingHours,
      }))
    );

    // Send notification based on report type
    if (isMonthlyReport) {
      // Group results by team before sending monthly report
      const teams = userConfig.getTeams();
      const groupedResults = timeAnalyzer.groupByTeam(results, teams);

      // Calculate total expected hours for the period
      const holidays = (event.env?.HOLIDAYS || process.env.HOLIDAYS || "")
        .split(",")
        .map((d) => d.trim());

      // Use the same date object we used for calculations
      const reportDate = event.testDate
        ? moment(event.testDate).tz("Asia/Kolkata")
        : moment().tz("Asia/Kolkata");

      // Recalculate the date range for this month
      const monthStart = reportDate.clone().startOf("month");
      const monthEnd = reportDate.clone().endOf("month");
      const currentDate = reportDate.clone();
      const finalEndDate = moment.min(monthEnd, currentDate);

      const workingDays = getWorkingDaysCount(
        monthStart,
        finalEndDate,
        holidays
      );
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
      await slack.notifyMonthly(groupedResults, reportDate, totalExpectedHours);
    } else {
      // Send daily report to Slack
      await slack.notifyBulk(results, previousWorkday);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: isMonthlyReport
          ? `Time Entry Summary for ${startTime.format(
              "MMMM YYYY"
            )} (Week ${weekNumber})`
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
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error in Time Warden",
        error: error.message,
      }),
    };
  }
};

async function checkIfWorkingDay(date, holidays) {
  const dayOfWeek = date.day();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    return {
      shouldProcess: false,
      reason: "Weekend",
      isWeekend: true,
      isHoliday: false,
    };
  }

  const dateStr = date.format("YYYY-MM-DD");
  const isHoliday = holidays.includes(dateStr);

  if (isHoliday) {
    return {
      shouldProcess: false,
      reason: "Holiday",
      isWeekend: false,
      isHoliday: true,
    };
  }

  return {
    shouldProcess: true,
    reason: "Working Day",
    isWeekend: false,
    isHoliday: false,
  };
}

function getPreviousWorkday(date, holidays) {
  let previousDay = date.clone().subtract(1, "days");
  let attempts = 0; // Add safety counter to prevent infinite loops
  const maxAttempts = 10; // Maximum number of days to look back

  while (
    (previousDay.day() === 0 || // Sunday
      previousDay.day() === 6 || // Saturday
      holidays.includes(previousDay.format("YYYY-MM-DD"))) &&
    attempts < maxAttempts
  ) {
    previousDay.subtract(1, "days");
    attempts++;
  }

  console.log("getPreviousWorkday details:", {
    startDate: date.format("YYYY-MM-DD"),
    foundPreviousDay: previousDay.format("YYYY-MM-DD"),
    attempts: attempts,
    isWeekend: previousDay.day() === 0 || previousDay.day() === 6,
    isHoliday: holidays.includes(previousDay.format("YYYY-MM-DD")),
  });

  return previousDay;
}

function getWorkingDaysCount(startDate, endDate, holidays) {
  let count = 0;
  let current = startDate.clone();

  while (current.isSameOrBefore(endDate, "day")) {
    // Check if it's not a weekend and not a holiday
    if (
      current.day() !== 0 &&
      current.day() !== 6 &&
      !holidays.includes(current.format("YYYY-MM-DD"))
    ) {
      count++;
    }
    current.add(1, "day");
  }
  return count;
}
