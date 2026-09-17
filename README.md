# tabula-telegram

Node.js + TypeScript service that parses source pages (Axios + Cheerio) and emits
the results to a Telegram channel.

Status: **scaffold only** — every module exposes its types and signatures and
throws `not implemented`.

## Requirements

- Node.js >= 22.18 (runs `.ts` directly via native type stripping, no bundler)

## Setup

```bash
npm install
cp .env.example .env   # fill in TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID
```

## Scripts

| Script              | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Run `src/index.ts` with watch + `.env`       |
| `npm run typecheck` | Type check without emitting                  |
| `npm run build`     | Compile `src` to `dist`                      |
| `npm start`         | Run the compiled build                       |
| `npm test`          | Node built-in test runner over `tests/`      |

## Layout

```
src/
  index.ts            entry point: config -> dependencies -> pipeline
  config/             environment parsing and validation (AppConfig)
  http/               shared axios instance (timeout, headers, retries)
  parser/
    types.ts          Parser / ParseResult contracts
    fetch-page.ts     axios page download
    extract.ts        cheerio document + selector helpers
    run-parser.ts     fetch + parse for one source
    sources/          one module per site, registered in sources/index.ts
  telegram/
    types.ts          OutgoingMessage / ChannelEmitter contracts
    client.ts         Bot API wrapper over axios
    emitter.ts        channel emitter with throttling and dry-run
    formatter.ts      ParsedItem -> message text
  pipeline/           parse -> dedupe -> format -> emit orchestration
  store/              seen-item store for idempotent emits
  types/              shared domain models (SourceConfig, ParsedItem)
  utils/              logger
tests/                unit tests mirroring src/
```

## Adding a source

1. Create `src/parser/sources/<site>.ts` exporting a `Parser`.
2. Register it in `src/parser/sources/index.ts`.
3. The pipeline picks it up automatically.

## Conventions

- ESM only, `"type": "module"`; relative imports carry the `.ts` extension and
  are rewritten to `.js` on build.
- `erasableSyntaxOnly` is on, so no enums, namespaces, or parameter properties.
- Modules export interfaces and factory functions; dependencies are injected
  from `src/index.ts` rather than imported as singletons.
