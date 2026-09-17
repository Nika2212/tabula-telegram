import type { AxiosInstance } from 'axios';

import type { HttpConfig } from '../config/index.ts';
import type { Logger } from '../utils/logger.ts';
import { withRetry } from '../utils/retry.ts';

export interface PageFetcher {
  (url: string): Promise<string>;
}

export function createPageFetcher(
  client: AxiosInstance,
  config: HttpConfig,
  logger: Logger,
): PageFetcher {
  return async (url) => {
    const html = await withRetry(
      async () => {
        const response = await client.get<string>(url);
        return response.data;
      },
      {
        attempts: config.maxRetries,
        baseDelayMs: config.retryBaseDelayMs,
        logger,
        label: `GET ${url}`,
      },
    );

    logger.debug('fetched page', { url, bytes: html.length });
    return html;
  };
}
