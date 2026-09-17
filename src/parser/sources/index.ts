import type { Parser } from '../types.ts';

/**
 * Registry of site-specific parsers.
 * Add one module per source in this folder and register it here.
 */
export function createParsers(): readonly Parser[] {
  return [];
}
