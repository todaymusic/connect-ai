"use client";

import Link from "next/link";
import { PenLine, Upload } from "lucide-react";
import { canWrite, type WriteType } from "@/lib/write/config";
import { useViewerRole } from "./useViewerRole";

/**
 * 그 글을 쓸 수 있는 사람에게만 보이는 글쓰기 버튼 — lib/write/config 의 canWrite 기준.
 *   예) '악보 올리기'(score)는 에디터·관리자에게만, '정보글 쓰기'(article)는 로그인한 회원 모두에게.
 * 브라우저에서 역할을 확인한 뒤에 그리므로 페이지는 정적(ISR) 그대로이고, 비로그인·권한 없는 사람에게는 아무것도 보이지 않는다.
 * (비로그인이 다른 경로로 글쓰기 화면에 가면 그 화면이 로그인 안내를 보여 준다)
 */
export function RoleWriteLink({
  type,
  href,
  label,
  tone = "primary",
  icon = "pen",
}: {
  type: WriteType;
  href: string;
  label: string;
  tone?: "primary" | "secondary";
  icon?: "pen" | "upload";
}) {
  const role = useViewerRole();
  if (!role || !canWrite(role, type)) return null;
  const Icon = icon === "upload" ? Upload : PenLine;
  return (
    <Link
      href={href}
      className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors ${
        tone === "primary" ? "bg-coral text-white hover:bg-coral-deep" : "bg-ink text-paper hover:bg-ink/85"
      }`}
    >
      <Icon aria-hidden className="size-4" />
      {label}
    </Link>
  );
}
