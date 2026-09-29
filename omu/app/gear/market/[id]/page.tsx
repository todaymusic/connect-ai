import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle, ShieldAlert } from "lucide-react";
import { MARKET_ICON, MarketPrice, MarketStatusBadge } from "@/components/cards/MarketCard";
import { AuthorLabel } from "@/components/detail/AuthorLabel";
import { Breadcrumbs, CommentsSection, DetailShell, InfoList, JsonLd, ReportButton, SimpleMarkdown, TwoColumn } from "@/components/detail/DetailParts";
import { Badge } from "@/components/ui";
import { getMarketItem, listMarketItems } from "@/lib/data/market";
import { listComments } from "@/lib/data/posts";
import { formatCount, formatDateTime, formatPrice } from "@/lib/format";
import { ITEM_CONDITIONS, MARKET_CATEGORIES, MARKET_STATUS, TRADE_TYPES, siteUrl } from "@/lib/site";

export const revalidate = 120;

export async function generateStaticParams() {
  const { items } = await listMarketItems({ pageSize: 200 });
  return items.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/gear/market/[id]">): Promise<Metadata> {
  const { id } = await params;
  const m = await getMarketItem(id);
  if (!m) return { title: "매물을 찾을 수 없어요", robots: { index: false } };
  const price = m.tradeType === "share" ? "무료 나눔" : formatPrice(m.price);
  const description = `${TRADE_TYPES[m.tradeType]} · ${MARKET_CATEGORIES[m.category]} · ${m.region} · ${price}. ${m.description.split("\n")[0].slice(0, 90)}`;
  return {
    title: `${m.title} — 중고 장터`,
    description,
    alternates: { canonical: `/gear/market/${m.id}` },
    // 거래가 끝난 매물은 검색에 남기지 않는다
    robots: m.status === "sold" ? { index: false, follow: true } : undefined,
    openGraph: { title: m.title, description },
  };
}

const SAFETY_TIPS = [
  "가능하면 사람이 많은 곳에서 직접 만나 물건을 확인한 뒤 거래하세요.",
  "물건을 보기 전에 선입금·계약금을 요구하면 거래를 멈추세요.",
  "악기는 소리·넥·전원·단자 상태를 그 자리에서 꼭 시험해 보세요.",
  "OMU 는 아직 안전결제(에스크로)를 지원하지 않아요. 거래는 당사자 간 책임으로 이뤄져요.",
];

export default async function MarketDetailPage({ params }: PageProps<"/gear/market/[id]">) {
  const { id } = await params;
  const m = await getMarketItem(id);
  if (!m) notFound();
  const comments = await listComments("market", m.id);
  const Icon = MARKET_ICON[m.category];
  const url = `${siteUrl()}/gear/market/${m.id}`;

  return (
    <DetailShell>
      {m.tradeType !== "buy" && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: m.title,
            description: m.description,
            category: MARKET_CATEGORIES[m.category],
            url,
            offers: {
              "@type": "Offer",
              price: m.tradeType === "share" ? 0 : m.price,
              priceCurrency: "KRW",
              availability: m.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
              itemCondition: m.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
              areaServed: m.region,
              url,
            },
          }}
        />
      )}
      <Breadcrumbs
        items={[
          { href: "/", label: "홈" },
          { href: "/gear", label: "악기" },
          { href: "/gear/market", label: "중고 장터" },
          { href: `/gear/market/${m.id}`, label: m.title },
        ]}
      />

      <TwoColumn
        main={
          <>
            {/* 사진 갤러리 — 사진이 없으면 종류 아이콘 자리표시 */}
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-stone">
              <Icon aria-hidden className="size-20 text-ink/15" strokeWidth={1.2} />
              <span className="absolute bottom-3 right-3 rounded-full bg-card/85 px-2.5 py-1 text-xs text-ink-2">
                {m.imageUrls.length > 0 ? `사진 ${m.imageUrls.length}장` : "등록된 사진 없음"}
              </span>
            </div>

            <header className="mt-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <MarketStatusBadge item={m} />
                <Badge tone="neutral">{TRADE_TYPES[m.tradeType]}</Badge>
                <Badge tone="outline">{MARKET_CATEGORIES[m.category]}</Badge>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">{m.title}</h1>
              <p className="font-display mt-2 text-2xl font-bold text-ink">
                <MarketPrice item={m} />
              </p>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
                <span>{m.region}</span>
                <time dateTime={m.createdAt}>{formatDateTime(m.createdAt)}</time>
                <span>조회 {formatCount(m.views)}</span>
              </p>
            </header>
            <div className="mt-6 border-t border-line pt-6">
              <SimpleMarkdown text={m.description} />
            </div>
            <CommentsSection title="문의" threads={comments} count={m.commentCount} />
          </>
        }
        aside={
          <>
            <InfoList
              rows={[
                { label: "거래 방식", value: `${TRADE_TYPES[m.tradeType]} · 직거래` },
                { label: m.tradeType === "buy" ? "희망 가격" : "가격", value: <MarketPrice item={m} /> },
                { label: "지역", value: m.region },
                { label: "거래 상태", value: MARKET_STATUS[m.status] },
                { label: "물건 상태", value: m.condition ? ITEM_CONDITIONS[m.condition] : "—" },
                { label: m.tradeType === "buy" ? "구하는 사람" : "판매자", value: <AuthorLabel author={m.seller} /> },
              ]}
            />
            <div className="card p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <MessageCircle aria-hidden className="size-4" />
                연락 안내
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{m.contact ?? "판매자가 따로 적은 연락 안내가 없어요. 아래 문의 댓글을 이용해 주세요."}</p>
              <button
                type="button"
                disabled
                className="mt-3 h-10 w-full cursor-not-allowed rounded-full bg-stone text-sm font-bold text-ink-3"
              >
                1:1 채팅 (준비 중)
              </button>
            </div>
            <div className="rounded-2xl border border-coral-soft bg-coral-soft/25 p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <ShieldAlert aria-hidden className="size-4 text-coral-deep" />
                안전 거래 안내
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-2">
                {SAFETY_TIPS.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
              <Link href="/terms#market" className="mt-2 inline-block text-xs font-semibold text-blue hover:underline">
                중고거래 이용 규칙 보기
              </Link>
            </div>
            <div className="flex justify-end">
              <ReportButton />
            </div>
          </>
        }
      />
    </DetailShell>
  );
}
