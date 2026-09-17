import { loadConfig } from './config/index.ts';
import { createConsoleHandler } from './handlers/console-handler.ts';
import { createTelegramHandler } from './handlers/telegram-handler.ts';
import { createHttpClient } from './http/client.ts';
import { createPageFetcher } from './parser/fetch-page.ts';
import { createTabulaNewsSource } from './parser/tabula/source.ts';
import { checkForNews } from './pipeline/run.ts';
import { runOnInterval } from './scheduler/interval.ts';
import { createFileStateStore } from './store/state-store.ts';
import { createTelegramClient } from './telegram/client.ts';
import { createChannelEmitter } from './telegram/emitter.ts';
import type { NewsHandler } from './types/index.ts';
import { createLogger, type Logger } from './utils/logger.ts';

async function buildHandlers(
  config: ReturnType<typeof loadConfig>,
  logger: Logger,
): Promise<NewsHandler[]> {
  const handlers: NewsHandler[] = [createConsoleHandler(logger.child('news'))];

  if (config.telegram === null) {
    logger.info('Telegram is not configured, printing to the console only');
    return handlers;
  }

  const telegramLogger = logger.child('telegram');
  const client = createTelegramClient({
    config: config.telegram,
    timeoutMs: config.http.timeoutMs,
    maxAttempts: config.http.maxRetries,
    logger: telegramLogger,
  });

  // Fail at startup rather than on the first article.
  const bot = await client.getMe();
  telegramLogger.info('authenticated', {
    bot: `@${bot.username}`,
    channel: config.telegram.channelId,
    dryRun: config.telegram.dryRun,
  });

  const emitter = createChannelEmitter({
    client,
    config: config.telegram,
    logger: telegramLogger,
  });
  handlers.push(createTelegramHandler(emitter));

  return handlers;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel, 'app');

  const client = createHttpClient(config.http);
  const fetchPage = createPageFetcher(client, config.http, logger.child('http'));
  const source = createTabulaNewsSource({ fetchPage, config, logger });
  const store = createFileStateStore(config.statePath, logger.child('state'));
  const handlers = await buildHandlers(config, logger);

  const controller = new AbortController();
  let stopping = false;
  for (const signalName of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signalName, () => {
      if (stopping) return;
      stopping = true;
      logger.info(`received ${signalName}, finishing current poll`);
      controller.abort();
    });
  }

  logger.info('watching for news', {
    source: `${config.source.baseUrl}${config.source.listPath}`,
    everySeconds: Math.round(config.pollIntervalMs / 1000),
    state: config.statePath,
  });

  await runOnInterval(
    async () => {
      const summary = await checkForNews({
        source,
        store,
        handlers,
        logger: logger.child('poll'),
        maxItemsPerRun: config.maxItemsPerRun,
      });

      if (summary.delivered < summary.fresh) {
        logger.warn('some articles were not delivered this run', {
          delivered: summary.delivered,
          fresh: summary.fresh,
        });
      }
    },
    { intervalMs: config.pollIntervalMs, signal: controller.signal, logger },
  );
}

await main();
