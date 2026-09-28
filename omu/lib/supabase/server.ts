import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "./config";

/**
 * 서버(Server Component · Route Handler · Server Action)용 Supabase 클라이언트.
 * 요청마다 새로 만든다(세션 쿠키가 요청별로 다르기 때문).
 * 환경변수가 없으면 null.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  const env = getSupabasePublicEnv();
  if (!env) return null;

  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component 렌더링 중에는 쿠키를 쓸 수 없다.
          // 세션 갱신은 proxy.ts 가 담당하므로 여기서는 무시해도 된다.
        }
      },
    },
  });
}
