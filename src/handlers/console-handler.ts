import type { NewsArticle, NewsHandler } from '../types/index.ts';

const RULE = '─'.repeat(78);

const TBILISI_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tbilisi',
  dateStyle: 'medium',
  timeStyle: 'short',
});

function field(label: string, value: string): string {
  return `  ${(`${label}:`).padEnd(13)}${value}`;
}

/**
 * Stage-1 destination: prints what the Telegram post will contain, so the
 * extraction can be eyeballed before the channel emitter exists.
 */
export function createConsoleHandler(): NewsHandler {
  return {
    name: 'console',

    handle(article: NewsArticle): Promise<void> {
      const lines = [
        RULE,
        `  NEW ARTICLE   #${article.nid}   ${TBILISI_TIME.format(new Date(article.createdAt))} (Tbilisi)`,
        RULE,
        field('title', article.title),
      ];

      if (article.categories.length > 0) {
        lines.push(field('categories', article.categories.join(', ')));
      }
      if (article.topic !== null) lines.push(field('topic', article.topic));
      if (article.author !== null) lines.push(field('author', article.author));

      if (article.thumbnail === null) {
        lines.push(field('thumbnail', '(none)'));
      } else {
        const { width, height, alt, url } = article.thumbnail;
        const size = width !== null && height !== null ? `  [${width}x${height}]` : '';
        lines.push(field('thumbnail', `${url}${size}`));
        if (alt !== null) lines.push(field('image alt', alt));
      }

      lines.push(field('link', article.url));
      if (article.shortUrl !== null) lines.push(field('short link', article.shortUrl));

      lines.push('', '  description:');
      const description = article.description === '' ? '(empty)' : article.description;
      for (const paragraph of description.split('\n')) {
        lines.push(`    ${paragraph}`);
      }
      lines.push(RULE, '');

      console.log(lines.join('\n'));
      return Promise.resolve();
    },
  };
}
