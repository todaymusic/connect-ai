import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthState, type CurrentUser } from "./auth";
import { getSocialProviders } from "./auth-providers";
import { getSupabaseServerClient } from "./supabase/server";

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
    case "unconfigured":
      return previewAllowed() ? { kind: "preview" } : { kind: "unconfigured" };
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

  const [membersTotal, admins, editors, scores, published, drafts, selling, marketTotal, openReports, ...storage] =
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
      ...BUCKETS.map((b) => bucketStatus(supabase, b)),
    ]);

  const warnings: string[] = [];
  if ([membersTotal, scores, published, marketTotal, openReports].some((v) => v === null)) {
    warnings.push("일부 항목을 불러오지 못했어요. Supabase에 schema.sql 이 적용됐는지 확인해 주세요.");
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
  storage: [
    { id: "scores", label: "악보 PDF", ok: true, files: 24 },
    { id: "thumbnails", label: "썸네일", ok: true, files: 12 },
    { id: "market", label: "중고 사진", ok: true, files: 37 },
  ],
  warnings: [],
};
