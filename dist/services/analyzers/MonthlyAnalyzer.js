"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyAnalyzer = void 0;
const BaseAnalyzer_1 = require("./BaseAnalyzer");
class MonthlyAnalyzer extends BaseAnalyzer_1.BaseAnalyzer {
    analyzeEntries(entries, user) {
        const totalHours = this.roundHours(this.calculateTotalHours(entries));
        return {
            user: user.name,
            team: user.team,
            totalHours,
        };
    }
    groupByTeam(results) {
        const teamTotals = {};
        let grandTotal = 0;
        results.forEach((result) => {
            if (!teamTotals[result.team]) {
                teamTotals[result.team] = {
                    name: result.team,
                    totalHours: 0,
                    members: [],
                };
            }
            teamTotals[result.team].members.push({
                name: result.user,
                hours: result.totalHours,
            });
            teamTotals[result.team].totalHours += result.totalHours;
            grandTotal += result.totalHours;
        });
        return {
            teams: teamTotals,
            grandTotal: this.roundHours(grandTotal),
        };
    }
}
exports.MonthlyAnalyzer = MonthlyAnalyzer;
//# sourceMappingURL=MonthlyAnalyzer.js.map