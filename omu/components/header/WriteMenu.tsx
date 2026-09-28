"use client";

import Link from "next/link";
import { ChevronDown, PenLine } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { WRITE_ACTIONS } from "@/lib/nav";

/** 글쓰기 CTA — 어디에 쓸지 고르는 드롭다운 */
export function WriteMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-coral pl-4 pr-3 text-sm font-semibold text-white transition-colors hover:bg-coral-deep"
      >
        <PenLine aria-hidden className="size-4" />
        글쓰기
        <ChevronDown aria-hidden className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-[var(--shadow-hover)]"
        >
          {WRITE_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3.5 py-2.5 transition-colors hover:bg-stone"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{a.label}</span>
                <span className="rounded-full bg-stone px-1.5 py-px text-[10px] font-bold text-ink-3">준비 중</span>
              </span>
              <span className="block text-xs text-ink-3">{a.hint}</span>
            </Link>
          ))}
          <p className="mx-1.5 mt-1 border-t border-line px-2 pb-1.5 pt-2.5 text-xs text-ink-3">
            글쓰기는 오픈 준비 중이에요. 열리면 로그인한 회원 누구나 쓸 수 있어요.
          </p>
        </div>
      )}
    </div>
  );
}
