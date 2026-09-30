import { ArticleCard } from "@/components/cards/ArticleCard";
import { CategoryTabs, EmptyState, FilterForm, ListHeader, ListShell, Pagination, ResultCount } from "@/components/list/ListLayout";
import { listArticles } from "@/lib/data/articles";
import { ARTICLE_CATEGORIES, GEAR_ARTICLE_CATEGORIES, INFO_CATEGORIES, type ArticleCategory } from "@/lib/site";
import { first, pageParam, type Query, type SearchParams } from "@/lib/url";
import { RoleWriteLink } from "@/components/auth/RoleWriteLink";

type Section = "info" | "gear";

const SECTION = {
  info: {
    base: "/info",
    title: "음악정보",
    eyebrow: "Music Info",
    description: "악기 입문, 입시, 공연·공모전, 연습실 정보와 뮤직스토리를 모았어요.",
    cats: INFO_CATEGORIES as Record<string, string>,
  },
  gear: {
    base: "/gear",
    title: "악기·장비 정보",
    eyebrow: "Gear Guide",
    description: "오디오 인터페이스·마이크·악기를 고를 때 따져볼 기준을 모았어요.",
    cats: GEAR_ARTICLE_CATEGORIES as Record<string, string>,
  },
} as const;

export async function ArticleList({
  section,
  category,
  searchParams,
}: {
  section: Section;
  category?: ArticleCategory;
  searchParams: SearchParams;
}) {
  const cfg = SECTION[section];
  const keys = Object.keys(cfg.cats) as ArticleCategory[];
  const pathname = category ? `${cfg.base}/${category}` : cfg.base;
  const q = first(searchParams.q);
  const page = pageParam(searchParams.page);
  const query: Query = { q, page: page > 1 ? String(page) : undefined };
  const result = await listArticles({ category, categories: keys, q, page, pageSize: 9 });

  const tabs =
    section === "info"
      ? [{ key: "all", href: "/info", label: "전체" }, ...keys.map((k) => ({ key: k, href: `/info/${k}`, label: ARTICLE_CATEGORIES[k] }))]
      : [
          { key: "market", href: "/gear/market", label: "중고 장터" },
          ...keys.map((k) => ({ key: k, href: `/gear/${k}`, label: ARTICLE_CATEGORIES[k] })),
        ];

  return (
    <ListShell>
      <ListHeader
        eyebrow={cfg.eyebrow}
        title={category ? ARTICLE_CATEGORIES[category] : cfg.title}
        description={cfg.description}
        // 정보글은 로그인한 회원 누구나 쓸 수 있어서, 로그인한 사람에게만 보인다(비로그인은 버튼 없음)
        actions={<RoleWriteLink type="article" href={`/write/article${category ? `?category=${category}` : ""}`} label="정보글 쓰기" />}
      />
      <CategoryTabs label="분류" current={category ?? "all"} items={tabs} />
      <div className="mt-5 rounded-2xl border border-line bg-card p-3 sm:p-4">
        <FilterForm pathname={pathname} query={query} placeholder="제목·키워드로 찾기" />
      </div>
      <div className="mt-6">
        <ResultCount total={result.total} query={q} />
      </div>
      {result.items.length === 0 ? (
        <div className="mt-4">
          {q ? (
            <EmptyState title="검색 결과가 없어요">다른 검색어로 찾아보거나 다른 분류도 둘러보세요.</EmptyState>
          ) : (
            <EmptyState title="아직 올라온 글이 없어요">다른 분류도 둘러보세요.</EmptyState>
          )}
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {result.items.map((a) => (
            <li key={a.id}>
              <ArticleCard article={a} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} pathname={pathname} query={query} />
    </ListShell>
  );
}
