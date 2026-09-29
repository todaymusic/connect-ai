import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, PenLine, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { hrefWith, type Query } from "@/lib/url";

/* ───────── 목록 머리 ───────── */
export function ListHeader({
  eyebrow,
  title,
  description,
  writeHref,
  writeLabel = "글쓰기",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  writeHref?: string;
  writeLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-display mb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-coral-deep">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{description}</p>}
      </div>
      {writeHref && (
        <Link
          href={writeHref}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-coral px-4 text-sm font-bold text-white transition-colors hover:bg-coral-deep"
        >
          <PenLine aria-hidden className="size-4" />
          {writeLabel}
        </Link>
      )}
    </div>
  );
}

/* ───────── 분류 탭 (링크) ───────── */
export function CategoryTabs({
  label,
  items,
  current,
}: {
  label: string;
  items: { href: string; label: string; key: string }[];
  current: string;
}) {
  return (
    <nav aria-label={label} className="mt-5">
      <ul className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {items.map((t) => {
          const active = t.key === current;
          return (
            <li key={t.key} className="shrink-0">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  active ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-line-2 hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ───────── 칩 필터 (한 파라미터의 값 고르기) ───────── */
export function ChipFilter({
  label,
  param,
  options,
  current,
  pathname,
  query,
  allLabel = "전체",
}: {
  label: string;
  param: string;
  options: { value: string; label: ReactNode }[];
  current: string | undefined;
  pathname: string;
  query: Query;
  allLabel?: string;
}) {
  const all = [{ value: "", label: allLabel }, ...options];
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-xs font-semibold text-ink-3">{label}</span>
      <ul className="scrollbar-none flex min-w-0 gap-1 overflow-x-auto">
        {all.map((o) => {
          const active = (current ?? "") === o.value;
          return (
            <li key={o.value || "all"} className="shrink-0">
              <Link
                href={hrefWith(pathname, query, { [param]: o.value || undefined })}
                aria-current={active ? "true" : undefined}
                scroll={false}
                className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  active ? "bg-ink text-paper" : "bg-stone text-ink-2 hover:bg-line"
                }`}
              >
                {o.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ───────── 검색 + 선택 필터 폼 (GET, JS 불필요) ───────── */
export function FilterForm({
  pathname,
  query,
  placeholder,
  selects = [],
  keep = [],
}: {
  pathname: string;
  query: Query;
  placeholder: string;
  selects?: { name: string; label: string; options: { value: string; label: string }[] }[];
  /** 폼 제출 시 유지할 다른 파라미터 (칩 필터 값 등) */
  keep?: string[];
}) {
  const hasFilter = Boolean(query.q) || selects.some((s) => query[s.name]);
  return (
    <form action={pathname} method="get" role="search" className="flex flex-wrap items-center gap-2">
      {keep.map((k) => (query[k] ? <input key={k} type="hidden" name={k} value={query[k]} /> : null))}
      <label className="min-w-0 flex-1 basis-48">
        <span className="sr-only">{placeholder}</span>
        <input
          type="search"
          name="q"
          defaultValue={query.q}
          placeholder={placeholder}
          className="h-10 w-full rounded-full border border-line bg-card px-4 text-sm outline-none transition placeholder:text-ink-3 focus:border-ink-3"
        />
      </label>
      {selects.map((s) => (
        <label key={s.name} className="shrink-0">
          <span className="sr-only">{s.label}</span>
          <select
            name={s.name}
            defaultValue={query[s.name] ?? ""}
            className="h-10 max-w-[9.5rem] rounded-full border border-line bg-card pl-3 pr-8 text-sm text-ink-2 outline-none focus:border-ink-3"
          >
            <option value="">{s.label} 전체</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button type="submit" className="h-10 shrink-0 rounded-full bg-ink px-4 text-sm font-bold text-paper hover:bg-ink/90">
        적용
      </button>
      {hasFilter && (
        <Link href={hrefWith(pathname, Object.fromEntries(keep.map((k) => [k, query[k]])), {})} className="shrink-0 px-1 text-sm font-semibold text-ink-3 underline-offset-2 hover:text-ink hover:underline">
          초기화
        </Link>
      )}
    </form>
  );
}

/* ───────── 결과 수 ───────── */
export function ResultCount({ total, query }: { total: number; query?: string }) {
  return (
    <p className="text-sm text-ink-2" aria-live="polite">
      {query ? (
        <>
          <strong className="text-ink">‘{query}’</strong> 검색 결과{" "}
        </>
      ) : (
        "전체 "
      )}
      <span className="font-display font-bold text-ink">{total.toLocaleString("ko-KR")}</span>건
    </p>
  );
}

/* ───────── 빈 상태 ───────── */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-2 px-5 py-12 text-center">
      <SearchX aria-hidden className="mx-auto size-8 text-ink-3" />
      <p className="mt-3 font-bold text-ink">{title}</p>
      {children && <div className="mt-1.5 text-sm leading-relaxed text-ink-2">{children}</div>}
    </div>
  );
}

/** 아직 열지 않은(콘텐츠가 없는) 게시판 — '검색 결과 없음' 대신 준비 중 안내 */
export function ComingSoonState({ title, children, action }: { title: string; children?: ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-2 bg-card px-5 py-12 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-stone text-ink-2">
        <Clock aria-hidden className="size-5" />
      </span>
      <p className="mt-3 font-bold text-ink">{title}</p>
      {children && <div className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-2">{children}</div>}
      {action && (
        <Link href={action.href} className="mt-5 inline-flex h-10 items-center rounded-full border border-line-2 bg-paper px-5 text-sm font-bold text-ink hover:border-ink-3">
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** 글이 하나도 없는 커뮤니티 — 첫 글 쓰기로 안내 */
export function FirstPostState({ href = "/write/community" }: { href?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-2 bg-card px-5 py-12 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-coral-soft/60 text-coral-deep">
        <PenLine aria-hidden className="size-5" />
      </span>
      <p className="mt-3 font-bold text-ink">아직 올라온 글이 없어요</p>
      <p className="mt-1.5 text-sm text-ink-2">첫 글을 남겨보세요. 로그인 없이도 쓸 수 있어요.</p>
      <Link href={href} className="mt-5 inline-flex h-10 items-center rounded-full bg-coral px-5 text-sm font-bold text-white hover:bg-coral-deep">
        첫 글 쓰기
      </Link>
    </div>
  );
}

/* ───────── 페이지 이동 ───────── */
export function Pagination({ page, pageCount, pathname, query }: { page: number; pageCount: number; pathname: string; query: Query }) {
  if (pageCount <= 1) return null;
  const link = (p: number) => hrefWith(pathname, query, { page: p > 1 ? String(p) : undefined }, true);
  const btn = "inline-flex h-10 items-center gap-1 rounded-full border border-line bg-card px-4 text-sm font-semibold";
  return (
    <nav aria-label="페이지 이동" className="mt-8 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={link(page - 1)} className={`${btn} hover:border-ink-3`}>
          <ChevronLeft aria-hidden className="size-4" />
          이전
        </Link>
      ) : (
        <span aria-disabled className={`${btn} text-ink-3 opacity-50`}>
          <ChevronLeft aria-hidden className="size-4" />
          이전
        </span>
      )}
      <span className="font-display text-sm text-ink-2">
        {page} / {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={link(page + 1)} className={`${btn} hover:border-ink-3`}>
          다음
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span aria-disabled className={`${btn} text-ink-3 opacity-50`}>
          다음
          <ChevronRight aria-hidden className="size-4" />
        </span>
      )}
    </nav>
  );
}

export function ListShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 sm:py-12">{children}</div>;
}
