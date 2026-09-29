import type { Author } from "@/lib/data/types";
import { EDITOR_DISPLAY_NAME } from "@/lib/site";
import { AdminBadge, EditorBadge } from "../ui";

/**
 * 작성자 표기 규칙 (작업지시서 6-1)
 *  - author_display = editor → 'OMU 에디터' 배지 (실제 계정 닉네임을 노출하지 않음)
 *  - 관리자 계정 → '운영자' 배지
 *  - 익명 글(author 없음) → '익명'
 */
export function AuthorLabel({
  author,
  display = "member",
  anonymous = false,
}: {
  author: Author | null;
  display?: "editor" | "member";
  anonymous?: boolean;
}) {
  if (display === "editor") return <EditorBadge label={EDITOR_DISPLAY_NAME} />;
  if (anonymous || !author) return <span className="font-semibold text-ink-2">익명</span>;
  if (author.role === "admin") return <AdminBadge label="운영자" />;
  return <span className="truncate font-semibold text-ink-2">{author.nickname}</span>;
}
