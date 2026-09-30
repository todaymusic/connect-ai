import "server-only";

import type { ArticleEdit } from "@/components/write/forms/ArticleForm";
import { getSupabaseServerClient } from "../supabase/server";
import type { Writer } from "./writer";

export type ArticleEditLoad = { kind: "ok"; edit: ArticleEdit } | { kind: "missing" | "forbidden" | "demo"; message: string };

/**
 * /write/article?edit=<id> — 수정할 정보글 불러오기 (로그인 세션으로 조회: 본인 초안도 보인다).
 * 작성자 본인 또는 관리자만. 실제 저장 권한은 서버 액션 + DB RLS 가 다시 확인한다.
 */
export async function loadArticleForEdit(id: string, writer: Writer | null, mode: "demo" | "supabase"): Promise<ArticleEditLoad> {
  if (mode === "demo") return { kind: "demo", message: "데모 모드에서는 저장된 글이 없어 수정할 수 없어요. 새 글 쓰기로 흐름을 확인해 보세요." };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { kind: "missing", message: "수정할 글을 찾을 수 없어요." };
  const supabase = await getSupabaseServerClient();
  if (!supabase || !writer) return { kind: "forbidden", message: "로그인한 작성자만 수정할 수 있어요." };
  const { data } = await supabase
    .from("articles")
    .select("id, author_id, author_display, category, title, meta_description, content, keywords, youtube_url, is_published")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { kind: "missing", message: "수정할 글을 찾을 수 없어요. 지워졌거나 다른 사람의 임시저장 글이에요." };
  if (data.author_id !== writer.id && writer.role !== "admin") return { kind: "forbidden", message: "본인이 쓴 글만 수정할 수 있어요." };
  return {
    kind: "ok",
    edit: {
      id: data.id,
      isPublished: Boolean(data.is_published),
      authorDisplay: data.author_display === "editor" ? "editor" : "member",
      values: {
        category: data.category ?? "",
        title: data.title ?? "",
        meta_description: data.meta_description ?? "",
        content: data.content ?? "",
        keywords: data.keywords ?? "",
        youtube_url: data.youtube_url ?? "",
      },
    },
  };
}
