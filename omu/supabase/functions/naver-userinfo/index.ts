// ─────────────────────────────────────────────────────────────────────────────
// 네이버 로그인용 userinfo 프록시 (Supabase Edge Function, Deno) — 미배포 초안
//
// 왜 필요한가
//   Supabase '커스텀 OAuth2 Provider' 는 로그인 후 userinfo_url 을 호출해
//   최상위 JSON 에서 sub / email / name / picture 같은 표준 필드를 읽는다.
//   그런데 네이버 프로필 API(https://openapi.naver.com/v1/nid/me)는
//   { resultcode, message, response: { id, email, nickname, ... } } 처럼 한 단계 중첩돼 있다.
//   이 함수는 네이버 응답을 표준(OIDC userinfo 형태) 필드로 펼쳐서 돌려준다.
//
// 배포 (docs/AUTH.md 참고)
//   supabase functions deploy naver-userinfo --no-verify-jwt
//   → Supabase 커스텀 Provider 의 UserInfo URL 에
//     https://<project-ref>.supabase.co/functions/v1/naver-userinfo 입력
//
// 보안 메모
//   - 비밀값을 쓰지 않는다. 호출자가 보낸 네이버 access token 을 네이버에 그대로 전달할 뿐이다.
//   - Supabase Auth 서버가 네이버 토큰으로 호출하므로 Supabase JWT 검증은 끈다(--no-verify-jwt).
//   - email_verified 는 false 로 둔다. 네이버 이메일을 '검증된 이메일'로 신뢰하면
//     같은 이메일의 다른 계정과 자동 연결될 수 있어서, 보수적으로 연결하지 않도록 한다.
// ─────────────────────────────────────────────────────────────────────────────

const NAVER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me";

type NaverProfileResponse = {
  resultcode?: string;
  message?: string;
  response?: {
    id?: string;
    email?: string;
    name?: string;
    nickname?: string;
    profile_image?: string;
  };
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const authorization = req.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return json({ error: "invalid_token" }, 401);
  }

  let naver: NaverProfileResponse;
  try {
    const res = await fetch(NAVER_PROFILE_URL, { headers: { Authorization: authorization } });
    if (!res.ok) return json({ error: "naver_userinfo_failed" }, res.status === 401 ? 401 : 502);
    naver = (await res.json()) as NaverProfileResponse;
  } catch {
    return json({ error: "naver_unreachable" }, 502);
  }

  const profile = naver.response;
  if (naver.resultcode !== "00" || !profile?.id) {
    return json({ error: "naver_userinfo_failed" }, 401);
  }

  return json({
    sub: profile.id,
    email: profile.email ?? null,
    email_verified: false,
    name: profile.name ?? profile.nickname ?? null,
    nickname: profile.nickname ?? null,
    preferred_username: profile.nickname ?? null,
    picture: profile.profile_image ?? null,
  });
});
