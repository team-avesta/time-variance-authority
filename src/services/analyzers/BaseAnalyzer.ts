import moment from 'moment-timezone';

export interface TimeEntry {
  start: string;
  end: string;
  description?: string;
  project?: string;
  task?: string;
}

export class BaseAnalyzer {
  protected readonly IST_TIMEZONE: string;

  constructor() {
    this.IST_TIMEZONE = 'Asia/Kolkata';
  }

  calculateTotalHours(entries: TimeEntry[]): number {
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

  roundHours(hours: number): number {
    return Math.round(hours * 100) / 100;
  }
}
