import moment from 'moment-timezone';

export interface TimeEntry {
  start: string;
  end: string;
  description?: string;
  project?: string;
  task?: string;
}

// Constants
const REQUIRED_HOURS = 8;
const SUSPICIOUS_GAP_HOURS = 4;
const SUSPICIOUS_DURATION_HOURS = 10;

export interface SuspiciousEntry {
  type: 'long_duration' | 'large_gap' | 'insufficient_hours';
  entry?: TimeEntry;
  duration?: number;
  startTime?: string;
  endTime?: string;
  before?: TimeEntry;
  after?: TimeEntry;
  gap?: number;
  gapStartTime?: string;
  gapEndTime?: string;
  totalHours?: number;
  missingHours?: number;
}

export interface AnalysisResult {
  totalHours: number;
  isMissing: boolean;
  missingHours: number;
  suspiciousEntries: SuspiciousEntry[] | null;
}

interface TeamMember {
  name: string;
  hours: number;
}

interface Team {
  name: string;
  totalHours: number;
  members: TeamMember[];
}

interface TeamResults {
  teams: {
    [key: string]: Team;
  };
  grandTotal: number;
}

interface Teams {
  [key: string]: {
    name: string;
    [key: string]: any;
  };
}

class TimeAnalyzer {
  constructor() {
    // Empty constructor
  }

  analyzeEntries(entries: TimeEntry[]): AnalysisResult {
    if (!entries || entries.length === 0) {
      return {
        totalHours: 0,
        isMissing: true,
        missingHours: REQUIRED_HOURS,
        suspiciousEntries: null,
      };
    }

    // Sort entries by start time
    const sortedEntries = [...entries].sort(
      (a, b) => moment(a.start).valueOf() - moment(b.start).valueOf()
    );

    let totalHours = 0;
    const suspiciousEntries: SuspiciousEntry[] = [];

    // Debug log for entries analysis
    console.log('Analyzing entries:', {
      totalEntries: entries.length,
      sortedEntries: sortedEntries.map((e) => ({
        start: moment(e.start).format(),
        end: moment(e.end).format(),
        duration: moment
          .duration(moment(e.end).diff(moment(e.start)))
          .asHours(),
        description: e.description,
      })),
    });

    // Analyze each entry
    sortedEntries.forEach((entry, index) => {
      const start = moment(entry.start);
      const end = moment(entry.end);
      const duration = moment.duration(end.diff(start)).asHours();

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
          type: 'long_duration',
          entry,
          duration,
          startTime: start.format('HH:mm'),
          endTime: end.format('HH:mm'),
        });
      }

      // Check for suspicious gaps between entries
      if (index > 0) {
        const prevEnd = moment(sortedEntries[index - 1].end);
        const gap = moment.duration(start.diff(prevEnd)).asHours();

        if (gap > SUSPICIOUS_GAP_HOURS) {
          suspiciousEntries.push({
            type: 'large_gap',
            before: sortedEntries[index - 1],
            after: entry,
            gap,
            gapStartTime: prevEnd.format('HH:mm'),
            gapEndTime: start.format('HH:mm'),
          });
        }
      }
    });

    // Check for insufficient total hours (only if some hours were logged)
    if (totalHours > 0 && totalHours < REQUIRED_HOURS) {
      suspiciousEntries.push({
        type: 'insufficient_hours',
        totalHours,
        missingHours: REQUIRED_HOURS - totalHours,
      });
    }

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      isMissing: totalHours === 0, // Changed to only true when no hours logged
      missingHours: Math.max(0, REQUIRED_HOURS - totalHours),
      suspiciousEntries:
        suspiciousEntries.length > 0 ? suspiciousEntries : null,
    };
  }

  groupByTeam(results: any[], teams: Teams): TeamResults {
    const teamResults: TeamResults = {
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

export default new TimeAnalyzer();
