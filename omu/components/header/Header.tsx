import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "../Logo";
import { SearchForm } from "../SearchForm";
import { MainNav, MainNavStrip } from "./MainNav";
import { MobileMenu } from "./MobileMenu";
import { UserMenu } from "./UserMenu";
import { WriteMenu } from "./WriteMenu";

/** 글로벌 헤더 — 스크롤 시 상단 고정(sticky) */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6">
        <Link href="/" aria-label="OMU 홈" className="-ml-1 shrink-0 rounded-lg p-1 lg:mr-3">
          <Logo className="h-8 w-[61px] sm:h-9 sm:w-[69px]" />
        </Link>

        <MainNav />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <SearchForm className="hidden w-56 md:block xl:w-64" />
          <Link
            href="/search"
            aria-label="검색"
            className="inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-stone md:hidden"
          >
            <Search aria-hidden className="size-5" />
          </Link>
          <WriteMenu />
          <UserMenu />
          <MobileMenu />
        </div>
      </div>
      <MainNavStrip />
    </header>
  );
}
