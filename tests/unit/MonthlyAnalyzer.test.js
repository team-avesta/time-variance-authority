const moment = require("moment-timezone");
const MonthlyAnalyzer = require("../../services/analyzers/MonthlyAnalyzer");

describe("MonthlyAnalyzer", () => {
  const analyzer = new MonthlyAnalyzer();

  const createEntry = (start, end, description = "") => ({
    start: moment.tz(start, "Asia/Kolkata").toISOString(),
    end: moment.tz(end, "Asia/Kolkata").toISOString(),
    description,
    project: "Test Project",
    task: "Test Task",
  });

  describe("Monthly Calculations", () => {
    test("should calculate total hours for a month", () => {
      const entries = [
        createEntry("2025-03-01 09:00", "2025-03-01 17:00"), // 8 hours
        createEntry("2025-03-02 10:00", "2025-03-02 18:00"), // 8 hours
        createEntry("2025-03-03 09:00", "2025-03-03 18:00"), // 9 hours
      ];

      const result = analyzer.analyzeEntries(entries, {
        id: "user1",
        name: "Test User",
        requiredHours: 8,
      });

      expect(result.totalHours).toBe(25); // 8 + 8 + 9
      expect(result.dailyAverages).toBeDefined();
      expect(result.workingDays).toBeDefined();
    });

    test("should handle month boundaries correctly", () => {
      const entries = [
        // Last day of previous month
        createEntry("2025-02-28 22:00", "2025-03-01 02:00"),
        // First day of next month
        createEntry("2025-03-31 22:00", "2025-04-01 02:00"),
        // Regular day
        createEntry("2025-03-15 09:00", "2025-03-15 17:00"),
      ];

      const result = analyzer.analyzeEntries(entries, {
        id: "user1",
        name: "Test User",
        requiredHours: 8,
      });

      expect(result.totalHours).toBe(12); // Only count March hours (4 + 0 + 8)
    });

    test("should calculate working days correctly", () => {
      const entries = [
        createEntry("2025-03-01 09:00", "2025-03-01 17:00"), // Saturday
        createEntry("2025-03-03 09:00", "2025-03-03 17:00"), // Monday
        createEntry("2025-03-04 09:00", "2025-03-04 17:00"), // Tuesday
      ];

      const result = analyzer.analyzeEntries(entries, {
        id: "user1",
        name: "Test User",
        requiredHours: 8,
      });

      expect(result.workingDays).toBe(2); // Should only count weekdays
      expect(result.totalHours).toBe(24); // All hours still counted
    });
  });

  describe("Holiday Handling", () => {
    test("should exclude holidays from working days", () => {
      const entries = [
        createEntry("2025-03-14 09:00", "2025-03-14 17:00"), // Holiday
        createEntry("2025-03-13 09:00", "2025-03-13 17:00"), // Regular day
      ];

      const result = analyzer.analyzeEntries(entries, {
        id: "user1",
        name: "Test User",
        requiredHours: 8,
      });

      expect(result.workingDays).toBe(1); // Should exclude holiday
      expect(result.totalHours).toBe(16); // But still count hours
    });
  });

  describe("Performance Analysis", () => {
    test("should calculate daily averages", () => {
      const entries = [
        createEntry("2025-03-03 09:00", "2025-03-03 17:00"), // 8 hours
        createEntry("2025-03-04 09:00", "2025-03-04 19:00"), // 10 hours
      ];

      const result = analyzer.analyzeEntries(entries, {
        id: "user1",
        name: "Test User",
        requiredHours: 8,
      });

      expect(result.dailyAverages).toBeDefined();
      expect(result.dailyAverages.actual).toBe(9); // (8 + 10) / 2
      expect(result.dailyAverages.expected).toBe(8);
    });

    test("should identify performance trends", () => {
      const entries = Array.from({ length: 20 }, (_, i) =>
        createEntry(
          `2025-03-${i + 1} 09:00`,
          `2025-03-${i + 1} ${17 + (i % 3)}:00`
        )
      );

      const result = analyzer.analyzeEntries(entries, {
        id: "user1",
        name: "Test User",
        requiredHours: 8,
      });

      expect(result.trends).toBeDefined();
      expect(result.trends.hoursVariance).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    test("should handle empty entries", () => {
      const result = analyzer.analyzeEntries([], {
        id: "user1",
        name: "Test User",
        requiredHours: 8,
      });

      expect(result.totalHours).toBe(0);
      expect(result.workingDays).toBe(0);
      expect(result.dailyAverages.actual).toBe(0);
    });

    test("should handle invalid dates", () => {
      const entries = [
        {
          start: "invalid-date",
          end: "invalid-date",
          description: "Invalid entry",
        },
      ];

      expect(() => {
        analyzer.analyzeEntries(entries, {
          id: "user1",
          name: "Test User",
          requiredHours: 8,
        });
      }).not.toThrow();
    });

    test("should handle missing user config", () => {
      const entries = [createEntry("2025-03-01 09:00", "2025-03-01 17:00")];

      expect(() => {
        analyzer.analyzeEntries(entries);
      }).not.toThrow();
    });
  });
});
