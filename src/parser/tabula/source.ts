import type { AppConfig } from '../../config/index.ts';
import type { NewsArticle, NewsListItem } from '../../types/index.ts';
import type { Logger } from '../../utils/logger.ts';
import type { PageFetcher } from '../fetch-page.ts';
import type { NewsSource } from '../news-source.ts';
import { parsePage } from '../next-data.ts';
import { parseArticle } from './article.ts';
import { parseListing } from './listing.ts';

export interface TabulaNewsSourceDeps {
  readonly fetchPage: PageFetcher;
  readonly config: AppConfig;
  readonly logger: Logger;
}

export function createTabulaNewsSource(deps: TabulaNewsSourceDeps): NewsSource {
  const { baseUrl, listPath } = deps.config.source;
  const listingUrl = `${baseUrl}${listPath}`;
  const logger = deps.logger.child('tabula');

  return {
    id: 'tabula-news',

    async fetchListing() {
      const html = await deps.fetchPage(listingUrl);
      const { nextData } = parsePage(html, listingUrl);
      const { items, skipped } = parseListing(nextData, listingUrl, listingUrl);

      if (skipped > 0) {
        logger.warn('skipped listing entries with missing fields', { skipped });
      }
      logger.debug('listing parsed', { items: items.length, newest: items[0]?.createdAt });

      return items;
    },

    async fetchArticle(item: NewsListItem): Promise<NewsArticle> {
      const html = await deps.fetchPage(item.url);
      const { $, nextData } = parsePage(html, item.url);

      return parseArticle(nextData, $, item.url, item);
    },
  };
}
