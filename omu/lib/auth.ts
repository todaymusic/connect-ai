import "server-only";

import { cache } from "react";
import type { Role } from "./site";
import { getSupabaseServerClient } from "./supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  nickname: string;
  role: Role;
  avatarUrl: string | null;
  /** 로그인에 사용한 소셜 서비스 (kakao, custom:naver 등) */
  provider: string | null;
};

export type AuthState =
  | { status: "unconfigured" } // Supabase 환경변수 없음 (데모 모드)
  | { status: "signed-out" }
  | { status: "signed-in"; user: CurrentUser }
  | { status: "error"; message: string };

/**
 * 현재 사용자 확인 (서버 전용, 요청 단위 캐시).
 * profiles 는 schema.sql 의 컬럼 권한상 email 을 읽을 수 없으므로
 * 공개 컬럼(id, nickname, role, avatar_url)만 조회하고 email 은 auth 세션에서 가져온다.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { status: "unconfigured" };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    // 세션이 없을 때도 error 가 올 수 있으므로 로그아웃 상태로 취급
    return { status: "signed-out" };
  }
  const user = data.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, nickname, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { status: "error", message: "프로필을 불러오지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  const meta = user.user_metadata ?? {};
  return {
    status: "signed-in",
    user: {
      id: user.id,
      email: user.email ?? null,
      // 가입 트리거가 아직 프로필을 만들지 않았으면(스키마 미적용 등) 메타데이터로 대체
      // (이메일 로그인 계정은 메타데이터가 비어 있으므로 가입 트리거와 같은 규칙으로 이메일 앞부분을 쓴다)
      nickname: profile?.nickname ?? meta.nickname ?? meta.name ?? meta.full_name ?? (user.email?.split("@")[0] || "회원"),
      role: (profile?.role as Role | undefined) ?? "user",
      avatarUrl: profile?.avatar_url ?? meta.avatar_url ?? meta.picture ?? null,
      provider: (user.app_metadata?.provider as string | undefined) ?? null,
    },
  };
});

export function isAdmin(state: AuthState): boolean {
  return state.status === "signed-in" && state.user.role === "admin";
}
