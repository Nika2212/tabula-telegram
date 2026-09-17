import type { Logger } from '../utils/logger.ts';
import type { TelegramClient } from './client.ts';
import type { ChannelEmitter } from './types.ts';

export interface EmitterOptions {
  readonly client: TelegramClient;
  readonly logger: Logger;
  /** Bot API allows ~20 messages/minute per channel; throttle accordingly. */
  readonly minIntervalMs: number;
  /** When true, messages are logged instead of sent. */
  readonly dryRun: boolean;
}

export function createChannelEmitter(
  _options: EmitterOptions,
): ChannelEmitter {
  throw new Error('createChannelEmitter is not implemented');
}
