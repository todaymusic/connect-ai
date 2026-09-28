"use client";

import { useId, useState } from "react";
import type { MockScore } from "@/lib/mock";
import { SCORE_INSTRUMENTS, type ScoreInstrument } from "@/lib/site";
import { ScoreCard } from "./ScoreCard";

type Tab = "all" | ScoreInstrument;

/** 이번 주 무료 악보 — 과목별 탭 + 카드 4개 */
export function FreeScoreTabs({ scores }: { scores: MockScore[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const baseId = useId();

  const instruments = (Object.keys(SCORE_INSTRUMENTS) as ScoreInstrument[]).filter((k) =>
    scores.some((s) => s.instrument === k),
  );
  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "전체" },
    ...instruments.map((k) => ({ key: k, label: SCORE_INSTRUMENTS[k] })),
  ];

  const visible = (tab === "all" ? [...scores].sort((a, b) => b.downloads - a.downloads) : scores.filter((s) => s.instrument === tab)).slice(0, 4);

  return (
    <div>
      <div role="tablist" aria-label="과목 선택" className="scrollbar-none -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => {
          const selected = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              onClick={() => setTab(t.key)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                selected ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-line-2 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <ul
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${tab}`}
        className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4"
      >
        {visible.map((s) => (
          <li key={s.id}>
            <ScoreCard score={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}
