"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_MENU } from "@/lib/site";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 데스크톱 상단 메뉴 (5개, 순서 고정) */
export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {MAIN_MENU.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3.5 py-2 text-[15px] font-semibold transition-colors ${
                  active ? "text-ink" : "text-ink-2 hover:bg-stone hover:text-ink"
                }`}
              >
                {item.label}
                {/* 항상 렌더하고 보이기만 전환: 정적 404 페이지(서버 경로 /_not-found)와 클라이언트 경로가
                    달라도 DOM 구조가 같아 하이드레이션 오류가 나지 않는다 */}
                <span
                  aria-hidden
                  className={`absolute bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-coral transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 모바일·태블릿: 헤더 아래 가로 스크롤 메뉴 줄 */
export function MainNavStrip() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" className="border-t border-line lg:hidden">
      <ul className="scrollbar-none mx-auto flex max-w-[1120px] gap-1 overflow-x-auto px-3 py-2 sm:px-5">
        <li>
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              pathname === "/" ? "bg-ink text-paper" : "text-ink-2 hover:bg-stone"
            }`}
          >
            홈
          </Link>
        </li>
        {MAIN_MENU.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  active ? "bg-ink text-paper" : "text-ink-2 hover:bg-stone"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
