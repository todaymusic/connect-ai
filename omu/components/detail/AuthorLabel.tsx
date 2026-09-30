import type { Author } from "@/lib/data/types";
import { EDITOR_DISPLAY_NAME } from "@/lib/site";
import { AdminBadge, EditorBadge } from "../ui";

/**
 * 작성자 표기 규칙 (작업지시서 6-1)
 *  - author_display = editor → 'OMU 에디터' 배지 (실제 계정 닉네임을 노출하지 않음)
 *  - 관리자 계정 → '운영자' 배지
 *  - 비회원 글·댓글 → 자동 표시 이름 + '비회원' 표시
 *  - 익명 글(author 없음) → '익명' (정보글처럼 익명이 없는 곳은 unknownLabel, 예: 탈퇴한 회원 → '회원')
 *  - 닉네임이 비어 있으면 '회원' — 이메일 등 개인정보는 절대 쓰지 않는다
 */
export function AuthorLabel({
  author,
  display = "member",
  anonymous = false,
  guestName = null,
  unknownLabel = "익명",
}: {
  author: Author | null;
  display?: "editor" | "member";
  anonymous?: boolean;
  guestName?: string | null;
  unknownLabel?: string;
}) {
  if (display === "editor") return <EditorBadge label={EDITOR_DISPLAY_NAME} />;
  if (guestName) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1">
        <span className="truncate font-semibold text-ink-2">{guestName}</span>
        <span className="shrink-0 rounded-full border border-line-2 px-1.5 text-[10px] font-bold leading-4 text-ink-3">비회원</span>
      </span>
    );
  }
  if (anonymous) return <span className="font-semibold text-ink-2">익명</span>;
  if (!author) return <span className="font-semibold text-ink-2">{unknownLabel}</span>;
  if (author.role === "admin") return <AdminBadge label="운영자" />;
  return <span className="truncate font-semibold text-ink-2">{author.nickname?.trim() || "회원"}</span>;
}
