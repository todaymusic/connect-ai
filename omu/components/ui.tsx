import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { RecruitLevel } from "@/lib/site";
import { RECRUIT_LEVELS } from "@/lib/site";

/* ───────── 배지 ───────── */
type BadgeTone = "neutral" | "coral" | "blue" | "pro" | "ink" | "outline";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-stone text-ink-2",
  coral: "bg-coral-soft text-coral-deep",
  blue: "bg-blue-soft text-blue-deep",
  pro: "bg-pro-soft text-pro-deep",
  ink: "bg-ink text-paper",
  outline: "border border-line-2 text-ink-2",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold leading-4 ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** 무료 악보 배지 */
export function FreeBadge() {
  return (
    <span className="font-display inline-flex items-center rounded-full bg-coral px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
      FREE
    </span>
  );
}

/** 구인 성격 배지: 취미=blue, 세미프로=coral, 현역·프로=purple (작업지시서 7-1) */
const LEVEL_TONE: Record<RecruitLevel, BadgeTone> = { hobby: "blue", semipro: "coral", pro: "pro" };
export function LevelBadge({ level }: { level: RecruitLevel }) {
  return <Badge tone={LEVEL_TONE[level]}>{RECRUIT_LEVELS[level]}</Badge>;
}

/** 'OMU 에디터' 작성자 표기 배지 */
export function EditorBadge({ label = "OMU 에디터" }: { label?: string }) {
  return (
    <Badge tone="outline" className="bg-card">
      <BadgeCheck aria-hidden className="size-3.5 text-blue" />
      {label}
    </Badge>
  );
}

/** 운영자(관리자) 표기 배지 */
export function AdminBadge({ label = "운영자" }: { label?: string }) {
  return (
    <Badge tone="ink">
      <ShieldCheck aria-hidden className="size-3.5" />
      {label}
    </Badge>
  );
}

/* ───────── 섹션 헤더 ───────── */
export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "전체보기",
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="font-display mb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-coral-deep">{eyebrow}</p>
        )}
        <h2 id={id} className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          {title}
        </h2>
        {description && <p className="mt-1.5 text-sm text-ink-2">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink-2 hover:text-ink"
        >
          {linkLabel}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function Section({ children, className = "", labelledBy }: { children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={`mx-auto max-w-[1120px] px-4 sm:px-6 ${className}`}>
      {children}
    </section>
  );
}

/* 숫자 포맷은 lib/format 한 곳에서 관리한다 */
export { formatCount, formatPrice } from "@/lib/format";
