"use client";

import { useEffect, useState } from "react";
import type { Role } from "@/lib/site";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type ClientUser = { id: string; nickname: string; role: Role; avatarUrl: string | null };

/**
 * 헤더용 현재 사용자 (클라이언트).
 * 페이지를 정적으로 유지하려고 서버가 아닌 브라우저에서 세션을 확인한다.
 * 첫 렌더는 항상 null(로그인 버튼) → 하이드레이션 불일치 없음.
 */
export function useCurrentUser(): ClientUser | null {
  const [user, setUser] = useState<ClientUser | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;

    async function load(userId: string | undefined, meta: Record<string, unknown> | undefined) {
      if (!supabase) return;
      if (!userId) {
        if (!cancelled) setUser(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, nickname, role, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      setUser({
        id: userId,
        nickname: profile?.nickname ?? (meta?.name as string | undefined) ?? "회원",
        role: (profile?.role as Role | undefined) ?? "user",
        avatarUrl: profile?.avatar_url ?? (meta?.avatar_url as string | undefined) ?? null,
      });
    }

    supabase.auth.getUser().then(({ data }) => load(data.user?.id, data.user?.user_metadata));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // 콜백 안에서 Supabase 호출을 await 하면 교착될 수 있어 다음 틱으로 미룬다
      setTimeout(() => load(session?.user.id, session?.user.user_metadata), 0);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return user;
}
