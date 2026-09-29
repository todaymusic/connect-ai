import { isAuthPKCECodeVerifierMissingError, type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth-providers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** 이메일 템플릿을 token_hash 방식으로 바꿨을 때 받을 수 있는 type 값 */
const EMAIL_OTP_TYPES: EmailOtpType[] = ["email", "magiclink", "signup", "invite", "email_change"];

/**
 * 로그인 콜백 (카카오·네이버 OAuth + 이메일 로그인 링크 공통)
 *  - OAuth·이메일 링크(기본 템플릿): Supabase → 여기(/auth/callback?code=…&next=…)
 *    PKCE code 를 세션으로 교환해 쿠키에 저장한 뒤 next 경로로 보낸다.
 *    (code_verifier 는 로그인을 시작한 브라우저의 쿠키에 있으므로 같은 브라우저에서 열어야 한다)
 *  - 이메일 링크(선택: 템플릿을 token_hash 방식으로 바꾼 경우): ?token_hash=…&type=email
 *    verifyOtp 로 바로 세션을 만든다. 다른 기기·브라우저에서 열어도 된다. (docs/AUTH.md)
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

  // 사용자가 동의 화면에서 취소했거나, 이메일 링크가 만료·재사용됐거나, Provider 가 오류를 돌려준 경우
  const providerError = searchParams.get("error");
  if (providerError) {
    if (searchParams.get("error_code") === "otp_expired") return toLogin("link_expired");
    return toLogin(providerError === "access_denied" ? "access_denied" : "exchange_failed");
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") as EmailOtpType | null;
  if (!code && !(tokenHash && otpType && EMAIL_OTP_TYPES.includes(otpType))) return toLogin("missing_code");

  const supabase = await getSupabaseServerClient();
  if (!supabase) return toLogin("unconfigured");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return toLogin(isAuthPKCECodeVerifierMissingError(error) ? "other_browser" : "exchange_failed");
  } else {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: otpType! });
    if (error) return toLogin("link_expired");
  }

  return NextResponse.redirect(new URL(next, origin));
}
