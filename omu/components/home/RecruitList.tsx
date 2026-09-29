import Link from "next/link";
import type { Recruit } from "@/lib/data/types";
import { RecruitCard } from "../cards/RecruitCard";
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

export function RecruitList({ recruits }: { recruits: Recruit[] }) {
  return (
    <ul className="grid gap-2.5 md:grid-cols-2">
      {recruits.map((r) => (
        <li key={r.id}>
          <RecruitCard recruit={r} />
        </li>
      ))}
    </ul>
  );
}
