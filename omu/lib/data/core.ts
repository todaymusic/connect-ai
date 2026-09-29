// 데이터 계층 공통 도우미 (데모 필터·페이지 나누기, Supabase 행 → 도메인 변환)
import type { Role } from "../site";
import type { Author, Paged } from "./types";

export const DEFAULT_PAGE_SIZE = 12;

export function clampPage(page: number | undefined): number {
  return Number.isFinite(page) && (page as number) >= 1 ? Math.floor(page as number) : 1;
}

export function paginate<T>(items: T[], page = 1, pageSize = DEFAULT_PAGE_SIZE): Paged<T> {
  const p = clampPage(page);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return { items: items.slice((p - 1) * pageSize, p * pageSize), total, page: p, pageSize, pageCount };
}

export function toPaged<T>(items: T[], total: number, page: number, pageSize: number): Paged<T> {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** 검색어 부분일치 (공백·대소문자 무시) */
export function matches(q: string | undefined, ...fields: (string | null | undefined)[]): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase().replace(/\s+/g, "");
  if (!needle) return true;
  return fields.some((f) => f?.toLowerCase().replace(/\s+/g, "").includes(needle));
}

export const byNewest = <T extends { createdAt: string }>(a: T, b: T) => (a.createdAt < b.createdAt ? 1 : -1);

/** PostgREST ilike 패턴에서 와일드카드 문자를 이스케이프 */
export function likePattern(q: string): string {
  return `%${q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/** Supabase range(from, to) 계산 */
export function range(page: number, pageSize: number): [number, number] {
  const from = (clampPage(page) - 1) * pageSize;
  return [from, from + pageSize - 1];
}

type ProfileRow = { id: string; nickname: string; role: string } | null | undefined;

export function toAuthor(row: ProfileRow | ProfileRow[]): Author | null {
  const r = Array.isArray(row) ? row[0] : row;
  if (!r) return null;
  return { id: r.id, nickname: r.nickname, role: (r.role as Role) ?? "user" };
}

/** 프로필 조인 select 조각 (email 은 컬럼 권한상 읽을 수 없으므로 절대 넣지 않는다) */
export const PROFILE_COLS = "id, nickname, role";
