interface SlackBlock {
  type: string;
  text?: any;
  elements?: any[];
}

export class BaseFormatter {
  protected createHeaderBlock(text: string): SlackBlock {
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text,
        emoji: true,
      },
    };
  }

  protected createSectionBlock(text: string): SlackBlock {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text,
      },
    };
  }

  protected createDividerBlock(): SlackBlock {
    return { type: 'divider' };
  }

  protected createContextBlock(text: string): SlackBlock {
    return {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text,
        },
      ],
    };
  }
}
