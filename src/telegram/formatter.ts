import type { NewsArticle } from '../types/index.ts';
import { truncate } from '../utils/html.ts';
import type { OutgoingMessage } from './types.ts';

/** Bot API ceilings for a photo caption and a plain text message. */
const CAPTION_LIMIT = 1024;
const TEXT_LIMIT = 4096;

/** Headroom for any entity-length accounting differences. */
const SAFETY_MARGIN = 24;

/** Only these three characters need escaping in Telegram's HTML parse mode. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Builds the channel post: the article's image, captioned with the headline.
 *
 * The headline links to the article, so the post stays navigable without a
 * visible URL. Articles without an image fall back to a text message and let
 * Telegram render the picture as a large link preview.
 */
export function formatArticle(article: NewsArticle): OutgoingMessage {
  const photoUrl = article.thumbnail?.url ?? null;
  const limit = photoUrl === null ? TEXT_LIMIT : CAPTION_LIMIT;
  const title = escapeHtml(truncate(article.title, limit - SAFETY_MARGIN));

  return {
    text: `<a href="${escapeHtml(article.url)}"><b>${title}</b></a>`,
    parseMode: 'HTML',
    photoUrl,
    preview:
      photoUrl === null
        ? { url: article.url, preferLargeMedia: true, showAboveText: true }
        : null,
  };
}
