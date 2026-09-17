export class TelegramApiError extends Error {
  readonly method: string;
  readonly code: number;
  readonly retryAfterMs: number | null;

  constructor(method: string, code: number, description: string, retryAfterMs: number | null) {
    super(`Telegram ${method} failed (${code}): ${description}`);
    this.name = 'TelegramApiError';
    this.method = method;
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }

  /** 429 and 5xx are worth another attempt; 400/403 are not. */
  get isRetryable(): boolean {
    return this.code === 429 || this.code >= 500;
  }
}
