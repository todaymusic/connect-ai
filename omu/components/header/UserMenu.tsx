"use client";

import Link from "next/link";
import { FileText, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ROLES } from "@/lib/site";
import { useCurrentUser } from "../auth/useCurrentUser";

/** 헤더 우측: 비로그인 → 로그인 버튼 / 로그인 → 닉네임 메뉴(내 정보글·관리자 링크·로그아웃) */
export function UserMenu() {
  const user = useCurrentUser();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    const loginHref = pathname && pathname !== "/" && !pathname.startsWith("/login") && !pathname.startsWith("/signup")
      ? `/login?next=${encodeURIComponent(pathname)}`
      : "/login";
    return (
      <Link
        href={loginHref}
        className="inline-flex h-9 items-center rounded-full border border-line-2 bg-card px-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink-3 sm:h-10 sm:px-4"
      >
        로그인
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 max-w-[150px] items-center gap-1.5 rounded-full border border-line-2 bg-card pl-1 pr-3 text-sm font-semibold text-ink transition-colors hover:border-ink-3 sm:h-10"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone text-ink-2 sm:size-8">
          <UserRound aria-hidden className="size-4" />
        </span>
        <span className="truncate">{user.nickname}</span>
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-[var(--shadow-hover)]"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-bold text-ink">{user.nickname}</p>
            <p className="text-xs text-ink-3">{ROLES[user.role]}</p>
          </div>
          <Link
            href="/my/articles"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-stone"
          >
            <FileText aria-hidden className="size-4" />
            내 정보글
          </Link>
          {user.role === "admin" && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-stone"
            >
              <ShieldCheck aria-hidden className="size-4" />
              관리자 페이지
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink-2 hover:bg-stone hover:text-ink"
            >
              <LogOut aria-hidden className="size-4" />
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
