"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const MonthlyAnalyzer_1 = require("./analyzers/MonthlyAnalyzer");
// Constants
const IST_TIMEZONE = "Asia/Kolkata";
const REQUIRED_HOURS = 8;
const SUSPICIOUS_GAP_HOURS = 4;
const SUSPICIOUS_DURATION_HOURS = 10;
class TimeAnalyzer {
    constructor() {
        this.monthlyAnalyzer = new MonthlyAnalyzer_1.MonthlyAnalyzer();
    }
    analyzeEntries(entries, date) {
        if (!entries || entries.length === 0) {
            return {
                totalHours: 0,
                isMissing: true,
                missingHours: REQUIRED_HOURS,
                suspiciousEntries: null,
            };
        }
        // Sort entries by start time
        const sortedEntries = [...entries].sort((a, b) => (0, moment_timezone_1.default)(a.start).valueOf() - (0, moment_timezone_1.default)(b.start).valueOf());
        let totalHours = 0;
        const suspiciousEntries = [];
        // Debug log for entries analysis
        console.log("Analyzing entries:", {
            totalEntries: entries.length,
            sortedEntries: sortedEntries.map((e) => ({
                start: (0, moment_timezone_1.default)(e.start).format(),
                end: (0, moment_timezone_1.default)(e.end).format(),
                duration: moment_timezone_1.default
                    .duration((0, moment_timezone_1.default)(e.end).diff((0, moment_timezone_1.default)(e.start)))
                    .asHours(),
                description: e.description,
            })),
        });
        // Analyze each entry
        sortedEntries.forEach((entry, index) => {
            const start = (0, moment_timezone_1.default)(entry.start);
            const end = (0, moment_timezone_1.default)(entry.end);
            const duration = moment_timezone_1.default.duration(end.diff(start)).asHours();
            console.log(`Entry ${index + 1} analysis:`, {
                start: start.format(),
                end: end.format(),
                duration,
                runningTotal: totalHours + duration,
            });
            // Add to total hours
            totalHours += duration;
            // Check for suspiciously long entries
            if (duration > SUSPICIOUS_DURATION_HOURS) {
                suspiciousEntries.push({
                    type: "long_duration",
                    entry,
                    duration,
                    startTime: start.format("HH:mm"),
                    endTime: end.format("HH:mm"),
                });
            }
            // Check for suspicious gaps between entries
            if (index > 0) {
                const prevEnd = (0, moment_timezone_1.default)(sortedEntries[index - 1].end);
                const gap = moment_timezone_1.default.duration(start.diff(prevEnd)).asHours();
                if (gap > SUSPICIOUS_GAP_HOURS) {
                    suspiciousEntries.push({
                        type: "large_gap",
                        before: sortedEntries[index - 1],
                        after: entry,
                        gap,
                        gapStartTime: prevEnd.format("HH:mm"),
                        gapEndTime: start.format("HH:mm"),
                    });
                }
            }
        });
        // Check for insufficient total hours (only if some hours were logged)
        if (totalHours > 0 && totalHours < REQUIRED_HOURS) {
            suspiciousEntries.push({
                type: "insufficient_hours",
                totalHours,
                missingHours: REQUIRED_HOURS - totalHours,
            });
        }
        return {
            totalHours: Math.round(totalHours * 100) / 100,
            isMissing: totalHours === 0, // Changed to only true when no hours logged
            missingHours: Math.max(0, REQUIRED_HOURS - totalHours),
            suspiciousEntries: suspiciousEntries.length > 0 ? suspiciousEntries : null,
        };
    }
    calculateTotalHours(entries) {
        if (!entries || entries.length === 0) {
            return 0;
        }
        return entries.reduce((total, entry) => {
            const start = (0, moment_timezone_1.default)(entry.start);
            const end = (0, moment_timezone_1.default)(entry.end);
            const duration = moment_timezone_1.default.duration(end.diff(start));
            return total + duration.asHours();
        }, 0);
    }
    analyzeMonthlyEntries(entries, user) {
        return this.monthlyAnalyzer.analyzeEntries(entries, user);
    }
    groupByTeam(results, teams) {
        const teamResults = {
            teams: {},
            grandTotal: 0,
        };
        // Initialize teams
        Object.entries(teams).forEach(([teamId, team]) => {
            teamResults.teams[teamId] = {
                name: team.name,
                totalHours: 0,
                members: [],
            };
        });
        // Group results by team
        results.forEach((result) => {
            const team = result.team;
            if (team && teamResults.teams[team]) {
                teamResults.teams[team].members.push({
                    name: result.user,
                    hours: result.totalHours || 0,
                });
                teamResults.teams[team].totalHours += result.totalHours || 0;
                teamResults.grandTotal += result.totalHours || 0;
            }
        });
        // Round all numbers
        teamResults.grandTotal = Math.round(teamResults.grandTotal * 100) / 100;
        Object.values(teamResults.teams).forEach((team) => {
            team.totalHours = Math.round(team.totalHours * 100) / 100;
            team.members.forEach((member) => {
                member.hours = Math.round(member.hours * 100) / 100;
            });
        });
        return teamResults;
    }
}
exports.default = new TimeAnalyzer();
//# sourceMappingURL=TimeAnalyzer.js.map