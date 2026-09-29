import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";

/**
 * 비회원 작성 안내 + 로그인 권유
 *  - 로그인 없이 쓸 수 있다는 것을 먼저, 로그인하면 더 안전하다는 것을 함께 보여 준다.
 */
export function GuestNotice({ what = "글", loginHref, demo = false }: { what?: "글" | "댓글"; loginHref: string; demo?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 sm:p-5" role="note" aria-label="비회원 작성 안내">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <UserRound aria-hidden className="size-4 text-coral-deep" />
        로그인 없이 바로 {what === "글" ? "쓸" : "달"} 수 있어요
      </p>
      <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-ink-2">
        <li>· 이름은 ‘새벽 기타리스트’처럼 자동으로 붙어요. 같은 글 안에서는 같은 이름으로 보여요.</li>
        <li>· 쓴 {what}은 <strong className="font-semibold text-ink">이 브라우저에서만</strong> 고치거나 지울 수 있어요. 브라우저 기록을 지우면 관리할 수 없어요.</li>
        <li>· 이메일·전화번호 같은 개인정보는 받지 않아요.</li>
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={loginHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-2 bg-paper px-3.5 text-[13px] font-bold text-ink hover:border-ink-3"
        >
          <LogIn aria-hidden className="size-3.5" />
          로그인하고 어디서든 관리하기
        </Link>
        {demo && <span className="text-xs text-ink-3">데모에서는 위 역할 선택으로 회원을 체험할 수 있어요.</span>}
      </div>
    </div>
  );
}
