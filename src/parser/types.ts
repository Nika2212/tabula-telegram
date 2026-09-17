import type { ParsedItem, SourceConfig } from '../types/index.ts';

export interface ParseResult {
  readonly sourceId: string;
  readonly items: readonly ParsedItem[];
  readonly errors: readonly Error[];
}

/** One implementation per source site. */
export interface Parser {
  readonly source: SourceConfig;
  /** Extracts items from already-fetched markup. Must stay side-effect free. */
  parse(html: string): readonly ParsedItem[];
}
