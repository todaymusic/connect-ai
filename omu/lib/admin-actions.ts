"use server";

// 관리자 신고 처리 — 처리 완료·기각, 대상 숨기기. 악보·정보글 삭제.
// 권한은 화면 가드(getAdminAccess) + DB RLS(omu_reports_update_admin, 각 테이블 관리자 수정 정책) 이중으로 확인한다.
import { revalidatePath } from "next/cache";
import { getAdminAccess } from "./admin";
import { storageObjectPath } from "./data/storage";
import { articlePath, isKey, ARTICLE_CATEGORIES, SCORE_INSTRUMENTS } from "./site";
import { getSupabaseServerClient } from "./supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** 숨김(is_hidden) 컬럼이 있는 대상만 숨길 수 있다 */
const HIDEABLE: Record<string, string> = { post: "posts", comment: "comments", market: "market_items", recruit: "recruits" };

export type AdminActionResult = { ok: boolean; message: string };

async function adminClient() {
  const access = await getAdminAccess();
  if (access.kind !== "admin") return { error: access.kind === "preview" ? "미리보기에서는 실제로 처리되지 않아요." : "관리자만 처리할 수 있어요." } as const;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase 에 연결하지 못했어요." } as const;
  return { supabase, userId: access.user.id } as const;
}

export async function setReportStatus(id: string, status: "resolved" | "dismissed" | "open"): Promise<AdminActionResult> {
  const c = await adminClient();
  if ("error" in c) return { ok: false, message: c.error as string };
  if (!UUID.test(id) || !["resolved", "dismissed", "open"].includes(status)) return { ok: false, message: "잘못된 요청이에요." };
  const { error } = await c.supabase
    .from("reports")
    .update(status === "open" ? { status, resolved_by: null, resolved_at: null } : { status, resolved_by: c.userId, resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: "처리하지 못했어요. 관리자 권한을 확인해 주세요." };
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { ok: true, message: status === "resolved" ? "처리 완료로 바꿨어요." : status === "dismissed" ? "기각했어요." : "다시 열었어요." };
}

/** 신고 대상 글·댓글·매물·모집글 숨기기 + 같은 대상 신고를 모두 처리 완료로 */
export async function hideReportTarget(reportId: string): Promise<AdminActionResult> {
  const c = await adminClient();
  if ("error" in c) return { ok: false, message: c.error as string };
  if (!UUID.test(reportId)) return { ok: false, message: "잘못된 요청이에요." };
  const { data: report, error: e1 } = await c.supabase.from("reports").select("target_type, target_id").eq("id", reportId).maybeSingle();
  if (e1 || !report) return { ok: false, message: "신고를 찾을 수 없어요." };
  const table = HIDEABLE[report.target_type as string];
  if (!table) return { ok: false, message: "악보·정보글은 숨김 대신 관리자 메뉴의 ‘악보·정보글 등록’(/admin/content)에서 삭제해 주세요." };
  const { error: e2 } = await c.supabase.from(table).update({ is_hidden: true }).eq("id", report.target_id);
  if (e2) return { ok: false, message: "숨기지 못했어요. 관리자 권한을 확인해 주세요." };
  await c.supabase
    .from("reports")
    .update({ status: "resolved", resolved_by: c.userId, resolved_at: new Date().toISOString() })
    .eq("target_type", report.target_type)
    .eq("target_id", report.target_id)
    .eq("status", "open");
  // 상세 페이지 캐시도 바로 갱신 (target_path 는 20260930 마이그레이션 컬럼 — 없으면 목록만)
  const { data: snap } = await c.supabase.from("reports").select("target_path").eq("id", reportId).maybeSingle();
  const path = typeof snap?.target_path === "string" ? snap.target_path.split("#")[0] : null;
  if (path && /^\/(community|gear|recruit|score|info)(\/[A-Za-z0-9_-]+){0,3}$/.test(path)) revalidatePath(path);
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  revalidatePath("/community");
  revalidatePath("/gear/market");
  revalidatePath("/recruit");
  return { ok: true, message: "대상을 숨기고 같은 대상의 신고를 모두 처리 완료로 바꿨어요." };
}

/* ───────── 악보·정보글 삭제 ───────── */

export type DeleteContentResult = AdminActionResult & {
  /** DB 에서는 지웠지만 Storage 에 남은 파일 (버킷/경로) */
  leftovers?: string[];
};

/**
 * 악보·정보글 삭제 (관리자). RLS: omu_scores_delete_staff_own_or_admin · omu_articles_delete_staff_own_or_admin,
 * Storage: omu_storage_staff_delete(scores·thumbnails 버킷).
 * 순서: DB 행을 먼저 지우고(실패하면 아무것도 건드리지 않음) → 그 행이 가리키던 PDF·미리보기 파일을 지운다.
 * 파일 삭제가 실패하면 남은 경로를 알려 준다(공개 페이지는 이미 사라졌으므로 사용자에게는 영향 없음).
 * 댓글은 DB 트리거(omu_cleanup_comments)가, 악보 요청의 연결(fulfilled_score_id)은 FK(on delete set null)가 정리한다.
 */
export async function deleteContent(kind: "score" | "article", id: string): Promise<DeleteContentResult> {
  const c = await adminClient();
  if ("error" in c) return { ok: false, message: c.error as string };
  if (!UUID.test(id) || (kind !== "score" && kind !== "article")) return { ok: false, message: "잘못된 요청이에요." };

  const table = kind === "score" ? "scores" : "articles";
  const { data, error } = await c.supabase
    .from(table)
    .delete()
    .eq("id", id)
    .select(kind === "score" ? "slug, instrument, file_url, thumbnail_url" : "slug, category, thumbnail_url");
  if (error) return { ok: false, message: "지우지 못했어요. 관리자 권한을 확인해 주세요." };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = (data as any[] | null)?.[0];
  if (!row) return { ok: false, message: "이미 지워졌거나 찾을 수 없어요." };

  // 연결된 파일 정리 (값이 이 프로젝트 Storage 경로일 때만)
  const files: { bucket: "scores" | "thumbnails"; path: string }[] = [];
  const pdf = kind === "score" ? storageObjectPath("scores", row.file_url) : null;
  const thumb = storageObjectPath("thumbnails", row.thumbnail_url);
  if (pdf) files.push({ bucket: "scores", path: pdf });
  if (thumb) files.push({ bucket: "thumbnails", path: thumb });
  const leftovers: string[] = [];
  for (const f of files) {
    const { error: rmError } = await c.supabase.storage.from(f.bucket).remove([f.path]);
    if (rmError) leftovers.push(`${f.bucket}/${f.path}`);
  }

  // 공개 화면 캐시 갱신
  if (kind === "score") {
    revalidatePath("/score");
    if (isKey(SCORE_INSTRUMENTS, row.instrument)) {
      revalidatePath(`/score/${row.instrument}`);
      revalidatePath(`/score/${row.instrument}/${row.slug}`);
    }
  } else {
    revalidatePath("/info");
    revalidatePath("/gear");
    if (isKey(ARTICLE_CATEGORIES, row.category)) {
      const path = articlePath(row.category, row.slug);
      revalidatePath(path);
      revalidatePath(path.replace(/\/[^/]+$/, ""));
    }
  }
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/content");
  revalidatePath("/admin");

  const [what, withWhat] = kind === "score" ? ["악보를", "악보와"] : ["정보글을", "정보글과"];
  if (leftovers.length) {
    return { ok: true, message: `${what} 지웠어요. 다만 파일 ${leftovers.length}개는 지우지 못했어요. Storage 에서 직접 지워 주세요.`, leftovers };
  }
  return { ok: true, message: files.length ? `${withWhat} 연결된 파일(${files.length}개)을 함께 지웠어요.` : `${what} 지웠어요.` };
}
