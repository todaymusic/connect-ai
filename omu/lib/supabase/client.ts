"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./config";

let browserClient: SupabaseClient | null = null;

/**
 * 브라우저용 Supabase 클라이언트 (싱글턴).
 * 환경변수가 없으면 null — 호출하는 쪽에서 '연결 전' 상태를 안전하게 처리한다.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(env.url, env.anonKey);
  }
  return browserClient;
}
