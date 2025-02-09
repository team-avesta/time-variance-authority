const moment = require("moment-timezone");
const TimeAnalyzer = require("../../services/TimeAnalyzer");

describe("TimeAnalyzer Performance Tests", () => {
  const createEntry = (start, end, description = "") => ({
    start: moment.tz(start, "Asia/Kolkata").toISOString(),
    end: moment.tz(end, "Asia/Kolkata").toISOString(),
    description,
    project: "Test Project",
    task: "Test Task",
  });

  describe("Large Dataset Processing", () => {
    test("should handle 1000 entries efficiently", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = Array.from({ length: 1000 }, (_, i) => {
        const hour = (i % 24).toString().padStart(2, "0");
        const day = Math.floor(i / 24) + 1;
        return createEntry(
          `2025-03-${day} ${hour}:00`,
          `2025-03-${day} ${hour}:30`
        );
      });

      const startTime = process.hrtime();
      const result = TimeAnalyzer.analyzeEntries(entries, date);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalTime = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

      expect(totalTime).toBeLessThan(1000); // Should process in less than 1 second
      expect(result).toBeDefined();
    });

    test("should handle concurrent analysis efficiently", async () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = Array.from({ length: 100 }, () =>
        createEntry("2025-03-15 09:00", "2025-03-15 17:00")
      );

      const startTime = process.hrtime();
      await Promise.all(
        Array.from({ length: 10 }, () =>
          Promise.resolve(TimeAnalyzer.analyzeEntries(entries, date))
        )
      );
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalTime = seconds * 1000 + nanoseconds / 1000000;

      expect(totalTime).toBeLessThan(2000); // Should process 10 concurrent analyses in less than 2 seconds
    });
  });

  describe("Memory Usage", () => {
    test("should maintain reasonable memory usage with large datasets", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = Array.from({ length: 5000 }, (_, i) => {
        const hour = (i % 24).toString().padStart(2, "0");
        const day = Math.floor(i / 24) + 1;
        return createEntry(
          `2025-03-${day} ${hour}:00`,
          `2025-03-${day} ${hour}:30`
        );
      });

      const beforeMemory = process.memoryUsage().heapUsed;
      TimeAnalyzer.analyzeEntries(entries, date);
      const afterMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (afterMemory - beforeMemory) / 1024 / 1024; // MB

      expect(memoryIncrease).toBeLessThan(50); // Should use less than 50MB additional memory
    });
  });

  describe("Edge Case Performance", () => {
    test("should handle deeply nested overlapping entries efficiently", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = Array.from({ length: 100 }, (_, i) => {
        const start = moment
          .tz("2025-03-15 09:00", "Asia/Kolkata")
          .add(i, "minutes")
          .toISOString();
        const end = moment
          .tz("2025-03-15 17:00", "Asia/Kolkata")
          .subtract(i, "minutes")
          .toISOString();
        return { start, end, description: `Overlapping entry ${i}` };
      });

      const startTime = process.hrtime();
      const result = TimeAnalyzer.analyzeEntries(entries, date);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalTime = seconds * 1000 + nanoseconds / 1000000;

      expect(totalTime).toBeLessThan(500); // Should process in less than 500ms
      expect(result.suspiciousEntries).toBeDefined();
    });

    test("should handle rapid consecutive entries efficiently", () => {
      const date = moment.tz("2025-03-15", "Asia/Kolkata");
      const entries = Array.from({ length: 1000 }, (_, i) => {
        const minute = i.toString().padStart(2, "0");
        return createEntry(
          `2025-03-15 00:${minute}:00`,
          `2025-03-15 00:${minute}:30`
        );
      });

      const startTime = process.hrtime();
      const result = TimeAnalyzer.analyzeEntries(entries, date);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalTime = seconds * 1000 + nanoseconds / 1000000;

      expect(totalTime).toBeLessThan(1000); // Should process in less than 1 second
      expect(result).toBeDefined();
    });
  });
});
