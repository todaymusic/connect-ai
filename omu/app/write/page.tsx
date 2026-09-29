import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, CheckCircle2, FileMusic, Guitar, Lock, MessagesSquare, Music2, Users, type LucideIcon } from "lucide-react";
import { DemoRoleSwitcher } from "@/components/write/WriteChrome";
import { MyDemoWrites } from "@/components/write/MyDemoWrites";
import { ROLES } from "@/lib/site";
import { WRITE_TYPES, canWrite, type WriteType } from "@/lib/write/config";
import { getWriterState } from "@/lib/write/writer";

export const metadata: Metadata = {
  title: "글쓰기",
  robots: { index: false, follow: false },
};

const ICONS: Record<WriteType, LucideIcon> = {
  score: FileMusic,
  article: BookOpen,
  market: Guitar,
  recruit: Users,
  community: MessagesSquare,
  "score-request": Music2,
};

/** 작성 허브 — 유형 고르기. 권한이 없는 유형은 이유를 보여준다. */
export default async function WriteHubPage({ searchParams }: PageProps<"/write">) {
  const { saved } = await searchParams;
  const state = await getWriterState();
  const role = state.writer?.role ?? null;

  return (
    <div className="mx-auto max-w-[880px] px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-coral-deep">Write</p>
      <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">무엇을 올릴까요?</h1>
      <p className="mt-1.5 text-sm text-ink-2">
        {state.writer ? (
          <>
            <strong className="text-ink">{state.writer.nickname}</strong> 님은 <strong className="text-ink">{ROLES[state.writer.role]}</strong> 권한으로 글을 쓸 수 있어요.
          </>
        ) : (
          <>
            <strong className="text-ink">커뮤니티 글과 댓글은 로그인 없이 바로</strong> 쓸 수 있어요. 장터·구인·악보 요청은 로그인하면 쓸 수 있어요.
          </>
        )}
      </p>

      {saved === "article" && (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-blue-soft/50 px-4 py-3 text-sm text-ink-2">
          <CheckCircle2 aria-hidden className="size-4 text-blue" />
          정보글을 초안으로 저장했어요. 관리자가 발행하면 공개돼요.
        </p>
      )}

      {state.mode === "demo" && (
        <div className="mt-6">
          <DemoRoleSwitcher current={state.demoRole} next="/write" />
        </div>
      )}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {WRITE_TYPES.map((t) => {
          const Icon = ICONS[t.key];
          const allowed = canWrite(role, t.key);
          const reason = t.minRole === "editor" ? "에디터·관리자 전용이에요" : !role ? "로그인 후 쓸 수 있어요" : "";
          const guestOk = !role && t.guestAllowed;
          return (
            <li key={t.key}>
              <Link
                href={`/write/${t.key}`}
                className={`card flex h-full items-start gap-3 p-4 sm:p-5 ${allowed ? "card-hover" : "bg-paper"}`}
                aria-describedby={!allowed ? `${t.key}-reason` : undefined}
              >
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${allowed ? "bg-coral-soft/60 text-coral-deep" : "bg-stone text-ink-3"}`}>
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-ink-3">{t.section}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-base font-extrabold text-ink">
                    {t.label}
                    {!allowed && <Lock aria-hidden className="size-3.5 text-ink-3" />}
                  </span>
                  <span className="mt-1 block text-[13px] text-ink-2">{t.hint}</span>
                  {guestOk && (
                    <span className="mt-2 inline-block rounded-full bg-blue-soft/60 px-2 py-0.5 text-[11px] font-bold text-blue">로그인 없이 바로 쓰기</span>
                  )}
                  {!allowed && (
                    <span id={`${t.key}-reason`} className="mt-2 inline-block rounded-full bg-stone px-2 py-0.5 text-[11px] font-bold text-ink-3">
                      {reason}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 rounded-xl bg-stone px-4 py-3 text-xs leading-relaxed text-ink-2">
        악보와 정보글은 에디터가 확인해 올려요. 찾는 악보가 없다면 ‘악보 요청’을 남겨 주세요. 글을 쓰기 전에{" "}
        <Link href="/terms" className="font-semibold underline underline-offset-2">
          이용약관
        </Link>
        의 게시물 규칙을 확인해 주세요.
      </p>

      {state.mode === "demo" && <MyDemoWrites />}
    </div>
  );
}
