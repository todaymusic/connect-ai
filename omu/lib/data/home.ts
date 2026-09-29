import "server-only";

import { INFO_CATEGORIES, type InfoCategory } from "../site";
import { listArticles } from "./articles";
import { listMarketItems } from "./market";
import { listPosts } from "./posts";
import { listRecruits } from "./recruits";
import { listScores } from "./scores";

/**
 * 인기 검색어 — 실제 검색 기록을 집계하기 전까지는 비워 둔다(지어낸 인기 검색어 금지).
 * 비어 있으면 홈의 '인기 검색어' 줄이 보이지 않는다.
 */
export const POPULAR_KEYWORDS: string[] = [];

const INFO_KEYS = Object.keys(INFO_CATEGORIES) as InfoCategory[];

/** 홈 화면에 필요한 데이터를 한 번에 (섹션마다 따로 부르면 출처가 섞일 수 있어 여기서 모은다) */
export async function getHomeData() {
  const [scores, articles, market, qna, popular, band, selling, openBand, anyRecruit] = await Promise.all([
    listScores({ sort: "popular", pageSize: 40 }),
    listArticles({ categories: INFO_KEYS, pageSize: 3 }),
    listMarketItems({ pageSize: 4 }),
    listPosts({ category: "qna", unanswered: true, pageSize: 4 }),
    listPosts({ sort: "popular", pageSize: 5 }),
    listRecruits({ category: "band", openOnly: true, pageSize: 4 }),
    listMarketItems({ status: "selling", pageSize: 1 }),
    listRecruits({ category: "band", openOnly: true, pageSize: 1 }),
    listRecruits({ pageSize: 1 }),
  ]);
  return {
    scores: scores.items,
    articles: articles.items,
    market: market.items,
    questions: qna.items,
    popular: popular.items,
    recruits: band.items,
    stats: {
      freeScores: scores.total,
      sellingMarket: selling.total,
      waitingQuestions: qna.total,
      openBands: openBand.total,
    },
    /** 전체 건수 — 0이면 홈에서 '준비 중'으로 보여 준다 */
    totals: { scores: scores.total, market: market.total, recruits: anyRecruit.total, posts: popular.total },
  };
}
