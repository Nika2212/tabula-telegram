import { asInteger, asList, asText, asTextList, asTimestamp } from '../coerce.ts';
import { PageShapeError } from '../errors.ts';
import type { RawNewsListResource, RawNextData } from '../raw-types.ts';
import type { NewsListItem } from '../../types/index.ts';

/** Order of preference when picking a listing thumbnail derivative. */
const THUMBNAIL_STYLES = ['news_thumb_lg', 'news_thumb_md', 'news_thumb_square_md', 'news_thumb_sm'];

function pickThumbnail(resource: RawNewsListResource): string | null {
  const links = resource.relationships?.thumbnail_proxy?.data?.meta?.imageDerivatives?.links;
  if (links === undefined) return null;

  for (const style of THUMBNAIL_STYLES) {
    const href = asText(links[style]?.href);
    if (href !== null) return href;
  }

  for (const derivative of Object.values(links)) {
    const href = asText(derivative.href);
    if (href !== null) return href;
  }
  return null;
}

function toListItem(resource: RawNewsListResource, articleBaseUrl: string): NewsListItem | null {
  const id = asText(resource.id);
  const attributes = resource.attributes;
  if (id === null || attributes === undefined) return null;

  const nid = asInteger(attributes.drupal_internal__nid);
  const title = asText(attributes.title);
  const slug = asText(attributes.slug);
  const createdAt = asTimestamp(attributes.created);

  // The public URL needs both halves; without either one the entry is unusable.
  if (nid === null || slug === null || title === null || createdAt === null) return null;

  return {
    id,
    nid,
    slug,
    title,
    createdAt,
    url: `${articleBaseUrl}/${nid}-${slug}`,
    streams: asTextList(attributes.streams),
    thumbnailUrl: pickThumbnail(resource),
  };
}

export interface ListingParseResult {
  readonly items: readonly NewsListItem[];
  readonly skipped: number;
}

/**
 * Reads `props.pageProps.latestNewsData`, the JSON:API collection the news page
 * embeds. Entries are already sorted newest first by `created`.
 */
export function parseListing(
  nextData: RawNextData,
  url: string,
  articleBaseUrl: string,
): ListingParseResult {
  const collection = nextData.props?.pageProps?.latestNewsData;
  if (collection === undefined) {
    throw new PageShapeError(url, 'props.pageProps.latestNewsData is missing');
  }

  const rows = asList(collection.data);
  if (rows.length === 0) {
    throw new PageShapeError(url, 'latestNewsData.data is empty or not an array');
  }

  const items: NewsListItem[] = [];
  for (const row of rows) {
    const item = toListItem(row as RawNewsListResource, articleBaseUrl);
    if (item !== null) items.push(item);
  }

  if (items.length === 0) {
    throw new PageShapeError(url, `none of the ${rows.length} entries had usable fields`);
  }

  return { items, skipped: rows.length - items.length };
}
