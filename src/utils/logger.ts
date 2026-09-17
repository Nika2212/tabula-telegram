export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(scope: string): Logger;
}

export function isLogLevel(value: string): value is LogLevel {
  return value in LEVEL_WEIGHT;
}

function formatMeta(meta: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) continue;
    parts.push(`${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`);
  }
  return parts.length > 0 ? `  ${parts.join(' ')}` : '';
}

export function createLogger(level: LogLevel, scope?: string): Logger {
  const threshold = LEVEL_WEIGHT[level];

  const write = (
    messageLevel: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
  ): void => {
    if (LEVEL_WEIGHT[messageLevel] < threshold) return;

    const time = new Date().toISOString().slice(11, 19);
    const label = messageLevel.toUpperCase().padEnd(5);
    const where = scope === undefined ? '' : ` [${scope}]`;
    const line = `${time} ${label}${where} ${message}${meta ? formatMeta(meta) : ''}`;

    if (messageLevel === 'error') console.error(line);
    else if (messageLevel === 'warn') console.warn(line);
    else console.log(line);
  };

  return {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
    child: (childScope) =>
      createLogger(level, scope === undefined ? childScope : `${scope}:${childScope}`),
  };
}
