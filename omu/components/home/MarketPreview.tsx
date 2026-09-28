import Link from "next/link";
import { Drum, Guitar, Headphones, MessageCircle, Music, Piano, Wind, type LucideIcon } from "lucide-react";
import type { MockMarketItem } from "@/lib/mock";
import { MARKET_CATEGORIES, MARKET_STATUS, type MarketCategory } from "@/lib/site";
import { Badge, formatPrice } from "../ui";

const CATEGORY_ICON: Record<MarketCategory, LucideIcon> = {
  guitar: Guitar,
  keyboard: Piano,
  drum: Drum,
  wind: Wind,
  equipment: Headphones,
  etc: Music,
};

function StatusBadge({ item }: { item: MockMarketItem }) {
  if (item.tradeType === "share") return <Badge tone="blue">나눔</Badge>;
  if (item.tradeType === "buy") return <Badge tone="pro">구해요</Badge>;
  if (item.status === "reserved") return <Badge tone="coral">{MARKET_STATUS.reserved}</Badge>;
  if (item.status === "sold") return <Badge tone="neutral">{MARKET_STATUS.sold}</Badge>;
  return <Badge tone="outline" className="bg-card">{MARKET_STATUS.selling}</Badge>;
}

function PriceLabel({ item }: { item: MockMarketItem }) {
  if (item.tradeType === "share") return <span className="text-blue">무료 나눔</span>;
  if (item.tradeType === "buy") return <span>희망 {formatPrice(item.price)}</span>;
  return <span>{formatPrice(item.price)}</span>;
}

export function MarketPreview({ items }: { items: MockMarketItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {items.map((m) => {
        const Icon = CATEGORY_ICON[m.category];
        return (
          <li key={m.id}>
            <Link href={`/gear/market/${m.id}`} className="card group flex h-full flex-col overflow-hidden">
              <div className="relative flex aspect-square items-center justify-center bg-stone">
                <Icon aria-hidden className="size-12 text-ink/20 transition-transform group-hover:scale-105" strokeWidth={1.4} />
                <span className="absolute left-2.5 top-2.5">
                  <StatusBadge item={m} />
                </span>
                <span className="absolute bottom-2.5 right-2.5 rounded-full bg-card/85 px-2 py-0.5 text-[11px] font-semibold text-ink-2">
                  {MARKET_CATEGORIES[m.category]}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-3.5">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-coral-deep">{m.title}</h3>
                <p className="font-display mt-1.5 text-base font-bold text-ink">
                  <PriceLabel item={m} />
                </p>
                <p className="mt-auto flex items-center justify-between pt-2 text-xs text-ink-3">
                  <span className="truncate">
                    {m.region} · {m.timeAgo}
                  </span>
                  <span className="font-display inline-flex shrink-0 items-center gap-1">
                    <MessageCircle aria-hidden className="size-3.5" />
                    {m.comments}
                  </span>
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
