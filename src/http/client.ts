import type { AxiosInstance } from 'axios';

import type { HttpConfig } from '../config/index.ts';

/** Shared axios instance: base headers, timeout, retry/backoff. */
export function createHttpClient(_config: HttpConfig): AxiosInstance {
  throw new Error('createHttpClient is not implemented');
}
