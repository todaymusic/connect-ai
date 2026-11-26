// 소셜 로그인 Provider 설정 (서버·클라이언트 공용)
import type { Provider } from "@supabase/supabase-js";

export type SocialProviderKey = "kakao" | "google" | "naver";

export type SocialProviderConfig = {
  key: SocialProviderKey;
  label: string;
  /** Supabase signInWithOAuth 에 넘길 provider 값. null 이면 아직 연결 안 됨(준비 중) */
  provider: Provider | null;
  /** 준비 중일 때 버튼에 표시할 안내 */
  pendingLabel: string;
};

/**
 * - 카카오: Supabase 내장 Provider('kakao') — 대시보드에서 켜기만 하면 동작.
 * - 네이버: Supabase 내장 Provider 목록에 없음(@supabase/auth-js Provider 타입 기준).
 *   Supabase '커스텀 OAuth2 Provider'(identifier 가 custom: 로 시작)로 등록한 뒤
 *   NEXT_PUBLIC_NAVER_PROVIDER_ID=custom:naver 처럼 식별자를 넣어야 켜진다.
 *   값이 없거나 형식이 틀리면 버튼은 '네이버 로그인 준비 중' 으로 비활성화된다.
 *   자세한 연결 방법: docs/AUTH.md
 */
export function getSocialProviders(): SocialProviderConfig[] {
  const kakaoEnabled = process.env.NEXT_PUBLIC_AUTH_KAKAO_ENABLED !== "false";
  const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";
  const naverId = process.env.NEXT_PUBLIC_NAVER_PROVIDER_ID?.trim() ?? "";
  const naverProvider: Provider | null = isCustomProviderId(naverId) ? naverId : null;

  const providers: SocialProviderConfig[] = [
    {
      key: "kakao",
      label: "카카오로 계속하기",
      provider: kakaoEnabled ? "kakao" : null,
      pendingLabel: "카카오 로그인 준비 중",
    },
    {
      key: "google",
      label: "Google로 계속하기",
      // Supabase 에 구글 키를 넣은 뒤 NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true 로 켠다
      provider: googleEnabled ? "google" : null,
      pendingLabel: "Google 로그인 준비 중",
    },
    {
      key: "naver",
      label: "네이버로 계속하기",
      provider: naverProvider,
      pendingLabel: "네이버 로그인 준비 중",
    },
  ];
  // 구글·네이버는 실제로 연결된 경우에만 로그인 화면에 보인다(연결 전에는 '준비 중' 버튼도 숨김).
  // 관리자 화면의 연결 상태 표시는 이 필터 전 값이 아니라 provider 유무로 판단하므로 영향 없음.
  return providers.filter((p) => p.key === "kakao" || p.provider !== null);
}

/**
 * 이메일 로그인 링크(비밀번호 없음) — 카카오 키가 없어도 관리자가 들어올 수 있게 둔다.
 * 기본 켜짐. 소셜 로그인만 쓰고 싶으면 NEXT_PUBLIC_AUTH_EMAIL_ENABLED=false (Redeploy 필요).
 * Supabase 환경변수가 없는 데모 모드에서는 화면에 나오지 않는다.
 */
export function isEmailLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED !== "false";
}

/** Supabase 커스텀 Provider 식별자 규칙: custom: 접두사 + 소문자·숫자·하이픈·콜론, 전체 2~50자 */
export function isCustomProviderId(value: string): value is `custom:${string}` {
  return /^custom:[a-z0-9:-]+$/.test(value) && value.length <= 50;
}

/** 로그인 후 돌아갈 경로 검증 — 외부 URL·프로토콜 상대 경로(//evil.com) 차단 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** 로그인 콜백 오류 코드 → 사용자 안내 문구 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "로그인을 취소했어요. 다시 시도해 주세요.",
  missing_code: "로그인 정보를 받지 못했어요. 다시 시도해 주세요.",
  exchange_failed: "로그인 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
  unconfigured: "아직 로그인 서버가 연결되지 않았어요.",
  provider_disabled: "이 로그인 방식은 아직 준비 중이에요.",
  link_expired: "로그인 링크가 만료됐거나 이미 사용됐어요. 이메일로 링크를 다시 받아 주세요.",
  other_browser: "로그인 링크는 요청한 브라우저에서 열어야 해요. 이 브라우저에서 이메일을 다시 입력해 링크를 받아 주세요.",
};
