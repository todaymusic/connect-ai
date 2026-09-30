"use server";

// 정보글 발행·삭제 — 작성자 본인 또는 관리자.
// 권한은 로그인 세션 + DB RLS(omu_articles_update/delete: 본인 또는 관리자)가 판정하고,
// 발행 시각·배지·발행→초안 금지는 DB 트리거(omu_article_rules)가 지킨다.
import { revalidatePath } from "next/cache";
import { rpcMessage } from "../guard/server";
import { articlePath } from "../site";
import { getSupabaseServerClient } from "../supabase/server";
import { getWriterState } from "./writer";

export type ArticleActionResult = { ok: boolean; message: string; path?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function session() {
  const state = await getWriterState();
  if (state.mode === "demo") return { error: "데모 모드에서는 저장된 글이 없어요." } as const;
  if (!state.writer) return { error: "로그인한 회원만 할 수 있어요." } as const;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "로그인 서버에 연결하지 못했어요." } as const;
  return { supabase, writer: state.writer } as const;
}

function refresh(category: string, slug: string) {
  const path = articlePath(category, slug);
  revalidatePath(path);
  revalidatePath(path.replace(/\/[^/]+$/, ""));
  ["/info", "/gear", "/", "/sitemap.xml", "/my/articles", "/admin/content", "/admin"].forEach((p) => revalidatePath(p));
  return path;
}

/** 임시저장한 정보글 발행 (초안 → 공개). 공개 → 초안 되돌리기는 없다 */
export async function publishArticle(id: string): Promise<ArticleActionResult> {
  const s = await session();
  if ("error" in s) return { ok: false, message: s.error as string };
  if (!UUID.test(id)) return { ok: false, message: "잘못된 요청이에요." };
  const { data, error } = await s.supabase
    .from("articles")
    .update({ is_published: true })
    .eq("id", id)
    .eq("is_published", false)
    .select("category, slug")
    .maybeSingle();
  if (error) return { ok: false, message: rpcMessage(error, "발행하지 못했어요. 잠시 후 다시 시도해 주세요.") };
  if (!data) return { ok: false, message: "이미 발행했거나, 발행할 권한이 없는 글이에요." };
  return { ok: true, message: "발행했어요. 이제 누구나 볼 수 있어요.", path: refresh(data.category, data.slug) };
}

/** 정보글 삭제 (공개 글 포함) — 되돌릴 수 없다 */
export async function deleteArticle(id: string): Promise<ArticleActionResult> {
  const s = await session();
  if ("error" in s) return { ok: false, message: s.error as string };
  if (!UUID.test(id)) return { ok: false, message: "잘못된 요청이에요." };
  const { data, error } = await s.supabase.from("articles").delete().eq("id", id).select("category, slug");
  if (error) return { ok: false, message: rpcMessage(error, "지우지 못했어요. 잠시 후 다시 시도해 주세요.") };
  const row = data?.[0];
  if (!row) return { ok: false, message: "이미 지웠거나, 지울 권한이 없는 글이에요." };
  refresh(row.category, row.slug);
  return { ok: true, message: "정보글을 지웠어요." };
}
