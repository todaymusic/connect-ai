import Link from "next/link";
import { redirect } from "next/navigation";
import { AUTH_ERROR_MESSAGES, getSocialProviders, isEmailLoginEnabled, safeNextPath } from "@/lib/auth-providers";
import { getAuthState } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Logo } from "../Logo";
import { EmailLoginForm } from "./EmailLoginForm";
import { SocialLoginButtons } from "./SocialLoginButtons";

type Mode = "login" | "signup";

const COPY: Record<Mode, { title: string; description: string; emailDescription: string; switchText: string; switchLabel: string; switchHref: string }> = {
  login: {
    title: "OMU에 로그인",
    description: "카카오나 네이버 계정으로 간편하게 로그인하세요.",
    emailDescription: "소셜 계정이나 이메일로 간편하게 로그인하세요.",
    switchText: "처음이신가요?",
    switchLabel: "회원가입",
    switchHref: "/signup",
  },
  signup: {
    title: "OMU 회원가입",
    description: "별도 비밀번호 없이, 쓰던 소셜 계정으로 바로 가입돼요.",
    emailDescription: "별도 비밀번호 없이, 쓰던 소셜 계정이나 이메일로 바로 가입돼요.",
    switchText: "이미 계정이 있나요?",
    switchLabel: "로그인",
    switchHref: "/login",
  },
};

/** /login · /signup 공통 화면 — 소셜 로그인은 로그인과 가입이 같은 흐름이다 */
export async function AuthPanel({ mode, searchParams }: { mode: Mode; searchParams: Record<string, string | string[] | undefined> }) {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const next = safeNextPath(first(searchParams.next));
  const errorCode = first(searchParams.error);
  const errorMessage = errorCode ? (AUTH_ERROR_MESSAGES[errorCode] ?? AUTH_ERROR_MESSAGES.exchange_failed) : null;

  // 이미 로그인한 사용자는 원래 가려던 곳으로
  const auth = await getAuthState();
  if (auth.status === "signed-in") redirect(next);

  const copy = COPY[mode];
  const configured = isSupabaseConfigured();
  // 이메일 로그인 링크: 실제 로그인 서버가 연결된 경우에만 (데모 모드에서는 숨김)
  const emailLogin = configured && isEmailLoginEnabled();
  const switchHref = next !== "/" ? `${copy.switchHref}?next=${encodeURIComponent(next)}` : copy.switchHref;

  return (
    <div className="mx-auto flex max-w-[1120px] justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="w-full max-w-[420px]">
        <div className="card px-5 py-8 sm:px-8 sm:py-10">
          <Logo className="h-9 w-[69px]" />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink">{copy.title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{emailLogin ? copy.emailDescription : copy.description}</p>

          {errorMessage && (
            <p role="alert" className="mt-5 rounded-xl bg-coral-soft/50 px-3.5 py-2.5 text-sm text-coral-deep">
              {errorMessage}
            </p>
          )}

          <div className="mt-6">
            <SocialLoginButtons providers={getSocialProviders()} next={next} configured={configured} />
          </div>

          {emailLogin && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-ink-3" aria-hidden>
                <span className="h-px flex-1 bg-line-2" />
                또는
                <span className="h-px flex-1 bg-line-2" />
              </div>
              <EmailLoginForm next={next} />
            </>
          )}

          {mode === "signup" && (
            <ul className="mt-6 space-y-1.5 rounded-xl bg-paper px-4 py-3.5 text-xs leading-relaxed text-ink-2">
              <li>· 가입하면 닉네임은 소셜 계정의 이름(이메일로 가입하면 이메일 앞부분)으로 시작해요. 나중에 바꿀 수 있어요.</li>
              <li>· 악보 다운로드와 글 읽기는 가입 없이도 가능해요.</li>
            </ul>
          )}

          <p className="mt-6 text-xs leading-relaxed text-ink-3">
            계속하면 OMU의{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
              이용약관
            </Link>
            과{" "}
            <Link href="/privacy" className="font-semibold underline underline-offset-2 hover:text-ink">
              개인정보처리방침
            </Link>
            에 동의하는 것으로 봐요.
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-ink-2">
          {copy.switchText}{" "}
          <Link href={switchHref} className="font-bold text-ink underline-offset-2 hover:underline">
            {copy.switchLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
