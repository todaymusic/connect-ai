import { Search } from "lucide-react";

type SearchFormProps = {
  size?: "sm" | "lg";
  defaultValue?: string;
  className?: string;
  autoFocus?: boolean;
};

/** 통합 검색 폼 — JS 없이도 동작하는 GET /search?q= */
export function SearchForm({ size = "sm", defaultValue, className = "", autoFocus }: SearchFormProps) {
  const lg = size === "lg";
  return (
    <form action="/search" method="get" role="search" className={className}>
      <label className="relative block">
        <span className="sr-only">곡명·악기·아티스트 검색</span>
        <Search
          aria-hidden
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-3 ${lg ? "left-5 size-5" : "left-3.5 size-4"}`}
        />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          placeholder="곡명·악기·아티스트 검색"
          className={
            lg
              ? "h-14 w-full rounded-full border border-line-2 bg-card pl-13 pr-24 text-base shadow-[var(--shadow-card)] outline-none transition placeholder:text-ink-3 focus:border-ink-3 focus:shadow-[var(--shadow-hover)]"
              : "h-10 w-full rounded-full border border-line bg-card pl-10 pr-4 text-sm outline-none transition placeholder:text-ink-3 focus:border-line-2 focus:bg-card"
          }
        />
        {lg && (
          <button
            type="submit"
            className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full bg-coral px-5 text-sm font-semibold text-white transition hover:bg-coral-deep"
          >
            검색
          </button>
        )}
      </label>
    </form>
  );
}
