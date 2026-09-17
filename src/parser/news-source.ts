import type { NewsArticle, NewsListItem } from '../types/index.ts';

/**
 * The news page interface. A source exposes the listing (newest first) and the
 * detail view for a single entry, so the pipeline never deals with HTML.
 */
export interface NewsSource {
  readonly id: string;

  /** Page 1 of the feed, newest first. */
  fetchListing(): Promise<readonly NewsListItem[]>;

  /** Full detail for one entry, read from its own page. */
  fetchArticle(item: NewsListItem): Promise<NewsArticle>;
}
