import type { MarketItem } from "../types";

// 공개 전 정리: 실제 거래 가능한 매물이 없으므로 비워 둔다(허위 매물 금지).
// 중고 장터는 '준비 중' — Supabase 연결 후 회원이 올린 매물만 보인다.
export const DEMO_MARKET: MarketItem[] = [];
