/**
 * Safe JSON parse with fallback
 */
export function parseJson<T>(data: string | null, fallback: T): T {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON stringify
 */
export function stringifyJson(data: unknown): string {
  return JSON.stringify(data);
}
