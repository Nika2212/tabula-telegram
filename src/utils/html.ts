import { load } from 'cheerio';

/**
 * Collapses an HTML fragment into plain text. Tabula wraps body copy in deeply
 * nested `<span>` elements, so block-level tags are turned into breaks first to
 * keep sentences from running together.
 */
export function htmlToText(html: string): string {
  const $ = load(`<div id="root">${html}</div>`);
  $('#root script, #root style').remove();
  $('#root p, #root br, #root div, #root li, #root h1, #root h2, #root h3').after('\n');

  return $('#root')
    .text()
    .replace(/\r/g, '')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
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
