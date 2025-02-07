// Set timezone for all tests
process.env.TZ = "Asia/Kolkata";

// Mock environment variables
process.env.CLOCKIFY_API_KEY = "test-api-key";
process.env.SLACK_BOT_TOKEN = "test-bot-token";
process.env.SLACK_CHANNEL_ID = "test-channel-id";
process.env.HOLIDAYS = "2025-03-14,2025-08-09,2025-08-15,2025-08-16,2025-10-02";

// Global test timeout
jest.setTimeout(10000);

// Mock moment-timezone to ensure consistent timezone behavior
jest.mock("moment-timezone", () => {
  const moment = jest.requireActual("moment-timezone");
  // Ensure moment always uses Asia/Kolkata
  moment.tz.setDefault("Asia/Kolkata");
  return moment;
});
