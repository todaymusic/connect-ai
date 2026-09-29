"use client";

// 이 브라우저에만 남는 기록 (localStorage)
//  · 데모 모드: 댓글·숨김·신고를 서버 대신 여기에 보관한다(다른 사람에게 보이지 않음).
//  · 두 모드 공통: '이미 신고한 대상' 표시(반복 신고 안내용).
import type { Role } from "../site";
import type { NewComment } from "./actions";

export type LocalComment = NewComment & {
  threadKey: string;
  guestName: string | null;
  editedAt?: string;
  deleted?: boolean;
};

export type LocalReport = {
  id: string;
  targetType: string;
  targetId: string;
  title: string;
  path: string;
  reason: string;
  detail: string;
  createdAt: string;
  status: "open" | "resolved" | "dismissed";
  reporter: "guest" | Role;
};

const KEYS = {
  comments: "omu-demo-comments",
  hidden: "omu-demo-hidden",
  reports: "omu-demo-reports",
  reported: "omu-reported",
} as const;
const EVENT = "omu-local-change";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장 공간 부족·사생활 보호 모드 — 무시 */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeLocal(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/* ───────── 데모 댓글 ───────── */
export const threadKey = (type: string, id: string) => `${type}:${id}`;

export function readLocalComments(key: string): LocalComment[] {
  const all = read<LocalComment[]>(KEYS.comments, []);
  return Array.isArray(all) ? all.filter((c) => c.threadKey === key) : [];
}
export function addLocalComment(c: LocalComment) {
  const all = read<LocalComment[]>(KEYS.comments, []);
  write(KEYS.comments, [...(Array.isArray(all) ? all : []), c].slice(-300));
}
export function updateLocalComment(id: string, patch: Partial<LocalComment>) {
  const all = read<LocalComment[]>(KEYS.comments, []);
  write(KEYS.comments, all.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

/* ───────── 데모 숨김 (데모 관리자가 목데이터 글·댓글을 숨긴 기록) ───────── */
export function readHidden(): string[] {
  const v = read<string[]>(KEYS.hidden, []);
  return Array.isArray(v) ? v : [];
}
export function hideLocal(id: string) {
  write(KEYS.hidden, [...new Set([...readHidden(), id])]);
}

/* ───────── 신고 ───────── */
export const reportKey = (type: string, id: string) => `${type}:${id}`;
export function hasReported(type: string, id: string): boolean {
  const v = read<string[]>(KEYS.reported, []);
  return Array.isArray(v) && v.includes(reportKey(type, id));
}
export function markReported(type: string, id: string) {
  const v = read<string[]>(KEYS.reported, []);
  write(KEYS.reported, [...new Set([...(Array.isArray(v) ? v : []), reportKey(type, id)])].slice(-500));
}
export function readLocalReports(): LocalReport[] {
  const v = read<LocalReport[]>(KEYS.reports, []);
  return Array.isArray(v) ? v : [];
}
export function addLocalReport(r: LocalReport) {
  write(KEYS.reports, [r, ...readLocalReports()].slice(0, 100));
}
export function updateLocalReport(id: string, status: LocalReport["status"]) {
  write(KEYS.reports, readLocalReports().map((r) => (r.id === id ? { ...r, status } : r)));
}

/**
 * useSyncExternalStore 용 스냅샷 캐시 — 내용이 같으면 같은 참조를 돌려준다
 * (매번 새 배열을 돌려주면 무한 렌더가 난다)
 */
export function cachedSnapshot<T>(compute: () => T): () => T {
  let key = "";
  let val: T;
  return () => {
    const next = compute();
    const k = JSON.stringify(next);
    if (k !== key) {
      key = k;
      val = next;
    }
    return val;
  };
}
