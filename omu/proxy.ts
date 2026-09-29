import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/config";

/**
 * Supabase 세션 갱신 (Next.js 16: middleware → proxy).
 * 만료된 access token 을 요청마다 갱신해 쿠키에 다시 써 준다.
 * Supabase 환경변수가 없으면(데모 모드) 아무것도 하지 않는다.
 */
export async function proxy(request: NextRequest) {
  const env = getSupabasePublicEnv();
  if (!env) return NextResponse.next({ request });

  // 로그인 콜백 URL 이 Supabase Redirect URLs 에 없으면 Supabase 가 Site URL(/)로 code(또는 오류)를 보낸다.
  // 그대로 두면 로그인이 끝나지 않으므로 콜백으로 넘겨 세션을 만든다(OAuth·이메일 링크 공통).
  const q = request.nextUrl.searchParams;
  if (request.nextUrl.pathname === "/" && (q.has("code") || (q.has("error") && q.has("error_description")))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // 인증 쿠키를 쓰는 응답은 CDN 캐시 금지 (다른 사용자에게 세션이 새지 않도록)
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getUser() 가 토큰을 검증·갱신한다. 이 호출과 createServerClient 사이에 다른 로직을 넣지 말 것.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 정적 파일·이미지·폰트·파비콘·OAuth 콜백 제외 (콜백은 라우트 핸들러가 직접 세션을 만든다)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|logo.svg|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};
