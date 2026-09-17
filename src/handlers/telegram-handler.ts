import { formatArticle } from '../telegram/formatter.ts';
import type { ChannelEmitter } from '../telegram/types.ts';
import type { NewsArticle, NewsHandler } from '../types/index.ts';

/**
 * Bridges the news pipeline to the channel. A throw here stops the run without
 * advancing the watermark, so the article is retried on the next poll.
 */
export function createTelegramHandler(emitter: ChannelEmitter): NewsHandler {
  return {
    name: 'telegram',

    async handle(article: NewsArticle): Promise<void> {
      await emitter.emit(formatArticle(article));
    },
  };
}
