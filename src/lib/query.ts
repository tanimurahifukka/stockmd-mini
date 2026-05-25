// Shared helpers for list-query parsing. Resource modules import these from
// src/lib (which is allowed by module-boundary policy).

export type ListQuery = {
  limit: number;
  offset: number;
  include_deleted: boolean;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export function parseListQuery(url: URL): ListQuery {
  const limit = clampInt(url.searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = clampInt(url.searchParams.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER);
  const include_deleted = (url.searchParams.get("include_deleted") ?? "").toLowerCase() === "true";
  return { limit, offset, include_deleted };
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw === null) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}
