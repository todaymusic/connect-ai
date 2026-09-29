import Link from "next/link";
import { Section } from "../ui";

/**
 * 가입 권유 배너
 *  - loginReady(로그인 연결됨): 카카오·네이버 간편 가입 안내
 *  - 아직 로그인 연결 전: 가입 대신 지금 할 수 있는 것(가입 없이 커뮤니티 글쓰기)을 안내
 */
export function JoinBanner({ loginReady }: { loginReady: boolean }) {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-[20px] border border-line bg-card px-5 py-8 sm:px-10 sm:py-10">
        <span aria-hidden className="absolute -right-6 -top-6 hidden size-28 sm:block rounded-full bg-coral-soft/50" />
        <span aria-hidden className="absolute right-12 top-10 hidden size-4 sm:block rounded-full bg-coral" />
        <div className="relative max-w-xl">
          {loginReady ? (
            <>
              <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">카카오·네이버 계정으로 간편하게 가입하세요</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2 sm:text-[15px]">
                읽기와 커뮤니티 글쓰기는 가입 없이도 할 수 있어요. 가입하면 닉네임으로 글을 쓰고, 어디서든 내 글을 관리할 수 있어요.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link href="/signup" className="inline-flex h-11 items-center rounded-full bg-coral px-6 text-sm font-bold text-white transition-colors hover:bg-coral-deep">
                  간편 가입하기
                </Link>
                <Link href="/login" className="inline-flex h-11 items-center rounded-full border border-line-2 bg-card px-6 text-sm font-bold text-ink transition-colors hover:border-ink-3">
                  로그인
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">가입 없이 먼저 이야기를 나눠 보세요</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2 sm:text-[15px]">
                음악정보는 누구나 읽을 수 있고, 커뮤니티 글과 댓글은 로그인 없이 쓸 수 있어요. 회원 가입(카카오·네이버)은 준비 중이에요.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link href="/write/community" className="inline-flex h-11 items-center rounded-full bg-coral px-6 text-sm font-bold text-white transition-colors hover:bg-coral-deep">
                  커뮤니티 글 쓰기
                </Link>
                <Link href="/info" className="inline-flex h-11 items-center rounded-full border border-line-2 bg-card px-6 text-sm font-bold text-ink transition-colors hover:border-ink-3">
                  음악정보 보기
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </Section>
  );
}
