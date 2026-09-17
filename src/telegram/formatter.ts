import type { ParsedItem } from '../types/index.ts';
import type { OutgoingMessage } from './types.ts';

/** Escapes text for the configured parse mode. */
export function escapeHtml(_text: string): string {
  throw new Error('escapeHtml is not implemented');
}

/** Turns a parsed item into a channel-ready message. */
export function formatItem(_item: ParsedItem): OutgoingMessage {
  throw new Error('formatItem is not implemented');
}
