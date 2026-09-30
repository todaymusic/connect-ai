"use client";

import { useSyncExternalStore } from "react";
import type { Role } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_ROLE_COOKIE } from "@/lib/write/config";
import { useCurrentUser } from "./useCurrentUser";

const noop = () => () => {};

/** 데모 모드: 글쓰기 화면에서 고른 데모 역할 (쿠키). 권한이 아니라 화면 확인용이다 */
function readDemoRole(): Role | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${DEMO_ROLE_COOKIE}=([^;]*)`));
  const v = m?.[1];
  return v === "user" || v === "editor" || v === "admin" ? v : null;
}

/**
 * 지금 보는 사람의 역할 (브라우저에서 확인) — 비로그인·확인 전이면 null.
 * ISR 로 캐시되는 공개 페이지에서 사용자별 버튼을 그릴 때 쓴다(서버에서 분기하면 캐시가 사용자마다 갈라지거나 새어 나간다).
 *  - Supabase 연결: 로그인 세션 + profiles.role (useCurrentUser)
 *  - 데모 모드: 글쓰기 화면의 데모 역할 쿠키
 * 버튼을 보여 줄지 정하는 화면 편의일 뿐이고, 실제 권한은 글쓰기 서버 액션과 DB RLS 가 판정한다.
 */
export function useViewerRole(): Role | null {
  const user = useCurrentUser();
  const demoRole = useSyncExternalStore(noop, () => (isSupabaseConfigured() ? null : readDemoRole()), () => null);
  return isSupabaseConfigured() ? (user?.role ?? null) : demoRole;
}
