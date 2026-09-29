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
import { DEMO_ARTICLES } from "../data/demo/articles";
import { DEMO_SCORES } from "../data/demo/scores";
import { marketImageUrl } from "../data/storage";
import { pickGuestName } from "../guest/names";
import { GUEST_SECRET_PATTERN, clientKey, guestHashServer, memThrottle, rpcMessage, spamCheck } from "../guard/server";
import { uniqueSlug } from "../slug";
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
  /** 비회원 글: 자동 표시 이름 + 소유 확인용 해시(sha256(비밀값|post:id)) */
  guest?: { name: string; tag: string };
  /** 데모 장터 사진 미리보기(작은 썸네일 data URL — 브라우저에서 붙인다) */
  images?: string[];
  editedAt?: string;
  /** 커뮤니티 글 원본 값 (보관함에서 수정할 때 사용) */
  edit?: { title: string; content: string; tags: string };
};

export type WriteResult =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: FieldErrors; values?: Raw }
  | { status: "demo"; record: DemoRecord };

type Insert = { table: string; row: Record<string, unknown>; select: string };
type Plan<T> = {
  type: WriteType;
  validate: (raw: Raw) => Validated<T>;
  insert: (data: T, writer: Writer) => Insert | { error: string };
  /** 비회원 저장 (Supabase RPC). 없으면 비회원은 쓸 수 없다 */
  guestRpc?: (data: T, secret: string, client: string) => { fn: string; args: Record<string, unknown> };
  /** 데모 보관함에서 다시 고칠 수 있게 원본 값을 남긴다 */
  editable?: (data: T) => DemoRecord["edit"];
  /** 저장 후 이동할 주소 (insert 결과 행을 받는다) */
  path: (data: T, row: Record<string, string>) => string;
  revalidate: string[];
  preview: (data: T) => { title: string; body: string; fields: [string, string][] };
  /**
   * 제목으로 만든 주소(data.slug)를 저장 직전에 겹치지 않게 맞춘다(-2, -3 …).
   * scores·articles 의 slug 는 DB 전체에서 unique 라 분류와 관계없이 확인한다.
   */
  uniqueSlug?: { table: "scores" | "articles"; demoTaken: () => string[] };
};

type Slugged = { slug: string };
type ServerClient = NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>;

/** base, base-2, base-3 … 처럼 이미 쓰인 주소 (slug 는 영문 소문자·숫자·하이픈뿐이라 그대로 패턴에 넣어도 안전) */
function sameBase(base: string, slugs: string[]): string[] {
  const re = new RegExp(`^${base}(-\\d+)?$`);
  return slugs.filter((s) => re.test(s));
}

async function takenSlugs(supabase: ServerClient, table: string, base: string): Promise<string[]> {
  const { data } = await supabase.from(table).select("slug").like("slug", `${base}%`).limit(1000);
  return sameBase(base, ((data ?? []) as unknown as Slugged[]).map((r) => r.slug));
}

function dbErrorMessage(e: { code?: string; message: string }): string {
  if (e.code === "23505") return "같은 제목의 글이 동시에 저장되고 있어요. 잠시 후 다시 시도해 주세요.";
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
  const guest = !writer;
  if (!canWrite(writer?.role ?? null, plan.type) || (guest && !plan.guestRpc)) {
    return { status: "error", message: denyReason(writer?.role ?? null, plan.type) ?? "권한이 없어요.", values: raw };
  }

  // 스팸 방지: 숨은 입력칸(honeypot)은 모두, 작성 시간 검사는 비회원만
  const spam = guest ? spamCheck({ website: raw.website, startedAt: raw.started_at }) : raw.website ? spamCheck({ website: raw.website }) : null;
  if (spam) return { status: "error", message: spam, values: raw };
  const secret = raw.guest_secret ?? "";
  if (guest && !GUEST_SECRET_PATTERN.test(secret)) {
    return { status: "error", message: "비회원 확인 정보가 없어요. 페이지를 새로 고친 뒤 다시 시도해 주세요.", values: raw };
  }

  const v = plan.validate(raw);
  if (!v.ok) return { status: "error", message: "입력한 내용을 확인해 주세요.", fieldErrors: v.errors, values: raw };

  // 연속 작성 제한 (서버 메모리 — 최종 방어는 DB)
  const client = await clientKey();
  const limited =
    memThrottle("post", guest ? `c:${client}` : `u:${writer.id}:${plan.type}`, guest) ??
    (guest ? memThrottle("post", `g:${guestHashServer(secret, "actor")}`, true) : null);
  if (limited) return { status: "error", message: limited, values: raw };

  // 데모 모드: 서버에 저장하지 않고, 검증을 통과한 결과만 돌려준다(브라우저가 localStorage 에 보관)
  if (state.mode === "demo") {
    if (plan.uniqueSlug) {
      const d = v.data as unknown as Slugged;
      d.slug = uniqueSlug(d.slug, sameBase(d.slug, plan.uniqueSlug.demoTaken()));
    }
    const p = plan.preview(v.data);
    const id = `demo-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const tag = guest ? guestHashServer(secret, `post:${id}`) : null;
    const guestInfo = tag ? { name: pickGuestName(tag, []), tag } : undefined;
    return {
      status: "demo",
      record: {
        id,
        type: plan.type,
        createdAt: new Date().toISOString(),
        ...p,
        fields: guestInfo ? [["작성자 표시", `${guestInfo.name} (비회원)`], ...p.fields.filter(([k]) => k !== "작성자 표시")] : p.fields,
        guest: guestInfo,
        edit: plan.editable?.(v.data),
      },
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { status: "error", message: "로그인 서버에 연결하지 못했어요.", values: raw };

  if (guest && plan.guestRpc) {
    const { fn, args } = plan.guestRpc(v.data, secret, client);
    const { data, error } = await supabase.rpc(fn, args);
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row?.id) return { status: "error", message: rpcMessage(error, "저장하지 못했어요. 잠시 후 다시 시도해 주세요."), values: raw };
    plan.revalidate.forEach((p) => revalidatePath(p));
    redirect(plan.path(v.data, row as Record<string, string>));
  }

  // 자동 주소: 저장 직전에 DB 에서 겹치는 주소를 확인하고, 그 사이 다른 글이 같은 주소를 먼저 가져가
  // unique 제약(23505)에 걸리면 다음 번호로 두 번까지 다시 시도한다(권한상 안 보이는 초안과 겹칠 때도 같은 방식).
  const slugged = plan.uniqueSlug ? (v.data as unknown as Slugged) : null;
  const base = slugged?.slug ?? "";
  const tried: string[] = [];
  for (let attempt = 0; ; attempt++) {
    if (slugged && plan.uniqueSlug) slugged.slug = uniqueSlug(base, [...(await takenSlugs(supabase, plan.uniqueSlug.table, base)), ...tried]);
    const ins = plan.insert(v.data, writer as Writer);
    if ("error" in ins) return { status: "error", message: ins.error, values: raw };
    const { data, error } = await supabase.from(ins.table).insert(ins.row).select(ins.select).single();
    if (error?.code === "23505" && slugged && attempt < 2) {
      tried.push(slugged.slug);
      continue;
    }
    if (error || !data) return { status: "error", message: dbErrorMessage(error ?? { message: "" }), values: raw };

    // 새 글 주소도 갱신 — 지웠던 글과 같은 주소가 다시 쓰이면 예전 ISR 페이지가 남아 있을 수 있다
    const dest = plan.path(v.data, data as unknown as Record<string, string>);
    [...plan.revalidate, dest.split("?")[0]].forEach((p) => revalidatePath(p));
    redirect(dest);
  }
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
      // 비회원: 검증된 RPC 로만 저장 (anon 은 posts 테이블에 직접 쓸 수 없다)
      guestRpc: (d, secret, client) => ({
        fn: "omu_guest_create_post",
        args: {
          p_category: d.category,
          p_qna_subject: d.qna_subject,
          p_title: d.title,
          p_content: d.content,
          p_youtube_url: d.youtube_url,
          p_tags: d.tags,
          p_secret: secret,
          p_client: client,
        },
      }),
      editable: (d) => ({ title: d.title, content: d.content, tags: d.tags.join(", ") }),
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
      insert: ({ images, ...d }, w) => {
        // 사진은 브라우저가 market 버킷의 '본인 uid/' 폴더에 먼저 올린다 → 경로가 본인 폴더인지 다시 확인
        if (images.some((p) => !p.startsWith(`${w.id}/`))) return { error: "사진 정보가 올바르지 않아요. 사진을 다시 골라 주세요." };
        const image_urls = images.map(marketImageUrl).filter((u): u is string => Boolean(u));
        return { table: "market_items", select: "id", row: { ...d, image_urls, status: "selling", seller_id: w.id } };
      },
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
          ["사진", d.images.length ? `${d.images.length}장 (데모: 이 브라우저에서만 미리보기)` : "없음"],
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
          thumbnail_url: d.thumbnail_path,
          author_id: w.id,
        },
      }),
      uniqueSlug: { table: "scores", demoTaken: () => DEMO_SCORES.map((s) => s.slug) },
      path: (d) => `/score/${d.instrument}/${d.slug}`,
      revalidate: ["/score", "/"],
      preview: (d) => ({
        title: d.title,
        body: d.meta_description,
        fields: [
          ["주소(자동)", `/score/${d.instrument}/${d.slug}`],
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
      uniqueSlug: { table: "articles", demoTaken: () => DEMO_ARTICLES.map((a) => a.slug) },
      path: (d) => (isAdmin && d.is_published ? articlePath(d.category, d.slug) : "/write?saved=article"),
      revalidate: ["/info", "/gear", "/"],
      preview: (d) => ({
        title: d.title,
        body: d.content,
        fields: [
          ["분류", ARTICLE_CATEGORIES[d.category]],
          ["주소(자동)", articlePath(d.category, d.slug)],
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
