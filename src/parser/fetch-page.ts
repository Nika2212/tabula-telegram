import type { AxiosInstance } from 'axios';

export interface FetchPageOptions {
  readonly url: string;
  readonly client: AxiosInstance;
}

/** Downloads raw markup for a source page. */
export function fetchPage(_options: FetchPageOptions): Promise<string> {
  throw new Error('fetchPage is not implemented');
}
