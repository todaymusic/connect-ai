import Link from "next/link";
import { ChevronRight, Flag, MessageCircle } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import type { CommentThread } from "@/lib/data/types";
import { formatDateTime, formatRelative } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { Badge } from "../ui";
import { AuthorLabel } from "./AuthorLabel";

/* ───────── JSON-LD ───────── */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // `<` 를 이스케이프해 본문 안의 </script> 로 스크립트가 끊기지 않게 한다
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/* ───────── 이동 경로 (화면 + BreadcrumbList 구조화 데이터) ───────── */
export function Breadcrumbs({ items }: { items: { href: string; label: string }[] }) {
  const base = siteUrl();
  return (
    <>
      <nav aria-label="현재 위치" className="text-xs text-ink-3">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((it, i) => (
            <Fragment key={it.href}>
              {i > 0 && <ChevronRight aria-hidden className="size-3" />}
              <li>
                {i === items.length - 1 ? (
                  <span aria-current="page" className="font-semibold text-ink-2">
                    {it.label}
                  </span>
                ) : (
                  <Link href={it.href} className="hover:text-ink hover:underline">
                    {it.label}
                  </Link>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.label, item: `${base}${it.href}` })),
        }}
      />
    </>
  );
}

/* ───────── 아주 작은 마크다운 렌더러 ─────────
   지원: 빈 줄 문단, ## / ### 제목, - 목록. HTML 은 해석하지 않는다(글자 그대로) → XSS 걱정 없음. */
export function SimpleMarkdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="prose-omu">
      {blocks.map((b, i) => {
        const block = b.trim();
        if (!block) return null;
        if (block.startsWith("### ")) return <h3 key={i}>{block.slice(4)}</h3>;
        if (block.startsWith("## ")) return <h2 key={i}>{block.slice(3)}</h2>;
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {l}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/* ───────── 유튜브 임베드 (youtube-nocookie) ───────── */
export function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m?.[1] ?? null;
}
export function YouTubeEmbed({ url, title }: { url: string | null; title: string }) {
  const id = youtubeId(url);
  if (!id) return null;
  return (
    <div className="my-6 aspect-video overflow-hidden rounded-2xl border border-line bg-stone">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={`${title} — 영상`}
        className="size-full"
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

/* ───────── 신고 (준비 중) ───────── */
export function ReportButton() {
  return (
    <button
      type="button"
      disabled
      title="신고 기능은 곧 열려요"
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-ink-3 disabled:cursor-not-allowed"
    >
      <Flag aria-hidden className="size-3.5" />
      신고 <span className="rounded-full bg-stone px-1.5 text-[10px]">준비 중</span>
    </button>
  );
}

/* ───────── 댓글 (읽기 전용) ───────── */
export function CommentsSection({
  threads,
  count,
  title = "댓글",
  acceptable = false,
}: {
  threads: CommentThread[];
  count: number;
  title?: string;
  /** Q&A 처럼 채택 표시를 쓰는 곳 */
  acceptable?: boolean;
}) {
  return (
    <section aria-labelledby="comments-title" className="mt-10">
      <h2 id="comments-title" className="flex items-center gap-2 text-lg font-extrabold text-ink">
        <MessageCircle aria-hidden className="size-5" />
        {title} <span className="font-display text-ink-3">{count}</span>
      </h2>

      {threads.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-stone px-4 py-6 text-center text-sm text-ink-2">아직 {title}이 없어요.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {threads.map((c) => (
            <li key={c.id} className={`card p-4 ${c.isAccepted ? "border-blue/50" : ""}`}>
              <CommentBody c={c} acceptable={acceptable} />
              {c.replies.length > 0 && (
                <ul className="mt-3 space-y-3 border-l-2 border-line pl-4">
                  {c.replies.map((r) => (
                    <li key={r.id}>
                      <CommentBody c={r} acceptable={false} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 댓글 작성은 다음 단계 — 자리는 미리 보여준다 */}
      <div className="mt-4 rounded-2xl border border-line bg-card p-4">
        <label htmlFor="comment-draft" className="text-sm font-semibold text-ink-2">
          {title} 쓰기
        </label>
        <textarea
          id="comment-draft"
          disabled
          rows={2}
          placeholder={`${title} 작성은 곧 열려요.`}
          className="mt-2 w-full resize-none rounded-xl border border-line bg-stone px-3 py-2 text-sm placeholder:text-ink-3 disabled:cursor-not-allowed"
        />
        <div className="mt-2 flex justify-end">
          <button type="button" disabled className="h-9 rounded-full bg-stone px-4 text-sm font-bold text-ink-3 disabled:cursor-not-allowed">
            등록 (준비 중)
          </button>
        </div>
      </div>
    </section>
  );
}

function CommentBody({ c, acceptable }: { c: CommentThread | CommentThread["replies"][number]; acceptable: boolean }) {
  return (
    <div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
        <AuthorLabel author={c.author} anonymous={c.isAnonymous} />
        <time dateTime={c.createdAt} title={formatDateTime(c.createdAt)}>
          {formatRelative(c.createdAt)}
        </time>
        {acceptable && c.isAccepted && <Badge tone="blue">채택된 답변</Badge>}
      </p>
      <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-ink">{c.content}</p>
    </div>
  );
}

/* ───────── 상세 정보 표 ───────── */
export function InfoList({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line rounded-2xl border border-line bg-card text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-3">
          <dt className="shrink-0 text-ink-3">{r.label}</dt>
          <dd className="min-w-0 text-right font-semibold text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailShell({ children }: { children: ReactNode }) {
  return <article className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 sm:py-12">{children}</article>;
}

/** 오른쪽(모바일은 아래) 보조 영역이 있는 2단 레이아웃 */
export function TwoColumn({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">{main}</div>
      <aside className="min-w-0 space-y-4">{aside}</aside>
    </div>
  );
}
