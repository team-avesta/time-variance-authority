const moment = require("moment-timezone");

class SlackMessageFormatter {
  constructor() {
    this.IST_TIMEZONE = "Asia/Kolkata";
  }

  formatDailyReport(results, date) {
    const parts = [];
    const dateStr = moment(date).format("dddd, MMMM D, YYYY");

    // Add header
    parts.push(`Time Entry Summary for ${dateStr}`);

    // Add missing entries section
    if (results.missing && results.missing.length > 0) {
      parts.push(":bell: Missing Time Entries");
      results.missing.forEach((entry) => {
        parts.push(`• ${entry.user}`);
      });
    }

    // Add suspicious entries section
    if (results.suspicious && results.suspicious.length > 0) {
      parts.push(":warning: Suspicious Entries");
      results.suspicious.forEach((entry) => {
        let message = `• ${entry.user} - `;
        switch (entry.type) {
          case "insufficient_hours":
            message += `Short duration entry detected (${entry.totalHours.toFixed(
              1
            )} hours)`;
            break;
          case "long_duration":
            message += `Long duration entry detected (${entry.duration.toFixed(
              1
            )} hours)`;
            break;
          case "large_gap":
            message += `Large gap detected between entries (${entry.gapStartTime} to ${entry.gapEndTime})`;
            break;
          case "overlap":
            message += `Overlapping entries detected (${entry.overlapStart} to ${entry.overlapEnd})`;
            break;
        }
        parts.push(message);
      });
    }

    // If no issues found
    if (
      (!results.missing || results.missing.length === 0) &&
      (!results.suspicious || results.suspicious.length === 0)
    ) {
      parts.push("No issues found.");
    }

    return parts.join("\n");
  }

  formatByTeam(results, date) {
    const parts = [];
    const dateStr = moment(date).format("dddd, MMMM D, YYYY");

    // Add header
    parts.push(`Time Entry Summary for ${dateStr}`);

    // Group missing entries by team
    if (results.missing && results.missing.length > 0) {
      parts.push(":bell: Missing Time Entries");

      const teamGroups = {};
      results.missing.forEach((entry) => {
        if (!teamGroups[entry.team]) {
          teamGroups[entry.team] = [];
        }
        teamGroups[entry.team].push(entry.user);
      });

      Object.entries(teamGroups).forEach(([team, users]) => {
        parts.push(`${team}:`);
        users.forEach((user) => {
          parts.push(`• ${user}`);
        });
      });
    }

    // Group suspicious entries by team
    if (results.suspicious && results.suspicious.length > 0) {
      parts.push(":warning: Suspicious Entries");

      const teamGroups = {};
      results.suspicious.forEach((entry) => {
        if (!teamGroups[entry.team]) {
          teamGroups[entry.team] = [];
        }
        teamGroups[entry.team].push({
          user: entry.user,
          type: entry.type,
          details: this._formatSuspiciousEntry(entry),
        });
      });

      Object.entries(teamGroups).forEach(([team, entries]) => {
        parts.push(`${team}:`);
        entries.forEach((entry) => {
          parts.push(`• ${entry.user} - ${entry.details}`);
        });
      });
    }

    return parts.join("\n");
  }

  _formatSuspiciousEntry(entry) {
    const formatHours = (hours) => (Math.round(hours * 10) / 10).toFixed(1);

    switch (entry.type) {
      case "insufficient_hours":
        return `${entry.user} - Short duration entry detected (${formatHours(
          entry.totalHours
        )} hours)`;
      case "long_duration":
        return `Long duration entry detected (${formatHours(
          entry.duration
        )} hours)`;
      case "large_gap":
        return `Large gap detected between entries (${entry.gapStartTime} to ${entry.gapEndTime})`;
      case "overlap":
        return `Overlapping entries detected (${entry.overlapStart} to ${entry.overlapEnd})`;
      case "short_duration":
        return `${entry.user} - Short duration entry detected (${formatHours(
          entry.duration
        )} hours)`;
      default:
        return "Unknown issue detected";
    }
  }
}

module.exports = new SlackMessageFormatter();
