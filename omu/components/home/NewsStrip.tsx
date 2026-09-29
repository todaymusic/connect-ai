import Link from "next/link";
import { CalendarDays, FileMusic, Megaphone } from "lucide-react";

// 1차: 정적 배너 (작업지시서 9-2의 '히어로 배너 — 1차는 정적 배너 가능')
const NEWS = [
  { icon: FileMusic, tag: "신규 악보", title: "피아노 입문곡 12편 무료 공개", href: "/score/piano", tone: "text-coral-deep" },
  { icon: CalendarDays, tag: "공모전", title: "가을 싱어송라이터 공모전 모음", href: "/info/contest", tone: "text-blue" },
  { icon: Megaphone, tag: "공지", title: "OMU 오픈 베타를 시작했어요", href: "/community/free", tone: "text-ink-2" },
];

export function NewsStrip() {
  return (
    <section aria-label="이번 주 소식" className="mx-auto max-w-[1120px] px-4 sm:px-6">
      <ul className="scrollbar-none -mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {NEWS.map((n) => (
          <li key={n.title} className="w-[78%] shrink-0 snap-start sm:w-auto">
            <Link href={n.href} className="card flex items-center gap-3 px-4 py-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone">
                <n.icon aria-hidden className={`size-5 ${n.tone}`} />
              </span>
              <span className="min-w-0">
                <span className={`block text-xs font-bold ${n.tone}`}>{n.tag}</span>
                <span className="block truncate text-sm font-semibold text-ink">{n.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
