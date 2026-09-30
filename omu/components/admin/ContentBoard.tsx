import Link from "next/link";
import { ExternalLink, FileMusic, FileText, ImageOff, PenLine, Upload } from "lucide-react";
import { ADMIN_CONTENT_LIMIT, type AdminArticleRow, type AdminContent, type AdminScoreRow } from "@/lib/admin";
import { formatCount, formatDate } from "@/lib/format";
import { ARTICLE_CATEGORIES, DIFFICULTIES, SCORE_INSTRUMENTS, articlePath, isKey } from "@/lib/site";
import { AdminBadge, Badge } from "../ui";
import { AdminNav } from "./AdminNav";
import { EditArticleLink, PublishArticleButton } from "../write/ArticleActions";
import { DeleteContentButton } from "./ContentActions";

export type ContentDone = { kind: "score" | "article" | "published" | "deleted"; leftovers: string[] } | null;

/** /admin/content — 악보·정보글 등록 바로가기 + 최근 등록 목록(보기·삭제) */
export function ContentBoard({
  content,
  preview,
  openReports,
  done,
}: {
  content: AdminContent;
  preview: boolean;
  openReports: number | null;
  done: ContentDone;
}) {
  return (
    <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-center gap-2">
        <AdminBadge label="관리자" />
        {preview && <Badge tone="coral">미리보기 · 목데이터</Badge>}
      </div>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">악보·정보글 등록</h1>
      <p className="mt-1 text-sm text-ink-2">악보 PDF 와 정보글을 올리고, 최근 등록한 항목을 확인하거나 지울 수 있어요.</p>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <AdminNav active="content" openReports={openReports} />
        <div className="min-w-0">
          {done && (
            <div role="status" className="mb-4 rounded-xl bg-blue-soft/50 px-4 py-3 text-sm font-semibold text-ink">
              {done.kind === "score" ? "악보를 지웠어요." : done.kind === "published" ? "정보글을 발행했어요. 이제 누구나 볼 수 있어요." : "정보글을 지웠어요."}
              {done.leftovers.length > 0 ? (
                <>
                  {" "}
                  다만 아래 파일은 지우지 못했어요. Supabase Storage 에서 직접 지워 주세요.
                  <ul className="mt-1.5 list-inside list-disc font-normal text-ink-2">
                    {done.leftovers.map((p) => (
                      <li key={p} className="break-all">
                        {p}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                done.kind === "score" && " 연결된 PDF·미리보기 파일도 함께 지웠어요."
              )}
            </div>
          )}
          {preview && (
            <p className="mb-4 rounded-xl border border-coral-soft bg-coral-soft/30 px-4 py-3 text-sm leading-relaxed text-ink-2">
              Supabase 가 연결되지 않은 미리보기예요. 서버에 등록된 악보·정보글은 없고, 글쓰기는 데모로만 확인할 수 있어요.
            </p>
          )}
          {content.error && <p className="mb-4 rounded-xl bg-stone px-4 py-3 text-sm text-ink-2">{content.error}</p>}

          <div className="grid gap-2.5 sm:grid-cols-2">
            <BigLink href="/write/score" icon={Upload} title="악보 올리기" body="PDF 를 고르면 첫 페이지 미리보기가 자동으로 만들어져요." />
            <BigLink href="/write/article" icon={PenLine} title="정보글 쓰기" body="‘발행’하면 바로 공개, ‘임시저장’하면 초안으로 남아요. 관리자 글에는 OMU 에디터 배지가 붙어요." />
          </div>

          <section aria-labelledby="admin-scores-title" className="mt-10">
            <ListTitle id="admin-scores-title" title="최근 등록한 악보" count={content.scores.length} />
            {content.scores.length === 0 ? (
              <Empty>아직 등록한 악보가 없어요.</Empty>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {content.scores.map((s) => (
                  <ScoreRow key={s.id} s={s} preview={preview} />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="admin-articles-title" className="mt-10">
            <ListTitle id="admin-articles-title" title="최근 등록한 정보글" count={content.articles.length} />
            {content.articles.length === 0 ? (
              <Empty>아직 등록한 정보글이 없어요.</Empty>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {content.articles.map((a) => (
                  <ArticleRow key={a.id} a={a} preview={preview} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function BigLink({ href, icon: Icon, title, body }: { href: string; icon: typeof Upload; title: string; body: string }) {
  return (
    <Link href={href} className="card group flex items-start gap-3.5 p-4 transition-colors hover:border-ink-3 sm:p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-coral text-white transition-colors group-hover:bg-coral-deep">
        <Icon aria-hidden className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-extrabold text-ink">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-ink-2">{body}</span>
      </span>
    </Link>
  );
}

function ListTitle({ id, title, count }: { id: string; title: string; count: number }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 id={id} className="text-lg font-extrabold text-ink">
        {title} <span className="font-display text-sm font-bold text-ink-3">{count}</span>
      </h2>
      <p className="text-xs text-ink-3">최근 {ADMIN_CONTENT_LIMIT}개까지</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 rounded-2xl bg-stone px-4 py-8 text-center text-sm text-ink-2">{children}</p>;
}

function ViewLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex h-8 items-center gap-1 rounded-full border border-line-2 px-3 text-xs font-bold text-ink hover:border-ink-3" aria-label={label}>
      <ExternalLink aria-hidden className="size-3.5" />
      보기
    </Link>
  );
}

function ScoreRow({ s, preview }: { s: AdminScoreRow; preview: boolean }) {
  const instrument = isKey(SCORE_INSTRUMENTS, s.instrument) ? SCORE_INSTRUMENTS[s.instrument] : s.instrument;
  const difficulty = s.difficulty && isKey(DIFFICULTIES, s.difficulty) ? DIFFICULTIES[s.difficulty] : null;
  return (
    <li className="card flex gap-3 p-3.5 sm:p-4" data-testid="admin-score-row">
      <div className="flex aspect-[3/4] w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-stone sm:w-14">
        {s.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 주소
          <img src={s.thumbnailUrl} alt="" loading="lazy" decoding="async" className="size-full bg-white object-cover object-top" />
        ) : (
          <FileMusic aria-hidden className="size-5 text-ink-3" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-ink">{s.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
          <Badge>{instrument}</Badge>
          {difficulty && <Badge tone="outline">{difficulty}</Badge>}
          <span>
            <time dateTime={s.createdAt}>{formatDate(s.createdAt)}</time> · 다운로드 {formatCount(s.downloads)} · 조회 {formatCount(s.views)}
          </span>
          {s.thumbnailUrl ? (
            <span className="text-ink-2">미리보기 있음</span>
          ) : (
            <span className="inline-flex items-center gap-0.5">
              <ImageOff aria-hidden className="size-3" />
              미리보기 없음
            </span>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <ViewLink href={`/score/${s.instrument}/${s.slug}`} label={`${s.title} 공개 페이지 보기`} />
          <DeleteContentButton kind="score" id={s.id} title={s.title} preview={preview} />
        </div>
      </div>
    </li>
  );
}

function ArticleRow({ a, preview }: { a: AdminArticleRow; preview: boolean }) {
  const category = isKey(ARTICLE_CATEGORIES, a.category) ? ARTICLE_CATEGORIES[a.category] : a.category;
  return (
    <li className="card flex gap-3 p-3.5 sm:p-4" data-testid="admin-article-row">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-line bg-stone sm:size-14">
        <FileText aria-hidden className="size-5 text-ink-3" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-ink">{a.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
          <Badge>{category}</Badge>
          {a.isPublished ? <Badge tone="blue">발행</Badge> : <Badge tone="outline">초안</Badge>}
          <time dateTime={a.publishedAt ?? a.createdAt}>{formatDate(a.publishedAt ?? a.createdAt)}</time>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {a.isPublished ? (
            <ViewLink href={articlePath(a.category, a.slug)} label={`${a.title} 공개 페이지 보기`} />
          ) : (
            !preview && <PublishArticleButton id={a.id} title={a.title} back="/admin/content" />
          )}
          {!preview && <EditArticleLink id={a.id} />}
          <DeleteContentButton kind="article" id={a.id} title={a.title} preview={preview} />
        </div>
      </div>
    </li>
  );
}
