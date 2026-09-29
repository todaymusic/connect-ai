import { PostRow } from "@/components/cards/PostRow";
import { CategoryTabs, ChipFilter, EmptyState, FilterForm, FirstPostState, ListHeader, ListShell, Pagination, ResultCount } from "@/components/list/ListLayout";
import { listPosts } from "@/lib/data/posts";
import { COMMUNITY_CATEGORIES, QNA_SUBJECTS, type CommunityCategory } from "@/lib/site";
import { first, pageParam, pick, type Query, type SearchParams } from "@/lib/url";

const DESCRIPTIONS: Record<CommunityCategory | "all", string> = {
  all: "자유·익명·Q&A·연주 자랑·음악창업 이야기를 나눠요.",
  free: "음악하는 사람들의 자유로운 이야기.",
  anon: "작성자가 드러나지 않는 익명 게시판이에요.",
  qna: "과목별 질문과 답변. 질문자가 답변을 채택할 수 있어요.",
  showcase: "연주 영상을 올리고 피드백을 받아요.",
  startup: "학원·연습실 등 음악 창업 고민과 경험을 나눠요.",
};

export async function CommunityListPage({ category, searchParams }: { category?: CommunityCategory; searchParams: SearchParams }) {
  const pathname = category ? `/community/${category}` : "/community";
  const isQna = category === "qna";
  const subject = isQna ? pick(searchParams.subject, QNA_SUBJECTS) : undefined;
  const status = isQna ? pick(searchParams.status, ["open"] as const) : undefined;
  const sort = pick(searchParams.sort, ["popular"] as const);
  const q = first(searchParams.q);
  const page = pageParam(searchParams.page);
  const query: Query = { subject, status, sort, q, page: page > 1 ? String(page) : undefined };
  const result = await listPosts({ category, subject, unanswered: status === "open", sort: sort ?? "latest", q, page, pageSize: 15 });
  // 이 게시판에 글이 하나도 없으면 필터 대신 첫 글 쓰기 안내
  const empty = result.total === 0 && (await listPosts({ category, pageSize: 1 })).total === 0;

  return (
    <ListShell>
      <ListHeader
        eyebrow="Community"
        title={category ? COMMUNITY_CATEGORIES[category] : "커뮤니티"}
        description={DESCRIPTIONS[category ?? "all"]}
        writeHref={`/write/community${category ? `?category=${category}` : ""}`}
        writeLabel={isQna ? "질문하기" : "글쓰기"}
      />
      <CategoryTabs
        label="게시판"
        current={category ?? "all"}
        items={[
          { key: "all", href: "/community", label: "전체" },
          ...(Object.keys(COMMUNITY_CATEGORIES) as CommunityCategory[]).map((k) => ({ key: k, href: `/community/${k}`, label: COMMUNITY_CATEGORIES[k] })),
        ]}
      />
      {empty ? (
        <div className="mt-6">
          <FirstPostState href={`/write/community${category ? `?category=${category}` : ""}`} />
        </div>
      ) : (
      <>
      <div className="mt-5 space-y-3 rounded-2xl border border-line bg-card p-3 sm:p-4">
        <FilterForm pathname={pathname} query={query} placeholder="제목·태그로 찾기" keep={["subject", "status", "sort"]} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {isQna ? (
            <ChipFilter
              label="과목"
              param="subject"
              current={subject}
              pathname={pathname}
              query={query}
              options={Object.entries(QNA_SUBJECTS).map(([value, label]) => ({ value, label }))}
            />
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-2">
            {isQna && (
              <ChipFilter label="답변" param="status" current={status} pathname={pathname} query={query} allLabel="전체" options={[{ value: "open", label: "답변 대기" }]} />
            )}
            <ChipFilter label="정렬" param="sort" current={sort} pathname={pathname} query={query} allLabel="최신순" options={[{ value: "popular", label: "인기순" }]} />
          </div>
        </div>
      </div>
      <div className="mt-6">
        <ResultCount total={result.total} query={q} />
      </div>
      {result.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="아직 글이 없어요">첫 글을 남겨 보세요.</EmptyState>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {result.items.map((p) => (
            <li key={p.id}>
              <PostRow post={p} showCategory={!category} />
            </li>
          ))}
        </ul>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} pathname={pathname} query={query} />
      </>
      )}
    </ListShell>
  );
}
