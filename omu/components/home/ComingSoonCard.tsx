import Link from "next/link";
import { Clock, PenLine } from "lucide-react";
import type { ReactNode } from "react";

/** 홈 섹션용 '준비 중' 안내 — 빈 그리드 대신 */
export function ComingSoonCard({ title, children, action }: { title: string; children?: ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-stone text-ink-2">
        <Clock aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-ink">{title}</p>
        {children && <p className="mt-1 text-sm leading-relaxed text-ink-2">{children}</p>}
      </div>
      {action && (
        <Link href={action.href} className="inline-flex h-10 shrink-0 items-center rounded-full border border-line-2 bg-paper px-4 text-sm font-bold text-ink hover:border-ink-3">
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** 커뮤니티에 글이 하나도 없을 때 — 첫 글 유도 */
export function FirstPostCard() {
  return (
    <div className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-coral-soft/60 text-coral-deep">
        <PenLine aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-ink">아직 올라온 글이 없어요</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">첫 글을 남겨보세요. 질문·후기·연주 자랑 모두 좋아요. 로그인 없이도 쓸 수 있어요.</p>
      </div>
      <Link href="/write/community" className="inline-flex h-10 shrink-0 items-center rounded-full bg-coral px-5 text-sm font-bold text-white hover:bg-coral-deep">
        첫 글 쓰기
      </Link>
    </div>
  );
}
