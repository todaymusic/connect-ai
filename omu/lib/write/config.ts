// 글쓰기 유형과 권한 — schema.sql 의 RLS 정책과 같은 기준이다.
//   회원(user) 이상: 커뮤니티 · 중고 장터 · 구인·모집 · 악보 요청
//   에디터(editor)·관리자(admin): 악보 · 정보글 (+ 위 전부)
// 화면 가드일 뿐이고, 실제 저장 권한은 DB 의 RLS 가 최종 판정한다.
import type { Role } from "../site";

export type WriteType = "score" | "article" | "market" | "recruit" | "community" | "score-request";

export type WriteTypeConfig = {
  key: WriteType;
  label: string;
  /** 대분류 메뉴 이름 */
  section: string;
  hint: string;
  minRole: Role;
};

export const WRITE_TYPES: WriteTypeConfig[] = [
  { key: "score", label: "악보 올리기", section: "악보공유", hint: "무료 악보 PDF 등록 · 에디터 전용", minRole: "editor" },
  { key: "article", label: "정보글 쓰기", section: "음악정보", hint: "입문·입시·공모전·장비 정보 · 에디터 전용", minRole: "editor" },
  { key: "market", label: "중고 판매글", section: "악기", hint: "판매 · 구매 · 나눔", minRole: "user" },
  { key: "recruit", label: "모집글", section: "구인·모집", hint: "밴드 · 세션 · 레슨 · 오디션", minRole: "user" },
  { key: "community", label: "커뮤니티 글", section: "커뮤니티", hint: "자유 · 익명 · Q&A · 연주 자랑 · 창업 고민", minRole: "user" },
  { key: "score-request", label: "악보 요청", section: "악보공유", hint: "“이 곡 악보 있나요?”", minRole: "user" },
];

export function getWriteType(key: string): WriteTypeConfig | undefined {
  return WRITE_TYPES.find((t) => t.key === key);
}

const RANK: Record<Role, number> = { user: 1, editor: 2, admin: 3 };

export function canWrite(role: Role | null | undefined, type: WriteType): boolean {
  const cfg = getWriteType(type);
  if (!cfg || !role) return false;
  return RANK[role] >= RANK[cfg.minRole];
}

export function denyReason(role: Role | null | undefined, type: WriteType): string | null {
  if (!role) return "로그인한 회원만 글을 쓸 수 있어요.";
  if (canWrite(role, type)) return null;
  return "악보와 정보글은 OMU 에디터·관리자만 올릴 수 있어요. 원하는 악보가 있다면 ‘악보 요청’을 남겨 주세요.";
}

/** 데모 모드 역할 쿠키 */
export const DEMO_ROLE_COOKIE = "omu_demo_role";
export const DEMO_ROLES = { signed_out: "비로그인", user: "회원", editor: "에디터", admin: "관리자" } as const;
export type DemoRole = keyof typeof DEMO_ROLES;
