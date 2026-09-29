import Link from "next/link";
import { ArrowRight, BookOpen, FileMusic, Guitar, MessagesSquare, Users, type LucideIcon } from "lucide-react";
import { SearchForm } from "../SearchForm";

export type HeroStats = { freeScores: number; sellingMarket: number; waitingQuestions: number; openBands: number };
/** 각 코너가 지금 열려 있는지 (콘텐츠가 있거나 바로 쓸 수 있으면 true) */
export type HeroOpen = { scores: boolean; market: boolean; recruit: boolean };

export function Hero({ stats, keywords, open }: { stats: HeroStats; keywords: string[]; open: HeroOpen }) {
  // 0건은 자랑처럼 보이지 않게 숨긴다 — 실제 숫자가 있는 타일만
  const tiles = [
    { href: "/score", label: "무료 악보", value: stats.freeScores, unit: "개", accent: false },
    { href: "/gear/market?status=selling", label: "판매중 매물", value: stats.sellingMarket, unit: "건", accent: false },
    { href: "/community/qna?status=open", label: "답변 기다리는 질문", value: stats.waitingQuestions, unit: "개", accent: true },
    { href: "/recruit/band?open=1", label: "모집 중인 밴드", value: stats.openBands, unit: "건", accent: false },
  ].filter((t) => t.value > 0);

  const corners: { icon: LucideIcon; label: string; desc: string; href: string; ready: boolean }[] = [
    { icon: BookOpen, label: "음악정보", desc: "악기 입문·입시·공모전·연습실 정보", href: "/info", ready: true },
    { icon: MessagesSquare, label: "커뮤니티", desc: "가입 없이 묻고 나누기", href: "/community", ready: true },
    { icon: FileMusic, label: "무료 악보", desc: "저작권을 확인한 악보만", href: "/score", ready: open.scores },
    { icon: Guitar, label: "중고 장터", desc: "악기·장비 직거래", href: "/gear/market", ready: open.market },
    { icon: Users, label: "구인·모집", desc: "밴드·세션·레슨 모집", href: "/recruit", ready: open.recruit },
  ];
  const upcoming = corners.filter((c) => !c.ready).map((c) => c.label);

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
            악기 입문·입시·공모전 같은 음악정보를 읽고, 커뮤니티에서 가입 없이 묻고 나눠 보세요.
            {upcoming.length > 0 && <> {upcoming.join("·")}은 차례로 열 예정이에요.</>}
          </p>

          <SearchForm size="lg" className="mt-7 max-w-[560px]" />
          {keywords.length > 0 && (
            <div className="mt-3 flex max-w-[560px] flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-semibold text-ink-3">인기 검색어</span>
              {keywords.map((k) => (
                <Link
                  key={k}
                  href={`/search?q=${encodeURIComponent(k)}`}
                  className="rounded-full bg-stone px-2.5 py-1 text-xs text-ink-2 transition-colors hover:bg-line hover:text-ink"
                >
                  {k}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              href="/info"
              className="inline-flex h-12 items-center gap-1.5 rounded-full bg-coral px-6 text-[15px] font-bold text-white transition-colors hover:bg-coral-deep"
            >
              음악정보 보기
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

        {/* 오늘의 OMU — 실제 숫자가 있을 때만 타일, 아래에는 지금 열린 곳·준비 중인 곳 */}
        <div className="card p-4 sm:p-5">
          <p className="text-sm font-bold text-ink">{tiles.length > 0 ? "오늘의 OMU" : "지금 OMU에서는"}</p>
          {tiles.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2.5">
              {tiles.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="card-hover block h-full rounded-xl border border-line bg-paper p-3.5 transition sm:p-4">
                    <span className="block text-xs font-semibold text-ink-2">{t.label}</span>
                    <span className="mt-2 flex items-baseline gap-0.5">
                      <span className={`font-display text-3xl font-bold tracking-tight ${t.accent ? "text-coral-deep" : "text-ink"}`}>{t.value}</span>
                      <span className="text-sm text-ink-3">{t.unit}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <ul className={`${tiles.length > 0 ? "mt-4" : "mt-3"} divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper`}>
            {corners.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-stone/60">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${c.ready ? "bg-coral-soft/60 text-coral-deep" : "bg-stone text-ink-3"}`}>
                    <c.icon aria-hidden className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-bold ${c.ready ? "text-ink" : "text-ink-2"}`}>{c.label}</span>
                    <span className="block truncate text-xs text-ink-3">{c.desc}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${c.ready ? "bg-blue-soft/60 text-blue" : "bg-stone text-ink-3"}`}
                  >
                    {c.ready ? "이용 가능" : "준비 중"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
