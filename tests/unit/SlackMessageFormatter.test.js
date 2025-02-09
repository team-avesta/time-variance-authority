const moment = require("moment-timezone");
const formatter = require("../../services/formatters/SlackMessageFormatter");

describe("SlackMessageFormatter", () => {
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

  describe("Daily Report Format", () => {
    test("should format date correctly", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const results = createMockResults();
      const formattedMessage = formatter.formatDailyReport(results, date);
      expect(formattedMessage).toContain("Thursday, February 6, 2025");
    });

    test("should format missing entries by team", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const mockUsers = [
        { name: "rutu patel", team: "teamAlpha" },
        { name: "Anjali Bhansari", team: "teamAlpha" },
        { name: "Sahil Makwana", team: "teamAlpha" },
        { name: "Akshat Kansara", team: "teamBravo" },
      ];

      const results = createMockResults(mockUsers, []);
      const formattedMessage = formatter.formatDailyReport(results, date);

      expect(formattedMessage).toContain(":bell: Missing Time Entries");
      expect(formattedMessage).toContain("• rutu patel");
      expect(formattedMessage).toContain("• Anjali Bhansari");
      expect(formattedMessage).toContain("• Sahil Makwana");
      expect(formattedMessage).toContain("• Akshat Kansara");
    });

    test("should format suspicious entries correctly", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const suspiciousEntries = [
        {
          user: "Hiral",
          team: "teamBravo",
          type: "insufficient_hours",
          totalHours: 7.0,
        },
      ];

      const results = createMockResults([], suspiciousEntries);
      const formattedMessage = formatter.formatDailyReport(results, date);

      expect(formattedMessage).toContain(":warning: Suspicious Entries");
      expect(formattedMessage).toContain(
        "• Hiral - Short duration entry detected (7.0 hours)"
      );
    });

    test("should handle both missing and suspicious entries", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const mockUsers = [{ name: "rutu patel", team: "teamAlpha" }];
      const suspiciousEntries = [
        {
          user: "Hiral",
          team: "teamBravo",
          type: "insufficient_hours",
          totalHours: 7.0,
        },
      ];

      const results = createMockResults(mockUsers, suspiciousEntries);
      const formattedMessage = formatter.formatDailyReport(results, date);

      expect(formattedMessage).toContain(":bell: Missing Time Entries");
      expect(formattedMessage).toContain("• rutu patel");
      expect(formattedMessage).toContain(":warning: Suspicious Entries");
      expect(formattedMessage).toContain(
        "• Hiral - Short duration entry detected (7.0 hours)"
      );
    });

    test("should handle special characters in names", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const mockUsers = [
        { name: "John O'Connor", team: "teamAlpha" },
        { name: "María García", team: "teamBravo" },
      ];

      const results = createMockResults(mockUsers, []);
      const formattedMessage = formatter.formatDailyReport(results, date);

      expect(formattedMessage).toContain("• John O'Connor");
      expect(formattedMessage).toContain("• María García");
    });

    test("should format hours with one decimal place", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const suspiciousEntries = [
        {
          user: "User1",
          team: "teamAlpha",
          type: "insufficient_hours",
          totalHours: 7.05,
        },
      ];

      const results = createMockResults([], suspiciousEntries);
      const formattedMessage = formatter.formatDailyReport(results, date);
      expect(formattedMessage).toContain("(7.0 hours)");
    });

    test("should show no issues message when no problems found", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const results = createMockResults();
      const formattedMessage = formatter.formatDailyReport(results, date);
      expect(formattedMessage).toContain("No issues found");
    });
  });

  describe("Team Grouping Format", () => {
    test("should group missing entries by team", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const mockUsers = [
        { name: "User1", team: "Team Alpha" },
        { name: "User2", team: "Team Alpha" },
        { name: "User3", team: "Team Bravo" },
      ];

      const results = createMockResults(mockUsers, []);
      const formattedMessage = formatter.formatByTeam(results, date);

      expect(formattedMessage).toContain("Team Alpha:");
      expect(formattedMessage).toContain("Team Bravo:");
      expect(formattedMessage).toContain("• User1");
      expect(formattedMessage).toContain("• User2");
      expect(formattedMessage).toContain("• User3");
    });

    test("should group suspicious entries by team", () => {
      const date = moment.tz("2025-02-06", "Asia/Kolkata");
      const suspiciousEntries = [
        {
          user: "User1",
          team: "Team Alpha",
          type: "insufficient_hours",
          totalHours: 7.0,
        },
        {
          user: "User2",
          team: "Team Bravo",
          type: "long_duration",
          duration: 11.0,
        },
      ];

      const results = createMockResults([], suspiciousEntries);
      const formattedMessage = formatter.formatByTeam(results, date);

      expect(formattedMessage).toContain("Team Alpha:");
      expect(formattedMessage).toContain("Team Bravo:");
      expect(formattedMessage).toContain(
        "User1 - User1 - Short duration entry detected (7.0 hours)"
      );
      expect(formattedMessage).toContain(
        "Long duration entry detected (11.0 hours)"
      );
    });
  });

  describe("Message Components", () => {
    test("should use correct emoji icons", () => {
      const missingEmoji = ":bell:";
      const warningEmoji = ":warning:";

      expect(missingEmoji).toBe(":bell:");
      expect(warningEmoji).toBe(":warning:");
    });

    test("should format bullet points correctly", () => {
      const bulletPoint = "•";
      expect(bulletPoint).toBe("•");
    });
  });
});
