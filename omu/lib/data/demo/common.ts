import type { Author } from "../types";

const BASE = Date.now();
export function ago(minutes: number): string {
  return new Date(BASE - minutes * 60_000).toISOString();
}
export const HOUR = 60;
export const DAY = 24 * 60;

export const AUTHORS = {
  editor: { id: "omu-editor", nickname: "OMU 에디터", role: "editor" },
  admin: { id: "omu-admin", nickname: "OMU 운영자", role: "admin" },
  guitar: { id: "omu-u1", nickname: "초보기타", role: "user" },
  vocal: { id: "omu-u2", nickname: "노래하는곰", role: "user" },
  piano: { id: "omu-u3", nickname: "건반연습생", role: "user" },
  bass: { id: "omu-u4", nickname: "저음왕", role: "user" },
  band: { id: "omu-u5", nickname: "주말밴드", role: "user" },
  busking: { id: "omu-u6", nickname: "홍대기타", role: "user" },
  studio: { id: "omu-u7", nickname: "합주실사장", role: "user" },
  jazz: { id: "omu-u8", nickname: "재즈듣는밤", role: "user" },
  drum: { id: "omu-u9", nickname: "스틱돌리기", role: "user" },
  keys: { id: "omu-u10", nickname: "키보드세션", role: "user" },
} as const satisfies Record<string, Author>;
