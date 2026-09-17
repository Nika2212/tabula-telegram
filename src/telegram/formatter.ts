import type { NewsArticle } from '../types/index.ts';
import { truncate } from '../utils/html.ts';
import type { OutgoingMessage } from './types.ts';

/**
 * The Bot API ceiling for a text message. It is the only cap applied to the
 * description: a photo caption would be limited to 1024, which is shorter than
 * most Tabula articles, so posts carry the image as a link preview instead.
 */
const TEXT_LIMIT = 4096;

/** Headroom for the separators and any entity-length accounting differences. */
const SAFETY_MARGIN = 24;

/** Only these three characters need escaping in Telegram's HTML parse mode. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Builds the channel post: bold headline, the full description, then the link.
 * The image arrives as a large preview above the text.
 */
export function formatArticle(article: NewsArticle): OutgoingMessage {
  const reserved = article.title.length + article.url.length + SAFETY_MARGIN;
  const room = Math.max(0, TEXT_LIMIT - reserved);
  const description = truncate(article.description, room);

  const blocks = [`<b>${escapeHtml(article.title)}</b>`];
  if (description !== '') blocks.push(escapeHtml(description));
  blocks.push(article.url);

  return {
    text: blocks.join('\n\n'),
    parseMode: 'HTML',
    preview: { url: article.url, preferLargeMedia: true, showAboveText: true },
  };
}
