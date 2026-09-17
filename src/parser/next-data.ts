import { load, type CheerioAPI } from 'cheerio';

import { PageShapeError } from './errors.ts';
import type { RawNextData } from './raw-types.ts';

const CHALLENGE_MARKERS = ['cf_chl_opt', 'Just a moment', 'cf-browser-verification'];

export interface ParsedPage {
  readonly $: CheerioAPI;
  readonly nextData: RawNextData;
}

/**
 * Loads a tabula.ge page and pulls out its `__NEXT_DATA__` island. The site is
 * a Next.js app that ships the same JSON:API payload the public API would
 * return, so cheerio only has to find one script tag. The document is handed
 * back too, for the `og:` meta fallbacks.
 */
export function parsePage(html: string, url: string): ParsedPage {
  if (CHALLENGE_MARKERS.some((marker) => html.includes(marker))) {
    throw new PageShapeError(url, 'Cloudflare served a challenge page instead of content');
  }

  const $ = load(html);
  const payload = $('script#__NEXT_DATA__').first().contents().text();

  if (payload.trim() === '') {
    throw new PageShapeError(url, 'no #__NEXT_DATA__ script found');
  }

  try {
    return { $, nextData: JSON.parse(payload) as RawNextData };
  } catch (error) {
    throw new PageShapeError(
      url,
      `#__NEXT_DATA__ is not valid JSON (${error instanceof Error ? error.message : String(error)})`,
    );
  }
}

/** Reads a `<meta property="...">` or `<meta name="...">` value. */
export function metaContent($: CheerioAPI, key: string): string | null {
  const value =
    $(`meta[property="${key}"]`).attr('content') ?? $(`meta[name="${key}"]`).attr('content');
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed === '' ? null : trimmed;
}
