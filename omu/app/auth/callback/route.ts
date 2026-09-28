import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth-providers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth 콜백 (카카오·네이버 공통)
 * 흐름: 소셜 로그인 → Supabase(/auth/v1/callback) → 여기(/auth/callback?code=…&next=…)
 * PKCE code 를 세션으로 교환해 쿠키에 저장한 뒤 next 경로로 보낸다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));

  const toLogin = (code: string) => {
    const url = new URL("/login", origin);
    url.searchParams.set("error", code);
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  };

  // 사용자가 동의 화면에서 취소했거나 Provider 가 오류를 돌려준 경우
  const providerError = searchParams.get("error");
  if (providerError) {
    return toLogin(providerError === "access_denied" ? "access_denied" : "exchange_failed");
  }

  const code = searchParams.get("code");
  if (!code) return toLogin("missing_code");

  const supabase = await getSupabaseServerClient();
  if (!supabase) return toLogin("unconfigured");

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return toLogin("exchange_failed");

  return NextResponse.redirect(new URL(next, origin));
}
