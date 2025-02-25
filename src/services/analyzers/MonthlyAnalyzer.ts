import { BaseAnalyzer, TimeEntry } from "./BaseAnalyzer";
import { User } from "../../config/UserConfig";

interface AnalysisResult {
  user: string;
  team: string;
  totalHours: number;
}

interface TeamMember {
  name: string;
  hours: number;
}

interface TeamTotal {
  name: string;
  totalHours: number;
  members: TeamMember[];
}

interface TeamAnalysis {
  teams: {
    [key: string]: TeamTotal;
  };
  grandTotal: number;
}

export class MonthlyAnalyzer extends BaseAnalyzer {
  analyzeEntries(entries: TimeEntry[], user: User): AnalysisResult {
    const totalHours = this.roundHours(this.calculateTotalHours(entries));

    return {
      user: user.name,
      team: user.team,
      totalHours,
    };
  }

  groupByTeam(results: AnalysisResult[]): TeamAnalysis {
    const teamTotals: { [key: string]: TeamTotal } = {};
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
