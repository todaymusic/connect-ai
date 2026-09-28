// 소셜 로그인 Provider 설정 (서버·클라이언트 공용)
import type { Provider } from "@supabase/supabase-js";

export type SocialProviderKey = "kakao" | "naver";

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
  const naverId = process.env.NEXT_PUBLIC_NAVER_PROVIDER_ID?.trim() ?? "";
  const naverProvider: Provider | null = isCustomProviderId(naverId) ? naverId : null;

  return [
    {
      key: "kakao",
      label: "카카오로 계속하기",
      provider: kakaoEnabled ? "kakao" : null,
      pendingLabel: "카카오 로그인 준비 중",
    },
    {
      key: "naver",
      label: "네이버로 계속하기",
      provider: naverProvider,
      pendingLabel: "네이버 로그인 준비 중",
    },
  ];
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

/** OAuth 콜백 오류 코드 → 사용자 안내 문구 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "로그인을 취소했어요. 다시 시도해 주세요.",
  missing_code: "로그인 정보를 받지 못했어요. 다시 시도해 주세요.",
  exchange_failed: "로그인 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
  unconfigured: "아직 로그인 서버가 연결되지 않았어요.",
  provider_disabled: "이 로그인 방식은 아직 준비 중이에요.",
};
