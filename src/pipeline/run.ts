import type { NewsSource } from '../parser/news-source.ts';
import { rememberIds, type StateStore } from '../store/state-store.ts';
import type { NewsArticle, NewsHandler, NewsListItem } from '../types/index.ts';
import type { Logger } from '../utils/logger.ts';
import { selectFresh } from './select-fresh.ts';

export interface PipelineDeps {
  readonly source: NewsSource;
  readonly store: StateStore;
  readonly handlers: readonly NewsHandler[];
  readonly logger: Logger;
  readonly maxItemsPerRun: number;
}

export interface CheckSummary {
  readonly listed: number;
  readonly fresh: number;
  readonly delivered: number;
  readonly firstRun: boolean;
}

/**
 * Every handler must accept the article. Succeeding partially would let the
 * console printer mask a failed Telegram post and the article would never be
 * retried, so one failure fails the whole delivery.
 */
async function deliver(
  article: NewsArticle,
  handlers: readonly NewsHandler[],
  logger: Logger,
): Promise<boolean> {
  for (const handler of handlers) {
    try {
      await handler.handle(article);
    } catch (error) {
      logger.error('handler failed', {
        handler: handler.name,
        nid: article.nid,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  return true;
}

/**
 * One poll: read the listing, work out what is new, fetch each new entry's own
 * page for the full details, hand it to the handlers, then remember it.
 *
 * Delivery runs oldest first and stops at the first failure, leaving the
 * watermark where it was so the next poll retries rather than skipping.
 */
export async function checkForNews(deps: PipelineDeps): Promise<CheckSummary> {
  const state = await deps.store.load();
  const firstRun = state.lastSeenId === null;

  const items = await deps.source.fetchListing();
  const fresh = selectFresh(items, state, deps.maxItemsPerRun);

  if (fresh.length === 0) {
    // Debug, not info: at a two-minute interval this is the usual outcome.
    deps.logger.debug('no new articles', { listed: items.length });
    return { listed: items.length, fresh: 0, delivered: 0, firstRun };
  }

  deps.logger.info(
    firstRun ? 'first run, taking the latest article' : 'new articles found',
    { count: fresh.length, listed: items.length },
  );

  const delivered: NewsListItem[] = [];
  for (const item of fresh) {
    let article: NewsArticle;
    try {
      article = await deps.source.fetchArticle(item);
    } catch (error) {
      deps.logger.error('could not read article page, retrying next poll', {
        nid: item.nid,
        url: item.url,
        error: error instanceof Error ? error.message : String(error),
      });
      break;
    }

    if (!(await deliver(article, deps.handlers, deps.logger))) {
      deps.logger.error('delivery incomplete, retrying next poll', { nid: item.nid });
      break;
    }

    delivered.push(item);
  }

  const newest = delivered.at(-1);
  if (newest !== undefined) {
    await deps.store.save({
      lastSeenId: newest.id,
      lastSeenNid: newest.nid,
      lastSeenCreatedAt: newest.createdAt,
      seenIds: rememberIds(state, delivered.map((item) => item.id).reverse()),
      updatedAt: new Date().toISOString(),
    });
  }

  return { listed: items.length, fresh: fresh.length, delivered: delivered.length, firstRun };
}
