const moment = require("moment-timezone");
const BaseAnalyzer = require("./BaseAnalyzer");

class MonthlyAnalyzer extends BaseAnalyzer {
  constructor() {
    super();
    this.IST_TIMEZONE = "Asia/Kolkata";
  }

  analyzeEntries(entries, user) {
    if (!entries || entries.length === 0) {
      return {
        totalHours: 0,
        workingDays: 0,
        dailyAverages: {
          actual: 0,
          expected: user?.requiredHours || 8,
        },
        trends: {
          hoursVariance: 0,
        },
      };
    }

    // Sort entries chronologically
    const sortedEntries = [...entries].sort((a, b) =>
      moment(a.start).diff(moment(b.start))
    );

    // Calculate total hours
    let totalHours = 0;
    const dailyHours = new Map();

    sortedEntries.forEach((entry) => {
      const startMoment = moment.tz(entry.start, this.IST_TIMEZONE);
      const endMoment = moment.tz(entry.end, this.IST_TIMEZONE);
      const duration = moment.duration(endMoment.diff(startMoment)).asHours();

      const dateKey = startMoment.format("YYYY-MM-DD");
      dailyHours.set(dateKey, (dailyHours.get(dateKey) || 0) + duration);
      totalHours += duration;
    });

    // Calculate working days (excluding weekends and holidays)
    const workingDays = Array.from(dailyHours.keys()).filter((date) => {
      const momentDate = moment(date);
      const isWeekend = momentDate.day() === 0 || momentDate.day() === 6;
      const isHoliday = process.env.HOLIDAYS?.split(",").includes(date);
      return !isWeekend && !isHoliday;
    }).length;

    // Calculate daily averages
    const actualDailyAverage = workingDays > 0 ? totalHours / workingDays : 0;
    const expectedDailyHours = user?.requiredHours || 8;

    // Calculate trends
    const dailyVariances = Array.from(dailyHours.values()).map((hours) =>
      Math.abs(hours - expectedDailyHours)
    );
    const averageVariance =
      dailyVariances.length > 0
        ? dailyVariances.reduce((sum, variance) => sum + variance, 0) /
          dailyVariances.length
        : 0;

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      workingDays,
      dailyAverages: {
        actual: Math.round(actualDailyAverage * 100) / 100,
        expected: expectedDailyHours,
      },
      trends: {
        hoursVariance: Math.round(averageVariance * 100) / 100,
      },
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

module.exports = MonthlyAnalyzer;
