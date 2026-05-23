/** Raw API shapes — update here when backend contract changes. */
export type ApiRecord = Record<string, unknown>;

export function apiString(raw: ApiRecord, key: string, fallback = ''): string {
  const value = raw[key];
  return typeof value === 'string' ? value : fallback;
}

export function apiNumber(raw: ApiRecord, key: string, fallback = 0): number {
  const value = raw[key];
  return typeof value === 'number' ? value : fallback;
}

export function apiBoolean(raw: ApiRecord, key: string, fallback = false): boolean {
  const value = raw[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function apiArray(raw: ApiRecord, key: string): ApiRecord[] {
  const value = raw[key];
  return Array.isArray(value) ? (value as ApiRecord[]) : [];
}
