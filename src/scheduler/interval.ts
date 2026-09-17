import type { Logger } from '../utils/logger.ts';
import { delay } from '../utils/time.ts';

export interface IntervalOptions {
  readonly intervalMs: number;
  readonly signal: AbortSignal;
  readonly logger: Logger;
}

/**
 * Runs `task` immediately and then every `intervalMs`, measuring the gap from
 * the end of one run so a slow poll cannot stack up overlapping runs. A failing
 * task is logged and the schedule continues.
 */
export async function runOnInterval(
  task: () => Promise<void>,
  options: IntervalOptions,
): Promise<void> {
  const { intervalMs, signal, logger } = options;

  while (!signal.aborted) {
    const startedAt = Date.now();

    try {
      await task();
    } catch (error) {
      logger.error('poll failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if (signal.aborted) break;

    const waitMs = Math.max(0, intervalMs - (Date.now() - startedAt));
    logger.debug('sleeping until next poll', { seconds: Math.round(waitMs / 1000) });
    await delay(waitMs, signal);
  }

  logger.info('scheduler stopped');
}
