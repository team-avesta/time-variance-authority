const moment = require("moment-timezone");
const TimeAnalyzer = require("../../services/TimeAnalyzer");

describe("TimeAnalyzer Integration Tests", () => {
  // Helper function to create time entries
  const createEntry = (start, end, description = "") => ({
    start: moment.tz(start, "Asia/Kolkata").toISOString(),
    end: moment.tz(end, "Asia/Kolkata").toISOString(),
    description,
    project: "Test Project",
    task: "Test Task",
  });

  describe("Basic Time Entry Analysis", () => {
    test("should handle fractional hours correctly", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 09:00", "2025-03-15 13:30"), // 4.5 hours
        createEntry("2025-03-15 14:00", "2025-03-15 17:15"), // 3.25 hours
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(8); // Should round to 8
      expect(result.suspiciousEntries).toBeNull(); // Should not be suspicious
    });

    test("should handle entries with seconds precision", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        {
          start: "2025-03-15T03:30:30Z", // 09:00:30 IST
          end: "2025-03-15T07:30:45Z", // 13:00:45 IST
          description: "",
          project: "Test Project",
          task: "Test Task",
        },
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(4);
    });

    test("should validate start time before end time", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 13:00", "2025-03-15 09:00"), // Invalid: end before start
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(0);
    });
  });

  describe("Suspicious Entry Detection", () => {
    test("should detect multiple suspicious conditions", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 09:00", "2025-03-15 20:00"), // 11 hours (long duration)
        createEntry("2025-03-15 19:00", "2025-03-15 21:00"), // Overlapping
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.suspiciousEntries).toBeTruthy();
      expect(result.suspiciousEntries.length).toBeGreaterThanOrEqual(2);
      expect(
        result.suspiciousEntries.some((e) => e.type === "long_duration")
      ).toBeTruthy();
      expect(
        result.suspiciousEntries.some((e) => e.type === "overlap")
      ).toBeTruthy();
    });

    test("should detect back-to-back entries", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 09:00", "2025-03-15 13:00"),
        createEntry("2025-03-15 13:00", "2025-03-15 17:00"), // Exactly back-to-back
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(8);
      expect(result.suspiciousEntries).toBeNull(); // Back-to-back should not be suspicious
    });

    test("should handle boundary cases for suspicious duration", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = [
        createEntry("2025-03-15 09:00", "2025-03-15 19:00"), // Exactly 10 hours
      ];

      const result = TimeAnalyzer.analyzeEntries(entries, date);
      expect(result.totalHours).toBe(10);
      expect(result.suspiciousEntries).toBeNull(); // Exactly 10 hours should not be suspicious
    });
  });

  describe("Team Analysis", () => {
    test("should group results by team correctly", () => {
      const results = [
        { user: "User1", team: "teamAlpha", totalHours: 8 },
        { user: "User2", team: "teamAlpha", totalHours: 7 },
        { user: "User3", team: "teamBravo", totalHours: 9 },
      ];

      const teams = {
        teamAlpha: { name: "Team Alpha" },
        teamBravo: { name: "Team Bravo" },
      };

      const groupedResults = TimeAnalyzer.groupByTeam(results, teams);

      expect(groupedResults.teams.teamAlpha.totalHours).toBe(15);
      expect(groupedResults.teams.teamBravo.totalHours).toBe(9);
      expect(groupedResults.grandTotal).toBe(24);
    });

    test("should handle missing team data", () => {
      const results = [
        { user: "User1", totalHours: 8 }, // No team
        { user: "User2", team: "teamAlpha", totalHours: 7 },
      ];

      const teams = {
        teamAlpha: { name: "Team Alpha" },
      };

      const groupedResults = TimeAnalyzer.groupByTeam(results, teams);

      expect(groupedResults.teams.teamAlpha.totalHours).toBe(7);
      expect(groupedResults.grandTotal).toBe(7);
    });
  });
});
