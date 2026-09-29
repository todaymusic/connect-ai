"use client";

import { Archive, Trash2 } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { DemoRecord } from "@/lib/write/actions";
import { WRITE_TYPES } from "@/lib/write/config";
import { clearDemoWrites, readDemoWrites, subscribeDemoWrites } from "@/lib/write/demo-store";

// localStorage 스냅샷 캐시 (같은 값이면 같은 배열을 돌려줘야 useSyncExternalStore 가 무한 렌더하지 않는다)
let cacheKey = "";
let cacheVal: DemoRecord[] = [];
function snapshot(): DemoRecord[] {
  const list = readDemoWrites();
  const key = list.map((r) => r.id).join(",");
  if (key !== cacheKey) {
    cacheKey = key;
    cacheVal = list;
  }
  return cacheVal;
}
const EMPTY: DemoRecord[] = [];

/** 데모 모드에서 이 브라우저에 보관된 글 목록 */
export function MyDemoWrites() {
  const list = useSyncExternalStore(subscribeDemoWrites, snapshot, () => EMPTY);
  if (list.length === 0) return null;
  return (
    <section aria-labelledby="demo-archive-title" className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 id="demo-archive-title" className="flex items-center gap-2 text-lg font-extrabold text-ink">
          <Archive aria-hidden className="size-5" />이 브라우저의 데모 글 <span className="font-display text-ink-3">{list.length}</span>
        </h2>
        <button type="button" onClick={clearDemoWrites} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-3 hover:text-ink">
          <Trash2 aria-hidden className="size-4" />
          모두 지우기
        </button>
      </div>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {list.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <p className="text-xs font-semibold text-ink-3">{WRITE_TYPES.find((t) => t.key === r.type)?.label ?? r.type}</p>
            <p className="mt-0.5 truncate text-[15px] font-semibold text-ink">{r.title}</p>
            <p className="mt-0.5 truncate text-xs text-ink-3">{r.fields.map(([k, v]) => `${k} ${v}`).join(" · ")}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-3">데모 글은 서버에 저장되지 않아 목록 페이지에는 나오지 않아요.</p>
    </section>
  );
}
