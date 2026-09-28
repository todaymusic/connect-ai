import Link from "next/link";
import { Lock, ServerOff, ShieldAlert, TriangleAlert } from "lucide-react";
import type { AdminAccess } from "@/lib/admin";
import { ROLES } from "@/lib/site";

type NoticeKind = Exclude<AdminAccess["kind"], "admin" | "preview">;

/** 관리자가 아닐 때 보여주는 안내 (비로그인 / 권한 없음 / 미연결 / 오류) */
export function AdminGuardNotice({ access }: { access: Extract<AdminAccess, { kind: NoticeKind }> }) {
  const content = (() => {
    switch (access.kind) {
      case "signed-out":
        return {
          icon: Lock,
          title: "관리자 로그인이 필요해요",
          body: "관리자 페이지는 관리자 권한이 있는 계정으로 로그인해야 볼 수 있어요.",
          actions: (
            <Link
              href="/login?next=%2Fadmin"
              className="inline-flex h-11 items-center rounded-full bg-coral px-6 text-sm font-bold text-white hover:bg-coral-deep"
            >
              로그인하기
            </Link>
          ),
        };
      case "forbidden":
        return {
          icon: ShieldAlert,
          title: "접근 권한이 없어요",
          body: `지금 로그인한 계정(${access.user.nickname} · ${ROLES[access.user.role]})에는 관리자 권한이 없어요. 권한이 필요하면 기존 관리자에게 역할 변경을 요청해 주세요.`,
          actions: (
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-full border border-line-2 bg-card px-6 text-sm font-bold text-ink hover:border-ink-3"
              >
                다른 계정으로 로그인
              </button>
            </form>
          ),
        };
      case "unconfigured":
        return {
          icon: ServerOff,
          title: "아직 관리자 기능을 쓸 수 없어요",
          body: "Supabase가 연결되면 관리자 페이지가 열려요. 배포 담당자는 DEPLOYMENT.md 의 환경변수 설정을 확인해 주세요.",
          actions: null,
        };
      case "error":
        return { icon: TriangleAlert, title: "권한을 확인하지 못했어요", body: access.message, actions: null };
    }
  })();

  const Icon = content.icon;
  return (
    <div className="mx-auto max-w-[520px] px-4 py-16 sm:px-6 sm:py-24">
      <div className="card px-6 py-9 text-center sm:px-10">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone text-ink-2">
          <Icon aria-hidden className="size-6" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight text-ink">{content.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{content.body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {content.actions}
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-line-2 bg-card px-6 text-sm font-bold text-ink hover:border-ink-3"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
