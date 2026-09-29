import Link from "next/link";
import { FileMusic, Flag, FolderOpen, LayoutDashboard, UserCog, type LucideIcon } from "lucide-react";

/* 좌측(모바일은 상단) 관리자 메뉴 */
const ADMIN_NAV: { key: string; label: string; icon: LucideIcon; href: string | null }[] = [
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard, href: "/admin" },
  { key: "reports", label: "신고 처리", icon: Flag, href: "/admin/reports" },
  { key: "content", label: "악보·정보글 등록", icon: FileMusic, href: "/admin/content" },
  { key: "roles", label: "회원 역할 변경", icon: UserCog, href: null },
  { key: "storage", label: "스토리지 관리", icon: FolderOpen, href: null },
];

export function AdminNav({ active, openReports }: { active: "dashboard" | "reports" | "content"; openReports?: number | null }) {
  return (
    <nav aria-label="관리자 메뉴" className="min-w-0">
      <ul className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {ADMIN_NAV.map((item) => {
          const current = item.key === active;
          const inner = (
            <>
              <item.icon aria-hidden className="size-4" />
              {item.label}
              {item.key === "reports" && (openReports ?? 0) > 0 && (
                <span className={`rounded-full px-1.5 py-px font-display text-[10px] font-bold ${current ? "bg-paper text-ink" : "bg-coral text-white"}`}>{openReports}</span>
              )}
              {!item.href && <span className="rounded-full bg-stone px-1.5 py-px text-[10px] font-bold text-ink-3">준비 중</span>}
            </>
          );
          const cls = `flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold ${
            current ? "bg-ink text-paper" : item.href ? "text-ink-2 hover:bg-stone hover:text-ink" : "text-ink-3"
          }`;
          return (
            <li key={item.key} className="shrink-0">
              {item.href ? (
                <Link href={item.href} aria-current={current ? "page" : undefined} className={cls}>
                  {inner}
                </Link>
              ) : (
                <span aria-disabled className={cls}>
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
