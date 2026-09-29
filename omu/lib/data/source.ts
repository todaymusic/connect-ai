import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../supabase/config";
import { getSupabasePublicClient } from "../supabase/public";

export type DataSource = "demo" | "supabase";

/**
 * 데이터 출처 결정
 *  - Supabase 환경변수가 없으면 demo (목데이터)
 *  - 있으면 supabase. 단 OMU_DATA_SOURCE=demo 로 강제로 데모를 볼 수 있다(디자인 확인용)
 */
export function getDataSource(): DataSource {
  if (process.env.OMU_DATA_SOURCE === "demo") return "demo";
  return isSupabaseConfigured() ? "supabase" : "demo";
}

/** supabase 모드일 때만 클라이언트를 돌려준다 */
export function publicDb(): SupabaseClient | null {
  return getDataSource() === "supabase" ? getSupabasePublicClient() : null;
}
