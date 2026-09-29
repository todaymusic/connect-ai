import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Globe, MapPin, Send } from "lucide-react";
import { DeadlineBadge } from "@/components/cards/RecruitCard";
import { AuthorLabel } from "@/components/detail/AuthorLabel";
import { ThreadOwnerActions } from "@/components/interact/ThreadOwnerActions";
import { Breadcrumbs, CommentsSection, DetailShell, InfoList, ReportButton, SimpleMarkdown, TwoColumn } from "@/components/detail/DetailParts";
import { Badge, LevelBadge } from "@/components/ui";
import { listComments } from "@/lib/data/posts";
import { getRecruit, listRecruits } from "@/lib/data/recruits";
import { daysUntil, formatCount, formatDate, formatDateTime } from "@/lib/format";
import { RECRUIT_CATEGORIES, RECRUIT_LEVELS, SKILL_LEVELS, isKey } from "@/lib/site";

export const revalidate = 120;

export async function generateStaticParams() {
  const { items } = await listRecruits({ pageSize: 200 });
  return items.map((r) => ({ category: r.category, id: r.id }));
}

export async function generateMetadata({ params }: PageProps<"/recruit/[category]/[id]">): Promise<Metadata> {
  const { category, id } = await params;
  const r = await getRecruit(category, id);
  if (!r) return { title: "모집글을 찾을 수 없어요", robots: { index: false } };
  const bits = [RECRUIT_CATEGORIES[r.category], r.level ? RECRUIT_LEVELS[r.level] : null, r.region, r.positions.join("·") || null];
  const description = `${bits.filter(Boolean).join(" · ")}. ${r.description.split("\n")[0].slice(0, 90)}`;
  return {
    title: `${r.title} — 구인·모집`,
    description,
    alternates: { canonical: `/recruit/${r.category}/${r.id}` },
    robots: r.isClosed ? { index: false, follow: true } : undefined,
    openGraph: { title: r.title, description },
  };
}

export default async function RecruitDetailPage({ params }: PageProps<"/recruit/[category]/[id]">) {
  const { category, id } = await params;
  if (!isKey(RECRUIT_CATEGORIES, category)) notFound();
  const r = await getRecruit(category, id);
  if (!r) notFound();
  const comments = await listComments("recruit", r.id);
  const online = r.region === "온라인";
  const closed = r.isClosed || (r.deadline !== null && daysUntil(r.deadline) < 0);

  return (
    <DetailShell>
      <Breadcrumbs
        items={[
          { href: "/", label: "홈" },
          { href: "/recruit", label: "구인·모집" },
          { href: `/recruit/${r.category}`, label: RECRUIT_CATEGORIES[r.category] },
          { href: `/recruit/${r.category}/${r.id}`, label: r.title },
        ]}
      />
      <TwoColumn
        main={
          <>
            <header>
              <div className="flex flex-wrap items-center gap-1.5">
                {r.level && <LevelBadge level={r.level} />}
                <Badge tone="neutral">{RECRUIT_CATEGORIES[r.category]}</Badge>
                <DeadlineBadge recruit={r} />
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">{r.title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                <AuthorLabel author={r.author} />
                <time dateTime={r.createdAt}>{formatDateTime(r.createdAt)}</time>
                <span>조회 {formatCount(r.views)}</span>
              </p>
            </header>
            {r.positions.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-bold text-ink">모집 역할</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {r.positions.map((p) => (
                    <li key={p} className="rounded-full border border-line-2 bg-card px-3 py-1 text-sm font-semibold text-ink">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 border-t border-line pt-6">
              <SimpleMarkdown text={r.description} />
            </div>
            <CommentsSection title="지원·문의" threads={comments} threadType="recruit" threadId={r.id} path={`/recruit/${r.category}/${r.id}`} />
          </>
        }
        aside={
          <>
            <InfoList
              rows={[
                { label: "분류", value: RECRUIT_CATEGORIES[r.category] },
                ...(r.level ? [{ label: "성격", value: <LevelBadge level={r.level} /> }] : []),
                {
                  label: "지역",
                  value: (
                    <span className="inline-flex items-center gap-1">
                      {online ? <Globe aria-hidden className="size-3.5" /> : <MapPin aria-hidden className="size-3.5" />}
                      {online ? "온라인(비대면)" : r.region}
                    </span>
                  ),
                },
                { label: "장르", value: r.genre ?? "무관" },
                { label: "실력", value: r.skillLevel ? SKILL_LEVELS[r.skillLevel] : "무관" },
                { label: "일정", value: r.schedule ?? "협의" },
                { label: "마감", value: r.isClosed ? "모집 마감" : r.deadline ? formatDate(r.deadline) : "상시 모집" },
              ]}
            />
            <div className="card p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <Send aria-hidden className="size-4" />
                지원·연락 안내
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                {closed ? "모집이 끝난 글이에요." : (r.contact ?? "아래 ‘지원·문의’ 댓글로 연락해 주세요.")}
              </p>
              <button type="button" disabled className="mt-3 h-10 w-full cursor-not-allowed rounded-full bg-stone text-sm font-bold text-ink-3">
                {closed ? "모집 마감" : "간편 지원 (준비 중)"}
              </button>
              <p className="mt-2 text-xs text-ink-3">연락처를 주고받을 때는 개인정보가 필요 이상 노출되지 않게 주의해 주세요.</p>
            </div>
            <ThreadOwnerActions threadType="recruit" threadId={r.id} path={`/recruit/${r.category}/${r.id}`} listPath="/recruit" />
            <div className="flex justify-end">
              <ReportButton targetType="recruit" targetId={r.id} title={r.title} path={`/recruit/${r.category}/${r.id}`} />
            </div>
          </>
        }
      />
    </DetailShell>
  );
}
