export type ParseMode = 'HTML' | 'MarkdownV2';

export interface OutgoingMessage {
  readonly text: string;
  readonly parseMode?: ParseMode;
  readonly photoUrl?: string;
  readonly disableNotification?: boolean;
  readonly disableLinkPreview?: boolean;
}

export interface SentMessage {
  readonly messageId: number;
  readonly chatId: string;
}

/** Destination for formatted messages. */
export interface ChannelEmitter {
  emit(message: OutgoingMessage): Promise<SentMessage>;
}
