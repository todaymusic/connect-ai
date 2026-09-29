import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { MARKET_ICON, MarketCard } from "@/components/cards/MarketCard";
import { CategoryTabs, ComingSoonState, ListHeader, ListShell } from "@/components/list/ListLayout";
import { closedReason } from "@/lib/write/config";
import { SectionHeader } from "@/components/ui";
import { listArticles } from "@/lib/data/articles";
import { listMarketItems } from "@/lib/data/market";
import { ARTICLE_CATEGORIES, GEAR_ARTICLE_CATEGORIES, MARKET_CATEGORIES, TRADE_TYPES, type GearArticleCategory, type MarketCategory } from "@/lib/site";

export const metadata: Metadata = {
  title: "악기 — 중고 장터·장비 정보",
  description: "악기·장비 중고 거래(판매·구매·나눔)와 이펙터·오디오인터페이스·마이크·악기 추천 정보.",
  alternates: { canonical: "/gear" },
};

export const revalidate = 300;

const GEAR_KEYS = Object.keys(GEAR_ARTICLE_CATEGORIES) as GearArticleCategory[];

export default async function GearPage() {
  const [market, guides] = await Promise.all([
    listMarketItems({ pageSize: 8 }),
    listArticles({ categories: GEAR_KEYS, pageSize: 3 }),
  ]);
  // 매물이 하나도 없으면 거래 바로가기를 숨기고 장터 자리에 준비 중 안내
  const marketOpen = market.total > 0;
  const closed = closedReason("market");
  const guideSection = (
    <section aria-labelledby="guide-title" className={marketOpen ? "mt-12" : "mt-8"}>
      <SectionHeader id="guide-title" title="장비·악기 정보" description="고르기 전에 읽어보면 좋은 글" href="/gear/equipment" />
      <ul className="grid gap-3 md:grid-cols-3">
        {guides.items.map((a) => (
          <li key={a.id}>
            <ArticleCard article={a} />
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <ListShell>
      <ListHeader
        eyebrow="Gear"
        title="악기"
        description={
          marketOpen
            ? "필요한 악기는 중고로 구하고, 고르기 전엔 장비·악기 정보를 읽어보세요."
            : "악기·장비를 고르기 전에 읽어보면 좋은 정보를 모았어요. 중고 장터는 준비 중이에요."
        }
        writeHref={closed ? undefined : "/write/market"}
        writeLabel="판매글 쓰기"
      />
      <CategoryTabs
        label="악기 메뉴"
        current="all"
        items={[
          { key: "all", href: "/gear", label: "전체" },
          { key: "market", href: "/gear/market", label: "중고 장터" },
          ...GEAR_KEYS.map((k) => ({ key: k, href: `/gear/${k}`, label: ARTICLE_CATEGORIES[k] })),
        ]}
      />

      {!marketOpen && guideSection}

      {marketOpen ? (
      <>
      {/* 거래 방식·종류 바로가기 */}
      <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
        {(Object.keys(TRADE_TYPES) as (keyof typeof TRADE_TYPES)[]).map((t) => (
          <Link key={t} href={`/gear/market?trade=${t}`} className="card card-hover flex items-center justify-between px-4 py-3.5">
            <span>
              <span className="block text-base font-bold text-ink">{TRADE_TYPES[t]}</span>
              <span className="block text-xs text-ink-3">
                {t === "sell" ? "쓰던 악기를 팔아요" : t === "buy" ? "찾는 악기를 구해요" : "필요한 분께 무료로"}
              </span>
            </span>
            <ArrowRight aria-hidden className="size-4 text-ink-3" />
          </Link>
        ))}
      </div>
      <ul className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {(Object.keys(MARKET_CATEGORIES) as MarketCategory[]).map((c) => {
          const Icon = MARKET_ICON[c];
          return (
            <li key={c} className="shrink-0">
              <Link href={`/gear/market?category=${c}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink-2 hover:border-line-2 hover:text-ink">
                <Icon aria-hidden className="size-4" />
                {MARKET_CATEGORIES[c]}
              </Link>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="market-title" className="mt-10">
        <SectionHeader id="market-title" title="중고 장터 최신 매물" description="직거래 중심 · 안전결제는 아직 지원하지 않아요." href="/gear/market" />
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
          {market.items.map((m) => (
            <li key={m.id}>
              <MarketCard item={m} />
            </li>
          ))}
        </ul>
      </section>

      {guideSection}
      </>
      ) : (
        <section aria-labelledby="market-title" className="mt-12">
          <SectionHeader id="market-title" title="중고 장터" href="/gear/market" />
          {closed ? (
            <ComingSoonState title="중고 장터는 준비 중이에요">안전한 거래 기능을 갖춘 뒤 열 예정이에요.</ComingSoonState>
          ) : (
            <ComingSoonState title="아직 올라온 매물이 없어요" action={{ href: "/write/market", label: "첫 매물 올리기" }}>
              판매·구매·나눔 글을 올릴 수 있어요.
            </ComingSoonState>
          )}
        </section>
      )}
    </ListShell>
  );
}
