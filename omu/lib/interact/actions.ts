"use server";

// 댓글 · 수정 · 삭제(숨김) · 신고 · 내 항목 확인 — 회원·비회원 공통 서버 액션
//  · Supabase 모드: schema.sql 11) 의 RPC 로만 쓴다(권한·길이·도배 제한을 DB 가 최종 판정).
//  · 데모 모드  : 같은 검증·제한을 거친 뒤 결과만 돌려준다. 브라우저가 localStorage 에 보관한다.
import { revalidatePath } from "next/cache";
import type { CommentTarget } from "../data/types";
import { GUEST_SECRET_PATTERN, clientKey, guestHashServer, memThrottle, rpcMessage, spamCheck } from "../guard/server";
import type { Role } from "../site";
import { getSupabaseServerClient } from "../supabase/server";
import { validateComment, validatePostEdit, validateReport, type FieldErrors } from "../write/validate";
import { getWriterState } from "../write/writer";

const THREAD_TYPES: CommentTarget[] = ["post", "recruit", "market", "article", "score"];
const REPORT_TYPES = ["post", "recruit", "market", "article", "score", "comment", "score_request"] as const;
export type ReportTarget = (typeof REPORT_TYPES)[number];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEMO_ID = /^[A-Za-z0-9_-]{1,64}$/;
/** 다시 그릴(revalidate) 수 있는 주소만 — 임의 경로 무효화 방지 */
const SAFE_PATH = /^\/(community|gear|recruit|score|info)(\/[A-Za-z0-9_-]+){0,3}$/;

export type Viewer = { kind: "guest" } | { kind: "member"; nickname: string; role: Role };
export type ActionError = { status: "error"; message: string; fieldErrors?: FieldErrors };

type Ctx = Awaited<ReturnType<typeof context>>;
async function context() {
  const state = await getWriterState();
  const viewer: Viewer = state.writer ? { kind: "member", nickname: state.writer.nickname, role: state.writer.role } : { kind: "guest" };
  return { state, viewer, mode: state.mode, guest: !state.writer };
}

function idOk(ctx: Ctx, id: string | null | undefined): boolean {
  return Boolean(id) && (ctx.mode === "supabase" ? UUID.test(id as string) : DEMO_ID.test(id as string));
}

function refresh(path: string | undefined, extra: string[] = []) {
  for (const p of [path, ...extra]) if (p && SAFE_PATH.test(p)) revalidatePath(p);
}

/** 비회원 비밀값 확인 + 도배 제한 키 */
function guestKeys(secret: string | null | undefined): { ok: true; actor: string } | { ok: false } {
  if (!secret || !GUEST_SECRET_PATTERN.test(secret)) return { ok: false };
  return { ok: true, actor: guestHashServer(secret, "actor") };
}

async function throttle(ctx: Ctx, kind: "comment" | "report" | "edit", secret: string | null | undefined): Promise<string | null> {
  if (!ctx.guest) return memThrottle(kind, `u:${ctx.state.writer!.id}`, false);
  const client = await clientKey();
  const g = guestKeys(secret);
  return memThrottle(kind, `c:${client}`, true) ?? (g.ok ? memThrottle(kind, `g:${g.actor}`, true) : null);
}

const NO_SECRET: ActionError = { status: "error", message: "비회원 확인 정보가 없어요. 페이지를 새로 고친 뒤 다시 시도해 주세요." };

/* ───────── 내 항목 (수정·삭제 버튼 표시용) ───────── */
export type MyItems = {
  mode: "demo" | "supabase";
  viewer: Viewer;
  admin: boolean;
  /** 글(스레드) 자체를 고치거나 지울 수 있는지 */
  thread: boolean;
  /** 고치거나 지울 수 있는 댓글 id (데모 모드 비회원 댓글은 브라우저가 직접 확인) */
  comments: string[];
};

export async function getMyItems(threadType: CommentTarget, threadId: string, secret: string | null): Promise<MyItems> {
  const ctx = await context();
  const base: MyItems = { mode: ctx.mode, viewer: ctx.viewer, admin: ctx.viewer.kind === "member" && ctx.viewer.role === "admin", thread: false, comments: [] };
  if (!THREAD_TYPES.includes(threadType) || !idOk(ctx, threadId) || ctx.mode === "demo") return base;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return base;
  const { data, error } = await supabase.rpc("omu_my_items", {
    p_thread_type: threadType,
    p_thread_id: threadId,
    p_secret: secret && GUEST_SECRET_PATTERN.test(secret) ? secret : null,
  });
  if (error || !Array.isArray(data)) return base;
  const rows = data as { kind: string; id: string | null }[];
  return {
    ...base,
    admin: rows.some((r) => r.kind === "admin"),
    thread: rows.some((r) => r.kind === "thread"),
    comments: rows.filter((r) => r.kind === "comment" && r.id).map((r) => r.id as string),
  };
}

/* ───────── 댓글 작성 ───────── */
export type NewComment = {
  id: string;
  parentId: string | null;
  content: string;
  anonymous: boolean;
  createdAt: string;
  /** 회원이면 닉네임·역할, 비회원이면 null */
  author: { nickname: string; role: Role } | null;
  /** 비회원: sha256(비밀값|대상종류:대상id) — 같은 글 안 같은 이름 + 이 브라우저 소유 확인용 */
  guestTag: string | null;
};
export type CommentResult = ActionError | { status: "ok" } | { status: "demo"; comment: NewComment };

export async function submitComment(input: {
  threadType: CommentTarget;
  threadId: string;
  parentId?: string | null;
  content: string;
  anonymous?: boolean;
  secret?: string | null;
  website?: string;
  startedAt?: number;
  path?: string;
}): Promise<CommentResult> {
  const ctx = await context();
  if (!THREAD_TYPES.includes(input.threadType) || !idOk(ctx, input.threadId)) return { status: "error", message: "댓글을 달 글을 찾을 수 없어요." };
  if (input.parentId && !idOk(ctx, input.parentId)) return { status: "error", message: "답글 대상 댓글이 올바르지 않아요." };
  const spam = ctx.guest ? spamCheck({ website: input.website, startedAt: input.startedAt }) : input.website ? spamCheck({ website: input.website }) : null;
  if (spam) return { status: "error", message: spam };
  const invalid = validateComment(input.content ?? "");
  if (invalid) return { status: "error", message: invalid, fieldErrors: { content: invalid } };
  if (ctx.guest && !guestKeys(input.secret).ok) return NO_SECRET;
  const limited = await throttle(ctx, "comment", input.secret);
  if (limited) return { status: "error", message: limited };

  const content = input.content.trim();
  if (ctx.mode === "demo") {
    const w = ctx.state.writer;
    return {
      status: "demo",
      comment: {
        id: `lc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        parentId: input.parentId ?? null,
        content,
        anonymous: Boolean(input.anonymous) && !ctx.guest,
        createdAt: new Date().toISOString(),
        author: w ? { nickname: w.nickname, role: w.role } : null,
        guestTag: ctx.guest ? guestHashServer(input.secret as string, `${input.threadType}:${input.threadId}`) : null,
      },
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { status: "error", message: "서버에 연결하지 못했어요." };
  const { error } = await supabase.rpc("omu_create_comment", {
    p_target_type: input.threadType,
    p_target_id: input.threadId,
    p_parent_id: input.parentId ?? null,
    p_content: content,
    p_anonymous: Boolean(input.anonymous),
    p_secret: ctx.guest ? input.secret : null,
    p_client: ctx.guest ? await clientKey() : null,
  });
  if (error) return { status: "error", message: rpcMessage(error, "댓글을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.") };
  refresh(input.path);
  return { status: "ok" };
}

/* ───────── 수정 ───────── */
export type EditResult = ActionError | { status: "ok" | "demo"; title?: string; content: string; tags?: string[] };

export async function editItem(input: {
  target: "post" | "comment";
  id: string;
  title?: string;
  content: string;
  tags?: string;
  secret?: string | null;
  path?: string;
}): Promise<EditResult> {
  const ctx = await context();
  if (!idOk(ctx, input.id)) return { status: "error", message: "고칠 글을 찾을 수 없어요." };
  let patch: { title?: string; content: string; tags?: string[] };
  if (input.target === "post") {
    const v = validatePostEdit({ title: input.title ?? "", content: input.content ?? "", tags: input.tags ?? "" });
    if (!v.ok) return { status: "error", message: "입력한 내용을 확인해 주세요.", fieldErrors: v.errors };
    patch = v.data;
  } else {
    const invalid = validateComment(input.content ?? "");
    if (invalid) return { status: "error", message: invalid, fieldErrors: { content: invalid } };
    patch = { content: input.content.trim() };
  }
  if (ctx.guest && !guestKeys(input.secret).ok) return NO_SECRET;
  const limited = await throttle(ctx, "edit", input.secret);
  if (limited) return { status: "error", message: limited };

  // 데모: 권한은 브라우저의 보관 기록(비회원 해시·데모 역할)으로 확인하고, 검증 결과만 돌려준다
  if (ctx.mode === "demo") return { status: "demo", ...patch };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { status: "error", message: "서버에 연결하지 못했어요." };
  const secret = ctx.guest ? input.secret : null;
  const { error } =
    input.target === "post"
      ? await supabase.rpc("omu_edit_post", { p_id: input.id, p_title: patch.title, p_content: patch.content, p_tags: patch.tags, p_secret: secret })
      : await supabase.rpc("omu_edit_comment", { p_id: input.id, p_content: patch.content, p_secret: secret });
  if (error) return { status: "error", message: rpcMessage(error, "고치지 못했어요. 잠시 후 다시 시도해 주세요.") };
  refresh(input.path, input.target === "post" ? ["/community"] : []);
  return { status: "ok", ...patch };
}

/* ───────── 삭제 (숨김) ───────── */
export async function deleteItem(input: {
  target: "post" | "comment" | "market" | "recruit";
  id: string;
  secret?: string | null;
  path?: string;
  listPath?: string;
}): Promise<ActionError | { status: "ok" | "demo" }> {
  const ctx = await context();
  if (!["post", "comment", "market", "recruit"].includes(input.target) || !idOk(ctx, input.id)) return { status: "error", message: "지울 글을 찾을 수 없어요." };
  if (ctx.guest && (input.target === "market" || input.target === "recruit")) return { status: "error", message: "장터·구인 글은 작성한 회원만 지울 수 있어요." };
  if (ctx.guest && !guestKeys(input.secret).ok) return NO_SECRET;
  const limited = await throttle(ctx, "edit", input.secret);
  if (limited) return { status: "error", message: limited };
  if (ctx.mode === "demo") return { status: "demo" };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { status: "error", message: "서버에 연결하지 못했어요." };
  const { error } = await supabase.rpc("omu_soft_delete", { p_target: input.target, p_id: input.id, p_secret: ctx.guest ? input.secret : null });
  if (error) return { status: "error", message: rpcMessage(error, "지우지 못했어요. 잠시 후 다시 시도해 주세요.") };
  refresh(input.path, [input.listPath ?? "", "/"]);
  return { status: "ok" };
}

/* ───────── 신고 ───────── */
const DEMO_REPORTED = new Set<string>();

export async function submitReport(input: {
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  detail?: string;
  secret?: string | null;
  website?: string;
  startedAt?: number;
}): Promise<ActionError | { status: "ok" | "demo"; reporter: "guest" | Role }> {
  const ctx = await context();
  const reporter = ctx.viewer.kind === "member" ? ctx.viewer.role : "guest";
  if (!REPORT_TYPES.includes(input.targetType) || !idOk(ctx, input.targetId)) return { status: "error", message: "신고할 글을 찾을 수 없어요." };
  const spam = ctx.guest ? spamCheck({ website: input.website, startedAt: input.startedAt }) : input.website ? spamCheck({ website: input.website }) : null;
  if (spam) return { status: "error", message: spam };
  const detail = (input.detail ?? "").trim();
  const invalid = validateReport(input.reason, detail);
  if (invalid) return { status: "error", message: invalid };
  const g = guestKeys(input.secret);
  if (ctx.guest && !g.ok) return NO_SECRET;

  if (ctx.mode === "demo") {
    // 데모: 같은 사람(비회원 키·데모 역할)이 같은 대상을 두 번 신고하지 못하게 (서버 메모리)
    const who = ctx.guest && g.ok ? g.actor : `u:${ctx.state.writer?.id}`;
    const key = `${who}:${input.targetType}:${input.targetId}`;
    if (DEMO_REPORTED.has(key)) return { status: "error", message: "이미 신고한 글이에요. 운영자가 확인할 때까지 기다려 주세요." };
    const limited = await throttle(ctx, "report", input.secret);
    if (limited) return { status: "error", message: limited };
    if (DEMO_REPORTED.size > 5000) DEMO_REPORTED.clear();
    DEMO_REPORTED.add(key);
    return { status: "demo", reporter };
  }

  const limited = await throttle(ctx, "report", input.secret);
  if (limited) return { status: "error", message: limited };
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { status: "error", message: "서버에 연결하지 못했어요." };
  const { error } = await supabase.rpc("omu_report", {
    p_target_type: input.targetType,
    p_target_id: input.targetId,
    p_reason: input.reason,
    p_detail: detail || null,
    p_secret: ctx.guest ? input.secret : null,
    p_client: ctx.guest ? await clientKey() : null,
  });
  if (error) return { status: "error", message: rpcMessage(error, "신고를 접수하지 못했어요. 잠시 후 다시 시도해 주세요.") };
  return { status: "ok", reporter };
}
