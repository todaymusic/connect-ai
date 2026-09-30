import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { CheckCircle2, ExternalLink, FileText, PenLine } from "lucide-react";
import { Badge } from "@/components/ui";
import { DeleteArticleButton, EditArticleLink, PublishArticleButton } from "@/components/write/ArticleActions";
import { formatDate } from "@/lib/format";
import { ARTICLE_CATEGORIES, articlePath, isKey } from "@/lib/site";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { first } from "@/lib/url";
import { getWriterState } from "@/lib/write/writer";

export const metadata: Metadata = {
  title: "내 정보글",
  robots: { index: false, follow: false },
};

type Row = { id: string; title: string; slug: string; category: string; is_published: boolean; created_at: string; published_at: string | null };

const DONE: Record<string, string> = {
  draft: "임시저장했어요. 아래에서 ‘발행’을 누르면 바로 공개돼요.",
  published: "발행했어요. 이제 누구나 볼 수 있어요.",
  deleted: "정보글을 지웠어요.",
};

/** /my/articles — 내가 쓴 정보글(초안 포함): 발행·수정·삭제. 로그인 회원 전용, 요청 시점 렌더 */
export default async function MyArticlesPage({ searchParams }: PageProps<"/my/articles">) {
  await connection();
  const sp = await searchParams;
  const done = DONE[first(sp.done) ?? first(sp.saved) ?? ""] ?? null;
  const state = await getWriterState();

  let body: React.ReactNode;
  if (state.mode === "demo") {
    body = (
      <p className="mt-6 rounded-2xl bg-stone px-4 py-8 text-center text-sm leading-relaxed text-ink-2">
        데모 모드에서는 쓴 글이 서버에 저장되지 않아요. 이 브라우저에 보관된 데모 글은{" "}
        <Link href="/write" className="font-semibold text-ink underline underline-offset-2">
          작성 허브
        </Link>
        에서 볼 수 있어요.
      </p>
    );
  } else if (!state.writer) {
    body = (
      <div className="mt-6 rounded-2xl bg-stone px-4 py-8 text-center">
        <p className="text-sm text-ink-2">로그인하면 내가 쓴 정보글을 관리할 수 있어요.</p>
        <Link href="/login?next=/my/articles" className="mt-3 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-bold text-paper">
          로그인
        </Link>
      </div>
    );
  } else {
    const supabase = await getSupabaseServerClient();
    const { data, error } = supabase
      ? await supabase
          .from("articles")
          .select("id, title, slug, category, is_published, created_at, published_at")
          .eq("author_id", state.writer.id)
          .order("created_at", { ascending: false })
          .limit(100)
      : { data: null, error: { message: "연결 실패" } };
    const rows = (data ?? []) as Row[];
    body = error ? (
      <p className="mt-6 rounded-2xl bg-stone px-4 py-8 text-center text-sm text-ink-2">목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
    ) : rows.length === 0 ? (
      <p className="mt-6 rounded-2xl bg-stone px-4 py-8 text-center text-sm text-ink-2">아직 쓴 정보글이 없어요.</p>
    ) : (
      <ul className="mt-6 space-y-2.5">
        {rows.map((a) => (
          <li key={a.id} className="card flex gap-3 p-3.5 sm:p-4" data-testid="my-article-row">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-stone text-ink-3">
              <FileText aria-hidden className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink">{a.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
                <Badge>{isKey(ARTICLE_CATEGORIES, a.category) ? ARTICLE_CATEGORIES[a.category] : a.category}</Badge>
                {a.is_published ? <Badge tone="blue">발행</Badge> : <Badge tone="outline">임시저장</Badge>}
                <time dateTime={a.published_at ?? a.created_at}>{formatDate(a.published_at ?? a.created_at)}</time>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {a.is_published ? (
                  <Link
                    href={articlePath(a.category, a.slug)}
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-line-2 px-3 text-xs font-bold text-ink hover:border-ink-3"
                  >
                    <ExternalLink aria-hidden className="size-3.5" />
                    보기
                  </Link>
                ) : (
                  <PublishArticleButton id={a.id} title={a.title} back="/my/articles" />
                )}
                <EditArticleLink id={a.id} />
                <DeleteArticleButton id={a.id} title={a.title} back="/my/articles" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-coral-deep">My</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">내 정보글</h1>
          <p className="mt-1.5 text-sm text-ink-2">임시저장한 글은 나와 관리자만 볼 수 있어요. 발행하면 바로 공개되고, 발행한 글은 수정·삭제만 할 수 있어요.</p>
        </div>
        <Link href="/write/article" className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-coral px-4 text-sm font-bold text-white hover:bg-coral-deep">
          <PenLine aria-hidden className="size-4" />
          정보글 쓰기
        </Link>
      </div>
      {done && (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-blue-soft/50 px-4 py-3 text-sm font-semibold text-ink">
          <CheckCircle2 aria-hidden className="size-4 text-blue" />
          {done}
        </p>
      )}
      {body}
    </div>
  );
}
