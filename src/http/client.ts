import axios, { type AxiosInstance } from 'axios';

import type { HttpConfig } from '../config/index.ts';

/**
 * Shared axios instance. tabula.ge sits behind Cloudflare and answers with a
 * challenge page for requests that do not look like a browser, so the default
 * headers matter as much as the timeout.
 */
export function createHttpClient(config: HttpConfig): AxiosInstance {
  return axios.create({
    timeout: config.timeoutMs,
    responseType: 'text',
    // Let callers inspect non-2xx bodies (challenge pages) instead of throwing.
    validateStatus: (status) => status >= 200 && status < 400,
    transitional: { forcedJSONParsing: false },
    headers: {
      'User-Agent': config.userAgent,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ka,en-US;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
    },
  });
}
