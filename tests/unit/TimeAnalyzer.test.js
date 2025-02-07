const moment = require("moment-timezone");
const TimeAnalyzer = require("../../services/TimeAnalyzer");

describe("TimeAnalyzer", () => {
  // Helper function to create time entries
  const createEntry = (start, end, description = "") => ({
    start: moment.tz(start, "Asia/Kolkata").toISOString(),
    end: moment.tz(end, "Asia/Kolkata").toISOString(),
    description,
    project: "Test Project",
    task: "Test Task",
  });

  describe("analyzeEntries", () => {
    test("should return missing hours for no entries", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const result = TimeAnalyzer.analyzeEntries([], date);

      expect(result).toEqual({
        totalHours: 0,
        isMissing: true,
        missingHours: 8,
        suspiciousEntries: null,
      });
    });

    test("should calculate total hours correctly for valid entries", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 09:00", "2025-03-15 13:00"),
        createEntry("2025-03-15 14:00", "2025-03-15 18:00"),
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);

      expect(result.totalHours).toBe(8);
      expect(result.isMissing).toBe(false);
      expect(result.missingHours).toBe(0);
      expect(result.suspiciousEntries).toBeNull();
    });

    test("should detect suspicious long duration entries", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 09:00", "2025-03-15 20:00"), // 11 hours
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);

      expect(result.suspiciousEntries).toHaveLength(1);
      expect(result.suspiciousEntries[0].type).toBe("long_duration");
      expect(result.suspiciousEntries[0].duration).toBeGreaterThan(10);
    });

    test("should detect large gaps between entries", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 09:00", "2025-03-15 10:00"),
        createEntry("2025-03-15 15:00", "2025-03-15 17:00"), // 5-hour gap
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);

      expect(result.suspiciousEntries).toHaveLength(1);
      expect(result.suspiciousEntries[0].type).toBe("large_gap");
      expect(result.suspiciousEntries[0].gap).toBeGreaterThan(4);
    });

    test("should handle insufficient hours", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 09:00", "2025-03-15 12:00"), // Only 3 hours
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);

      expect(result.totalHours).toBe(3);
      expect(result.missingHours).toBe(5);
      expect(result.suspiciousEntries).toHaveLength(1);
      expect(result.suspiciousEntries[0].type).toBe("insufficient_hours");
    });
  });

  describe("calculateTotalHours", () => {
    test("should return 0 for empty entries", () => {
      const result = TimeAnalyzer.calculateTotalHours([]);
      expect(result).toBe(0);
    });

    test("should calculate total hours correctly", () => {
      const entries = [
        createEntry("2025-03-15 09:00", "2025-03-15 12:00"), // 3 hours
        createEntry("2025-03-15 13:00", "2025-03-15 18:00"), // 5 hours
      ];

      const result = TimeAnalyzer.calculateTotalHours(entries);
      expect(result).toBe(8);
    });
  });
});
