// 데모 데이터 공통 — 작성자와 시간 도우미.
// ⚠️ 데모 데이터는 화면 확인용 더미다. 실제 콘텐츠는 오픈 전 관리자 페이지에서 올린다.
import type { Author } from "../types";

/** 서버가 이 모듈을 읽은 시각 기준으로 '몇 분 전' 을 만든다 (데모 글이 늘 최근처럼 보이도록) */
const BASE = Date.now();
export function ago(minutes: number): string {
  return new Date(BASE - minutes * 60_000).toISOString();
}
export const HOUR = 60;
export const DAY = 24 * 60;

export const AUTHORS = {
  editor: { id: "demo-editor", nickname: "OMU 에디터", role: "editor" },
  admin: { id: "demo-admin", nickname: "OMU 운영자", role: "admin" },
  guitar: { id: "demo-u1", nickname: "초보기타", role: "user" },
  vocal: { id: "demo-u2", nickname: "노래하는곰", role: "user" },
  piano: { id: "demo-u3", nickname: "건반연습생", role: "user" },
  bass: { id: "demo-u4", nickname: "저음왕", role: "user" },
  band: { id: "demo-u5", nickname: "주말밴드", role: "user" },
  busking: { id: "demo-u6", nickname: "홍대기타", role: "user" },
  studio: { id: "demo-u7", nickname: "합주실사장", role: "user" },
  jazz: { id: "demo-u8", nickname: "재즈듣는밤", role: "user" },
  drum: { id: "demo-u9", nickname: "스틱돌리기", role: "user" },
  keys: { id: "demo-u10", nickname: "키보드세션", role: "user" },
} as const satisfies Record<string, Author>;

export const DEMO_NOTICE = "※ 화면 확인용 예시 글입니다. 실제 콘텐츠는 오픈 전에 교체됩니다.";
