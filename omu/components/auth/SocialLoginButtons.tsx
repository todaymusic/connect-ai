"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { SocialProviderConfig, SocialProviderKey } from "@/lib/auth-providers";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// 각 서비스 로그인 버튼 디자인 가이드 색상 (카카오 #FEE500 / 네이버 #03C75A)
const STYLES: Record<SocialProviderKey, string> = {
  kakao: "bg-[#FEE500] text-black/85 hover:brightness-[0.97]",
  google: "border border-line-2 bg-white text-black/85 hover:bg-stone",
  naver: "bg-[#03C75A] text-white hover:brightness-[0.97]",
};

function GoogleSymbol() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function KakaoSymbol() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path
        fill="currentColor"
        d="M12 3.5c-5.24 0-9.5 3.3-9.5 7.37 0 2.62 1.76 4.92 4.4 6.23l-.9 3.3c-.08.3.26.54.52.37l3.93-2.6c.5.06 1.02.1 1.55.1 5.24 0 9.5-3.3 9.5-7.37S17.24 3.5 12 3.5Z"
      />
    </svg>
  );
}

function NaverSymbol() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4">
      <path fill="currentColor" d="M15.56 12.84 8.2 2.25H2.25v19.5h6.19V11.16l7.36 10.59h5.95V2.25h-6.19v10.59Z" />
    </svg>
  );
}

type Props = {
  providers: SocialProviderConfig[];
  /** 로그인 후 돌아갈 경로 (서버에서 safeNextPath 로 검증된 값) */
  next: string;
  /** Supabase 환경변수 연결 여부 */
  configured: boolean;
};

export function SocialLoginButtons({ providers, next, configured }: Props) {
  const [pending, setPending] = useState<SocialProviderKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(p: SocialProviderConfig) {
    if (!p.provider) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("아직 로그인 서버가 연결되지 않았어요.");
      return;
    }
    setError(null);
    setPending(p.key);

    const redirectTo = new URL("/auth/callback", window.location.origin);
    if (next !== "/") redirectTo.searchParams.set("next", next);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: p.provider,
      options: { redirectTo: redirectTo.toString() },
    });
    // 성공하면 브라우저가 소셜 로그인 화면으로 이동한다. 여기로 돌아오면 실패.
    if (oauthError) {
      setPending(null);
      setError("로그인 화면을 열지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <div>
      <ul className="space-y-2.5">
        {providers.map((p) => {
          const available = configured && p.provider !== null;
          const busy = pending === p.key;
          return (
            <li key={p.key}>
              <button
                type="button"
                onClick={() => signIn(p)}
                disabled={!available || pending !== null}
                aria-describedby={!available ? `${p.key}-pending` : undefined}
                className={`relative flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition disabled:cursor-not-allowed ${
                  available ? STYLES[p.key] : "border border-line-2 bg-stone text-ink-3"
                } ${available && pending !== null && !busy ? "opacity-60" : ""}`}
              >
                <span className="absolute left-4 flex items-center">
                  {busy ? (
                    <Loader2 aria-hidden className="size-5 animate-spin" />
                  ) : p.key === "kakao" ? (
                    <KakaoSymbol />
                  ) : p.key === "google" ? (
                    <GoogleSymbol />
                  ) : (
                    <NaverSymbol />
                  )}
                </span>
                {available ? p.label : p.pendingLabel}
              </button>
              {!available && (
                <p id={`${p.key}-pending`} className="sr-only">
                  {p.pendingLabel}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {!configured && (
        <p className="mt-3 rounded-xl bg-stone px-3.5 py-2.5 text-xs leading-relaxed text-ink-2">
          지금은 미리보기 환경이라 로그인 서버가 연결되어 있지 않아요. 연결되면 버튼이 바로 활성화돼요.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-coral-soft/50 px-3.5 py-2.5 text-sm text-coral-deep">
          {error}
        </p>
      )}
    </div>
  );
}
