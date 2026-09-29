import Link from "next/link";
import { Drum, Guitar, Headphones, MessageCircle, Music, Piano, Wind, type LucideIcon } from "lucide-react";
import type { MarketItem } from "@/lib/data/types";
import { formatPrice, formatRelative } from "@/lib/format";
import { MARKET_CATEGORIES, MARKET_STATUS, type MarketCategory } from "@/lib/site";
import { Badge } from "../ui";

export const MARKET_ICON: Record<MarketCategory, LucideIcon> = {
  guitar: Guitar,
  keyboard: Piano,
  drum: Drum,
  wind: Wind,
  equipment: Headphones,
  etc: Music,
};

export function MarketStatusBadge({ item }: { item: Pick<MarketItem, "tradeType" | "status"> }) {
  if (item.status === "sold") return <Badge tone="neutral">{MARKET_STATUS.sold}</Badge>;
  if (item.status === "reserved") return <Badge tone="coral">{MARKET_STATUS.reserved}</Badge>;
  if (item.tradeType === "share") return <Badge tone="blue">나눔</Badge>;
  if (item.tradeType === "buy") return <Badge tone="pro">구해요</Badge>;
  return (
    <Badge tone="outline" className="bg-card">
      {MARKET_STATUS.selling}
    </Badge>
  );
}

export function MarketPrice({ item }: { item: Pick<MarketItem, "tradeType" | "price"> }) {
  if (item.tradeType === "share") return <span className="text-blue">무료 나눔</span>;
  if (item.tradeType === "buy") return <span>희망 {formatPrice(item.price)}</span>;
  return <span>{formatPrice(item.price)}</span>;
}

export function MarketCard({ item: m, headingLevel = "h3" }: { item: MarketItem; headingLevel?: "h2" | "h3" }) {
  const Icon = MARKET_ICON[m.category];
  const H = headingLevel;
  const done = m.status === "sold";
  return (
    <Link href={`/gear/market/${m.id}`} className="card group flex h-full flex-col overflow-hidden">
      <div className="relative flex aspect-square items-center justify-center bg-stone">
        {m.imageUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 주소
          <img src={m.imageUrls[0]} alt="" loading="lazy" className={`absolute inset-0 size-full object-cover ${done ? "opacity-50" : ""}`} />
        ) : (
          <Icon aria-hidden className={`size-12 text-ink/20 transition-transform group-hover:scale-105 ${done ? "opacity-50" : ""}`} strokeWidth={1.4} />
        )}
        <span className="absolute left-2.5 top-2.5">
          <MarketStatusBadge item={m} />
        </span>
        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-card/85 px-2 py-0.5 text-[11px] font-semibold text-ink-2">
          {MARKET_CATEGORIES[m.category]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <H className={`line-clamp-2 text-sm font-semibold leading-snug group-hover:text-coral-deep ${done ? "text-ink-3" : "text-ink"}`}>
          {m.title}
        </H>
        <p className="font-display mt-1.5 text-base font-bold text-ink">
          <MarketPrice item={m} />
        </p>
        <p className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-ink-3">
          <span className="truncate">
            {m.region} · {formatRelative(m.createdAt)}
          </span>
          <span className="font-display inline-flex shrink-0 items-center gap-1">
            <MessageCircle aria-hidden className="size-3.5" />
            <span className="sr-only">댓글</span>
            {m.commentCount}
          </span>
        </p>
      </div>
    </Link>
  );
}
