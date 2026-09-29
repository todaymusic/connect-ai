import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ArticleForm } from "@/components/write/forms/ArticleForm";
import { CommunityForm } from "@/components/write/forms/CommunityForm";
import { MarketForm } from "@/components/write/forms/MarketForm";
import { RecruitForm } from "@/components/write/forms/RecruitForm";
import { ScoreForm } from "@/components/write/forms/ScoreForm";
import { ScoreRequestForm } from "@/components/write/forms/ScoreRequestForm";
import { GuestNotice } from "@/components/interact/GuestNotice";
import { DemoRoleSwitcher, WriteGate } from "@/components/write/WriteChrome";
import { first } from "@/lib/url";
import { canWrite, denyReason, getWriteType } from "@/lib/write/config";
import { getWriterState } from "@/lib/write/writer";

export async function generateMetadata({ params }: PageProps<"/write/[type]">): Promise<Metadata> {
  const { type } = await params;
  return { title: getWriteType(type)?.label ?? "글쓰기", robots: { index: false, follow: false } };
}

export default async function WriteTypePage({ params, searchParams }: PageProps<"/write/[type]">) {
  const { type } = await params;
  const cfg = getWriteType(type);
  if (!cfg) notFound();
  const sp = await searchParams;
  const state = await getWriterState();
  const role = state.writer?.role ?? null;
  const allowed = canWrite(role, cfg.key);
  const query = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))).toString();
  const here = `/write/${cfg.key}${query ? `?${query}` : ""}`;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());

  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/write" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-3 hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        작성 허브
      </Link>
      <p className="mt-4 text-xs font-semibold text-ink-3">{cfg.section}</p>
      <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{cfg.label}</h1>
      <p className="mt-1 text-sm text-ink-2">{cfg.hint}</p>

      {state.mode === "demo" && (
        <div className="mt-6">
          <DemoRoleSwitcher current={state.demoRole} next={here} />
        </div>
      )}

      {allowed && !role && (
        <div className="mt-6">
          <GuestNotice loginHref={`/login?next=${encodeURIComponent(here)}`} demo={state.mode === "demo"} />
        </div>
      )}

      <div className="mt-6">
        {!allowed ? (
          <WriteGate kind={role ? "forbidden" : "signed-out"} message={denyReason(role, cfg.key) ?? ""} next={here} demo={state.mode === "demo"} />
        ) : cfg.key === "community" ? (
          <CommunityForm mode={state.mode} guest={!role} defaults={{ category: first(sp.category), subject: first(sp.subject) }} />
        ) : cfg.key === "market" ? (
          <MarketForm mode={state.mode} defaults={{ trade: first(sp.trade), category: first(sp.category) }} />
        ) : cfg.key === "recruit" ? (
          <RecruitForm mode={state.mode} defaults={{ category: first(sp.category) }} today={today} />
        ) : cfg.key === "score-request" ? (
          <ScoreRequestForm mode={state.mode} defaults={{ instrument: first(sp.instrument) }} />
        ) : cfg.key === "score" ? (
          <ScoreForm mode={state.mode} />
        ) : (
          <ArticleForm mode={state.mode} isAdmin={role === "admin"} defaults={{ category: first(sp.category) }} />
        )}
      </div>
    </div>
  );
}
