"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyFormatter = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const BaseFormatter_1 = require("./BaseFormatter");
class MonthlyFormatter extends BaseFormatter_1.BaseFormatter {
    formatReport(results, monthDate, totalExpectedHours) {
        const blocks = [];
        const monthStr = (0, moment_timezone_1.default)(monthDate).format("MMMM YYYY");
        // Add header
        blocks.push(this.createHeaderBlock(`📊 Time Entry Summary for ${monthStr}`));
        // Add expected hours subtitle
        blocks.push(this.createSectionBlock(`⏳ Expected Hours: ${totalExpectedHours}`));
        // Add divider after subtitle
        blocks.push(this.createDividerBlock());
        // Add team sections
        Object.entries(results.teams).forEach(([teamId, team]) => {
            if (team.members.length === 0)
                return;
            // Team header with total hours
            const teamEmoji = this.getTeamEmoji(teamId);
            blocks.push(this.createSectionBlock(`${teamEmoji} *${team.name}* (${team.totalHours} hours)`));
            // Team members
            const membersList = team.members
                .sort((a, b) => b.hours - a.hours) // Sort by hours descending
                .map((member) => `• ${member.name} (${member.hours} hours)`)
                .join("\n");
            if (membersList) {
                blocks.push(this.createSectionBlock(membersList));
                blocks.push(this.createDividerBlock());
            }
        });
        // Add grand total
        blocks.push(this.createSectionBlock(`💫 *Total Hours: ${results.grandTotal}*`));
        // Add footer
        blocks.push(this.createContextBlock(`⏰ Report generated at ${(0, moment_timezone_1.default)()
            .tz("Asia/Kolkata")
            .format("HH:mm")} IST`));
        return blocks;
    }
    getTeamEmoji(teamId) {
        const emojis = {
            teamAlpha: "🔵",
            teamBravo: "🟣",
            teamCharlie: "🟡",
            teamDelta: "🟢",
            teamMobileApp: "📱",
            teamZenuProject: "⭐",
            teamInfra: "🔧",
            teamDataAndAnalytics: "📊",
        };
        return emojis[teamId] || "📌";
    }
}
exports.MonthlyFormatter = MonthlyFormatter;
//# sourceMappingURL=MonthlyFormatter.js.map