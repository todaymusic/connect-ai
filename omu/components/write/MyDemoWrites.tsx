"use client";

import { Archive, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { guestHash, peekGuestSecret } from "@/lib/guest/client";
import { deleteItem } from "@/lib/interact/actions";
import type { DemoRecord } from "@/lib/write/actions";
import { WRITE_TYPES } from "@/lib/write/config";
import { clearDemoWrites, readDemoWrites, removeDemoWrite, subscribeDemoWrites, updateDemoWrite } from "@/lib/write/demo-store";
import { PostEditForm } from "../interact/ThreadOwnerActions";

// localStorage 스냅샷 캐시 (같은 값이면 같은 배열을 돌려줘야 useSyncExternalStore 가 무한 렌더하지 않는다)
let cacheKey = "";
let cacheVal: DemoRecord[] = [];
function snapshot(): DemoRecord[] {
  const list = readDemoWrites();
  const key = JSON.stringify(list.map((r) => [r.id, r.title, r.editedAt]));
  if (key !== cacheKey) {
    cacheKey = key;
    cacheVal = list;
  }
  return cacheVal;
}
const EMPTY: DemoRecord[] = [];

/** 비회원 데모 글: 이 브라우저 비밀값으로 만든 해시가 같아야 내 글 (실제 서비스와 같은 방식) */
function useOwned(list: DemoRecord[]) {
  const [owned, setOwned] = useState<Set<string>>(new Set());
  useEffect(() => {
    const secret = peekGuestSecret();
    Promise.all(
      list.map(async (r) => {
        if (!r.guest) return r.id; // 회원 데모 글은 이 브라우저에서 쓴 것
        if (!secret) return null;
        return (await guestHash(secret, `post:${r.id}`)) === r.guest.tag ? r.id : null;
      }),
    ).then((ids) => setOwned(new Set(ids.filter((x): x is string => Boolean(x)))));
  }, [list]);
  return owned;
}

/** 데모 모드에서 이 브라우저에 보관된 글 목록 (커뮤니티 글은 수정·삭제 가능) */
export function MyDemoWrites() {
  const list = useSyncExternalStore(subscribeDemoWrites, snapshot, () => EMPTY);
  const owned = useOwned(list);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (list.length === 0) {
    return message ? (
      <p role="status" className="mt-6 rounded-xl bg-stone px-4 py-2.5 text-sm text-ink-2">
        {message}
      </p>
    ) : null;
  }

  async function remove(r: DemoRecord) {
    if (!window.confirm("이 데모 글을 지울까요?")) return;
    const res = await deleteItem({ target: "post", id: r.id, secret: peekGuestSecret() });
    if (res.status === "error") return setMessage(res.message);
    removeDemoWrite(r.id);
    setMessage("글을 지웠어요. 실제 서비스에서는 목록·검색에서 숨김 처리돼요.");
  }

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
      {message && (
        <p role="status" className="mt-3 rounded-xl bg-stone px-4 py-2.5 text-sm text-ink-2">
          {message}
        </p>
      )}
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {list.map((r) => {
          const canManage = r.type === "community" && owned.has(r.id);
          return (
            <li key={r.id} className="px-4 py-3" data-testid="demo-write">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-3">
                    {WRITE_TYPES.find((t) => t.key === r.type)?.label ?? r.type}
                    {r.guest && <> · {r.guest.name} (비회원)</>}
                    {r.editedAt && " · 수정됨"}
                  </p>
                  <p className="mt-0.5 truncate text-[15px] font-semibold text-ink">{r.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-3">{r.fields.map(([k, v]) => `${k} ${v}`).join(" · ")}</p>
                </div>
                {canManage && r.edit && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(editing === r.id ? null : r.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-full border border-line-2 px-2.5 text-xs font-bold text-ink"
                    >
                      <Pencil aria-hidden className="size-3.5" />
                      수정
                    </button>
                    <button type="button" onClick={() => remove(r)} className="inline-flex h-8 items-center gap-1 rounded-full border border-line-2 px-2.5 text-xs font-bold text-ink">
                      <Trash2 aria-hidden className="size-3.5" />
                      삭제
                    </button>
                  </div>
                )}
              </div>
              {r.images && r.images.length > 0 && (
                <ul className="mt-2 flex gap-1.5" aria-label="사진 미리보기">
                  {r.images.map((src, i) => (
                    <li key={i} className="size-12 overflow-hidden rounded-lg bg-stone">
                      {/* eslint-disable-next-line @next/next/no-img-element -- 브라우저에 보관한 썸네일(data URL) */}
                      <img src={src} alt={`사진 ${i + 1}`} className="size-full object-cover" />
                    </li>
                  ))}
                </ul>
              )}
              {editing === r.id && r.edit && (
                <PostEditForm
                  id={r.id}
                  initial={r.edit}
                  onCancel={() => setEditing(null)}
                  onDone={(v) => {
                    updateDemoWrite(r.id, {
                      title: v.title,
                      body: v.content,
                      edit: { title: v.title, content: v.content, tags: v.tags.join(", ") },
                      editedAt: new Date().toISOString(),
                    });
                    setEditing(null);
                    setMessage("글을 고쳤어요.");
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-ink-3">데모 글은 서버에 저장되지 않아 목록 페이지에는 나오지 않아요. 비회원 글은 이 브라우저에서만 고치고 지울 수 있어요.</p>
    </section>
  );
}
