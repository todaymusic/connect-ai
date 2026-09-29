"use client";

import { useRouter } from "next/navigation";
import { EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { useId, useMemo, useState, useSyncExternalStore } from "react";
import type { CommentTarget } from "@/lib/data/types";
import { peekGuestSecret } from "@/lib/guest/client";
import { deleteItem, editItem } from "@/lib/interact/actions";
import { cachedSnapshot, hideLocal, readHidden, subscribeLocal } from "@/lib/interact/local";
import { LIMITS } from "@/lib/write/validate";
import { useMyItems } from "./useMyItems";

const EMPTY: string[] = [];

/**
 * 글 작성자(회원·같은 브라우저의 비회원)·관리자에게만 보이는 수정·삭제 버튼
 *  - 커뮤니티 글: 수정(제목·본문·태그) + 삭제
 *  - 장터·구인 글: 삭제 (수정은 다음 업데이트)
 *  - 삭제는 실제로 지우지 않고 숨김 처리(deleted_at)한다.
 */
export function ThreadOwnerActions({
  threadType,
  threadId,
  path,
  listPath,
  edit,
}: {
  threadType: Extract<CommentTarget, "post" | "market" | "recruit">;
  threadId: string;
  path: string;
  listPath: string;
  /** 커뮤니티 글 수정용 현재 값 */
  edit?: { title: string; content: string; tags: string };
}) {
  const router = useRouter();
  const { items: my } = useMyItems(threadType, threadId);
  const hiddenSnap = useMemo(() => cachedSnapshot(readHidden), []);
  const hidden = useSyncExternalStore(subscribeLocal, hiddenSnap, () => EMPTY);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (hidden.includes(`${threadType}:${threadId}`)) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl bg-stone px-4 py-3 text-sm text-ink-2">
        <EyeOff aria-hidden className="size-4" />
        (데모) 이 브라우저에서 숨김 처리한 글이에요. 실제 서비스에서는 목록·검색에서 빠져요.
      </p>
    );
  }
  if (!my || !(my.thread || my.admin)) return null;
  const canEdit = Boolean(edit) && threadType === "post" && (my.thread || my.admin) && my.mode === "supabase";

  async function onDelete() {
    if (!window.confirm("이 글을 지울까요? 지운 글은 목록과 검색에서 사라지고 되돌릴 수 없어요.")) return;
    setBusy(true);
    const res = await deleteItem({ target: threadType, id: threadId, secret: peekGuestSecret(), path, listPath });
    setBusy(false);
    if (res.status === "error") return setError(res.message);
    if (res.status === "demo") {
      hideLocal(`${threadType}:${threadId}`);
      return;
    }
    router.push(listPath);
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink-3">{my.admin && !my.thread ? "관리자 권한으로 관리" : my.viewer.kind === "guest" ? "이 브라우저에서 쓴 글이에요" : "내가 쓴 글이에요"}</p>
        <div className="flex gap-1.5">
          {canEdit && (
            <button type="button" onClick={() => setEditing((v) => !v)} className="inline-flex h-8 items-center gap-1 rounded-full border border-line-2 px-3 text-xs font-bold text-ink hover:border-ink-3">
              <Pencil aria-hidden className="size-3.5" />
              수정
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-line-2 px-3 text-xs font-bold text-ink hover:border-coral hover:text-coral-deep disabled:opacity-60"
          >
            {busy ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <Trash2 aria-hidden className="size-3.5" />}
            삭제
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-coral-deep">
          {error}
        </p>
      )}
      {editing && edit && (
        <PostEditForm
          id={threadId}
          path={path}
          initial={edit}
          onDone={() => setEditing(false)}
        />
      )}
    </div>
  );
}

/** 커뮤니티 글 수정 폼 (제목·본문·태그) — 상세 화면과 데모 보관함이 같이 쓴다 */
export function PostEditForm({
  id,
  path,
  initial,
  onDone,
  onCancel,
}: {
  id: string;
  path?: string;
  initial: { title: string; content: string; tags: string };
  onDone: (v: { title: string; content: string; tags: string[] }) => void;
  onCancel?: () => void;
}) {
  const uid = useId();
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [tags, setTags] = useState(initial.tags);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await editItem({ target: "post", id, title, content, tags, secret: peekGuestSecret(), path }).catch(() => ({
      status: "error" as const,
      message: "고치지 못했어요. 잠시 후 다시 시도해 주세요.",
      fieldErrors: undefined,
    }));
    setBusy(false);
    if (res.status === "error") {
      setMessage(res.message);
      setErrors(res.fieldErrors ?? {});
      return;
    }
    onDone({ title: res.title ?? title, content: res.content, tags: res.tags ?? [] });
  }

  const input = "mt-1 w-full rounded-xl border border-line-2 bg-paper px-3 py-2 text-[15px] text-ink focus:border-ink focus:outline-none";
  return (
    <form onSubmit={save} noValidate className="mt-3 space-y-3 border-t border-line pt-3">
      {message && (
        <p role="alert" className="text-sm font-semibold text-coral-deep">
          {message}
        </p>
      )}
      <div>
        <label htmlFor={`${uid}-t`} className="text-sm font-bold text-ink">
          제목
        </label>
        <input id={`${uid}-t`} value={title} maxLength={LIMITS.title} onChange={(e) => setTitle(e.target.value)} className={input} aria-invalid={errors.title ? true : undefined} />
        {errors.title && <p className="mt-1 text-xs font-semibold text-coral-deep">{errors.title}</p>}
      </div>
      <div>
        <label htmlFor={`${uid}-c`} className="text-sm font-bold text-ink">
          본문
        </label>
        <textarea id={`${uid}-c`} value={content} rows={8} maxLength={LIMITS.content} onChange={(e) => setContent(e.target.value)} className={input} aria-invalid={errors.content ? true : undefined} />
        {errors.content && <p className="mt-1 text-xs font-semibold text-coral-deep">{errors.content}</p>}
      </div>
      <div>
        <label htmlFor={`${uid}-g`} className="text-sm font-bold text-ink">
          태그 <span className="font-normal text-ink-3">(쉼표로 구분, {LIMITS.tags}개까지)</span>
        </label>
        <input id={`${uid}-g`} value={tags} onChange={(e) => setTags(e.target.value)} className={input} />
        {errors.tags && <p className="mt-1 text-xs font-semibold text-coral-deep">{errors.tags}</p>}
      </div>
      <div className="flex justify-end gap-1.5">
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-9 rounded-full px-3 text-sm font-semibold text-ink-3 hover:text-ink">
            취소
          </button>
        )}
        <button type="submit" disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-bold text-paper disabled:opacity-60">
          {busy && <Loader2 aria-hidden className="size-3.5 animate-spin" />}
          저장
        </button>
      </div>
    </form>
  );
}
