import type { TelegramConfig } from '../config/index.ts';
import type { Logger } from '../utils/logger.ts';
import { delay } from '../utils/time.ts';
import type { TelegramClient } from './client.ts';
import type { ChannelEmitter, OutgoingMessage, SentMessage } from './types.ts';

export interface EmitterDeps {
  readonly client: TelegramClient;
  readonly config: TelegramConfig;
  readonly logger: Logger;
}

/**
 * Serializes sends and keeps them spaced out, since channels are capped at
 * roughly 20 messages per minute. In dry-run mode the post is logged instead.
 */
export function createChannelEmitter(deps: EmitterDeps): ChannelEmitter {
  let lastSentAt = 0;

  return {
    async emit(message: OutgoingMessage): Promise<SentMessage | null> {
      if (deps.config.dryRun) {
        deps.logger.info('dry run, not sending', {
          chars: message.text.length,
          preview: message.preview?.url ?? '(none)',
        });
        console.log(`\n--- telegram dry run ---\n${message.text}\n---\n`);
        return null;
      }

      const sinceLast = Date.now() - lastSentAt;
      if (lastSentAt !== 0 && sinceLast < deps.config.minIntervalMs) {
        await delay(deps.config.minIntervalMs - sinceLast);
      }

      const sent = await deps.client.send(message);
      lastSentAt = Date.now();

      deps.logger.info('posted to channel', {
        messageId: sent.messageId,
        chatId: sent.chatId,
        chars: message.text.length,
      });

      return sent;
    },
  };
}
