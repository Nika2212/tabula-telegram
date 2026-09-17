# tabula-telegram

A small service that watches the [Tabula](https://tabula.ge) news feed and posts
every new article to a Telegram channel.

It checks for news every 2 minutes. When something new shows up it opens the
article, takes the headline, image and text, and publishes it to the channel.
Articles it has already posted are remembered, so nothing gets sent twice.

## What you need

- Node.js 22 or newer
- A bot token from [@BotFather](https://t.me/BotFather)
- A Telegram channel where that bot is an administrator and allowed to post

## Running it

```bash
npm install
cp .env.example .env    # fill in the bot token and channel
npm run dev
```

For production, build first and run the compiled output:

```bash
npm run build
npm start
```

## Configuration

Everything is read from environment variables — see `.env.example` for the full
list. Only two are required:

| Variable              | Description                                       |
| --------------------- | ------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`  | Bot token from BotFather                          |
| `TELEGRAM_CHANNEL_ID` | `@channelname`, or `-100...` for a private channel |

Useful while trying things out:

| Variable           | Description                                        |
| ------------------ | -------------------------------------------------- |
| `TELEGRAM_DRY_RUN` | `true` prints posts to the console instead of sending |
| `POLL_INTERVAL_MS` | How often to check, in milliseconds                |
| `LOG_LEVEL`        | `debug` for verbose output                         |
| `STATE_PATH`       | Where the record of posted articles is kept        |

Without a token or channel the service still runs and prints articles to the
console, which is a convenient way to watch it work.

## Deployment

It runs as a background worker: no web server and no port to expose.

On a host with a throwaway filesystem — Railway, Fly, Heroku — attach a
persistent disk and point `STATE_PATH` at it. Otherwise the service forgets what
it has posted whenever it restarts and repeats the latest article. Run a single
instance; two would post everything twice.

## Scripts

| Command             | What it does          |
| ------------------- | --------------------- |
| `npm run dev`       | Run in watch mode     |
| `npm run build`     | Compile to `dist/`    |
| `npm start`         | Run the compiled build |
| `npm run typecheck` | Check types           |

## Good to know

Written in TypeScript, with Axios and Cheerio doing the fetching and reading.

News comes from the public Tabula website rather than its API, since the API is
not reachable from outside a browser. If the site ever changes shape, the
service fails loudly in the logs instead of quietly reporting no news. The
reasoning behind that, and the rest of the parsing details, lives in comments
alongside the code in `src/parser/`.
