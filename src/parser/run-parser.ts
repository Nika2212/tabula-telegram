import type { AxiosInstance } from 'axios';

import type { Parser, ParseResult } from './types.ts';

/** Fetches a source page and runs its parser over the markup. */
export function runParser(
  _parser: Parser,
  _client: AxiosInstance,
): Promise<ParseResult> {
  throw new Error('runParser is not implemented');
}
