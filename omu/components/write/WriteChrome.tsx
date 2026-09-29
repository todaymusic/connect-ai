import Link from "next/link";
import { FlaskConical, Lock, ShieldAlert } from "lucide-react";
import { setDemoRole } from "@/lib/write/actions";
import { DEMO_ROLES, type DemoRole } from "@/lib/write/config";

/** 데모 모드 역할 고르기 — Supabase 미연결 환경에서만 보인다 */
export function DemoRoleSwitcher({ current, next }: { current: DemoRole; next: string }) {
  return (
    <section aria-labelledby="demo-role-title" className="rounded-2xl border border-blue-soft bg-blue-soft/30 p-4 sm:p-5">
      <p id="demo-role-title" className="flex items-center gap-2 text-sm font-bold text-ink">
        <FlaskConical aria-hidden className="size-4 text-blue" />
        데모 작성 모드
      </p>
      <p className="mt-1 text-sm leading-relaxed text-ink-2">
        Supabase 가 연결되지 않은 환경이에요. 아래에서 역할을 바꿔 가며 글쓰기 권한과 폼을 확인할 수 있어요. 작성한 글은 이 브라우저에만 보관돼요.
      </p>
      <form action={setDemoRole} className="mt-3 flex flex-wrap gap-1.5">
        <input type="hidden" name="next" value={next} />
        {(Object.keys(DEMO_ROLES) as DemoRole[]).map((r) => (
          <button
            key={r}
            type="submit"
            name="role"
            value={r}
            aria-pressed={current === r}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              current === r ? "border-ink bg-ink text-paper" : "border-line-2 bg-card text-ink-2 hover:border-ink-3"
            }`}
          >
            {DEMO_ROLES[r]}
          </button>
        ))}
      </form>
    </section>
  );
}

/** 로그인 필요 / 권한 부족 안내 */
export function WriteGate({ kind, message, next, demo }: { kind: "signed-out" | "forbidden"; message: string; next: string; demo: boolean }) {
  const Icon = kind === "signed-out" ? Lock : ShieldAlert;
  return (
    <div className="card px-6 py-9 text-center sm:px-10">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone text-ink-2">
        <Icon aria-hidden className="size-6" />
      </span>
      <h2 className="mt-4 text-xl font-extrabold text-ink">{kind === "signed-out" ? "로그인이 필요해요" : "이 글은 쓸 수 없어요"}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        {kind === "signed-out" ? (
          demo ? (
            <p className="text-sm text-ink-3">위 ‘데모 작성 모드’에서 역할을 골라 보세요.</p>
          ) : (
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="inline-flex h-11 items-center rounded-full bg-coral px-6 text-sm font-bold text-white hover:bg-coral-deep">
              로그인하기
            </Link>
          )
        ) : (
          <Link href="/write/score-request" className="inline-flex h-11 items-center rounded-full bg-coral px-6 text-sm font-bold text-white hover:bg-coral-deep">
            악보 요청하기
          </Link>
        )}
        <Link href="/write" className="inline-flex h-11 items-center rounded-full border border-line-2 bg-card px-6 text-sm font-bold text-ink hover:border-ink-3">
          다른 글 쓰기
        </Link>
      </div>
    </div>
  );
}
