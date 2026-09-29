import type { MarketItem } from "@/lib/data/types";
import { MarketCard } from "../cards/MarketCard";

export function MarketPreview({ items }: { items: MarketItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {items.map((m) => (
        <li key={m.id}>
          <MarketCard item={m} />
        </li>
      ))}
    </ul>
  );
}
