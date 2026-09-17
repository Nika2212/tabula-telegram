/** Tracks already-emitted item ids so the pipeline stays idempotent. */
export interface SeenStore {
  has(itemId: string): Promise<boolean>;
  add(itemIds: readonly string[]): Promise<void>;
  flush(): Promise<void>;
}

export function createFileSeenStore(_filePath: string): SeenStore {
  throw new Error('createFileSeenStore is not implemented');
}

export function createMemorySeenStore(): SeenStore {
  throw new Error('createMemorySeenStore is not implemented');
}
