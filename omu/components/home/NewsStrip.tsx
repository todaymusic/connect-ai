import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// 홈 소식 띠 — 실제로 알릴 소식이 생기면 여기에 넣는다(예: 새 기능 오픈 공지).
// 공개 전 정리: 사실이 아닌 소식(가짜 신규 악보·공모전·오픈 공지)은 두지 않는다. 비어 있으면 아무것도 그리지 않는다.
type News = { icon: LucideIcon; tag: string; title: string; href: string; tone: string };
const NEWS: News[] = [];

export function NewsStrip() {
  if (NEWS.length === 0) return null;
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
