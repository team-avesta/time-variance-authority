const moment = require("moment-timezone");
const MonthlyAnalyzer = require("./analyzers/MonthlyAnalyzer");

class TimeAnalyzer {
  constructor() {
    this.IST_TIMEZONE = "Asia/Kolkata";
    this.REQUIRED_HOURS = 8;
    this.SUSPICIOUS_GAP_HOURS = 4;
    this.SUSPICIOUS_DURATION_HOURS = 10;
    this.monthlyAnalyzer = new MonthlyAnalyzer();
  }

  analyzeEntries(entries, date) {
    if (!entries || entries.length === 0) {
      return { totalHours: 0, suspiciousEntries: [] };
    }

    const sortedEntries = [...entries].sort((a, b) =>
      moment(a.start).diff(moment(b.start))
    );
    const suspiciousEntries = [];
    let totalHours = 0;

    // Calculate total hours for entries
    sortedEntries.forEach((entry) => {
      const startMoment = moment.tz(entry.start, this.IST_TIMEZONE);
      const endMoment = moment.tz(entry.end, this.IST_TIMEZONE);
      const dayStart = moment.tz(date, this.IST_TIMEZONE).startOf("day");
      const dayEnd = moment.tz(date, this.IST_TIMEZONE).endOf("day");

      // If entry spans midnight, only count hours within the day
      const effectiveStartMoment = startMoment.isBefore(dayStart)
        ? dayStart
        : startMoment;
      const effectiveEndMoment = endMoment.isAfter(dayEnd) ? dayEnd : endMoment;
      const duration = moment
        .duration(effectiveEndMoment.diff(effectiveStartMoment))
        .asHours();

      if (duration > 0) {
        totalHours += duration;
      }
    });

    // Round total hours
    totalHours = Math.round(totalHours);

    // Debug log for entries analysis
    console.log("Analyzing entries:", {
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

      // Check for suspiciously long entries
      if (duration > this.SUSPICIOUS_DURATION_HOURS) {
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
        const prevEnd = moment(sortedEntries[index - 1].end);
        const gap = moment.duration(start.diff(prevEnd)).asHours();

        if (gap > this.SUSPICIOUS_GAP_HOURS) {
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

      // Check for overlapping entries
      if (index > 0) {
        const prevEnd = moment(sortedEntries[index - 1].end);
        if (start.isBefore(prevEnd)) {
          suspiciousEntries.push({
            type: "overlap",
            before: sortedEntries[index - 1],
            after: entry,
            overlapStart: start.format("HH:mm"),
            overlapEnd: prevEnd.format("HH:mm"),
          });
        }
      }
    });

    // Check for insufficient hours only if no other suspicious entries
    if (suspiciousEntries.length === 0 && totalHours < this.REQUIRED_HOURS) {
      suspiciousEntries.push({
        type: "insufficient_hours",
        totalHours,
        missingHours: this.REQUIRED_HOURS - totalHours,
      });
    }

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      isMissing: totalHours === 0,
      missingHours: Math.max(0, this.REQUIRED_HOURS - totalHours),
      suspiciousEntries:
        suspiciousEntries.length > 0 ? suspiciousEntries : null,
    };
  }

  calculateTotalHours(entries) {
    return Math.round(
      entries.reduce((total, entry) => {
        const startMoment = moment.tz(entry.start, this.IST_TIMEZONE);
        const endMoment = moment.tz(entry.end, this.IST_TIMEZONE);
        const dayEnd = startMoment.clone().endOf("day");

        // If entry spans midnight, only count hours until midnight
        const effectiveEndMoment = endMoment.isAfter(dayEnd)
          ? dayEnd
          : endMoment;
        const duration = moment
          .duration(effectiveEndMoment.diff(startMoment))
          .asHours();

        return total + duration;
      }, 0)
    );
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

module.exports = new TimeAnalyzer();
