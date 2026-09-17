import type { CheerioAPI } from 'cheerio';

import { asInteger, asList, asText, asTimestamp } from '../coerce.ts';
import { PageShapeError } from '../errors.ts';
import { metaContent } from '../next-data.ts';
import type { RawImageStyle, RawNewsItem, RawNextData, RawTaxonomyTerm } from '../raw-types.ts';
import type { NewsArticle, NewsListItem, NewsThumbnail } from '../../types/index.ts';
import { htmlToText } from '../../utils/html.ts';

/**
 * `share` is the 1200x630 derivative the site uses for social cards, which is
 * also the best fit for a Telegram photo; the rest are progressively smaller.
 */
const IMAGE_STYLES = ['share', 'news_thumb_lg', 'original', 'news_thumb_md'];

function pickThumbnail(item: RawNewsItem, $: CheerioAPI): NewsThumbnail | null {
  const styles = item.thumbnail;
  const fallbackAlt = asText(item.thumbnail_alt);

  if (styles != null) {
    const chosen = IMAGE_STYLES.map((name) => styles[name]).find(
      (style): style is RawImageStyle => style !== undefined && asText(style.href) !== null,
    );
    const style = chosen ?? Object.values(styles).find((s) => asText(s.href) !== null);
    const href = style === undefined ? null : asText(style.href);

    if (style !== undefined && href !== null) {
      return {
        url: href,
        width: asInteger(style.orig_w),
        height: asInteger(style.orig_h),
        alt: asText(style.alt) ?? fallbackAlt,
        caption: asText(style.caption),
      };
    }
  }

  const ogImage = metaContent($, 'og:image');
  if (ogImage === null) return null;

  return { url: ogImage, width: null, height: null, alt: fallbackAlt, caption: null };
}

/**
 * Tabula leaves `lead` empty on news entries, so the description is derived
 * from the article body and falls back to the social-card description. The full
 * text is kept here; trimming to a message limit is the formatter's job.
 */
function buildDescription(item: RawNewsItem, $: CheerioAPI): string {
  const lead = asText(item.lead);
  if (lead !== null) return htmlToText(lead);

  const body = asText(item.body);
  if (body !== null) {
    const text = htmlToText(body);
    if (text !== '') return text;
  }

  return metaContent($, 'og:description') ?? metaContent($, 'description') ?? '';
}

function termNames(value: unknown): string[] {
  const names: string[] = [];
  for (const entry of asList(value)) {
    const name = asText((entry as RawTaxonomyTerm).name);
    if (name !== null) names.push(name);
  }
  return names;
}

/** Reads `props.pageProps.newsItem` from an article page. */
export function parseArticle(
  nextData: RawNextData,
  $: CheerioAPI,
  url: string,
  item: NewsListItem,
): NewsArticle {
  const raw = nextData.props?.pageProps?.newsItem;
  if (raw === undefined) {
    throw new PageShapeError(url, 'props.pageProps.newsItem is missing');
  }

  return {
    id: asText(raw.id) ?? item.id,
    nid: asInteger(raw.nid) ?? item.nid,
    title: asText(raw.title) ?? item.title,
    description: buildDescription(raw, $),
    url: asText(raw.url_absolute) ?? item.url,
    shortUrl: asText(raw.short_link),
    createdAt: asTimestamp(raw.created) ?? item.createdAt,
    thumbnail: pickThumbnail(raw, $),
    categories: termNames(raw.categories),
    topic: asText(raw.topic?.name),
    author: asText(raw.uid?.display_name),
  };
}
