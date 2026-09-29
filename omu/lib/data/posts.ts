import "server-only";

import type { CommunityCategory, QnaSubject } from "../site";
import { DEFAULT_PAGE_SIZE, PROFILE_COLS, byNewest, likePattern, matches, paginate, range, toAuthor, toPaged } from "./core";
import { DEMO_COMMENTS, DEMO_POSTS } from "./demo/posts";
import { publicDb } from "./source";
import type { Comment, CommentTarget, CommentThread, Paged, Post } from "./types";

export type PostFilter = {
  category?: CommunityCategory;
  subject?: QnaSubject;
  unanswered?: boolean;
  relatedScoreSlug?: string;
  q?: string;
  sort?: "latest" | "popular";
  page?: number;
  pageSize?: number;
};

// ⚠️ posts.author_id 는 컬럼 권한상 읽을 수 없다(익명 보호). 공개용 public_author_id 로 조인한다.
const POST_COLS = `id, category, qna_subject, title, content, youtube_url, is_anonymous, author_display, is_answered,
  tags, view_count, comment_count, created_at, author:profiles!posts_public_author_id_fkey(${PROFILE_COLS})`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPost(r: any): Post {
  const author = r.is_anonymous ? null : toAuthor(r.author);
  return {
    id: r.id,
    category: r.category,
    qnaSubject: r.qna_subject ?? null,
    title: r.title,
    content: r.content ?? "",
    youtubeUrl: r.youtube_url ?? null,
    isAnonymous: Boolean(r.is_anonymous),
    author,
    authorDisplay: r.author_display === "editor" ? "editor" : "member",
    isNotice: author?.role === "admin",
    isAnswered: Boolean(r.is_answered),
    tags: r.tags ?? [],
    views: r.view_count ?? 0,
    commentCount: r.comment_count ?? 0,
    createdAt: r.created_at,
    relatedScoreSlug: null,
  };
}

export async function listPosts(f: PostFilter = {}): Promise<Paged<Post>> {
  const pageSize = f.pageSize ?? DEFAULT_PAGE_SIZE;
  const db = publicDb();
  if (db) {
    let q = db.from("posts").select(POST_COLS, { count: "exact" });
    if (f.category) q = q.eq("category", f.category);
    if (f.subject) q = q.eq("qna_subject", f.subject);
    if (f.unanswered) q = q.eq("is_answered", false);
    if (f.q) q = q.ilike("title", likePattern(f.q));
    q = f.sort === "popular" ? q.order("view_count", { ascending: false }) : q.order("created_at", { ascending: false });
    const [from, to] = range(f.page ?? 1, pageSize);
    const { data, count, error } = await q.range(from, to);
    if (error) throw new Error(`게시글 목록을 불러오지 못했어요: ${error.message}`);
    return toPaged((data ?? []).map(mapPost), count ?? 0, f.page ?? 1, pageSize);
  }
  const items = DEMO_POSTS.filter(
    (p) =>
      (!f.category || p.category === f.category) &&
      (!f.subject || p.qnaSubject === f.subject) &&
      (!f.unanswered || !p.isAnswered) &&
      (!f.relatedScoreSlug || p.relatedScoreSlug === f.relatedScoreSlug) &&
      matches(f.q, p.title, p.tags.join(" ")),
  ).sort(f.sort === "popular" ? (a, b) => b.views - a.views : (a, b) => Number(b.isNotice) - Number(a.isNotice) || byNewest(a, b));
  return paginate(items, f.page, pageSize);
}

export async function getPost(category: string, id: string): Promise<Post | null> {
  const db = publicDb();
  if (db) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data, error } = await db.from("posts").select(POST_COLS).eq("id", id).eq("category", category).maybeSingle();
    if (error) throw new Error(`게시글을 불러오지 못했어요: ${error.message}`);
    return data ? mapPost(data) : null;
  }
  return DEMO_POSTS.find((p) => p.id === id && p.category === category) ?? null;
}

/* ───────── 댓글 (읽기 전용) ───────── */

const COMMENT_COLS = `id, target_type, target_id, parent_id, content, is_anonymous, is_accepted, created_at,
  author:profiles!comments_public_author_id_fkey(${PROFILE_COLS})`;

/** 대상 글의 댓글을 1단계 답글 구조로 묶어 돌려준다. 채택 답변이 맨 위. */
export async function listComments(targetType: CommentTarget, targetId: string): Promise<CommentThread[]> {
  let rows: Comment[];
  const db = publicDb();
  if (db) {
    const { data, error } = await db
      .from("comments")
      .select(COMMENT_COLS)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: true })
      .limit(300);
    if (error) throw new Error(`댓글을 불러오지 못했어요: ${error.message}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows = (data ?? []).map((r: any) => ({
      id: r.id,
      targetType: r.target_type,
      targetId: r.target_id,
      parentId: r.parent_id,
      content: r.content,
      isAnonymous: Boolean(r.is_anonymous),
      isAccepted: Boolean(r.is_accepted),
      author: r.is_anonymous ? null : toAuthor(r.author),
      createdAt: r.created_at,
    }));
  } else {
    rows = DEMO_COMMENTS.filter((c) => c.targetType === targetType && c.targetId === targetId).sort((a, b) =>
      a.createdAt < b.createdAt ? -1 : 1,
    );
  }
  const roots: CommentThread[] = rows.filter((c) => !c.parentId).map((c) => ({ ...c, replies: [] }));
  const byId = new Map(roots.map((c) => [c.id, c]));
  for (const c of rows) if (c.parentId) byId.get(c.parentId)?.replies.push(c);
  return roots.sort((a, b) => Number(b.isAccepted) - Number(a.isAccepted));
}
