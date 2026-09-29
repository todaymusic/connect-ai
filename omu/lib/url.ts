// 목록 페이지 쿼리스트링 도우미 — 필터는 모두 GET 파라미터라 JS 없이도 동작하고 공유·북마크가 된다.

export type SearchParams = Record<string, string | string[] | undefined>;
export type Query = Record<string, string | undefined>;

export function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

/** 허용된 값일 때만 돌려준다 (잘못된 필터 값은 조용히 무시) */
export function pick<T extends string>(v: string | string[] | undefined, allowed: readonly T[] | Record<T, unknown>): T | undefined {
  const s = first(v);
  if (!s) return undefined;
  const keys = Array.isArray(allowed) ? allowed : Object.keys(allowed);
  return (keys as string[]).includes(s) ? (s as T) : undefined;
}

export function pageParam(v: string | string[] | undefined): number {
  const n = Number(first(v));
  return Number.isInteger(n) && n > 1 && n < 10_000 ? n : 1;
}

/** 현재 쿼리에 덮어쓰기(undefined/빈 값은 제거). 필터가 바뀌면 page 는 1로 돌아간다. */
export function hrefWith(pathname: string, current: Query, patch: Query, keepPage = false): string {
  const merged: Query = { ...current, ...patch };
  if (!keepPage && !("page" in patch)) delete merged.page;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `${pathname}?${s}` : pathname;
}
