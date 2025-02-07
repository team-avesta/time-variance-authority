const moment = require("moment-timezone");

class BaseAnalyzer {
  constructor() {
    this.IST_TIMEZONE = "Asia/Kolkata";
  }

  calculateTotalHours(entries) {
    if (!entries || entries.length === 0) {
      return 0;
    }

    return entries.reduce((total, entry) => {
      const start = moment(entry.start);
      const end = moment(entry.end);
      const duration = moment.duration(end.diff(start)).asHours();
      return total + duration;
    }, 0);
  }

  roundHours(hours) {
    return Math.round(hours * 100) / 100;
  }
}

module.exports = BaseAnalyzer;
