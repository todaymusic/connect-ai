"use client";

import Link from "next/link";
import { LogOut, Menu, PenLine, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS, WRITE_ACTIONS } from "@/lib/nav";
import { SearchForm } from "../SearchForm";
import { useCurrentUser } from "../auth/useCurrentUser";

/** 모바일·태블릿 햄버거 메뉴 — 대분류 + 소분류 전체 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const user = useCurrentUser();

  // 페이지 이동 시 닫기 (렌더 중 상태 조정 — effect 없이 이전 경로와 비교)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="전체 메뉴 열기"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-stone"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      {/* 헤더의 backdrop-filter 가 fixed 요소의 기준(containing block)이 되므로 body 로 포털 */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="전체 메뉴">
            <button
              type="button"
              aria-label="메뉴 닫기"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/30"
            />
            <div className="absolute inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col bg-paper shadow-[var(--shadow-hover)]">
              <div className="flex h-14 items-center justify-between border-b border-line px-4">
                <span className="text-sm font-semibold text-ink-2">전체 메뉴</span>
                <button
                  type="button"
                  aria-label="메뉴 닫기"
                  onClick={() => setOpen(false)}
                  className="inline-flex size-10 items-center justify-center rounded-full hover:bg-stone"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
                <SearchForm />
                {user ? (
                  <div className="mt-4 rounded-2xl border border-line bg-card p-3">
                    <p className="truncate px-1 text-sm font-bold text-ink">{user.nickname} 님</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {user.role === "admin" ? (
                        <Link
                          href="/admin"
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-ink text-sm font-semibold text-paper"
                        >
                          <ShieldCheck aria-hidden className="size-4" />
                          관리자
                        </Link>
                      ) : (
                        <span />
                      )}
                      <form action="/auth/signout" method="post">
                        <button
                          type="submit"
                          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-line-2 bg-card text-sm font-semibold"
                        >
                          <LogOut aria-hidden className="size-4" />
                          로그아웃
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      className="inline-flex h-11 items-center justify-center rounded-full border border-line-2 bg-card text-sm font-semibold"
                    >
                      로그인
                    </Link>
                    <Link
                      href="/signup"
                      className="inline-flex h-11 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper"
                    >
                      회원가입
                    </Link>
                  </div>
                )}

                <ul className="mt-6 space-y-5">
                  {NAV_SECTIONS.map((s) => (
                    <li key={s.href}>
                      <Link href={s.href} className="text-base font-bold text-ink">
                        {s.label}
                      </Link>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {s.children.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              className="inline-block rounded-full border border-line bg-card px-3 py-1.5 text-[13px] text-ink-2"
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 rounded-2xl border border-line bg-card p-3">
                  <p className="flex items-center gap-1.5 px-1 text-sm font-bold">
                    <PenLine aria-hidden className="size-4 text-coral" />
                    글쓰기
                    <Link href="/write" className="ml-auto text-xs font-semibold text-ink-3 hover:text-ink">
                      전체 보기
                    </Link>
                  </p>
                  <ul className="mt-2 grid grid-cols-2 gap-1.5">
                    {WRITE_ACTIONS.map((a) => (
                      <li key={a.href}>
                        <Link href={a.href} className="block rounded-xl bg-stone px-3 py-2 text-[13px] font-semibold">
                          {a.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
