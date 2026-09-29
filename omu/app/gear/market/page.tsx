import type { Metadata } from "next";
import { MarketCard } from "@/components/cards/MarketCard";
import { CategoryTabs, ChipFilter, ComingSoonState, EmptyState, FilterForm, ListHeader, ListShell, Pagination, ResultCount } from "@/components/list/ListLayout";
import { closedReason } from "@/lib/write/config";
import { listMarketItems } from "@/lib/data/market";
import { ARTICLE_CATEGORIES, GEAR_ARTICLE_CATEGORIES, MARKET_CATEGORIES, MARKET_STATUS, REGIONS, TRADE_TYPES, type GearArticleCategory } from "@/lib/site";
import { first, pageParam, pick, type Query } from "@/lib/url";

export const metadata: Metadata = {
  title: "중고 장터 — 악기·음향장비 직거래",
  description: "기타·건반·드럼·관악기·음향장비 중고 판매, 구매, 나눔. 지역별로 찾아보세요.",
  alternates: { canonical: "/gear/market" },
};

export default async function MarketListPage({ searchParams }: PageProps<"/gear/market">) {
  const sp = await searchParams;
  const pathname = "/gear/market";
  const trade = pick(sp.trade, TRADE_TYPES);
  const category = pick(sp.category, MARKET_CATEGORIES);
  const region = pick(sp.region, REGIONS);
  const status = pick(sp.status, MARKET_STATUS);
  const q = first(sp.q);
  const page = pageParam(sp.page);
  const query: Query = { trade, category, region, status, q, page: page > 1 ? String(page) : undefined };
  const result = await listMarketItems({ trade, category, region, status, q, page });
  // 매물이 하나도 없으면 '검색 결과 없음' 대신 준비 중 안내 (필터는 숨김)
  const empty = result.total === 0 && (await listMarketItems({ pageSize: 1 })).total === 0;
  const closed = closedReason("market");

  return (
    <ListShell>
      <ListHeader
        eyebrow="Used Market"
        title="중고 장터"
        description={empty ? "직거래 중심의 악기·장비 거래 게시판을 준비하고 있어요." : "직거래 중심의 악기·장비 거래. 판매·구매·나눔 글을 올릴 수 있어요."}
        writeHref={closed ? undefined : "/write/market"}
        writeLabel="판매글 쓰기"
      />
      <CategoryTabs
        label="악기 메뉴"
        current="market"
        items={[
          { key: "all", href: "/gear", label: "전체" },
          { key: "market", href: "/gear/market", label: "중고 장터" },
          ...(Object.keys(GEAR_ARTICLE_CATEGORIES) as GearArticleCategory[]).map((k) => ({ key: k, href: `/gear/${k}`, label: ARTICLE_CATEGORIES[k] })),
        ]}
      />
      {empty ? (
        <div className="mt-6">
          <ComingSoonState title="중고 장터는 준비 중이에요" action={{ href: "/gear", label: "장비·악기 정보 보기" }}>
            {closed ? "안전한 거래 기능을 갖춘 뒤 열 예정이에요." : "아직 올라온 매물이 없어요."} 그전까지는 장비·악기 정보글을 참고해 보세요.
          </ComingSoonState>
        </div>
      ) : (
      <>
      <div className="mt-5 space-y-3 rounded-2xl border border-line bg-card p-3 sm:p-4">
        <FilterForm
          pathname={pathname}
          query={query}
          placeholder="매물 이름으로 찾기"
          selects={[
            { name: "category", label: "종류", options: Object.entries(MARKET_CATEGORIES).map(([value, label]) => ({ value, label })) },
            { name: "region", label: "지역", options: REGIONS.map((r) => ({ value: r, label: r })) },
          ]}
          keep={["trade", "status"]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <ChipFilter
            label="거래"
            param="trade"
            current={trade}
            pathname={pathname}
            query={query}
            options={Object.entries(TRADE_TYPES).map(([value, label]) => ({ value, label }))}
          />
          <ChipFilter
            label="상태"
            param="status"
            current={status}
            pathname={pathname}
            query={query}
            options={Object.entries(MARKET_STATUS).map(([value, label]) => ({ value, label }))}
          />
        </div>
      </div>
      <div className="mt-6">
        <ResultCount total={result.total} query={q} />
      </div>
      {result.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="조건에 맞는 매물이 없어요">지역이나 종류를 바꿔 보세요. 찾는 게 없다면 ‘구매’ 글을 올려 보세요.</EmptyState>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
          {result.items.map((m) => (
            <li key={m.id}>
              <MarketCard item={m} headingLevel="h2" />
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
