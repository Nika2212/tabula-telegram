/**
 * Raised when a page loads but does not contain the expected payload. This is
 * the signal that Cloudflare served a challenge or the site changed shape, and
 * it must stay loud rather than being treated as "no news".
 */
export class PageShapeError extends Error {
  readonly url: string;

  constructor(url: string, detail: string) {
    super(`Unexpected page shape at ${url}: ${detail}`);
    this.name = 'PageShapeError';
    this.url = url;
  }
}
