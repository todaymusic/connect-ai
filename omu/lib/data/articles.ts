import "server-only";

import type { ArticleCategory } from "../site";
import { DEFAULT_PAGE_SIZE, PROFILE_COLS, likePattern, matches, paginate, range, toAuthor, toPaged } from "./core";
import { DEMO_ARTICLES } from "./demo/articles";
import { publicDb } from "./source";
import type { Article, Paged } from "./types";

export type ArticleFilter = {
  category?: ArticleCategory;
  /** 여러 분류 중 하나 (예: 음악정보 5개 / 악기 탭 2개) */
  categories?: readonly ArticleCategory[];
  q?: string;
  page?: number;
  pageSize?: number;
};

const ARTICLE_COLS = `id, slug, category, title, content, meta_description, keywords, youtube_url, view_count,
  author_display, published_at, created_at, author:profiles!articles_author_id_fkey(${PROFILE_COLS})`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapArticle(r: any): Article {
  const content: string = r.content ?? "";
  return {
    id: r.id,
    slug: r.slug,
    category: r.category,
    title: r.title,
    summary: r.meta_description ?? content.slice(0, 120),
    content,
    keywords: (r.keywords ?? "").split(",").map((k: string) => k.trim()).filter(Boolean),
    youtubeUrl: r.youtube_url ?? null,
    views: r.view_count ?? 0,
    readMinutes: Math.max(1, Math.round(content.length / 500)),
    authorDisplay: r.author_display === "member" ? "member" : "editor",
    author: toAuthor(r.author),
    publishedAt: r.published_at ?? r.created_at,
  };
}

const byPublished = (a: Article, b: Article) => (a.publishedAt < b.publishedAt ? 1 : -1);

export async function listArticles(f: ArticleFilter = {}): Promise<Paged<Article>> {
  const pageSize = f.pageSize ?? DEFAULT_PAGE_SIZE;
  const cats = f.category ? [f.category] : f.categories;
  const db = publicDb();
  if (db) {
    // RLS 가 발행된 글만 보여주지만, 명시적으로도 거른다
    let q = db.from("articles").select(ARTICLE_COLS, { count: "exact" }).eq("is_published", true);
    if (cats?.length) q = q.in("category", [...cats]);
    if (f.q) q = q.ilike("title", likePattern(f.q));
    const [from, to] = range(f.page ?? 1, pageSize);
    const { data, count, error } = await q.order("published_at", { ascending: false }).range(from, to);
    if (error) throw new Error(`정보글 목록을 불러오지 못했어요: ${error.message}`);
    return toPaged((data ?? []).map(mapArticle), count ?? 0, f.page ?? 1, pageSize);
  }
  const items = DEMO_ARTICLES.filter(
    (a) => (!cats?.length || cats.includes(a.category)) && matches(f.q, a.title, a.summary, a.keywords.join(" ")),
  ).sort(byPublished);
  return paginate(items, f.page, pageSize);
}

export async function getArticle(category: string, slug: string): Promise<Article | null> {
  const db = publicDb();
  if (db) {
    const { data, error } = await db
      .from("articles")
      .select(ARTICLE_COLS)
      .eq("category", category)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(`정보글을 불러오지 못했어요: ${error.message}`);
    return data ? mapArticle(data) : null;
  }
  return DEMO_ARTICLES.find((a) => a.category === category && a.slug === slug) ?? null;
}

/** 같은 분류의 다른 글 */
export async function listRelatedArticles(article: Article, n = 3): Promise<Article[]> {
  const { items } = await listArticles({ category: article.category, pageSize: n + 1 });
  return items.filter((a) => a.id !== article.id).slice(0, n);
}
