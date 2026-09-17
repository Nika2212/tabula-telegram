import type { LogLevel } from '../utils/logger.ts';

export interface HttpConfig {
  readonly timeoutMs: number;
  readonly userAgent: string;
  readonly maxRetries: number;
}

export interface TelegramConfig {
  readonly botToken: string;
  readonly channelId: string;
}

export interface AppConfig {
  readonly http: HttpConfig;
  readonly telegram: TelegramConfig;
  readonly pollIntervalMs: number;
  readonly seenStorePath: string;
  readonly dryRun: boolean;
  readonly logLevel: LogLevel;
}

/** Reads and validates the environment, throwing on missing/invalid values. */
export function loadConfig(_env: NodeJS.ProcessEnv = process.env): AppConfig {
  throw new Error('loadConfig is not implemented');
}
