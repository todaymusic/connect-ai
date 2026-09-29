"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeNextPath } from "../auth-providers";
import {
  ARTICLE_CATEGORIES,
  COMMUNITY_CATEGORIES,
  DIFFICULTIES,
  ITEM_CONDITIONS,
  MARKET_CATEGORIES,
  QNA_SUBJECTS,
  RECRUIT_CATEGORIES,
  RECRUIT_LEVELS,
  SCORE_INSTRUMENTS,
  TRADE_TYPES,
  articlePath,
} from "../site";
import { getDataSource } from "../data/source";
import { getSupabaseServerClient } from "../supabase/server";
import { DEMO_ROLE_COOKIE, DEMO_ROLES, canWrite, denyReason, type WriteType } from "./config";
import {
  formToRaw,
  validateArticle,
  validateCommunity,
  validateMarket,
  validateRecruit,
  validateScore,
  validateScoreRequest,
  type FieldErrors,
  type Raw,
  type Validated,
} from "./validate";
import { getWriterState, type Writer } from "./writer";

/* ───────── 결과 타입 ───────── */
export type DemoRecord = {
  id: string;
  type: WriteType;
  title: string;
  createdAt: string;
  /** 미리보기에 보여줄 [항목, 값] */
  fields: [string, string][];
  body: string;
};

export type WriteResult =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: FieldErrors; values?: Raw }
  | { status: "demo"; record: DemoRecord };

type Insert = { table: string; row: Record<string, unknown>; select: string };
type Plan<T> = {
  type: WriteType;
  validate: (raw: Raw) => Validated<T>;
  insert: (data: T, writer: Writer) => Insert;
  /** 저장 후 이동할 주소 (insert 결과 행을 받는다) */
  path: (data: T, row: Record<string, string>) => string;
  revalidate: string[];
  preview: (data: T) => { title: string; body: string; fields: [string, string][] };
};

function dbErrorMessage(e: { code?: string; message: string }): string {
  if (e.code === "23505") return "이미 같은 주소(slug)를 쓰는 글이 있어요. 주소를 바꿔 주세요.";
  if (e.code === "42501" || /row-level security/i.test(e.message)) return "이 글을 쓸 권한이 없어요. 로그인 상태와 역할을 확인해 주세요.";
  if (e.code === "PGRST204" || e.code === "42703")
    return "DB에 새 입력 항목이 아직 없어요. 관리자는 supabase/migrations/20260929_write_fields.sql 을 적용해 주세요.";
  if (e.code === "23514" || e.code === "22P02" || e.code === "23502") return "입력값이 허용 범위를 벗어났어요. 내용을 다시 확인해 주세요.";
  return "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

async function run<T>(plan: Plan<T>, fd: FormData): Promise<WriteResult> {
  const raw = formToRaw(fd);
  const state = await getWriterState();
  const writer = state.writer;
  if (!writer) return { status: "error", message: "로그인한 회원만 글을 쓸 수 있어요.", values: raw };
  if (!canWrite(writer.role, plan.type)) return { status: "error", message: denyReason(writer.role, plan.type) ?? "권한이 없어요.", values: raw };

  const v = plan.validate(raw);
  if (!v.ok) return { status: "error", message: "입력한 내용을 확인해 주세요.", fieldErrors: v.errors, values: raw };

  // 데모 모드: 서버에 저장하지 않고, 검증을 통과한 결과만 돌려준다(브라우저가 localStorage 에 보관)
  if (state.mode === "demo") {
    const p = plan.preview(v.data);
    return {
      status: "demo",
      record: { id: `demo-${Date.now().toString(36)}`, type: plan.type, createdAt: new Date().toISOString(), ...p },
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { status: "error", message: "로그인 서버에 연결하지 못했어요.", values: raw };
  const { table, row, select } = plan.insert(v.data, writer);
  const { data, error } = await supabase.from(table).insert(row).select(select).single();
  if (error || !data) return { status: "error", message: dbErrorMessage(error ?? { message: "" }), values: raw };

  plan.revalidate.forEach((p) => revalidatePath(p));
  redirect(plan.path(v.data, data as unknown as Record<string, string>));
}

/* ───────── 유형별 계획 ───────── */

export async function submitCommunity(_prev: WriteResult, fd: FormData): Promise<WriteResult> {
  return run(
    {
      type: "community",
      validate: validateCommunity,
      insert: (d, w) => ({
        table: "posts",
        // ⚠️ 반환 컬럼은 id 만 — posts 는 author_id 를 읽을 수 없어서 select('*') 는 권한 오류가 난다
        select: "id",
        row: { category: d.category, qna_subject: d.qna_subject, title: d.title, content: d.content, youtube_url: d.youtube_url, is_anonymous: d.is_anonymous, tags: d.tags, author_id: w.id },
      }),
      path: (d, r) => `/community/${d.category}/${r.id}`,
      revalidate: ["/community", "/"],
      preview: (d) => ({
        title: d.title,
        body: d.content,
        fields: [
          ["게시판", COMMUNITY_CATEGORIES[d.category]],
          ...(d.qna_subject ? ([["과목", QNA_SUBJECTS[d.qna_subject]]] as [string, string][]) : []),
          ["작성자 표시", d.is_anonymous ? "익명" : "닉네임"],
          ...(d.tags.length ? ([["태그", d.tags.join(", ")]] as [string, string][]) : []),
          ...(d.youtube_url ? ([["영상", d.youtube_url]] as [string, string][]) : []),
        ],
      }),
    },
    fd,
  );
}

export async function submitMarket(_prev: WriteResult, fd: FormData): Promise<WriteResult> {
  return run(
    {
      type: "market",
      validate: validateMarket,
      insert: (d, w) => ({ table: "market_items", select: "id", row: { ...d, status: "selling", seller_id: w.id } }),
      path: (_d, r) => `/gear/market/${r.id}`,
      revalidate: ["/gear/market", "/gear", "/"],
      preview: (d) => ({
        title: d.title,
        body: d.description,
        fields: [
          ["거래", TRADE_TYPES[d.trade_type]],
          ["종류", MARKET_CATEGORIES[d.category]],
          ["가격", d.trade_type === "share" ? "무료 나눔" : `${d.price.toLocaleString("ko-KR")}원`],
          ["지역", d.region],
          ["물건 상태", d.item_condition ? ITEM_CONDITIONS[d.item_condition] : "—"],
          ["연락 안내", d.contact ?? "—"],
        ],
      }),
    },
    fd,
  );
}

export async function submitRecruit(_prev: WriteResult, fd: FormData): Promise<WriteResult> {
  return run(
    {
      type: "recruit",
      validate: validateRecruit,
      insert: (d, w) => ({ table: "recruits", select: "id", row: { ...d, author_id: w.id } }),
      path: (d, r) => `/recruit/${d.category}/${r.id}`,
      revalidate: ["/recruit", "/"],
      preview: (d) => ({
        title: d.title,
        body: d.description,
        fields: [
          ["모집 유형", RECRUIT_CATEGORIES[d.category]],
          ["성격", d.recruit_level ? RECRUIT_LEVELS[d.recruit_level] : "—"],
          ["지역", d.region],
          ["모집 역할", d.positions.join(", ") || "—"],
          ["마감일", d.deadline ?? "상시 모집"],
        ],
      }),
    },
    fd,
  );
}

export async function submitScoreRequest(_prev: WriteResult, fd: FormData): Promise<WriteResult> {
  return run(
    {
      type: "score-request",
      validate: validateScoreRequest,
      insert: (d, w) => ({ table: "score_requests", select: "id", row: { ...d, author_id: w.id } }),
      path: () => "/score/requests",
      revalidate: ["/score/requests"],
      preview: (d) => ({ title: d.song_title, body: d.description ?? "", fields: [["악기", SCORE_INSTRUMENTS[d.instrument]]] }),
    },
    fd,
  );
}

export async function submitScore(_prev: WriteResult, fd: FormData): Promise<WriteResult> {
  // Supabase 모드에서는 PDF 가 Storage 에 먼저 올라가 있어야 한다(브라우저가 업로드 후 경로를 넘긴다)
  const requireFile = getDataSource() === "supabase";
  return run(
    {
      type: "score",
      validate: (raw) => validateScore(raw, { requireFile }),
      insert: (d, w) => ({
        table: "scores",
        select: "id, slug",
        row: {
          title: d.title,
          slug: d.slug,
          instrument: d.instrument,
          difficulty: d.difficulty,
          genre: d.genre,
          artist: d.artist,
          meta_description: d.meta_description,
          file_url: d.file_path,
          author_id: w.id,
        },
      }),
      path: (d) => `/score/${d.instrument}/${d.slug}`,
      revalidate: ["/score", "/"],
      preview: (d) => ({
        title: d.title,
        body: d.meta_description,
        fields: [
          ["주소", `/score/${d.instrument}/${d.slug}`],
          ["악기", SCORE_INSTRUMENTS[d.instrument]],
          ["난이도", DIFFICULTIES[d.difficulty]],
          ["장르", d.genre ?? "—"],
          ["작곡·아티스트", d.artist ?? "—"],
          ["PDF", d.file_name ?? "데모 모드 — 파일은 저장하지 않아요"],
        ],
      }),
    },
    fd,
  );
}

export async function submitArticle(_prev: WriteResult, fd: FormData): Promise<WriteResult> {
  const state = await getWriterState();
  const isAdmin = state.writer?.role === "admin";
  return run(
    {
      type: "article",
      validate: validateArticle,
      insert: (d, w) => ({
        table: "articles",
        select: "id, slug",
        // 발행은 관리자만(에디터가 보내도 DB 트리거가 false 로 되돌린다)
        row: { ...d, is_published: isAdmin && d.is_published, author_id: w.id },
      }),
      path: (d) => (isAdmin && d.is_published ? articlePath(d.category, d.slug) : "/write?saved=article"),
      revalidate: ["/info", "/gear", "/"],
      preview: (d) => ({
        title: d.title,
        body: d.content,
        fields: [
          ["분류", ARTICLE_CATEGORIES[d.category]],
          ["주소", articlePath(d.category, d.slug)],
          ["작성자 표기", d.author_display === "editor" ? "OMU 에디터" : "닉네임"],
          ["발행", isAdmin && d.is_published ? "바로 발행" : "초안 (관리자 발행 대기)"],
        ],
      }),
    },
    fd,
  );
}

/* ───────── 데모 역할 바꾸기 (Supabase 미연결일 때만) ───────── */
export async function setDemoRole(fd: FormData): Promise<void> {
  const next = safeNextPath(String(fd.get("next") ?? "/write"), "/write");
  if (getDataSource() === "supabase") redirect(next); // 실제 서비스에서는 아무 일도 하지 않는다
  const role = String(fd.get("role") ?? "");
  const store = await cookies();
  if (role in DEMO_ROLES && role !== "signed_out") {
    store.set(DEMO_ROLE_COOKIE, role, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
  } else {
    store.delete(DEMO_ROLE_COOKIE);
  }
  redirect(next);
}
