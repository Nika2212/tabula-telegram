import type { AxiosInstance } from 'axios';

import type { Parser } from '../parser/types.ts';
import type { SeenStore } from '../store/seen-store.ts';
import type { ChannelEmitter } from '../telegram/types.ts';
import type { Logger } from '../utils/logger.ts';

export interface PipelineDeps {
  readonly parsers: readonly Parser[];
  readonly httpClient: AxiosInstance;
  readonly emitter: ChannelEmitter;
  readonly seenStore: SeenStore;
  readonly logger: Logger;
}

export interface PipelineRunSummary {
  readonly parsed: number;
  readonly emitted: number;
  readonly skipped: number;
  readonly failed: number;
}

/** parse -> dedupe -> format -> emit, once across all parsers. */
export function runOnce(_deps: PipelineDeps): Promise<PipelineRunSummary> {
  throw new Error('runOnce is not implemented');
}

/** Repeats runOnce on an interval until the signal aborts. */
export function runForever(
  _deps: PipelineDeps,
  _intervalMs: number,
  _signal: AbortSignal,
): Promise<void> {
  throw new Error('runForever is not implemented');
}
