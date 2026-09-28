import Link from "next/link";
import { Section } from "../ui";

export function JoinBanner() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-[20px] border border-line bg-card px-5 py-8 sm:px-10 sm:py-10">
        <span aria-hidden className="absolute -right-6 -top-6 hidden size-28 sm:block rounded-full bg-coral-soft/50" />
        <span aria-hidden className="absolute right-12 top-10 hidden size-4 sm:block rounded-full bg-coral" />
        <div className="relative max-w-xl">
          <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            지금 가입하고, 첫 질문이나 첫 매물을 올려보세요
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-2 sm:text-[15px]">
            악보 다운로드는 가입 없이도 무료예요. 글쓰기·댓글·중고거래·모집은 회원만 할 수 있어요.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center rounded-full bg-coral px-6 text-sm font-bold text-white transition-colors hover:bg-coral-deep"
            >
              이메일로 가입하기
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-full border border-line-2 bg-card px-6 text-sm font-bold text-ink transition-colors hover:border-ink-3"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
