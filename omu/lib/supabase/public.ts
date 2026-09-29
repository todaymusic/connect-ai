import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./config";

let client: SupabaseClient | null = null;

/**
 * 공개 콘텐츠 조회 전용 클라이언트 (세션·쿠키 없음, anon 권한).
 * 쿠키를 읽지 않으므로 목록·상세 페이지를 캐시(ISR)할 수 있다.
 * 권한은 schema.sql 의 RLS(발행된 글·숨김 아닌 글만)가 결정한다.
 */
export function getSupabasePublicClient(): SupabaseClient | null {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  if (!client) {
    client = createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}
