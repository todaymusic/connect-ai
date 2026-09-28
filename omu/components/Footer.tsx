import Link from "next/link";
import { NAV_SECTIONS } from "@/lib/nav";
import { CONTACT_EMAIL, SITE_TAGLINE } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-stone">
      <div className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo className="h-9 w-[69px]" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-2">{SITE_TAGLINE}</p>
            <p className="mt-4 text-sm text-ink-2">
              고객문의{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-blue hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <nav aria-label="사이트 전체 메뉴" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {NAV_SECTIONS.map((s) => (
              <div key={s.href}>
                <Link href={s.href} className="text-sm font-bold text-ink hover:text-coral-deep">
                  {s.label}
                </Link>
                <ul className="mt-3 space-y-2">
                  {s.children.slice(0, 5).map((c) => (
                    <li key={c.href}>
                      <Link href={c.href} className="text-[13px] text-ink-2 hover:text-ink">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line-2 pt-6 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li><Link href="/about" className="hover:text-ink">서비스 소개</Link></li>
            <li><Link href="/terms" className="hover:text-ink">이용약관</Link></li>
            <li><Link href="/privacy" className="font-semibold text-ink-2 hover:text-ink">개인정보처리방침</Link></li>
            <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">고객문의</a></li>
          </ul>
          <p className="font-display tracking-tight">© {new Date().getFullYear()} OMU</p>
        </div>
      </div>
    </footer>
  );
}
