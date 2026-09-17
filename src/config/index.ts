import { isLogLevel, type LogLevel } from '../utils/logger.ts';

export interface HttpConfig {
  readonly timeoutMs: number;
  readonly userAgent: string;
  readonly maxRetries: number;
  readonly retryBaseDelayMs: number;
}

export interface SourceConfig {
  readonly baseUrl: string;
  readonly listPath: string;
}

export interface TelegramConfig {
  readonly botToken: string;
  readonly channelId: string;
  /** Format and log the post without calling the Bot API. */
  readonly dryRun: boolean;
  /** Spacing between sends; channels are limited to ~20 messages/minute. */
  readonly minIntervalMs: number;
  readonly disableNotification: boolean;
}

export interface AppConfig {
  readonly source: SourceConfig;
  readonly http: HttpConfig;
  /** Null until a bot token is configured; stage 1 logs to the console. */
  readonly telegram: TelegramConfig | null;
  readonly pollIntervalMs: number;
  readonly maxItemsPerRun: number;
  readonly statePath: string;
  readonly logLevel: LogLevel;
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

function readString(env: NodeJS.ProcessEnv, key: string, fallback: string): string {
  const raw = env[key]?.trim();
  return raw === undefined || raw === '' ? fallback : raw;
}

function readBool(env: NodeJS.ProcessEnv, key: string, fallback: boolean): boolean {
  const raw = env[key]?.trim().toLowerCase();
  if (raw === undefined || raw === '') return fallback;
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  throw new Error(`${key} must be true or false, got "${raw}"`);
}

function readInt(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key]?.trim();
  if (raw === undefined || raw === '') return fallback;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer, got "${raw}"`);
  }
  return parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const logLevelRaw = readString(env, 'LOG_LEVEL', 'info');
  if (!isLogLevel(logLevelRaw)) {
    throw new Error(`LOG_LEVEL must be debug|info|warn|error, got "${logLevelRaw}"`);
  }

  const botToken = readString(env, 'TELEGRAM_BOT_TOKEN', '');
  const channelId = readString(env, 'TELEGRAM_CHANNEL_ID', '');

  return {
    source: {
      baseUrl: readString(env, 'SOURCE_BASE_URL', 'https://tabula.ge'),
      listPath: readString(env, 'SOURCE_LIST_PATH', '/ge/news'),
    },
    http: {
      timeoutMs: readInt(env, 'REQUEST_TIMEOUT_MS', 15_000),
      userAgent: readString(env, 'REQUEST_USER_AGENT', DEFAULT_USER_AGENT),
      maxRetries: readInt(env, 'HTTP_MAX_RETRIES', 3),
      retryBaseDelayMs: readInt(env, 'HTTP_RETRY_BASE_DELAY_MS', 1_000),
    },
    telegram:
      botToken === '' || channelId === ''
        ? null
        : {
            botToken,
            channelId,
            dryRun: readBool(env, 'TELEGRAM_DRY_RUN', false),
            minIntervalMs: readInt(env, 'TELEGRAM_MIN_INTERVAL_MS', 3_500),
            disableNotification: readBool(env, 'TELEGRAM_DISABLE_NOTIFICATION', false),
          },
    pollIntervalMs: readInt(env, 'POLL_INTERVAL_MS', 300_000),
    maxItemsPerRun: readInt(env, 'MAX_ITEMS_PER_RUN', 10),
    statePath: readString(env, 'STATE_PATH', './data/state.json'),
    logLevel: logLevelRaw,
  };
}
