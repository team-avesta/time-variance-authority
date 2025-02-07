class BaseFormatter {
    createHeaderBlock(text) {
      return {
        type: "header",
        text: {
          type: "plain_text",
          text,
          emoji: true,
        },
      };
    }
  
    createSectionBlock(text) {
      return {
        type: "section",
        text: {
          type: "mrkdwn",
          text,
        },
      };
    }
  
    createDividerBlock() {
      return { type: "divider" };
    }
  
    createContextBlock(text) {
      return {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text,
          },
        ],
      };
    }
  }
  
  module.exports = BaseFormatter;
  