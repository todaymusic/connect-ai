import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { WRITE_ACTIONS } from "@/lib/nav";

export const metadata: Metadata = {
  title: "글쓰기 준비 중",
  robots: { index: false, follow: true },
};

/** 글쓰기 진입점 — 기능 구축 전까지 안내만 제공 */
export default async function WritePage({ searchParams }: PageProps<"/write">) {
  const { type } = await searchParams;
  const selected = WRITE_ACTIONS.find((a) => a.key === (Array.isArray(type) ? type[0] : type));

  return (
    <div className="mx-auto max-w-[640px] px-4 py-12 sm:px-6 sm:py-20">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-stone px-3 py-1 text-xs font-bold text-ink-2">
        <Clock aria-hidden className="size-3.5" />
        준비 중
      </span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {selected ? `${selected.label}, 곧 열려요` : "글쓰기는 곧 열려요"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
        OMU는 무료 악보와 음악정보부터 차례로 열고 있어요. 글쓰기가 열리면 로그인한 회원 누구나 커뮤니티 글, 중고
        판매글, 모집글, 악보 요청을 올릴 수 있어요.
      </p>

      <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
        {WRITE_ACTIONS.map((a) => (
          <li
            key={a.key}
            className={`card p-4 ${selected?.key === a.key ? "border-ink-3" : ""}`}
            aria-current={selected?.key === a.key ? "true" : undefined}
          >
            <p className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-bold text-ink">{a.label}</span>
              <span className="rounded-full bg-stone px-2 py-0.5 text-[11px] font-bold text-ink-3">준비 중</span>
            </p>
            <p className="mt-1 text-xs text-ink-3">{a.hint}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-2.5">
        <Link
          href="/score"
          className="inline-flex h-11 items-center rounded-full bg-coral px-5 text-sm font-bold text-white hover:bg-coral-deep"
        >
          무료 악보 먼저 보기
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full border border-line-2 bg-card px-5 text-sm font-bold text-ink hover:border-ink-3"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
