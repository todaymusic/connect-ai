import Link from "next/link";
import { BookOpen, FileMusic, Guitar, MessagesSquare, Users, type LucideIcon } from "lucide-react";
import { NAV_SECTIONS } from "@/lib/nav";
import { Section, SectionHeader } from "../ui";

const ICONS: Record<string, LucideIcon> = {
  "/score": FileMusic,
  "/info": BookOpen,
  "/gear": Guitar,
  "/recruit": Users,
  "/community": MessagesSquare,
};

export function CategoryShortcuts() {
  return (
    <Section labelledBy="shortcut-title">
      <SectionHeader id="shortcut-title" eyebrow="Explore" title="어디부터 둘러볼까요?" />
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {NAV_SECTIONS.map((s, i) => {
          const Icon = ICONS[s.href];
          return (
            <li key={s.href} className={i === NAV_SECTIONS.length - 1 ? "col-span-2 sm:col-span-1" : ""}>
              <div className="card card-hover flex h-full flex-col p-4 sm:p-5">
                <Link href={s.href} className="group">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-stone text-ink transition-colors group-hover:bg-coral-soft group-hover:text-coral-deep">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="mt-3.5 block text-base font-extrabold text-ink">{s.label}</span>
                  <span className="mt-1 block text-[13px] leading-snug text-ink-2">{s.description}</span>
                </Link>
                <ul className="mt-4 hidden flex-wrap gap-1.5 sm:flex">
                  {s.children.slice(0, 4).map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        className="inline-block rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 transition-colors hover:border-line-2 hover:text-ink"
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
