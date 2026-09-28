import Link from "next/link";
import type { Metadata } from "next";
import { NAV_SECTIONS } from "@/lib/nav";

export const metadata: Metadata = {
  title: "준비 중인 페이지",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[640px] px-4 py-20 text-center sm:px-6 sm:py-28">
      <p className="font-display text-5xl font-bold tracking-tight text-ink">
        404<span className="text-coral">.</span>
      </p>
      <h1 className="mt-4 text-xl font-extrabold text-ink sm:text-2xl">아직 준비 중이거나 없는 페이지예요</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        OMU는 지금 오픈 준비 중이라 일부 메뉴가 순서대로 열리고 있어요. 아래에서 다른 곳을 둘러보세요.
      </p>
      <ul className="mt-8 flex flex-wrap justify-center gap-2">
        {NAV_SECTIONS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="inline-block rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold text-ink-2 hover:border-line-2 hover:text-ink"
            >
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-coral px-6 text-sm font-bold text-white hover:bg-coral-deep"
      >
        홈으로
      </Link>
    </div>
  );
}
