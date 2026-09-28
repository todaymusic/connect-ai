import Link from "next/link";
import { MapPin } from "lucide-react";
import type { MockRecruit } from "@/lib/mock";
import { RECRUIT_LEVELS, type RecruitLevel } from "@/lib/site";
import { LevelBadge } from "../ui";

export function RecruitLegend() {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
      <span className="mr-0.5">모집 성격</span>
      {(Object.keys(RECRUIT_LEVELS) as RecruitLevel[]).map((l) => (
        <Link key={l} href={`/recruit/band?level=${l}`} className="transition-opacity hover:opacity-80">
          <LevelBadge level={l} />
        </Link>
      ))}
    </div>
  );
}

export function RecruitList({ recruits }: { recruits: MockRecruit[] }) {
  return (
    <ul className="grid gap-2.5 md:grid-cols-2">
      {recruits.map((r) => (
        <li key={r.id}>
          <Link href={`/recruit/${r.category}/${r.id}`} className="card group flex items-start gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {r.level && <LevelBadge level={r.level} />}
                <span className="text-xs text-ink-3">{r.genre}</span>
              </div>
              <h3 className="mt-1.5 line-clamp-1 text-[15px] font-bold text-ink group-hover:text-coral-deep">{r.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-2">
                <span className="inline-flex items-center gap-0.5 text-ink-3">
                  <MapPin aria-hidden className="size-3.5" />
                  {r.region}
                </span>
                {r.positions.map((p) => (
                  <span key={p} className="rounded-full border border-line px-2 py-0.5">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <span className="shrink-0 pt-0.5 text-xs text-ink-3">{r.timeAgo}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
