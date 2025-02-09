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

  describe("Timezone Handling", () => {
    test("should handle entries at IST midnight boundary", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        // Entry starting at midnight IST
        createEntry("2025-03-15 00:00", "2025-03-15 04:00"),
        // Entry ending at midnight IST
        createEntry("2025-03-15 20:00", "2025-03-16 00:00"),
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(8);
    });

    test("should handle entries spanning IST midnight", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 22:00", "2025-03-16 02:00"), // 4 hours spanning midnight
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(2); // Only count hours before midnight
    });

    test("should handle UTC to IST conversion", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const utcEntry = {
        start: "2025-03-15T03:30:00Z", // 09:00 IST
        end: "2025-03-15T07:30:00Z", // 13:00 IST
        description: "",
        project: "Test Project",
        task: "Test Task",
      };

      const result = TimeAnalyzer.analyzeEntries([utcEntry], date);
      expect(result.totalHours).toBe(4);
    });
  });

  describe("analyzeEntries", () => {
    test("should return missing hours for no entries", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const result = TimeAnalyzer.analyzeEntries([], date);

      expect(result).toEqual({
        totalHours: 0,
        suspiciousEntries: [],
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

    test("should handle fractional hours correctly", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 09:00", "2025-03-15 13:30"), // 4.5 hours
        createEntry("2025-03-15 14:00", "2025-03-15 17:15"), // 3.25 hours
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(8); // Rounds to nearest hour
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

    test("should handle overlapping entries", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 09:00", "2025-03-15 13:00"),
        createEntry("2025-03-15 12:00", "2025-03-15 14:00"), // 1 hour overlap
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.suspiciousEntries).toBeTruthy();
      expect(
        result.suspiciousEntries.some((e) => e.type === "overlap")
      ).toBeTruthy();
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

    test("should handle entries with millisecond precision", () => {
      const entries = [
        {
          start: "2025-03-15T03:30:00.123Z",
          end: "2025-03-15T07:30:00.456Z",
          description: "",
          project: "Test Project",
          task: "Test Task",
        },
      ];

      const result = TimeAnalyzer.calculateTotalHours(entries);
      expect(result).toBe(4);
    });
  });

  describe("Error Handling", () => {
    test("should handle null entries", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const result = TimeAnalyzer.analyzeEntries(null, date);
      expect(result).toEqual({
        totalHours: 0,
        suspiciousEntries: [],
      });
    });

    test("should handle undefined entries", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const result = TimeAnalyzer.analyzeEntries(undefined, date);
      expect(result).toEqual({
        totalHours: 0,
        suspiciousEntries: [],
      });
    });

    test("should handle invalid date formats", () => {
      const entries = [
        {
          start: "invalid-date",
          end: "invalid-date",
          description: "Invalid entry",
        },
      ];
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(0);
      expect(result.suspiciousEntries).toBeDefined();
    });

    test("should handle missing start time", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        {
          end: moment.tz("2025-03-15 17:00", "Asia/Kolkata").toISOString(),
          description: "Missing start",
        },
      ];
      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(0);
      expect(result.suspiciousEntries).toBeDefined();
    });

    test("should handle missing end time", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        {
          start: moment.tz("2025-03-15 09:00", "Asia/Kolkata").toISOString(),
          description: "Missing end",
        },
      ];
      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(0);
      expect(result.suspiciousEntries).toBeDefined();
    });

    test("should handle malformed ISO strings", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        {
          start: "2025-03-15T09:00", // Missing timezone
          end: "2025-03-15T17:00", // Missing timezone
          description: "Malformed dates",
        },
      ];
      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(0);
      expect(result.suspiciousEntries).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    test("should handle DST transitions", () => {
      // Note: India doesn't observe DST, but system should handle it for other zones
      const date = moment.tz("2025-03-09", "America/New_York"); // DST start in US
      const entries = [createEntry("2025-03-09 01:00", "2025-03-09 04:00")];
      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBeDefined();
    });

    test("should handle leap year dates", () => {
      const date = moment.tz("2024-02-29", "Asia/Kolkata");
      const entries = [createEntry("2024-02-29 09:00", "2024-02-29 17:00")];
      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(8);
    });

    test("should handle year boundaries", () => {
      const date = moment.tz("2024-12-31", "Asia/Kolkata");
      const entries = [createEntry("2024-12-31 20:00", "2025-01-01 04:00")];
      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(4); // Only count hours in 2024
    });
  });
});
