import type { NewsArticle, NewsHandler } from '../types/index.ts';
import type { Logger } from '../utils/logger.ts';

const TBILISI_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tbilisi',
  dateStyle: 'short',
  timeStyle: 'short',
});

/**
 * Logs one line per article. Deliberately omits the body text, which would
 * otherwise add a couple of thousand characters to the logs per article.
 */
export function createConsoleHandler(logger: Logger): NewsHandler {
  return {
    name: 'console',

    handle(article: NewsArticle): Promise<void> {
      logger.info(article.title, {
        nid: article.nid,
        published: TBILISI_TIME.format(new Date(article.createdAt)),
        topic: article.topic ?? '-',
        categories: article.categories.join('/') || '-',
        author: article.author ?? '-',
        chars: article.description.length,
        image: article.thumbnail === null ? 'none' : `${article.thumbnail.width}x${article.thumbnail.height}`,
        url: article.url,
      });

      return Promise.resolve();
    },
  };
}
