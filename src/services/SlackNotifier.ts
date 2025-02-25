import { WebClient } from "@slack/web-api";
import moment from "moment-timezone";
import { MonthlyFormatter } from "./formatters/MonthlyFormatter";
import { SuspiciousEntry } from "./TimeAnalyzer";

interface Analysis {
  user?: string;
  totalHours: number;
  isMissing: boolean;
  missingHours?: number;
  suspiciousEntries: SuspiciousEntry[] | null;
}

interface AnalysisResult extends Analysis {
  user: string;
}

export class SlackNotifier {
  private client: WebClient;
  private channelId: string;
  private monthlyFormatter: MonthlyFormatter;

  constructor(token: string, channelId: string) {
    this.client = new WebClient(token);
    this.channelId = channelId;
    this.monthlyFormatter = new MonthlyFormatter();
  }

  async notifyChannel(analysis: Analysis, date: Date | string): Promise<any> {
    try {
      const message = this._buildMessage(analysis, date);
      if (!message) return null; // No issues to report

      const response = await this.client.chat.postMessage({
        channel: this.channelId,
        text: message,
        blocks: this._buildBlocks(analysis, date),
      });

      return response;
    } catch (error) {
      console.error("Error sending Slack notification:", error);
      throw error;
    }
  }

  async notifyBulk(
    results: AnalysisResult[],
    date: Date | string
  ): Promise<any> {
    try {
      // Send a summary message for all users
      const summaryBlocks = this._buildSummaryBlocks(results, date);

      const response = await this.client.chat.postMessage({
        channel: this.channelId,
        text: "Time Entry Summary Report",
        blocks: summaryBlocks,
      });

      return response;
    } catch (error) {
      console.error("Error sending bulk Slack notification:", error);
      throw error;
    }
  }

  async notifyMonthly(
    results: any,
    monthDate: Date | string,
    totalExpectedHours: number
  ): Promise<any> {
    try {
      const blocks = this.monthlyFormatter.formatReport(
        results,
        monthDate,
        totalExpectedHours
      );

      const response = await this.client.chat.postMessage({
        channel: this.channelId,
        text: "Monthly Time Entry Summary",
        blocks: blocks,
      });

      return response;
    } catch (error) {
      console.error("Error sending monthly Slack notification:", error);
      throw error;
    }
  }

  private _buildSummaryBlocks(
    results: AnalysisResult[],
    date: Date | string
  ): any[] {
    const blocks = [];
    const dateStr = moment(date).format("dddd, MMMM D, YYYY");

    // Header
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `Time Entry Summary for ${dateStr}`,
        emoji: true,
      },
    });

    // Missing entries section (only for those with no entries)
    const missingEntries = results.filter((r) => r.isMissing);
    if (missingEntries.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "🔔 *Missing Time Entries*",
        },
      });

      missingEntries.forEach((result) => {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `• ${result.user}`,
          },
        });
      });
    }

    // Suspicious entries section
    const suspiciousEntries = results.filter(
      (r) => r.suspiciousEntries && r.suspiciousEntries.length > 0
    );
    if (suspiciousEntries.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "⚠️ *Suspicious Entries*",
        },
      });

      suspiciousEntries.forEach((result) => {
        result.suspiciousEntries?.forEach((entry) => {
          let issueText = "";
          if (entry.type === "long_duration") {
            issueText = `• ${
              result.user
            } - Long duration entry detected (${entry.duration?.toFixed(
              1
            )} hours)`;
          } else if (entry.type === "large_gap") {
            issueText = `• ${result.user} - Large gap detected between entries (${entry.gapStartTime} to ${entry.gapEndTime})`;
          } else if (entry.type === "insufficient_hours") {
            issueText = `• ${
              result.user
            } - Short duration entry detected (${entry.totalHours?.toFixed(
              1
            )} hours)`;
          }

          blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: issueText,
            },
          });
        });
      });
    }

    // Add divider
    blocks.push({ type: "divider" });

    // Footer
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Report generated at ${moment()
            .tz("Asia/Kolkata")
            .format("HH:mm")} IST`,
        },
      ],
    });

    return blocks;
  }

  private _buildMessage(
    analysis: Analysis,
    date: Date | string
  ): string | null {
    const parts = [];
    const dateStr = moment(date).format("dddd, MMMM D, YYYY");

    if (analysis.isMissing && analysis.missingHours !== undefined) {
      parts.push(
        `🔔 *Missing Hours Alert*\nYou logged ${analysis.totalHours} hours on ${dateStr}. Required: ${analysis.missingHours} more hours.`
      );
    }

    if (analysis.suspiciousEntries) {
      analysis.suspiciousEntries.forEach((entry) => {
        if (entry.type === "long_duration" && entry.duration !== undefined) {
          parts.push(
            `⚠️ *Long Duration Entry*\nAn entry on ${dateStr} is ${entry.duration.toFixed(
              1
            )} hours long.`
          );
        } else if (entry.type === "large_gap" && entry.gap !== undefined) {
          parts.push(
            `⚠️ *Large Gap Detected*\nThere's a ${entry.gap.toFixed(
              1
            )} hour gap between entries on ${dateStr}.`
          );
        }
      });
    }

    return parts.length > 0 ? parts.join("\n\n") : null;
  }

  private _buildBlocks(analysis: Analysis, date: Date | string): any[] {
    const blocks = [];
    const dateStr = moment(date).format("dddd, MMMM D, YYYY");

    // Header
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `Time Entry Review for ${dateStr}`,
        emoji: true,
      },
    });

    // Summary section
    blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Hours Logged:*\n${analysis.totalHours}`,
        },
        {
          type: "mrkdwn",
          text: `*Status:*\n${
            analysis.isMissing ? "❌ Incomplete" : "✅ Complete"
          }`,
        },
      ],
    });

    // Missing hours alert
    if (analysis.isMissing && analysis.missingHours !== undefined) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🔔 *Missing Hours Alert*\nYou need to log ${analysis.missingHours.toFixed(
            1
          )} more hours for this day.`,
        },
      });
    }

    // Suspicious entries
    if (analysis.suspiciousEntries) {
      analysis.suspiciousEntries.forEach((entry) => {
        if (entry.type === "long_duration" && entry.duration !== undefined) {
          const text = `⚠️ *Long Duration Entry Detected*\n• Duration: ${entry.duration.toFixed(
            1
          )} hours\n• Description: ${
            entry.entry?.description || "No description"
          }`;
          blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text,
            },
          });
        }
      });
    }

    return blocks;
  }
}
