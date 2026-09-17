/** Narrowing helpers for payloads that arrive as `unknown`. */

export function asText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function asInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

export function asList(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Accepts an ISO 8601 timestamp and rejects anything unparseable. */
export function asTimestamp(value: unknown): string | null {
  const text = asText(value);
  if (text === null) return null;
  return Number.isNaN(Date.parse(text)) ? null : text;
}
