import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { getDataSource } from "@/lib/data/source";
import type { CommentTarget, CommentThread } from "@/lib/data/types";
import { siteUrl } from "@/lib/site";
import { CommentsLive } from "../interact/CommentsLive";

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

/* ───────── 신고 ───────── */
export { ReportButton } from "../interact/ReportButton";

/* ───────── 댓글 (읽기 + 작성·답글·수정·삭제·신고) ───────── */
export function CommentsSection({
  threads,
  title = "댓글",
  acceptable = false,
  threadType,
  threadId,
  path,
  threadGuestName = null,
}: {
  threads: CommentThread[];
  title?: string;
  /** Q&A 처럼 채택 표시를 쓰는 곳 */
  acceptable?: boolean;
  threadType: CommentTarget;
  threadId: string;
  /** 이 글의 주소 */
  path: string;
  threadGuestName?: string | null;
}) {
  return (
    <CommentsLive
      threadType={threadType}
      threadId={threadId}
      path={path}
      initial={threads}
      title={title}
      acceptable={acceptable}
      mode={getDataSource()}
      threadGuestName={threadGuestName}
    />
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
