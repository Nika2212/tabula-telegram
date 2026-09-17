import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { Logger } from '../utils/logger.ts';

/** How many recent ids are kept; comfortably more than the 40-item listing. */
const SEEN_ID_LIMIT = 200;

export interface PollState {
  readonly lastSeenId: string | null;
  readonly lastSeenNid: number | null;
  readonly lastSeenCreatedAt: string | null;
  readonly seenIds: readonly string[];
  readonly updatedAt: string | null;
}

export const EMPTY_STATE: PollState = {
  lastSeenId: null,
  lastSeenNid: null,
  lastSeenCreatedAt: null,
  seenIds: [],
  updatedAt: null,
};

export interface StateStore {
  load(): Promise<PollState>;
  save(state: PollState): Promise<void>;
}

function reviveState(parsed: unknown): PollState {
  const raw = parsed as Partial<PollState>;

  return {
    lastSeenId: typeof raw.lastSeenId === 'string' ? raw.lastSeenId : null,
    lastSeenNid: typeof raw.lastSeenNid === 'number' ? raw.lastSeenNid : null,
    lastSeenCreatedAt:
      typeof raw.lastSeenCreatedAt === 'string' ? raw.lastSeenCreatedAt : null,
    seenIds: Array.isArray(raw.seenIds)
      ? raw.seenIds.filter((id): id is string => typeof id === 'string')
      : [],
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
  };
}

/** Caps the id history, keeping the most recent entries at the front. */
export function rememberIds(
  state: PollState,
  newIds: readonly string[],
): readonly string[] {
  return [...newIds, ...state.seenIds].slice(0, SEEN_ID_LIMIT);
}

/** JSON file on disk, written atomically so a crash cannot truncate it. */
export function createFileStateStore(filePath: string, logger: Logger): StateStore {
  return {
    async load() {
      try {
        const raw = await readFile(filePath, 'utf8');
        // Editors on Windows may add a BOM, which JSON.parse rejects.
        const state = reviveState(JSON.parse(raw.replace(/^\uFEFF/, '')));
        logger.debug('state loaded', {
          lastSeenNid: state.lastSeenNid,
          seenIds: state.seenIds.length,
        });
        return state;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') {
          logger.info('no state file yet, starting fresh', { path: filePath });
        } else {
          logger.warn('state file unreadable, starting fresh', {
            path: filePath,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return EMPTY_STATE;
      }
    },

    async save(state) {
      await mkdir(dirname(filePath), { recursive: true });
      const temp = `${filePath}.tmp`;
      await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
      await rename(temp, filePath);
      logger.debug('state saved', { lastSeenNid: state.lastSeenNid });
    },
  };
}
