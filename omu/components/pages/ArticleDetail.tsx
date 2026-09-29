import Link from "next/link";
import type { Metadata } from "next";
import { Clock, Eye, Tag } from "lucide-react";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { AuthorLabel } from "@/components/detail/AuthorLabel";
import { Breadcrumbs, CommentsSection, DetailShell, JsonLd, ReportButton, SimpleMarkdown, YouTubeEmbed } from "@/components/detail/DetailParts";
import { Badge } from "@/components/ui";
import { getArticle, listRelatedArticles } from "@/lib/data/articles";
import { listComments } from "@/lib/data/posts";
import type { Article } from "@/lib/data/types";
import { formatCount, formatDate } from "@/lib/format";
import { ARTICLE_CATEGORIES, EDITOR_DISPLAY_NAME, articlePath, siteUrl } from "@/lib/site";

export async function articleMetadata(category: string, slug: string): Promise<Metadata> {
  const a = await getArticle(category, slug);
  if (!a) return { title: "글을 찾을 수 없어요", robots: { index: false } };
  return {
    title: a.title,
    description: a.summary,
    keywords: a.keywords,
    alternates: { canonical: articlePath(a.category, a.slug) },
    openGraph: { title: a.title, description: a.summary, type: "article", publishedTime: a.publishedAt },
  };
}

export async function ArticleDetail({ article: a }: { article: Article }) {
  const [related, comments] = await Promise.all([listRelatedArticles(a, 3), listComments("article", a.id)]);
  const isGear = a.category === "equipment" || a.category === "instrument";
  const sectionHref = isGear ? "/gear" : "/info";
  const url = `${siteUrl()}${articlePath(a.category, a.slug)}`;
  const authorName = a.authorDisplay === "editor" ? EDITOR_DISPLAY_NAME : (a.author?.nickname ?? "OMU");

  return (
    <DetailShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.summary,
          url,
          mainEntityOfPage: url,
          datePublished: a.publishedAt,
          inLanguage: "ko-KR",
          keywords: a.keywords.join(", "),
          articleSection: ARTICLE_CATEGORIES[a.category],
          author: a.authorDisplay === "editor" ? { "@type": "Organization", name: authorName } : { "@type": "Person", name: authorName },
          publisher: { "@type": "Organization", name: "OMU" },
        }}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "홈" },
          { href: sectionHref, label: isGear ? "악기" : "음악정보" },
          { href: `${sectionHref}/${a.category}`, label: ARTICLE_CATEGORIES[a.category] },
          { href: articlePath(a.category, a.slug), label: a.title },
        ]}
      />
      <div className="mx-auto max-w-[720px]">
        <header className="mt-5 border-b border-line pb-5">
          <Link href={`${sectionHref}/${a.category}`}>
            <Badge tone="neutral">{ARTICLE_CATEGORIES[a.category]}</Badge>
          </Link>
          <h1 className="mt-3 text-[26px] font-extrabold leading-snug tracking-tight text-ink sm:text-[32px]">{a.title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{a.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-3">
            <AuthorLabel author={a.author} display={a.authorDisplay} />
            <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time>
            <span className="font-display inline-flex items-center gap-1">
              <Eye aria-hidden className="size-3.5" />
              조회 {formatCount(a.views)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden className="size-3.5" />
              {a.readMinutes}분 분량
            </span>
          </div>
        </header>

        <div className="mt-6">
          <YouTubeEmbed url={a.youtubeUrl} title={a.title} />
          <SimpleMarkdown text={a.content} />
        </div>

        {a.keywords.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-1.5" aria-label="키워드">
            {a.keywords.map((k) => (
              <li key={k}>
                <Link
                  href={`/search?q=${encodeURIComponent(k)}`}
                  className="inline-flex items-center gap-1 rounded-full bg-stone px-2.5 py-1 text-xs text-ink-2 hover:bg-line"
                >
                  <Tag aria-hidden className="size-3" />
                  {k}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex justify-end">
          <ReportButton />
        </div>

        <CommentsSection threads={comments} count={comments.reduce((n, c) => n + 1 + c.replies.length, 0)} />
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-14">
          <h2 id="related-title" className="text-lg font-extrabold text-ink">
            {ARTICLE_CATEGORIES[a.category]} 다른 글
          </h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <ArticleCard article={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </DetailShell>
  );
}
