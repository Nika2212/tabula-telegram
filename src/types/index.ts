/** A page to be parsed. */
export interface SourceConfig {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly enabled: boolean;
}

/** A single normalized entry extracted from a source page. */
export interface ParsedItem {
  readonly id: string;
  readonly sourceId: string;
  readonly title: string;
  readonly url: string;
  readonly summary?: string;
  readonly imageUrl?: string;
  readonly publishedAt?: Date;
}
