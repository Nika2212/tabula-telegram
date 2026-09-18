import axios, { type AxiosInstance } from 'axios';

import type { TelegramConfig } from '../config/index.ts';
import type { Logger } from '../utils/logger.ts';
import { delay } from '../utils/time.ts';
import { TelegramApiError } from './errors.ts';
import type { BotIdentity, OutgoingMessage, SentMessage } from './types.ts';

interface ApiEnvelope<T> {
  readonly ok: boolean;
  readonly result?: T;
  readonly description?: string;
  readonly error_code?: number;
  readonly parameters?: { readonly retry_after?: number };
}

interface RawMessage {
  readonly message_id: number;
  readonly chat: { readonly id: number };
}

export interface TelegramClient {
  getMe(): Promise<BotIdentity>;
  send(message: OutgoingMessage): Promise<SentMessage>;
}

export interface TelegramClientDeps {
  readonly config: TelegramConfig;
  readonly timeoutMs: number;
  readonly maxAttempts: number;
  readonly logger: Logger;
}

function buildHttpClient(botToken: string, timeoutMs: number): AxiosInstance {
  return axios.create({
    baseURL: `https://api.telegram.org/bot${botToken}`,
    timeout: timeoutMs,
    headers: { 'Content-Type': 'application/json' },
    // Errors carry a useful JSON body, so read it instead of throwing.
    validateStatus: () => true,
  });
}

export function createTelegramClient(deps: TelegramClientDeps): TelegramClient {
  const http = buildHttpClient(deps.config.botToken, deps.timeoutMs);

  async function callOnce<T>(method: string, params: Record<string, unknown>): Promise<T> {
    const response = await http.post<ApiEnvelope<T>>(`/${method}`, params);
    const body = response.data;

    if (body.ok && body.result !== undefined) return body.result;

    const retryAfter = body.parameters?.retry_after;
    throw new TelegramApiError(
      method,
      body.error_code ?? response.status,
      body.description ?? 'no description',
      retryAfter === undefined ? null : retryAfter * 1000,
    );
  }

  async function call<T>(method: string, params: Record<string, unknown>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= deps.maxAttempts; attempt += 1) {
      try {
        return await callOnce<T>(method, params);
      } catch (error) {
        lastError = error;

        const retryable =
          error instanceof TelegramApiError ? error.isRetryable : true;
        if (!retryable || attempt === deps.maxAttempts) break;

        const waitMs =
          error instanceof TelegramApiError && error.retryAfterMs !== null
            ? error.retryAfterMs
            : 1000 * 2 ** (attempt - 1);

        deps.logger.warn(`${method} failed, retrying`, {
          attempt,
          of: deps.maxAttempts,
          waitMs,
          error: error instanceof Error ? error.message : String(error),
        });
        await delay(waitMs);
      }
    }

    throw lastError;
  }

  return {
    async getMe() {
      const me = await call<{ id: number; username?: string }>('getMe', {});
      return { id: me.id, username: me.username ?? '' };
    },

    async send(message) {
      const shared = {
        chat_id: deps.config.channelId,
        parse_mode: message.parseMode,
        disable_notification: deps.config.disableNotification,
      };

      if (message.photoUrl !== null) {
        const sent = await call<RawMessage>('sendPhoto', {
          ...shared,
          photo: message.photoUrl,
          caption: message.text,
        });
        return { messageId: sent.message_id, chatId: String(sent.chat.id) };
      }

      const preview = message.preview;
      const sent = await call<RawMessage>('sendMessage', {
        ...shared,
        text: message.text,
        link_preview_options:
          preview === null
            ? { is_disabled: true }
            : {
                url: preview.url,
                prefer_large_media: preview.preferLargeMedia,
                show_above_text: preview.showAboveText,
              },
      });

      return { messageId: sent.message_id, chatId: String(sent.chat.id) };
    },
  };
}
