const moment = require("moment-timezone");
const formatter = require("../../services/formatters/SlackMessageFormatter");

describe("SlackMessageFormatter Integration Tests", () => {
  const createMockResults = (missingUsers = [], suspiciousEntries = []) => {
    return {
      missing: missingUsers.map((user) => ({
        user: user.name,
        team: user.team,
        totalHours: 0,
        isMissing: true,
        missingHours: 8,
      })),
      suspicious: suspiciousEntries,
    };
  };

  describe("Message Format Edge Cases", () => {
    test("should handle multiple issues for same user", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const suspiciousEntries = [
        {
          user: "User1",
          team: "teamAlpha",
          type: "insufficient_hours",
          totalHours: 7.0,
        },
        {
          user: "User1",
          team: "teamAlpha",
          type: "large_gap",
          gapStartTime: "13:00",
          gapEndTime: "17:30",
        },
        {
          user: "User1",
          team: "teamAlpha",
          type: "long_duration",
          duration: 11.0,
        },
      ];

      const results = createMockResults([], suspiciousEntries);
      const formattedMessage = formatter.formatDailyReport(results, date);

      expect(formattedMessage).toContain(
        "User1 - Short duration entry detected (7.0 hours)"
      );
      expect(formattedMessage).toContain(
        "User1 - Large gap detected between entries (13:00 to 17:30)"
      );
      expect(formattedMessage).toContain(
        "User1 - Long duration entry detected (11.0 hours)"
      );
    });

    test("should handle special characters in names", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const mockUsers = [
        { name: "John O'Connor", team: "teamAlpha" },
        { name: "María García", team: "teamAlpha" },
        { name: "Владимир Петров", team: "teamBravo" },
        { name: "张伟", team: "teamBravo" },
      ];

      const results = createMockResults(mockUsers, []);
      const formattedMessage = formatter.formatDailyReport(results, date);

      expect(formattedMessage).toContain("• John O'Connor");
      expect(formattedMessage).toContain("• María García");
      expect(formattedMessage).toContain("• Владимир Петров");
      expect(formattedMessage).toContain("• 张伟");
    });

    test("should handle large team report", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const mockUsers = Array.from({ length: 50 }, (_, i) => ({
        name: `User${i + 1}`,
        team: i < 25 ? "teamAlpha" : "teamBravo",
      }));

      const suspiciousEntries = Array.from({ length: 10 }, (_, i) => ({
        user: `User${i + 1}`,
        team: i < 5 ? "teamAlpha" : "teamBravo",
        type: "insufficient_hours",
        totalHours: 7.0,
      }));

      const results = createMockResults(mockUsers, suspiciousEntries);
      const formattedMessage = formatter.formatByTeam(results, date);

      expect(formattedMessage).toContain("teamAlpha:");
      expect(formattedMessage).toContain("teamBravo:");
      expect(formattedMessage.split("\n").length).toBeGreaterThan(60);
    });

    test("should handle empty sections with team grouping", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const results = {
        missing: [],
        suspicious: [],
      };

      const formattedMessage = formatter.formatByTeam(results, date);
      expect(formattedMessage).toContain("Time Entry Summary for");
    });

    test("should handle decimal hours consistently", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const suspiciousEntries = [
        {
          user: "User1",
          team: "teamAlpha",
          type: "insufficient_hours",
          totalHours: 7.04,
        },
        {
          user: "User2",
          team: "teamAlpha",
          type: "insufficient_hours",
          totalHours: 7.05,
        },
        {
          user: "User3",
          team: "teamAlpha",
          type: "insufficient_hours",
          totalHours: 7.06,
        },
      ];

      const results = createMockResults([], suspiciousEntries);
      const formattedMessage = formatter.formatDailyReport(results, date);

      expect(formattedMessage).toContain("(7.0 hours)"); // 7.04 shows as 7.0
      expect(formattedMessage).toContain("(7.0 hours)"); // 7.05 shows as 7.0
      expect(formattedMessage).toContain("(7.1 hours)"); // 7.06 shows as 7.1
    });
  });

  describe("Complex Scenarios", () => {
    test("should handle mixed team and individual reports", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const mockUsers = [
        { name: "User1", team: "teamAlpha" },
        { name: "User2", team: "teamAlpha" },
        { name: "User3" }, // No team
        { name: "User4", team: "teamBravo" },
      ];

      const suspiciousEntries = [
        {
          user: "User1",
          team: "teamAlpha",
          type: "insufficient_hours",
          totalHours: 7.0,
        },
        {
          user: "User3", // No team
          type: "long_duration",
          duration: 11.0,
        },
      ];

      const results = createMockResults(mockUsers, suspiciousEntries);
      const formattedMessage = formatter.formatDailyReport(results, date);

      expect(formattedMessage).toContain("teamAlpha:");
      expect(formattedMessage).toContain("• User1");
      expect(formattedMessage).toContain("• User2");
      expect(formattedMessage).toContain("• User3"); // Should still be included
      expect(formattedMessage).toContain("• User4");
      expect(formattedMessage).toContain("(7.0 hours)");
      expect(formattedMessage).toContain("(11.0 hours)");
    });

    test("should handle multiple suspicious conditions for same user and team", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const suspiciousEntries = [
        {
          user: "User1",
          team: "teamAlpha",
          type: "insufficient_hours",
          totalHours: 7.0,
        },
        {
          user: "User1",
          team: "teamAlpha",
          type: "large_gap",
          gapStartTime: "13:00",
          gapEndTime: "17:30",
        },
        {
          user: "User1",
          team: "teamAlpha",
          type: "overlap",
          overlapStart: "09:00",
          overlapEnd: "10:00",
        },
      ];

      const results = createMockResults([], suspiciousEntries);
      const formattedMessage = formatter.formatByTeam(results, date);

      expect(formattedMessage).toContain("teamAlpha:");
      expect(formattedMessage).toContain(
        "Short duration entry detected (7.0 hours)"
      );
      expect(formattedMessage).toContain(
        "Large gap detected between entries (13:00 to 17:30)"
      );
      expect(formattedMessage).toContain(
        "Overlapping entries detected (09:00 to 10:00)"
      );
    });

    test("should handle extremely long messages", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const mockUsers = Array.from({ length: 100 }, (_, i) => ({
        name: `User${i + 1}`,
        team: `team${String.fromCharCode(65 + (i % 26))}`, // A-Z teams
      }));

      const suspiciousEntries = Array.from({ length: 50 }, (_, i) => ({
        user: `User${i + 1}`,
        team: `team${String.fromCharCode(65 + (i % 26))}`,
        type: i % 2 === 0 ? "insufficient_hours" : "long_duration",
        totalHours: i % 2 === 0 ? 7.0 : undefined,
        duration: i % 2 === 0 ? undefined : 11.0,
      }));

      const results = createMockResults(mockUsers, suspiciousEntries);
      const formattedMessage = formatter.formatByTeam(results, date);

      // Message should be properly formatted despite length
      expect(formattedMessage.length).toBeGreaterThan(1000);
      expect(formattedMessage.split("\n").length).toBeGreaterThan(100);
      expect(formattedMessage).toMatch(/^Time Entry Summary for/);
    });

    test("should handle special formatting requirements", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const mockUsers = [
        { name: "user.name", team: "team-1" }, // With dots
        { name: "user_name", team: "team_1" }, // With underscores
        { name: "user@domain", team: "team.1" }, // With @
        { name: "user-name", team: "team@1" }, // With hyphen
      ];

      const results = createMockResults(mockUsers, []);
      const formattedMessage = formatter.formatDailyReport(results, date);

      expect(formattedMessage).toContain("• user.name");
      expect(formattedMessage).toContain("• user_name");
      expect(formattedMessage).toContain("• user@domain");
      expect(formattedMessage).toContain("• user-name");
    });

    test("should handle emoji and markdown in names", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const mockUsers = [
        { name: "user 👨‍💻", team: "team 🚀" },
        { name: "user *bold*", team: "team _italic_" },
        { name: "user `code`", team: "team ~strike~" },
      ];

      const results = createMockResults(mockUsers, []);
      const formattedMessage = formatter.formatDailyReport(results, date);

      expect(formattedMessage).toContain("• user 👨‍💻");
      expect(formattedMessage).toContain("• user *bold*");
      expect(formattedMessage).toContain("• user `code`");
    });
  });
});
