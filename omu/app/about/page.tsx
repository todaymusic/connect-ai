import Link from "next/link";
import type { Metadata } from "next";
import { NAV_SECTIONS } from "@/lib/nav";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: "서비스 소개",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-10 sm:px-6 sm:py-14">
      <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-coral-deep">About</p>
      <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">곡 하나로 이어지는 음악 커뮤니티, OMU</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
        악보, 음악 정보, 중고 악기, 밴드 구인, 커뮤니티가 여러 사이트에 흩어져 있어 불편했던 경험에서 시작했어요. OMU 에서는 곡 하나를 중심으로 악보를 받고, 모르는 건
        묻고, 필요한 악기는 중고로 구하고, 같이 연주할 사람까지 찾을 수 있어요.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {NAV_SECTIONS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="card card-hover block h-full p-4">
              <span className="block text-base font-bold text-ink">{s.label}</span>
              <span className="mt-1 block text-sm text-ink-2">{s.description}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-ink-2">
        문의는{" "}
        <Link href="/contact" className="font-semibold text-blue hover:underline">
          고객센터
        </Link>
        로 보내 주세요.
      </p>
    </div>
  );
}
