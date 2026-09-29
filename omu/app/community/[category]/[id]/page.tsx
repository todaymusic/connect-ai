import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, FileMusic, Pin, Tag } from "lucide-react";
import { AuthorLabel } from "@/components/detail/AuthorLabel";
import { Breadcrumbs, CommentsSection, DetailShell, JsonLd, ReportButton, SimpleMarkdown, YouTubeEmbed } from "@/components/detail/DetailParts";
import { Badge } from "@/components/ui";
import { getPost, listComments, listPosts } from "@/lib/data/posts";
import { getScore, listScores } from "@/lib/data/scores";
import { formatCount, formatDateTime } from "@/lib/format";
import { COMMUNITY_CATEGORIES, QNA_SUBJECTS, isKey, siteUrl } from "@/lib/site";

export const revalidate = 60;

export async function generateStaticParams() {
  const { items } = await listPosts({ pageSize: 200 });
  return items.map((p) => ({ category: p.category, id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/community/[category]/[id]">): Promise<Metadata> {
  const { category, id } = await params;
  const p = await getPost(category, id);
  if (!p) return { title: "글을 찾을 수 없어요", robots: { index: false } };
  const description = p.content.replace(/\s+/g, " ").slice(0, 110);
  return {
    title: `${p.title} — ${COMMUNITY_CATEGORIES[p.category]}`,
    description,
    alternates: { canonical: `/community/${p.category}/${p.id}` },
    // 익명 글은 검색 노출하지 않는다
    robots: p.isAnonymous ? { index: false, follow: true } : undefined,
    openGraph: { title: p.title, description, type: "article" },
  };
}

export default async function PostDetailPage({ params }: PageProps<"/community/[category]/[id]">) {
  const { category, id } = await params;
  if (!isKey(COMMUNITY_CATEGORIES, category)) notFound();
  const p = await getPost(category, id);
  if (!p) notFound();

  const [comments, relatedScore] = await Promise.all([
    listComments("post", p.id),
    p.relatedScoreSlug ? findScore(p.relatedScoreSlug) : Promise.resolve(null),
  ]);
  const commentTotal = comments.reduce((n, c) => n + 1 + c.replies.length, 0);
  const url = `${siteUrl()}/community/${p.category}/${p.id}`;

  return (
    <DetailShell>
      {!p.isAnonymous && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "DiscussionForumPosting",
            headline: p.title,
            text: p.content,
            url,
            datePublished: p.createdAt,
            author: { "@type": "Person", name: p.author?.nickname ?? "OMU 회원" },
            interactionStatistic: { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: p.commentCount },
            ...(p.youtubeUrl ? { video: { "@type": "VideoObject", name: p.title, embedUrl: p.youtubeUrl } } : {}),
          }}
        />
      )}
      <Breadcrumbs
        items={[
          { href: "/", label: "홈" },
          { href: "/community", label: "커뮤니티" },
          { href: `/community/${p.category}`, label: COMMUNITY_CATEGORIES[p.category] },
          { href: `/community/${p.category}/${p.id}`, label: p.title },
        ]}
      />
      <div className="mx-auto max-w-[760px]">
        <header className="mt-5 border-b border-line pb-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {p.isNotice && (
              <Badge tone="coral">
                <Pin aria-hidden className="size-3" />
                공지
              </Badge>
            )}
            <Link href={`/community/${p.category}`}>
              <Badge tone="neutral">{COMMUNITY_CATEGORIES[p.category]}</Badge>
            </Link>
            {p.qnaSubject && <Badge tone="blue">{QNA_SUBJECTS[p.qnaSubject]}</Badge>}
            {p.category === "qna" &&
              (p.isAnswered ? (
                <Badge tone="outline">
                  <CheckCircle2 aria-hidden className="size-3 text-blue" />
                  해결됨
                </Badge>
              ) : (
                <Badge tone="coral">답변 대기</Badge>
              ))}
          </div>
          <h1 className="mt-3 text-[24px] font-extrabold leading-snug tracking-tight text-ink sm:text-[28px]">{p.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
            <AuthorLabel author={p.author} display={p.authorDisplay} anonymous={p.isAnonymous} />
            <time dateTime={p.createdAt}>{formatDateTime(p.createdAt)}</time>
            <span>조회 {formatCount(p.views)}</span>
          </p>
        </header>

        <div className="mt-6">
          <YouTubeEmbed url={p.youtubeUrl} title={p.title} />
          <SimpleMarkdown text={p.content} />
        </div>

        {p.tags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="태그">
            {p.tags.map((t) => (
              <li key={t}>
                <Link href={`/community?q=${encodeURIComponent(t)}`} className="inline-flex items-center gap-1 rounded-full bg-stone px-2.5 py-1 text-xs text-ink-2 hover:bg-line">
                  <Tag aria-hidden className="size-3" />
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {relatedScore && (
          <Link
            href={`/score/${relatedScore.instrument}/${relatedScore.slug}`}
            className="card card-hover mt-6 flex items-center gap-3 p-4"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone">
              <FileMusic aria-hidden className="size-5 text-coral-deep" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-ink-3">이 글과 연결된 악보</span>
              <span className="block truncate text-sm font-bold text-ink">{relatedScore.title}</span>
            </span>
          </Link>
        )}

        <div className="mt-6 flex justify-end">
          <ReportButton />
        </div>
        <CommentsSection title={p.category === "qna" ? "답변" : "댓글"} threads={comments} count={commentTotal} acceptable={p.category === "qna"} />
      </div>
    </DetailShell>
  );
}

async function findScore(slug: string) {
  // slug 만 알고 악기는 모를 때 — 목록에서 찾는다(곡 중심 연결용)
  const { items } = await listScores({ pageSize: 500 });
  const hit = items.find((s) => s.slug === slug);
  return hit ? getScore(hit.instrument, hit.slug) : null;
}
