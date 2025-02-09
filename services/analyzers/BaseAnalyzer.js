const moment = require("moment-timezone");

class BaseAnalyzer {
  constructor() {
    this.IST_TIMEZONE = "Asia/Kolkata";
  }

  roundHours(hours) {
    return Math.round(hours * 100) / 100;
  }

  calculateTotalHours(entries) {
    if (!entries || entries.length === 0) return 0;

    return entries.reduce((total, entry) => {
      const startMoment = moment.tz(entry.start, this.IST_TIMEZONE);
      const endMoment = moment.tz(entry.end, this.IST_TIMEZONE);
      const duration = moment.duration(endMoment.diff(startMoment)).asHours();
      return total + duration;
    }, 0);
  }

  isWorkingDay(date) {
    const momentDate = moment.tz(date, this.IST_TIMEZONE);
    const isWeekend = momentDate.day() === 0 || momentDate.day() === 6;
    const isHoliday = process.env.HOLIDAYS?.split(",").includes(
      momentDate.format("YYYY-MM-DD")
    );
    return !isWeekend && !isHoliday;
  }

  validateDate(date) {
    return moment.tz(date, this.IST_TIMEZONE).isValid();
  }

  validateEntry(entry) {
    return (
      entry &&
      this.validateDate(entry.start) &&
      this.validateDate(entry.end) &&
      moment(entry.start).isBefore(moment(entry.end))
    );
  }
}

module.exports = BaseAnalyzer;
