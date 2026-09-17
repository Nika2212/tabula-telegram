import type { Logger } from './logger.ts';
import { delay } from './time.ts';

export interface RetryOptions {
  readonly attempts: number;
  readonly baseDelayMs: number;
  readonly logger: Logger;
  readonly label: string;
}

/** Retries a fetch-like operation with exponential backoff. */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === options.attempts) break;

      const waitMs = options.baseDelayMs * 2 ** (attempt - 1);
      options.logger.warn(`${options.label} failed, retrying`, {
        attempt,
        of: options.attempts,
        waitMs,
        error: error instanceof Error ? error.message : String(error),
      });
      await delay(waitMs);
    }
  }

  throw lastError;
}
