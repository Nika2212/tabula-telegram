export type ParseMode = 'HTML' | 'MarkdownV2';

export interface LinkPreview {
  readonly url: string;
  /** Asks Telegram for the big image rather than a thumbnail. */
  readonly preferLargeMedia: boolean;
  /** Puts the image above the text, so the post reads like a photo post. */
  readonly showAboveText: boolean;
}

/**
 * A post ready for the Bot API. With a photo it is sent as a photo message and
 * `text` becomes the caption; otherwise as text, where `preview` supplies the
 * image instead.
 */
export interface OutgoingMessage {
  readonly text: string;
  readonly parseMode: ParseMode;
  readonly photoUrl: string | null;
  readonly preview: LinkPreview | null;
}

export interface SentMessage {
  readonly messageId: number;
  readonly chatId: string;
}

export interface BotIdentity {
  readonly id: number;
  readonly username: string;
}

/** Destination for formatted messages. */
export interface ChannelEmitter {
  emit(message: OutgoingMessage): Promise<SentMessage | null>;
}
