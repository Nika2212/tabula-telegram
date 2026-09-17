import type { CheerioAPI } from 'cheerio';

/** Wraps markup into a cheerio document. */
export function loadDocument(_html: string): CheerioAPI {
  throw new Error('loadDocument is not implemented');
}

/** Cheerio selector helpers shared by concrete parsers. */
export function textOf(_$: CheerioAPI, _selector: string): string | undefined {
  throw new Error('textOf is not implemented');
}

export function attrOf(
  _$: CheerioAPI,
  _selector: string,
  _attribute: string,
): string | undefined {
  throw new Error('attrOf is not implemented');
}

export function absoluteUrl(_href: string, _baseUrl: string): string {
  throw new Error('absoluteUrl is not implemented');
}
