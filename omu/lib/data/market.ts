import "server-only";

import type { MarketCategory, MarketStatus, TradeType } from "../site";
import { DEFAULT_PAGE_SIZE, PROFILE_COLS, byNewest, likePattern, matches, paginate, range, toAuthor, toPaged } from "./core";
import { DEMO_MARKET } from "./demo/market";
import { publicDb } from "./source";
import type { MarketItem, Paged } from "./types";

export type MarketFilter = {
  category?: MarketCategory;
  trade?: TradeType;
  region?: string;
  status?: MarketStatus;
  q?: string;
  page?: number;
  pageSize?: number;
};

const MARKET_COLS = `id, title, category, trade_type, price, status, item_condition, region, description, contact,
  image_urls, view_count, comment_count, created_at, seller:profiles!market_items_seller_id_fkey(${PROFILE_COLS})`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(r: any): MarketItem {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    tradeType: r.trade_type ?? (r.is_free_share ? "share" : "sell"),
    price: r.price ?? 0,
    status: r.status,
    condition: r.item_condition ?? null,
    region: r.region ?? "",
    description: r.description ?? "",
    contact: r.contact ?? null,
    imageUrls: r.image_urls ?? [],
    seller: toAuthor(r.seller),
    views: r.view_count ?? 0,
    commentCount: r.comment_count ?? 0,
    createdAt: r.created_at,
  };
}

export async function listMarketItems(f: MarketFilter = {}): Promise<Paged<MarketItem>> {
  const pageSize = f.pageSize ?? DEFAULT_PAGE_SIZE;
  const db = publicDb();
  if (db) {
    let q = db.from("market_items").select(MARKET_COLS, { count: "exact" });
    if (f.category) q = q.eq("category", f.category);
    if (f.trade) q = q.eq("trade_type", f.trade);
    if (f.region) q = q.eq("region", f.region);
    if (f.status) q = q.eq("status", f.status);
    if (f.q) q = q.ilike("title", likePattern(f.q));
    const [from, to] = range(f.page ?? 1, pageSize);
    const { data, count, error } = await q.order("created_at", { ascending: false }).range(from, to);
    if (error) throw new Error(`장터 목록을 불러오지 못했어요: ${error.message}`);
    return toPaged((data ?? []).map(mapItem), count ?? 0, f.page ?? 1, pageSize);
  }
  const items = DEMO_MARKET.filter(
    (m) =>
      (!f.category || m.category === f.category) &&
      (!f.trade || m.tradeType === f.trade) &&
      (!f.region || m.region === f.region) &&
      (!f.status || m.status === f.status) &&
      matches(f.q, m.title),
  ).sort(byNewest);
  return paginate(items, f.page, pageSize);
}

export async function getMarketItem(id: string): Promise<MarketItem | null> {
  const db = publicDb();
  if (db) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null; // uuid 가 아니면 조회하지 않는다
    const { data, error } = await db.from("market_items").select(MARKET_COLS).eq("id", id).maybeSingle();
    if (error) throw new Error(`매물을 불러오지 못했어요: ${error.message}`);
    return data ? mapItem(data) : null;
  }
  return DEMO_MARKET.find((m) => m.id === id) ?? null;
}
