import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getAuthState, type CurrentUser } from "./auth";
import { getSocialProviders } from "./auth-providers";
import { getSupabaseServerClient } from "./supabase/server";
import { DEMO_ROLE_COOKIE } from "./write/config";

/* ───────── 접근 권한 판단 ───────── */

export type AdminAccess =
  | { kind: "admin"; user: CurrentUser }
  | { kind: "preview" } // Supabase 미연결 + 미리보기 허용 (개발용, 목데이터)
  | { kind: "unconfigured" } // Supabase 미연결 (운영에서는 관리자 기능 비활성)
  | { kind: "signed-out" }
  | { kind: "forbidden"; user: CurrentUser }
  | { kind: "error"; message: string };

/** 미리보기(목데이터 관리자 화면)는 개발 서버이거나 OMU_ADMIN_PREVIEW=1 일 때만, 그리고 Supabase 미연결일 때만 */
function previewAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.OMU_ADMIN_PREVIEW === "1";
}

/**
 * 관리자 판단 기준: profiles.role === 'admin' (schema.sql 의 omu_is_admin() 과 동일).
 * 화면 가드일 뿐이고, 실제 데이터 보호는 DB 의 RLS 정책이 담당한다.
 */
export async function getAdminAccess(): Promise<AdminAccess> {
  const auth = await getAuthState();
  switch (auth.status) {
    case "unconfigured": {
      // 데모 모드에서 '관리자' 역할을 고른 경우에도 목데이터 미리보기를 보여 준다(실제 데이터·권한 없음)
      const demoRole = (await cookies()).get(DEMO_ROLE_COOKIE)?.value;
      return previewAllowed() || demoRole === "admin" ? { kind: "preview" } : { kind: "unconfigured" };
    }
    case "signed-out":
      return { kind: "signed-out" };
    case "error":
      return { kind: "error", message: auth.message };
    case "signed-in":
      return auth.user.role === "admin" ? { kind: "admin", user: auth.user } : { kind: "forbidden", user: auth.user };
  }
}

/* ───────── 대시보드 요약 ───────── */

type Count = number | null; // null = 조회 실패(스키마 미적용·권한 등)

export type BucketStatus = { id: string; label: string; ok: boolean | null; files: number | null };

export type AdminSummary = {
  source: "supabase" | "mock";
  members: { total: Count; admins: Count; editors: Count };
  scores: { total: Count };
  articles: { published: Count; drafts: Count };
  market: { selling: Count; total: Count };
  reports: { open: Count };
  /** 비회원이 쓴 글·댓글 수 (20260930 마이그레이션 필요) */
  guest: { posts: Count; comments: Count };
  storage: BucketStatus[];
  deploy: DeployStatus;
  warnings: string[];
};

export type DeployStatus = {
  environment: string;
  commit: string | null;
  branch: string | null;
  siteUrl: string | null;
  supabase: boolean;
  kakao: boolean;
  naver: boolean;
};

const BUCKETS: { id: string; label: string }[] = [
  { id: "scores", label: "악보 PDF" },
  { id: "thumbnails", label: "썸네일" },
  { id: "market", label: "중고 사진" },
];

function getDeployStatus(): DeployStatus {
  const providers = getSocialProviders();
  return {
    environment: process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "production" ? "production (로컬)" : "development"),
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    kakao: providers.some((p) => p.key === "kakao" && p.provider),
    naver: providers.some((p) => p.key === "naver" && p.provider),
  };
}

/** 행 개수만 조회 (head: true — 데이터는 가져오지 않음). 관리자는 RLS 상 전체 행을 볼 수 있다 */
async function countRows(supabase: SupabaseClient, table: string, eq?: [column: string, value: string | boolean]): Promise<Count> {
  try {
    let query = supabase.from(table).select("id", { count: "exact", head: true });
    if (eq) query = query.eq(eq[0], eq[1]);
    const { count, error } = await query;
    return error ? null : (count ?? 0);
  } catch {
    return null;
  }
}

/** 비회원 글·댓글 수 (guest_name 이 있는 행) */
async function countGuest(supabase: SupabaseClient, table: "posts" | "comments"): Promise<Count> {
  try {
    const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).not("guest_name", "is", null);
    return error ? null : (count ?? 0);
  } catch {
    return null;
  }
}

async function bucketStatus(supabase: SupabaseClient, b: { id: string; label: string }): Promise<BucketStatus> {
  try {
    const { data, error } = await supabase.storage.from(b.id).list("", { limit: 100 });
    if (error) return { ...b, ok: false, files: null };
    return { ...b, ok: true, files: data.length };
  } catch {
    return { ...b, ok: null, files: null };
  }
}

export async function getAdminSummary(access: AdminAccess): Promise<AdminSummary> {
  const deploy = getDeployStatus();

  if (access.kind !== "admin") {
    return { ...MOCK_SUMMARY, deploy };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ...MOCK_SUMMARY, deploy };

  const [membersTotal, admins, editors, scores, published, drafts, selling, marketTotal, openReports, guestPosts, guestComments, ...storage] =
    await Promise.all([
      countRows(supabase, "profiles"),
      countRows(supabase, "profiles", ["role", "admin"]),
      countRows(supabase, "profiles", ["role", "editor"]),
      countRows(supabase, "scores"),
      countRows(supabase, "articles", ["is_published", true]),
      countRows(supabase, "articles", ["is_published", false]),
      countRows(supabase, "market_items", ["status", "selling"]),
      countRows(supabase, "market_items"),
      countRows(supabase, "reports", ["status", "open"]),
      countGuest(supabase, "posts"),
      countGuest(supabase, "comments"),
      ...BUCKETS.map((b) => bucketStatus(supabase, b)),
    ]);

  const warnings: string[] = [];
  if ([membersTotal, scores, published, marketTotal, openReports].some((v) => v === null)) {
    warnings.push("일부 항목을 불러오지 못했어요. Supabase에 schema.sql 이 적용됐는지 확인해 주세요.");
  }
  if (guestPosts === null) {
    warnings.push("비회원 글·댓글 기능용 DB 업데이트가 아직 안 된 것 같아요. supabase/migrations/20260930_guest_community.sql 을 적용해 주세요.");
  }
  if (storage.some((s) => s.ok === false)) {
    warnings.push("일부 Storage 버킷이 없거나 접근할 수 없어요. schema.sql 의 8) Storage 단계를 확인해 주세요.");
  }

  return {
    source: "supabase",
    members: { total: membersTotal, admins, editors },
    scores: { total: scores },
    articles: { published, drafts },
    market: { selling, total: marketTotal },
    reports: { open: openReports },
    guest: { posts: guestPosts, comments: guestComments },
    storage,
    deploy,
    warnings,
  };
}

/** Supabase 연결 전 미리보기용 목데이터 */
const MOCK_SUMMARY: Omit<AdminSummary, "deploy"> = {
  source: "mock",
  members: { total: 128, admins: 1, editors: 2 },
  scores: { total: 24 },
  articles: { published: 3, drafts: 5 },
  market: { selling: 26, total: 41 },
  reports: { open: 2 },
  guest: { posts: 6, comments: 23 },
  storage: [
    { id: "scores", label: "악보 PDF", ok: true, files: 24 },
    { id: "thumbnails", label: "썸네일", ok: true, files: 12 },
    { id: "market", label: "중고 사진", ok: true, files: 37 },
  ],
  warnings: [],
};

/* ───────── 신고 목록 ───────── */

export type ReportStatus = "open" | "resolved" | "dismissed";
export type AdminReport = {
  id: string;
  createdAt: string;
  targetType: string;
  targetId: string;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  reporter: "member" | "guest";
  title: string | null;
  path: string | null;
  resolvedAt: string | null;
};

const REPORT_BASE = "id, created_at, target_type, target_id, reason, detail, status, reporter_id, resolved_at";

/** 관리자 신고 목록 — 미리보기(목데이터) 또는 Supabase(관리자 RLS) */
export async function listReports(access: AdminAccess, status: ReportStatus | "all"): Promise<{ items: AdminReport[]; error: string | null }> {
  if (access.kind !== "admin") {
    return { items: MOCK_REPORTS.filter((r) => status === "all" || r.status === status), error: null };
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { items: [], error: "Supabase 에 연결하지 못했어요." };
  const run = (ext: boolean) => {
    let q = supabase.from("reports").select(ext ? `${REPORT_BASE}, reporter_key, target_title, target_path` : REPORT_BASE);
    if (status !== "all") q = q.eq("status", status);
    return q.order("created_at", { ascending: false }).limit(100);
  };
  let { data, error } = await run(true);
  if (error && (error.code === "42703" || /column/i.test(error.message))) ({ data, error } = await run(false));
  if (error) return { items: [], error: "신고 목록을 불러오지 못했어요. schema.sql 적용 여부와 관리자 권한을 확인해 주세요." };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((data ?? []) as any[]).map(
    (r): AdminReport => ({
      id: r.id,
      createdAt: r.created_at,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      detail: r.detail ?? null,
      status: r.status,
      reporter: r.reporter_id ? "member" : "guest",
      title: r.target_title ?? null,
      path: r.target_path ?? null,
      resolvedAt: r.resolved_at ?? null,
    }),
  );
  return { items, error: null };
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const MOCK_REPORTS: AdminReport[] = [
  { id: "mr1", createdAt: hoursAgo(2), targetType: "post", targetId: "g1", reason: "spam", detail: "같은 광고 링크가 반복돼요.", status: "open", reporter: "guest", title: "가입 없이 처음 써봐요, 통기타 줄 얼마나 자주 가세요?", path: "/community/free/g1", resolvedAt: null },
  { id: "mr2", createdAt: hoursAgo(5), targetType: "comment", targetId: "c11", reason: "abuse", detail: null, status: "open", reporter: "member", title: "저는 한 달 반 정도요. 코팅 줄 쓰면 좀 더 오래 가요.", path: "/community/free/g1#comment-c11", resolvedAt: null },
  { id: "mr3", createdAt: hoursAgo(30), targetType: "market", targetId: "m2", reason: "fraud", detail: "선입금을 요구했어요.", status: "resolved", reporter: "member", title: "스트랫 타입 일렉기타 + 소프트케이스", path: "/gear/market/m2", resolvedAt: hoursAgo(20) },
];
