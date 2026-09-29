"use client";

import { Loader2, MailCheck } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** 같은 주소로 다시 보내기까지 기다리는 시간 — Supabase 기본 제한(60초)과 같다 */
const RESEND_SECONDS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Supabase Auth 오류 → 안내 문구 */
function describeError(error: { status?: number; code?: string; message?: string }): string {
  const code = error.code ?? "";
  if (error.status === 429 || code.startsWith("over_")) {
    const wait = /after (\d+) seconds?/.exec(error.message ?? "")?.[1];
    return wait
      ? `보안을 위해 ${wait}초 뒤에 다시 보낼 수 있어요.`
      : "메일을 너무 자주 요청했어요. 잠시 후 다시 시도해 주세요.";
  }
  if (code === "email_address_invalid" || code === "validation_failed") return "이메일 주소를 다시 확인해 주세요.";
  if (code === "email_address_not_authorized") return "이 주소로는 아직 메일을 보낼 수 없어요. 운영자에게 문의해 주세요.";
  if (code === "otp_disabled" || code === "email_provider_disabled" || code === "signup_disabled") {
    return "이메일 로그인이 아직 켜져 있지 않아요.";
  }
  return "메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.";
}

/**
 * 이메일 로그인 링크 (비밀번호 없음)
 * signInWithOtp → 메일의 링크 → /auth/callback(code 를 세션으로 교환) → next.
 * 처음 쓰는 이메일이면 계정이 새로 만들어지고, 가입 트리거가 profiles 를 만든다(닉네임 = 이메일 앞부분).
 * PKCE code_verifier 가 이 브라우저 쿠키에 저장되므로 링크도 같은 브라우저에서 열어야 한다.
 */
export function EmailLoginForm({ next }: { next: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function send(target: string) {
    const address = target.trim().toLowerCase();
    setError(null);
    if (!EMAIL_RE.test(address)) return setError("이메일 주소를 다시 확인해 주세요.");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setError("아직 로그인 서버가 연결되지 않았어요.");

    setBusy(true);
    const redirect = new URL("/auth/callback", window.location.origin);
    if (next !== "/") redirect.searchParams.set("next", next);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, emailRedirectTo: redirect.toString() },
    });
    setBusy(false);
    if (otpError) return setError(describeError(otpError));
    setSentTo(address);
    setCooldown(RESEND_SECONDS);
  }

  if (sentTo) {
    return (
      <div className="rounded-xl bg-paper px-4 py-4" role="status">
        <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <MailCheck aria-hidden className="size-4 text-coral-deep" />
          로그인 링크를 보냈어요
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
          <span className="font-semibold text-ink">{sentTo}</span> 메일함에서 링크를 눌러 주세요.
          <br />
          링크는 <strong className="font-semibold text-ink">이 브라우저에서</strong> 열어야 로그인돼요. 메일이 안 보이면 스팸함도 확인해 주세요.
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm font-semibold text-coral-deep">
            {error}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => send(sentTo)}
            disabled={busy || cooldown > 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-2 bg-card px-3.5 text-xs font-bold text-ink disabled:cursor-not-allowed disabled:text-ink-3"
          >
            {busy && <Loader2 aria-hidden className="size-3.5 animate-spin" />}
            {cooldown > 0 ? `다시 보내기 (${cooldown}초)` : "다시 보내기"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              setError(null);
            }}
            className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-ink-2 hover:bg-stone hover:text-ink"
          >
            다른 이메일 쓰기
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send(email);
      }}
      noValidate
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="text-sm font-bold text-ink">
        이메일로 로그인
      </h2>
      <p className="mt-0.5 text-xs leading-relaxed text-ink-3">비밀번호 없이, 메일로 받은 로그인 링크를 누르면 돼요.</p>
      <label htmlFor={`${id}-email`} className="sr-only">
        이메일 주소
      </label>
      <input
        id={`${id}-email`}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일 주소"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2.5 h-12 w-full rounded-xl border border-line-2 bg-paper px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm font-semibold text-coral-deep">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-2.5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-[15px] font-semibold text-paper transition hover:opacity-90 disabled:opacity-60"
      >
        {busy && <Loader2 aria-hidden className="size-5 animate-spin" />}
        로그인 링크 받기
      </button>
    </form>
  );
}
