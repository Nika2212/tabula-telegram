import type { AxiosInstance } from 'axios';

import type { TelegramConfig } from '../config/index.ts';
import type { OutgoingMessage, SentMessage } from './types.ts';

export interface TelegramClient {
  sendMessage(message: OutgoingMessage): Promise<SentMessage>;
  sendPhoto(message: OutgoingMessage): Promise<SentMessage>;
  getMe(): Promise<{ readonly id: number; readonly username: string }>;
}

/** Thin wrapper over the Bot API (https://api.telegram.org/bot<token>/...). */
export function createTelegramClient(
  _config: TelegramConfig,
  _client: AxiosInstance,
): TelegramClient {
  throw new Error('createTelegramClient is not implemented');
}
