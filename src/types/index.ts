/** An entry as it appears in the news listing (page 1 of the feed). */
export interface NewsListItem {
  readonly id: string;
  readonly nid: number;
  readonly slug: string;
  readonly title: string;
  readonly createdAt: string;
  readonly url: string;
  readonly streams: readonly string[];
  readonly thumbnailUrl: string | null;
}

export interface NewsThumbnail {
  readonly url: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly alt: string | null;
  readonly caption: string | null;
}

/** Everything gathered from a single article's own page. */
export interface NewsArticle {
  readonly id: string;
  readonly nid: number;
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly shortUrl: string | null;
  readonly createdAt: string;
  readonly thumbnail: NewsThumbnail | null;
  readonly categories: readonly string[];
  readonly topic: string | null;
  readonly author: string | null;
}

/**
 * Destination for freshly discovered articles. Currently satisfied by the
 * console handler; the Telegram emitter will implement the same contract.
 */
export interface NewsHandler {
  readonly name: string;
  handle(article: NewsArticle): Promise<void>;
}
