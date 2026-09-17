import { load } from 'cheerio';

/** Elements that should end up separated by a blank line. */
const BLOCK_ELEMENTS = 'p, div, li, h1, h2, h3, h4, h5, h6, blockquote, figcaption, tr';

/**
 * Collapses an HTML fragment into plain text, keeping paragraph breaks as blank
 * lines. Tabula wraps body copy in deeply nested `<span>` elements, so the
 * block-level tags are the only reliable paragraph boundaries.
 */
export function htmlToText(html: string): string {
  const $ = load(`<div id="root">${html}</div>`);
  const root = $('#root');

  root.find('script, style').remove();
  root.find('br').after('\n');
  root.find(BLOCK_ELEMENTS).after('\n\n');

  return root
    .text()
    .replace(/\r/g, '')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    // Nested blocks emit extra breaks; cap the gap at one blank line.
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Truncates on a word boundary and appends an ellipsis when shortened. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const hard = text.slice(0, maxLength);
  const lastSpace = hard.lastIndexOf(' ');
  const cut = lastSpace > maxLength * 0.6 ? hard.slice(0, lastSpace) : hard;

  return `${cut.trimEnd()}…`;
}
