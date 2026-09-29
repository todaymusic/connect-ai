import type { Author } from "../types";

const BASE = Date.now();
export function ago(minutes: number): string {
  return new Date(BASE - minutes * 60_000).toISOString();
}
export const HOUR = 60;
export const DAY = 24 * 60;

// 공개 전 정리: 가상의 회원 계정은 두지 않는다. 운영 명의(에디터·운영자)만 남긴다.
export const AUTHORS = {
  editor: { id: "omu-editor", nickname: "OMU 에디터", role: "editor" },
  admin: { id: "omu-admin", nickname: "OMU 운영자", role: "admin" },
} as const satisfies Record<string, Author>;
