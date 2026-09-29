import type { MetadataRoute } from "next";
import { listArticles } from "@/lib/data/articles";
import { listMarketItems } from "@/lib/data/market";
import { listPosts } from "@/lib/data/posts";
import { listRecruits } from "@/lib/data/recruits";
import { listScores } from "@/lib/data/scores";
import {
  COMMUNITY_CATEGORIES,
  GEAR_ARTICLE_CATEGORIES,
  INFO_CATEGORIES,
  RECRUIT_CATEGORIES,
  SCORE_INSTRUMENTS,
  articlePath,
  siteUrl,
} from "@/lib/site";

// 1시간마다 다시 만든다 — 새 악보·정보글이 자동으로 반영된다
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "daily") => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  const staticPages = [
    page("/", 1),
    page("/score", 0.9),
    ...Object.keys(SCORE_INSTRUMENTS).map((k) => page(`/score/${k}`, 0.8)),
    page("/score/requests", 0.5),
    page("/info", 0.9),
    ...Object.keys(INFO_CATEGORIES).map((k) => page(`/info/${k}`, 0.8)),
    page("/gear", 0.8),
    page("/gear/market", 0.8, "hourly"),
    ...Object.keys(GEAR_ARTICLE_CATEGORIES).map((k) => page(`/gear/${k}`, 0.7)),
    page("/recruit", 0.8, "hourly"),
    ...Object.keys(RECRUIT_CATEGORIES).map((k) => page(`/recruit/${k}`, 0.7, "hourly")),
    page("/community", 0.7, "hourly"),
    // 익명 게시판은 검색 노출 제외(robots noindex) 라 사이트맵에도 넣지 않는다
    ...Object.keys(COMMUNITY_CATEGORIES)
      .filter((k) => k !== "anon")
      .map((k) => page(`/community/${k}`, 0.6, "hourly")),
    page("/about", 0.3, "monthly"),
    page("/terms", 0.2, "monthly"),
    page("/privacy", 0.2, "monthly"),
    page("/contact", 0.2, "monthly"),
  ];

  // 상세 페이지 — 데이터 조회가 실패해도 사이트맵 전체가 깨지지 않게 한다
  const safe = async <T,>(fn: () => Promise<T[]>): Promise<T[]> => {
    try {
      return await fn();
    } catch {
      return [];
    }
  };
  const [scores, articles, market, recruits, posts] = await Promise.all([
    safe(async () => (await listScores({ pageSize: 1000 })).items),
    safe(async () => (await listArticles({ pageSize: 1000 })).items),
    safe(async () => (await listMarketItems({ pageSize: 500 })).items),
    safe(async () => (await listRecruits({ pageSize: 500 })).items),
    safe(async () => (await listPosts({ pageSize: 500 })).items),
  ]);

  return [
    ...staticPages,
    ...scores.map((s) => ({ url: `${base}/score/${s.instrument}/${s.slug}`, lastModified: new Date(s.createdAt), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...articles.map((a) => ({ url: `${base}${articlePath(a.category, a.slug)}`, lastModified: new Date(a.publishedAt), changeFrequency: "monthly" as const, priority: 0.8 })),
    // 거래 완료·모집 마감·익명 글은 noindex 라 제외
    ...market.filter((m) => m.status !== "sold").map((m) => ({ url: `${base}/gear/market/${m.id}`, lastModified: new Date(m.createdAt), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...recruits.filter((r) => !r.isClosed).map((r) => ({ url: `${base}/recruit/${r.category}/${r.id}`, lastModified: new Date(r.createdAt), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...posts.filter((p) => !p.isAnonymous && !p.guestName).map((p) => ({ url: `${base}/community/${p.category}/${p.id}`, lastModified: new Date(p.createdAt), changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}
