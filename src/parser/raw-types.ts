/**
 * Shapes of the payloads embedded in tabula.ge pages, as observed. These mirror
 * the wire format and stay confined to the parser; the rest of the app consumes
 * the normalized models from `src/types`.
 */

export interface RawImageDerivative {
  readonly href?: unknown;
}

export interface RawNewsListAttributes {
  readonly drupal_internal__nid?: unknown;
  readonly title?: unknown;
  readonly created?: unknown;
  readonly slug?: unknown;
  readonly streams?: unknown;
  readonly thumbnail_hidden?: unknown;
}

export interface RawNewsListResource {
  readonly id?: unknown;
  readonly type?: unknown;
  readonly attributes?: RawNewsListAttributes;
  readonly relationships?: {
    readonly thumbnail_proxy?: {
      readonly data?: {
        readonly meta?: {
          readonly imageDerivatives?: {
            readonly links?: Record<string, RawImageDerivative>;
          };
        };
      };
    };
  };
}

export interface RawNewsCollection {
  readonly data?: unknown;
  readonly links?: Record<string, { readonly href?: unknown }>;
}

/** One entry of the `thumbnail` map on an article page. */
export interface RawImageStyle {
  readonly href?: unknown;
  readonly alt?: unknown;
  readonly title?: unknown;
  readonly caption?: unknown;
  readonly orig_w?: unknown;
  readonly orig_h?: unknown;
}

export interface RawTaxonomyTerm {
  readonly name?: unknown;
}

export interface RawNewsItem {
  readonly id?: unknown;
  readonly nid?: unknown;
  readonly title?: unknown;
  readonly created?: unknown;
  readonly lead?: unknown;
  readonly body?: unknown;
  readonly slug?: unknown;
  readonly thumbnail?: Record<string, RawImageStyle> | null;
  readonly thumbnail_alt?: unknown;
  readonly thumbnail_hidden?: unknown;
  readonly categories?: unknown;
  readonly topic?: RawTaxonomyTerm | null;
  readonly uid?: { readonly display_name?: unknown } | null;
  readonly short_link?: unknown;
  readonly url_absolute?: unknown;
}

export interface RawNextData {
  readonly buildId?: unknown;
  readonly props?: {
    readonly pageProps?: {
      readonly latestNewsData?: RawNewsCollection;
      readonly newsItem?: RawNewsItem;
    };
  };
}
