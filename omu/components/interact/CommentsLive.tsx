"use client";

import Link from "next/link";
import { CornerDownRight, Loader2, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AuthorLabel } from "@/components/detail/AuthorLabel";
import { Badge } from "@/components/ui";
import { buildThreads } from "@/lib/data/threads";
import type { Comment, CommentTarget, CommentThread } from "@/lib/data/types";
import { formatDateTime, formatRelative } from "@/lib/format";
import { getGuestSecret, guestHash, localWait, markLocal, peekGuestSecret } from "@/lib/guest/client";
import { guestNameInThread } from "@/lib/guest/names";
import { deleteItem, editItem, submitComment, type MyItems } from "@/lib/interact/actions";
import {
  addLocalComment,
  cachedSnapshot,
  hideLocal,
  readHidden,
  readLocalComments,
  subscribeLocal,
  threadKey,
  updateLocalComment,
  type LocalComment,
} from "@/lib/interact/local";
import { LIMITS } from "@/lib/write/validate";
import { ReportButton } from "./ReportButton";
import { Honeypot, useStartedAt } from "./SpamGuard";
import { useMyItems } from "./useMyItems";

type Props = {
  threadType: CommentTarget;
  threadId: string;
  /** 이 글 주소 (다시 그리기·신고 주소용) */
  path: string;
  initial: CommentThread[];
  title: string;
  acceptable: boolean;
  mode: "demo" | "supabase";
  /** 글쓴이가 비회원이면 그 이름 (같은 글 안에서 다른 비회원이 같은 이름을 받지 않게) */
  threadGuestName?: string | null;
};

const EMPTY_LOCAL: LocalComment[] = [];
const EMPTY_IDS: string[] = [];

function toComment(c: LocalComment, type: CommentTarget, id: string): Comment {
  return {
    id: c.id,
    targetType: type,
    targetId: id,
    parentId: c.parentId,
    content: c.content,
    isAnonymous: c.anonymous,
    isAccepted: false,
    author: c.author ? { id: "demo", nickname: c.author.nickname, role: c.author.role } : null,
    createdAt: c.createdAt,
    guestName: c.guestName,
    editedAt: c.editedAt ?? null,
  };
}

/**
 * 댓글 목록 + 작성·답글·수정·삭제·신고 (회원·비회원 공통)
 *  - Supabase 모드: 서버가 준 목록을 그리고, 작성·수정 후 서버에서 다시 받아온다.
 *  - 데모 모드: 목데이터 + 이 브라우저의 localStorage 댓글을 합쳐서 보여 준다.
 */
export function CommentsLive({ threadType, threadId, path, initial, title, acceptable, mode, threadGuestName = null }: Props) {
  const key = threadKey(threadType, threadId);
  const { items: my, reload } = useMyItems(threadType, threadId);
  const localSnap = useMemo(() => cachedSnapshot(() => readLocalComments(key)), [key]);
  const hiddenSnap = useMemo(() => cachedSnapshot(readHidden), []);
  const local = useSyncExternalStore(subscribeLocal, localSnap, () => EMPTY_LOCAL);
  const hidden = useSyncExternalStore(subscribeLocal, hiddenSnap, () => EMPTY_IDS);
  const [myTag, setMyTag] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 데모: 이 브라우저의 비회원 키(이 글 전용 해시) — 내 댓글 확인용
  useEffect(() => {
    const s = peekGuestSecret();
    if (mode === "demo" && s) guestHash(s, key).then(setMyTag);
  }, [mode, key, local.length]);

  const threads = useMemo(() => {
    if (mode === "supabase") return initial;
    const flat: Comment[] = initial.flatMap((t) => (t.deleted ? t.replies : [t, ...t.replies]));
    const merged = [...flat, ...local.filter((c) => !c.deleted).map((c) => toComment(c, threadType, threadId))].filter((c) => !hidden.includes(c.id));
    merged.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    return buildThreads(merged);
  }, [mode, initial, local, hidden, threadType, threadId]);

  const count = threads.reduce((n, t) => n + (t.deleted ? 0 : 1) + t.replies.length, 0);

  const localById = useMemo(() => new Map(local.map((c) => [c.id, c])), [local]);
  const perms = (c: Comment): { edit: boolean; remove: boolean } => {
    if (!my || c.deleted) return { edit: false, remove: false };
    if (mode === "supabase") {
      const own = my.comments.includes(c.id);
      return { edit: own, remove: own || my.admin };
    }
    const lc = localById.get(c.id);
    const own = Boolean(lc && ((lc.guestTag && lc.guestTag === myTag) || (lc.author && my.viewer.kind === "member" && lc.author.nickname === my.viewer.nickname)));
    return { edit: own, remove: own || my.admin };
  };

  async function onDelete(c: Comment) {
    if (!window.confirm("이 댓글을 지울까요? 지운 댓글은 되돌릴 수 없어요.")) return;
    const res = await deleteItem({ target: "comment", id: c.id, secret: peekGuestSecret(), path });
    if (res.status === "error") return setNotice(res.message);
    if (res.status === "demo") {
      if (localById.has(c.id)) updateLocalComment(c.id, { deleted: true });
      else hideLocal(c.id); // 데모 관리자가 목데이터 댓글을 숨긴 경우
    } else {
      reload();
    }
    setNotice("댓글을 지웠어요.");
  }

  // Supabase 모드: 서버 액션이 revalidatePath 로 지금 화면을 새 데이터로 다시 그려 준다.
  // (여기서 router.refresh() 를 또 부르면 ISR 의 이전 캐시(STALE)를 받아 화면이 되돌아갈 수 있다)
  function afterSaved() {
    if (mode === "supabase") reload();
  }

  const renderComment = (c: Comment, isReply: boolean) => {
    const p = perms(c);
    if (c.deleted) return <p className="text-sm text-ink-3">삭제된 댓글이에요.</p>;
    if (editing === c.id) {
      return (
        <EditBox
          comment={c}
          path={path}
          onCancel={() => setEditing(null)}
          onSaved={(content) => {
            setEditing(null);
            if (mode === "demo") updateLocalComment(c.id, { content, editedAt: new Date().toISOString() });
            afterSaved();
            setNotice("댓글을 고쳤어요.");
          }}
        />
      );
    }
    return (
      <div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
          <AuthorLabel author={c.author} anonymous={c.isAnonymous} guestName={c.guestName} />
          <time dateTime={c.createdAt} title={formatDateTime(c.createdAt)} suppressHydrationWarning>
            {formatRelative(c.createdAt)}
          </time>
          {c.editedAt && <span>(수정됨)</span>}
          {acceptable && c.isAccepted && <Badge tone="blue">채택된 답변</Badge>}
        </p>
        <p className="mt-1.5 whitespace-pre-line break-words text-[15px] leading-relaxed text-ink">{c.content}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-0.5 text-xs">
          {!isReply && (
            <button type="button" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold text-ink-3 hover:bg-stone hover:text-ink">
              <CornerDownRight aria-hidden className="size-3.5" />
              답글
            </button>
          )}
          {p.edit && (
            <button type="button" onClick={() => setEditing(c.id)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold text-ink-3 hover:bg-stone hover:text-ink">
              <Pencil aria-hidden className="size-3.5" />
              수정
            </button>
          )}
          {p.remove && (
            <button type="button" onClick={() => onDelete(c)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold text-ink-3 hover:bg-stone hover:text-coral-deep">
              <Trash2 aria-hidden className="size-3.5" />
              삭제
            </button>
          )}
          {!p.edit && <ReportButton targetType="comment" targetId={c.id} title={c.content.slice(0, 60)} path={`${path}#comment-${c.id}`} compact />}
        </div>
      </div>
    );
  };

  const onAdded = (c: LocalComment | null) => {
    if (c) addLocalComment(c);
    setReplyTo(null);
    afterSaved();
  };

  return (
    <section aria-labelledby="comments-title" className="mt-10">
      <h2 id="comments-title" className="flex items-center gap-2 text-lg font-extrabold text-ink">
        <MessageCircle aria-hidden className="size-5" />
        {title} <span className="font-display text-ink-3">{count}</span>
      </h2>
      {notice && (
        <p role="status" className="mt-3 rounded-xl bg-stone px-4 py-2.5 text-sm text-ink-2">
          {notice}
        </p>
      )}

      {threads.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-stone px-4 py-6 text-center text-sm text-ink-2">아직 {title}이 없어요. 첫 {title}을 남겨 보세요.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {threads.map((c) => (
            <li key={c.id} id={`comment-${c.id}`} className={`card scroll-mt-24 p-4 ${c.isAccepted ? "border-blue/50" : ""}`}>
              {renderComment(c, false)}
              {(c.replies.length > 0 || replyTo === c.id) && (
                <ul className="mt-3 space-y-3 border-l-2 border-line pl-3 sm:pl-4">
                  {c.replies.map((r) => (
                    <li key={r.id} id={`comment-${r.id}`} className="scroll-mt-24">
                      {renderComment(r, true)}
                    </li>
                  ))}
                  {replyTo === c.id && (
                    <li>
                      <Composer
                        my={my}
                        mode={mode}
                        threadType={threadType}
                        threadId={threadId}
                        path={path}
                        parentId={c.id}
                        label="답글"
                        entries={guestEntries(threads, local, threadGuestName)}
                        onDone={onAdded}
                        onCancel={() => setReplyTo(null)}
                      />
                    </li>
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Composer
          my={my}
          mode={mode}
          threadType={threadType}
          threadId={threadId}
          path={path}
          parentId={null}
          label={title}
          entries={guestEntries(threads, local, threadGuestName)}
          onDone={onAdded}
        />
      </div>
    </section>
  );
}

/** 같은 글 안의 비회원 이름 목록 (데모에서 이름 고르기용) */
function guestEntries(threads: CommentThread[], local: LocalComment[], threadGuestName: string | null) {
  const tags = new Map(local.map((c) => [c.id, c.guestTag]));
  const entries = threads.flatMap((t) => [t, ...t.replies]).map((c) => ({ tag: tags.get(c.id) ?? null, name: c.guestName }));
  if (threadGuestName) entries.push({ tag: null, name: threadGuestName });
  return entries;
}

function Composer({
  my,
  mode,
  threadType,
  threadId,
  path,
  parentId,
  label,
  entries,
  onDone,
  onCancel,
}: {
  my: MyItems | null;
  mode: "demo" | "supabase";
  threadType: CommentTarget;
  threadId: string;
  path: string;
  parentId: string | null;
  label: string;
  entries: { tag: string | null; name: string | null }[];
  onDone: (c: LocalComment | null) => void;
  onCancel?: () => void;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useStartedAt();
  const honeypot = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const guest = my?.viewer.kind !== "member";

  useEffect(() => {
    if (parentId) areaRef.current?.focus();
  }, [parentId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const content = text.trim();
    if (content.length < LIMITS.minComment) return setError(`${label}을 ${LIMITS.minComment}자 이상 적어 주세요.`);
    if (guest) {
      const wait = localWait("comment", 10);
      if (wait > 0) return setError(`너무 빨리 다시 쓰고 있어요. ${wait}초 뒤에 다시 시도해 주세요.`);
    }
    setBusy(true);
    const secret = guest ? getGuestSecret() : null;
    const res = await submitComment({
      threadType,
      threadId,
      parentId,
      content,
      anonymous,
      secret,
      website: honeypot.current?.value ?? "",
      startedAt: started.current,
      path,
    }).catch(() => ({ status: "error" as const, message: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." }));
    setBusy(false);
    if (res.status === "error") return setError(res.message);
    if (guest) markLocal("comment");
    setText("");
    setAnonymous(false);
    if (res.status === "demo") {
      const c = res.comment;
      onDone({
        ...c,
        threadKey: threadKey(threadType, threadId),
        guestName: c.guestTag ? guestNameInThread(c.guestTag, entries) : null,
      });
    } else {
      onDone(null);
    }
  }

  if (!my) {
    return <div className="h-[120px] animate-pulse rounded-2xl border border-line bg-card" aria-label="댓글 입력창 준비 중" />;
  }

  return (
    <form onSubmit={send} noValidate className="relative rounded-2xl border border-line bg-card p-3.5 sm:p-4">
      <label htmlFor={`${id}-text`} className="text-sm font-semibold text-ink-2">
        {parentId ? "답글 쓰기" : `${label} 쓰기`}
        {my.viewer.kind === "member" && <span className="ml-1.5 font-normal text-ink-3">{my.viewer.nickname}</span>}
      </label>
      <textarea
        ref={areaRef}
        id={`${id}-text`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={parentId ? 2 : 3}
        maxLength={LIMITS.comment}
        placeholder={guest ? "로그인 없이도 쓸 수 있어요. 서로 존중하는 말로 남겨 주세요." : "서로 존중하는 말로 남겨 주세요."}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : `${id}-hint`}
        className="mt-2 w-full resize-y rounded-xl border border-line-2 bg-paper px-3 py-2 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
      />
      <Honeypot inputRef={honeypot} />
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-semibold text-coral-deep">
          {error}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p id={`${id}-hint`} className="min-w-0 flex-1 text-xs leading-relaxed text-ink-3">
          {guest ? (
            <>
              비회원은 ‘새벽 기타리스트’ 같은 이름이 자동으로 붙고, 이 브라우저에서만 고칠 수 있어요.{" "}
              <Link href={`/login?next=${encodeURIComponent(path)}`} className="font-semibold text-ink-2 underline underline-offset-2">
                로그인
              </Link>
              하면 어디서든 관리할 수 있어요.
              {mode === "demo" && " (데모: 이 브라우저에만 저장)"}
            </>
          ) : (
            <label className="inline-flex items-center gap-1.5">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="size-4 accent-ink" />
              익명으로 쓰기
              {mode === "demo" && <span className="ml-1">(데모: 이 브라우저에만 저장)</span>}
            </label>
          )}
        </p>
        <div className="flex shrink-0 gap-1.5">
          {onCancel && (
            <button type="button" onClick={onCancel} className="h-9 rounded-full px-3 text-sm font-semibold text-ink-3 hover:text-ink">
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-bold text-paper disabled:opacity-60"
          >
            {busy && <Loader2 aria-hidden className="size-3.5 animate-spin" />}
            등록
          </button>
        </div>
      </div>
    </form>
  );
}

function EditBox({ comment, path, onCancel, onSaved }: { comment: Comment; path: string; onCancel: () => void; onSaved: (content: string) => void }) {
  const [text, setText] = useState(comment.content);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await editItem({ target: "comment", id: comment.id, content: text, secret: peekGuestSecret(), path }).catch(() => ({
      status: "error" as const,
      message: "고치지 못했어요.",
    }));
    setBusy(false);
    if (res.status === "error") return setError(res.message);
    onSaved(res.content);
  }
  return (
    <form onSubmit={save} noValidate>
      <label htmlFor={`${id}-edit`} className="text-xs font-semibold text-ink-3">
        댓글 고치기
      </label>
      <textarea
        id={`${id}-edit`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={LIMITS.comment}
        autoFocus
        className="mt-1 w-full resize-y rounded-xl border border-line-2 bg-paper px-3 py-2 text-[15px] text-ink focus:border-ink focus:outline-none"
      />
      {error && (
        <p role="alert" className="mt-1 text-sm font-semibold text-coral-deep">
          {error}
        </p>
      )}
      <div className="mt-2 flex justify-end gap-1.5">
        <button type="button" onClick={onCancel} className="h-9 rounded-full px-3 text-sm font-semibold text-ink-3 hover:text-ink">
          취소
        </button>
        <button type="submit" disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-bold text-paper disabled:opacity-60">
          {busy && <Loader2 aria-hidden className="size-3.5 animate-spin" />}
          저장
        </button>
      </div>
    </form>
  );
}
