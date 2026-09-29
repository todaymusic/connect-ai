import type { Author } from "@/lib/data/types";
import { EDITOR_DISPLAY_NAME } from "@/lib/site";
import { AdminBadge, EditorBadge } from "../ui";

/**
 * 작성자 표기 규칙 (작업지시서 6-1)
 *  - author_display = editor → 'OMU 에디터' 배지 (실제 계정 닉네임을 노출하지 않음)
 *  - 관리자 계정 → '운영자' 배지
 *  - 비회원 글·댓글 → 자동 표시 이름 + '비회원' 표시
 *  - 익명 글(author 없음) → '익명'
 */
export function AuthorLabel({
  author,
  display = "member",
  anonymous = false,
  guestName = null,
}: {
  author: Author | null;
  display?: "editor" | "member";
  anonymous?: boolean;
  guestName?: string | null;
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
  if (anonymous || !author) return <span className="font-semibold text-ink-2">익명</span>;
  if (author.role === "admin") return <AdminBadge label="운영자" />;
  return <span className="truncate font-semibold text-ink-2">{author.nickname}</span>;
}
