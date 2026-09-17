import type { PollState } from '../store/state-store.ts';
import type { NewsListItem } from '../types/index.ts';

/**
 * Picks the entries that still need delivering, oldest first.
 *
 * The first run has nothing remembered, so only the newest entry is taken —
 * otherwise a cold start would replay the whole 40-item page. Afterwards the
 * walk stops at the remembered entry, which keeps items that were published
 * with a backdated `created` from being treated as new.
 */
export function selectFresh(
  items: readonly NewsListItem[],
  state: PollState,
  maxItemsPerRun: number,
): readonly NewsListItem[] {
  if (state.lastSeenId === null) {
    const newest = items[0];
    return newest === undefined ? [] : [newest];
  }

  const alreadySeen = new Set(state.seenIds);
  const watermark =
    state.lastSeenCreatedAt === null ? null : Date.parse(state.lastSeenCreatedAt);

  const fresh: NewsListItem[] = [];
  for (const item of items) {
    if (item.id === state.lastSeenId) break;
    if (watermark !== null && Date.parse(item.createdAt) <= watermark) break;
    if (alreadySeen.has(item.id)) continue;
    fresh.push(item);
  }

  fresh.reverse();

  // On a long outage, prefer the newest few over a flood of stale entries.
  return fresh.length > maxItemsPerRun ? fresh.slice(-maxItemsPerRun) : fresh;
}
