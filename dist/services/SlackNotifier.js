"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackNotifier = void 0;
const web_api_1 = require("@slack/web-api");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const MonthlyFormatter_1 = require("./formatters/MonthlyFormatter");
class SlackNotifier {
    constructor(token, channelId) {
        this.client = new web_api_1.WebClient(token);
        this.channelId = channelId;
        this.monthlyFormatter = new MonthlyFormatter_1.MonthlyFormatter();
    }
    async notifyChannel(analysis, date) {
        try {
            const message = this._buildMessage(analysis, date);
            if (!message)
                return null; // No issues to report
            const response = await this.client.chat.postMessage({
                channel: this.channelId,
                text: message,
                blocks: this._buildBlocks(analysis, date),
            });
            return response;
        }
        catch (error) {
            console.error("Error sending Slack notification:", error);
            throw error;
        }
    }
    async notifyBulk(results, date) {
        try {
            // Send a summary message for all users
            const summaryBlocks = this._buildSummaryBlocks(results, date);
            const response = await this.client.chat.postMessage({
                channel: this.channelId,
                text: "Time Entry Summary Report",
                blocks: summaryBlocks,
            });
            return response;
        }
        catch (error) {
            console.error("Error sending bulk Slack notification:", error);
            throw error;
        }
    }
    async notifyMonthly(results, monthDate, totalExpectedHours) {
        try {
            const blocks = this.monthlyFormatter.formatReport(results, monthDate, totalExpectedHours);
            const response = await this.client.chat.postMessage({
                channel: this.channelId,
                text: "Monthly Time Entry Summary",
                blocks: blocks,
            });
            return response;
        }
        catch (error) {
            console.error("Error sending monthly Slack notification:", error);
            throw error;
        }
    }
    _buildSummaryBlocks(results, date) {
        const blocks = [];
        const dateStr = (0, moment_timezone_1.default)(date).format("dddd, MMMM D, YYYY");
        // Header
        blocks.push({
            type: "header",
            text: {
                type: "plain_text",
                text: `Time Entry Summary for ${dateStr}`,
                emoji: true,
            },
        });
        // Missing entries section (only for those with no entries)
        const missingEntries = results.filter((r) => r.isMissing);
        if (missingEntries.length > 0) {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "🔔 *Missing Time Entries*",
                },
            });
            missingEntries.forEach((result) => {
                blocks.push({
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `• ${result.user}`,
                    },
                });
            });
        }
        // Suspicious entries section
        const suspiciousEntries = results.filter((r) => r.suspiciousEntries && r.suspiciousEntries.length > 0);
        if (suspiciousEntries.length > 0) {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "⚠️ *Suspicious Entries*",
                },
            });
            suspiciousEntries.forEach((result) => {
                var _a;
                (_a = result.suspiciousEntries) === null || _a === void 0 ? void 0 : _a.forEach((entry) => {
                    var _a, _b;
                    let issueText = "";
                    if (entry.type === "long_duration") {
                        issueText = `• ${result.user} - Long duration entry detected (${(_a = entry.duration) === null || _a === void 0 ? void 0 : _a.toFixed(1)} hours)`;
                    }
                    else if (entry.type === "large_gap") {
                        issueText = `• ${result.user} - Large gap detected between entries (${entry.gapStartTime} to ${entry.gapEndTime})`;
                    }
                    else if (entry.type === "insufficient_hours") {
                        issueText = `• ${result.user} - Short duration entry detected (${(_b = entry.totalHours) === null || _b === void 0 ? void 0 : _b.toFixed(1)} hours)`;
                    }
                    blocks.push({
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: issueText,
                        },
                    });
                });
            });
        }
        // Add divider
        blocks.push({ type: "divider" });
        // Footer
        blocks.push({
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `Report generated at ${(0, moment_timezone_1.default)()
                        .tz("Asia/Kolkata")
                        .format("HH:mm")} IST`,
                },
            ],
        });
        return blocks;
    }
    _buildMessage(analysis, date) {
        const parts = [];
        const dateStr = (0, moment_timezone_1.default)(date).format("dddd, MMMM D, YYYY");
        if (analysis.isMissing && analysis.missingHours !== undefined) {
            parts.push(`🔔 *Missing Hours Alert*\nYou logged ${analysis.totalHours} hours on ${dateStr}. Required: ${analysis.missingHours} more hours.`);
        }
        if (analysis.suspiciousEntries) {
            analysis.suspiciousEntries.forEach((entry) => {
                if (entry.type === "long_duration" && entry.duration !== undefined) {
                    parts.push(`⚠️ *Long Duration Entry*\nAn entry on ${dateStr} is ${entry.duration.toFixed(1)} hours long.`);
                }
                else if (entry.type === "large_gap" && entry.gap !== undefined) {
                    parts.push(`⚠️ *Large Gap Detected*\nThere's a ${entry.gap.toFixed(1)} hour gap between entries on ${dateStr}.`);
                }
            });
        }
        return parts.length > 0 ? parts.join("\n\n") : null;
    }
    _buildBlocks(analysis, date) {
        const blocks = [];
        const dateStr = (0, moment_timezone_1.default)(date).format("dddd, MMMM D, YYYY");
        // Header
        blocks.push({
            type: "header",
            text: {
                type: "plain_text",
                text: `Time Entry Review for ${dateStr}`,
                emoji: true,
            },
        });
        // Summary section
        blocks.push({
            type: "section",
            fields: [
                {
                    type: "mrkdwn",
                    text: `*Hours Logged:*\n${analysis.totalHours}`,
                },
                {
                    type: "mrkdwn",
                    text: `*Status:*\n${analysis.isMissing ? "❌ Incomplete" : "✅ Complete"}`,
                },
            ],
        });
        // Missing hours alert
        if (analysis.isMissing && analysis.missingHours !== undefined) {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `🔔 *Missing Hours Alert*\nYou need to log ${analysis.missingHours.toFixed(1)} more hours for this day.`,
                },
            });
        }
        // Suspicious entries
        if (analysis.suspiciousEntries) {
            analysis.suspiciousEntries.forEach((entry) => {
                var _a;
                if (entry.type === "long_duration" && entry.duration !== undefined) {
                    const text = `⚠️ *Long Duration Entry Detected*\n• Duration: ${entry.duration.toFixed(1)} hours\n• Description: ${((_a = entry.entry) === null || _a === void 0 ? void 0 : _a.description) || "No description"}`;
                    blocks.push({
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text,
                        },
                    });
                }
            });
        }
        return blocks;
    }
}
exports.SlackNotifier = SlackNotifier;
//# sourceMappingURL=SlackNotifier.js.map