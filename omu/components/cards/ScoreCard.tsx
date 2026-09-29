import Link from "next/link";
import { Download } from "lucide-react";
import type { Score } from "@/lib/data/types";
import { DIFFICULTIES, SCORE_INSTRUMENTS, type ScoreInstrument } from "@/lib/site";
import { Badge, FreeBadge, formatCount } from "../ui";

const THUMB_TONE: Record<ScoreInstrument, string> = {
  piano: "bg-stone",
  guitar: "bg-blue-soft/70",
  vocal: "bg-coral-soft/45",
  drum: "bg-pro-soft/80",
  bass: "bg-blue-soft/45",
  band: "bg-stone",
  chord: "bg-[#EDEBE3]",
};

/**
 * 악보 카드 — PDF 첫 페이지 미리보기(thumbnailUrl)가 있으면 세로 3:4 종이처럼 보여 주고,
 * 없으면 오선지 플레이스홀더. 카드 높이는 두 경우 모두 같다(4:3 영역).
 */
export function ScoreCard({ score }: { score: Score }) {
  return (
    <Link href={`/score/${score.instrument}/${score.slug}`} className="card group flex h-full flex-col overflow-hidden">
      <div className={`relative aspect-[4/3] overflow-hidden ${THUMB_TONE[score.instrument]}`}>
        {score.thumbnailUrl ? (
          <div className="absolute left-1/2 top-3 aspect-[3/4] w-[62%] -translate-x-1/2 overflow-hidden rounded-t-md bg-white shadow-[0_2px_10px_rgba(30,27,24,0.14)] transition-transform duration-300 group-hover:-translate-y-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 주소 */}
            <img src={score.thumbnailUrl} alt={`${score.title} 악보 첫 페이지 미리보기`} loading="lazy" decoding="async" className="size-full object-cover object-top" />
          </div>
        ) : (
          <svg aria-hidden viewBox="0 0 200 150" className="absolute inset-0 size-full" preserveAspectRatio="none">
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1="18" x2="182" y1={62 + i * 9} y2={62 + i * 9} stroke="#1E1B18" strokeOpacity="0.14" strokeWidth="1" />
            ))}
            <ellipse cx="72" cy="89" rx="6.5" ry="4.6" fill="#1E1B18" fillOpacity="0.22" transform="rotate(-18 72 89)" />
            <line x1="78" x2="78" y1="88" y2="56" stroke="#1E1B18" strokeOpacity="0.22" strokeWidth="1.6" />
            <ellipse cx="118" cy="75" rx="6.5" ry="4.6" fill="#F5623C" transform="rotate(-18 118 75)" />
            <line x1="124" x2="124" y1="74" y2="42" stroke="#F5623C" strokeWidth="1.6" />
          </svg>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <FreeBadge />
        </div>
        <span className="font-display absolute right-3 top-3 rounded-full bg-card/80 px-2 py-0.5 text-[11px] font-bold text-ink-2">
          {score.pages ? `PDF · ${score.pages}p` : "PDF"}
        </span>
        {!score.thumbnailUrl && (
          <span className="font-display absolute bottom-2.5 left-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/45">
            {score.instrument === "chord" ? "chart" : score.instrument}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-ink group-hover:text-coral-deep">{score.title}</h3>
        <p className="mt-1 truncate text-xs text-ink-3">
          {score.artist} · {score.genre}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="flex min-w-0 gap-1">
            <Badge>{SCORE_INSTRUMENTS[score.instrument]}</Badge>
            <span className="hidden sm:inline-flex">
              <Badge tone="outline">{DIFFICULTIES[score.difficulty]}</Badge>
            </span>
          </span>
          <span className="font-display inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-ink-3">
            <Download aria-hidden className="size-3.5" />
            {formatCount(score.downloads)}
          </span>
        </div>
      </div>
    </Link>
  );
}
