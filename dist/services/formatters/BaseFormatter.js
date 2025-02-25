"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseFormatter = void 0;
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
exports.BaseFormatter = BaseFormatter;
//# sourceMappingURL=BaseFormatter.js.map