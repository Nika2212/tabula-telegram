# tabula-telegram

Node.js + TypeScript watcher that polls the Tabula news feed and, for each new
article, reads its page for the thumbnail, title and description, then posts it
to a Telegram channel.

Every article goes to the console as well, so the run is readable in logs. If no
bot token or channel is configured, the console is the only destination.

## Where the data comes from

`api.tabula.ge` is unusable from a server: every request is answered with a
Cloudflare JavaScript challenge (`403`), regardless of headers, and its
`robots.txt` is `Disallow: /`.

The public page `https://tabula.ge/ge/news` is not challenged and embeds the
**same** Drupal JSON:API payload in its `__NEXT_DATA__` script tag, at
`props.pageProps.latestNewsData` — 40 newest entries, sorted by `created`
descending. So Axios fetches the page and Cheerio lifts out that one script tag.

Two consequences worth knowing:

- Cloudflare's rules are path-specific. `/ge/news` and `/ge/news/{id}` work;
  `/`, `/ge`, `/ge/rss.xml` and `/_next/data/...` are challenged. If that ever
  changes, `PageShapeError` is raised rather than reporting "no news".
- The listing carries no article text (`lead` is always null), so the
  description comes from the article page's `body`, falling back to
  `og:description`.

Article URLs are `https://tabula.ge/ge/news/{drupal_internal__nid}-{slug}`; the
slug alone returns 404.

## Requirements

- Node.js >= 22.18 (runs `.ts` directly via native type stripping)

## Setup

```bash
npm install
cp .env.example .env   # optional; every value has a working default
npm run dev
```

## How a poll works

1. Fetch `/ge/news` and parse the embedded JSON:API collection.
2. Work out which entries are new (see below).
3. For each one, fetch its own page and extract thumbnail, title, description,
   categories, topic, author and short link.
4. Hand it to every `NewsHandler`: the console printer and the Telegram poster.
5. Remember the newest delivered entry in `data/state.json`.

Then repeat every 5 minutes. The interval is measured from the end of each run,
so a slow poll cannot overlap the next one.

### Freshness rules

- **First run** (no state file) takes only the newest entry, so a cold start
  does not replay all 40.
- Later runs walk the listing newest-first and stop at the remembered entry.
  Entries are then delivered **oldest first**, so the output reads
  chronologically.
- Dedupe is by JSON:API UUID, not by `drupal_internal__nid` — nid order does not
  match publication order, so a nid watermark would drop articles.
- A failed article fetch stops the run without advancing the watermark, so the
  next poll retries instead of skipping. The same applies if **any** handler
  fails, so a Telegram outage cannot be masked by the console printer
  succeeding.
- `MAX_ITEMS_PER_RUN` caps a single run after an outage.

## The Telegram post

A text message: the title in bold, the article's **full** description, then the
URL. The image rides along as a link preview, requested large and placed above
the text, so it reads like a photo post.

The reason it is not an actual photo message is the Bot API limit: a photo
caption is capped at 1024 characters, which is shorter than most Tabula
articles, while a text message allows 4096. Measured across the ten newest
articles, posts came out between 873 and 2865 characters, so nothing is trimmed
in practice — `truncate` only engages if an article would exceed 4096.

The preview works because Telegram can fetch the article page itself: unlike the
JSON:API host, `/ge/news/{id}` is not challenged for any user agent, and it
carries an `og:image` at 1200x630.

Setup: create the bot with BotFather, add it to the channel as an
**administrator** with **Post Messages**, then set `TELEGRAM_BOT_TOKEN` and
`TELEGRAM_CHANNEL_ID` (`@username`, or `-100...` for a private channel). The
token is checked with `getMe` at startup so a bad token fails immediately rather
than on the first article.

Set `TELEGRAM_DRY_RUN=true` to format and print posts without sending them.

## Scripts

| Script              | Purpose                                 |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Watch mode, runs `src/index.ts`         |
| `npm run typecheck` | Type check without emitting             |
| `npm run build`     | Compile `src` to `dist`                 |
| `npm start`         | Run the compiled build                  |

Configuration is read from the environment; see `.env.example`. Useful knobs
while developing: `POLL_INTERVAL_MS`, `MAX_ITEMS_PER_RUN`, `TELEGRAM_DRY_RUN`,
`LOG_LEVEL=debug`.

To replay recent articles, delete `data/state.json` (next run takes the latest
one) or set `lastSeenCreatedAt` in it to an earlier timestamp.

## Deploying to Railway

This is a worker, not a web service: it opens no port and needs no healthcheck.
Railway's Nixpacks builder picks up `npm run build` and then `npm start`, which
runs the compiled `dist/`.

**State needs a volume.** The container filesystem is ephemeral, so without one
`data/state.json` is lost on every redeploy and restart. The next run then looks
like a first run and re-posts the most recent article — one duplicate per
restart. Attach a Railway volume and point the app at it:

- Mount path: `/data`
- Variable: `STATE_PATH=/data/state.json`

Volumes are bound to a single instance, so keep the service at one replica. Two
replicas would poll independently and double-post.

**Set these variables** in the Railway service (`.env` is gitignored and does
not ship):

| Variable                | Value                             |
| ----------------------- | --------------------------------- |
| `TELEGRAM_BOT_TOKEN`    | from BotFather                    |
| `TELEGRAM_CHANNEL_ID`   | `@channelusername` or `-100...`   |
| `STATE_PATH`            | `/data/state.json`                |

Everything else has a working default. `POLL_INTERVAL_MS` and `LOG_LEVEL` are
the ones worth overriding.

**Verify after the first deploy** that the source is still reachable. All of the
testing behind this parser ran from a residential IP; Cloudflare applies
stricter rules to datacenter ranges, so `/ge/news` could be challenged from
Railway even though it is not challenged locally. The symptom is explicit —
`PageShapeError: Cloudflare served a challenge page instead of content` in the
logs on every poll, rather than silent "no new articles". If that happens the
fix is a proxy or an egress IP that Cloudflare does not challenge, not a code
change.

SIGTERM is handled, so Railway's redeploys shut the poller down cleanly between
polls.

## Layout

```
src/
  index.ts                  bootstrap: config -> dependencies -> scheduler
  config/                   environment parsing, defaults, validation
  http/client.ts            axios instance with browser-like headers
  parser/
    news-source.ts          NewsSource interface (listing + article)
    fetch-page.ts           page fetcher with retry/backoff
    next-data.ts            cheerio: __NEXT_DATA__ + og: meta, challenge check
    coerce.ts               narrowing helpers for unknown payloads
    raw-types.ts            wire shapes, confined to the parser
    errors.ts               PageShapeError
    tabula/
      listing.ts            JSON:API collection -> NewsListItem[]
      article.ts            newsItem -> NewsArticle
      source.ts             NewsSource implementation
  pipeline/
    run.ts                  one poll: list -> detect -> enrich -> deliver
    select-fresh.ts          freshness rules
  scheduler/interval.ts     drift-free repeat with graceful shutdown
  store/state-store.ts      atomic JSON state file
  handlers/
    console-handler.ts      readable log output
    telegram-handler.ts     bridges the pipeline to the channel
  telegram/
    client.ts               Bot API calls with 429/5xx retry
    formatter.ts            NewsArticle -> caption, within Bot API limits
    emitter.ts              throttling and dry-run
    types.ts                OutgoingMessage, ChannelEmitter
  types/index.ts            NewsListItem, NewsArticle, NewsHandler
  utils/                    logger, html-to-text, retry, delay
```

## Adding another destination

Implement `NewsHandler` from `src/types/index.ts` and push it into the
`handlers` array in `src/index.ts`. Nothing else has to change: a throw from a
handler already stops the run so the article is retried on the next poll.

## Conventions

- ESM only; relative imports carry the `.ts` extension and are rewritten to
  `.js` on build.
- `erasableSyntaxOnly` is on, so no enums, namespaces, or parameter properties.
- Factory functions with injected dependencies; no module-level singletons.
#   t a b u l a - t e l e g r a m  
 