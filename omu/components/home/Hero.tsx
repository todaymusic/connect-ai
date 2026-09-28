import Link from "next/link";
import { ArrowRight, BookOpen, FileMusic, MessageCircleQuestion, Users } from "lucide-react";
import { SearchForm } from "../SearchForm";
import { POPULAR_KEYWORDS, TODAY_STATS } from "@/lib/mock";

const TODAY_TILES = [
  { href: "/score", label: "이번 주 무료 악보", value: TODAY_STATS.freeScores, unit: "개" },
  { href: "/gear/market", label: "새 중고 매물", value: TODAY_STATS.newMarket, unit: "건" },
  { href: "/community/qna", label: "답변 기다리는 질문", value: TODAY_STATS.waitingQuestions, unit: "개", accent: true },
  { href: "/recruit/band", label: "새 밴드·팀원 모집", value: TODAY_STATS.newRecruits, unit: "건" },
];

/** 곡 하나로 이어지는 동선: 악보 → 정보 → 커뮤니티 → 구인 */
const FLOW = [
  { icon: FileMusic, label: "악보 받기", href: "/score" },
  { icon: BookOpen, label: "연습 팁 읽기", href: "/info" },
  { icon: MessageCircleQuestion, label: "막히면 질문", href: "/community/qna" },
  { icon: Users, label: "같이 칠 사람", href: "/recruit/band" },
];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* 오선지 느낌의 은은한 배경 라인 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-10 h-40 opacity-60 [background-image:repeating-linear-gradient(to_bottom,var(--line)_0,var(--line)_1px,transparent_1px,transparent_14px)] [mask-image:linear-gradient(to_right,transparent,black_30%,black_70%,transparent)] sm:top-16"
      />

      <div className="relative mx-auto grid max-w-[1120px] gap-10 px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-12 lg:pb-16 lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold text-ink-2">
            <span aria-hidden className="size-2 rounded-full bg-coral" />
            오늘의 음악 커뮤니티
          </p>
          <h1
            id="hero-title"
            className="mt-4 text-[32px] font-extrabold leading-[1.22] tracking-[-0.03em] text-ink sm:text-[44px] lg:text-[52px]"
          >
            곡 하나로 시작해서
            <br />
            함께 연주할 사람까지<span className="text-coral">.</span>
          </h1>
          <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-ink-2 sm:text-base">
            무료 악보를 받고, 막히는 부분은 묻고, 필요한 악기는 중고로 구하고, 같이 칠 사람까지.
            흩어져 있던 음악 생활을 OMU 한 곳에서 이어가세요.
          </p>

          <SearchForm size="lg" className="mt-7 max-w-[560px]" />
          <div className="mt-3 flex max-w-[560px] flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold text-ink-3">인기 검색어</span>
            {POPULAR_KEYWORDS.map((k) => (
              <Link
                key={k}
                href={`/search?q=${encodeURIComponent(k)}`}
                className="rounded-full bg-stone px-2.5 py-1 text-xs text-ink-2 transition-colors hover:bg-line hover:text-ink"
              >
                {k}
              </Link>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              href="/score"
              className="inline-flex h-12 items-center gap-1.5 rounded-full bg-coral px-6 text-[15px] font-bold text-white transition-colors hover:bg-coral-deep"
            >
              무료 악보 받기
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              href="/community"
              className="inline-flex h-12 items-center rounded-full border border-line-2 bg-card px-6 text-[15px] font-bold text-ink transition-colors hover:border-ink-3"
            >
              커뮤니티 둘러보기
            </Link>
          </div>
        </div>

        {/* 오늘의 OMU 보드 — 악보·중고·게시판·구인을 한눈에 */}
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">오늘의 OMU</p>
            <span className="font-display text-xs text-ink-3">TODAY</span>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2.5">
            {TODAY_TILES.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="card-hover block h-full rounded-xl border border-line bg-paper p-3.5 transition sm:p-4"
                >
                  <span className="block text-xs font-semibold text-ink-2">{t.label}</span>
                  <span className="mt-2 flex items-baseline gap-0.5">
                    <span className={`font-display text-3xl font-bold tracking-tight ${t.accent ? "text-coral-deep" : "text-ink"}`}>
                      {t.value}
                    </span>
                    <span className="text-sm text-ink-3">{t.unit}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-xl bg-stone p-3.5">
            <p className="text-xs font-semibold text-ink-2">
              예) <span className="text-ink">캐논 변주곡</span> 하나로 이어지는 OMU 동선
            </p>
            <ol className="mt-2.5 grid grid-cols-4 gap-1">
              {FLOW.map((f, i) => (
                <li key={f.label} className="relative">
                  <Link href={f.href} className="group flex flex-col items-center gap-1.5 text-center">
                    <span className="flex size-9 items-center justify-center rounded-full border border-line bg-card text-ink-2 transition-colors group-hover:border-coral group-hover:text-coral-deep">
                      <f.icon aria-hidden className="size-4" />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight text-ink-2 sm:text-xs">{f.label}</span>
                  </Link>
                  {i < FLOW.length - 1 && (
                    <span aria-hidden className="absolute left-[calc(50%+22px)] right-[calc(-50%+22px)] top-[18px] border-t border-dashed border-line-2" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
