import "server-only";

import {
  ARTICLE_CATEGORIES,
  COMMUNITY_CATEGORIES,
  RECRUIT_CATEGORIES,
  SCORE_INSTRUMENTS,
  articlePath,
} from "../site";
import { listArticles } from "./articles";
import { listMarketItems } from "./market";
import { listPosts } from "./posts";
import { listRecruits } from "./recruits";
import { listScores } from "./scores";

export type SearchHit = { href: string; title: string; group: string; meta: string };

/** 통합 검색 — 1차는 각 분류의 제목 부분일치 (작업지시서 9-1) */
export async function searchAll(q: string): Promise<SearchHit[]> {
  const size = { pageSize: 20 };
  const [scores, articles, market, recruits, posts] = await Promise.all([
    listScores({ q, ...size }),
    listArticles({ q, ...size }),
    listMarketItems({ q, ...size }),
    listRecruits({ q, ...size }),
    listPosts({ q, ...size }),
  ]);
  return [
    ...scores.items.map((s) => ({
      href: `/score/${s.instrument}/${s.slug}`,
      title: s.title,
      group: "악보",
      meta: `${SCORE_INSTRUMENTS[s.instrument]} · ${s.artist}`,
    })),
    ...articles.items.map((a) => ({
      href: articlePath(a.category, a.slug),
      title: a.title,
      group: "음악정보",
      meta: ARTICLE_CATEGORIES[a.category],
    })),
    ...market.items.map((m) => ({ href: `/gear/market/${m.id}`, title: m.title, group: "중고", meta: m.region })),
    ...recruits.items.map((r) => ({
      href: `/recruit/${r.category}/${r.id}`,
      title: r.title,
      group: "구인",
      meta: `${RECRUIT_CATEGORIES[r.category]} · ${r.region}`,
    })),
    ...posts.items.map((p) => ({
      href: `/community/${p.category}/${p.id}`,
      title: p.title,
      group: "커뮤니티",
      meta: COMMUNITY_CATEGORIES[p.category],
    })),
  ];
}
