import "server-only";

import type { Difficulty, ScoreInstrument } from "../site";
import { SCORE_DEFAULT_PARTS } from "../site";
import { DEFAULT_PAGE_SIZE, PROFILE_COLS, byNewest, likePattern, matches, paginate, range, toAuthor, toPaged } from "./core";
import { DEMO_SCORE_REQUESTS, DEMO_SCORES } from "./demo/scores";
import { publicDb } from "./source";
import type { Paged, Score, ScoreRequest } from "./types";

export type ScoreFilter = {
  instrument?: ScoreInstrument;
  difficulty?: Difficulty;
  genre?: string;
  q?: string;
  sort?: "popular" | "latest";
  page?: number;
  pageSize?: number;
};

const SCORE_COLS = `id, slug, title, artist, instrument, difficulty, genre, file_url, meta_description,
  download_count, view_count, created_at, author:profiles!scores_author_id_fkey(${PROFILE_COLS})`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScore(r: any): Score {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    artist: r.artist ?? "",
    instrument: r.instrument,
    difficulty: r.difficulty ?? "beginner",
    genre: r.genre ?? "",
    parts: SCORE_DEFAULT_PARTS[r.instrument as ScoreInstrument] ?? [],
    pages: null,
    downloads: r.download_count ?? 0,
    views: r.view_count ?? 0,
    description: r.meta_description ?? "",
    fileUrl: r.file_url ?? null,
    author: toAuthor(r.author),
    createdAt: r.created_at,
  };
}

export async function listScores(f: ScoreFilter = {}): Promise<Paged<Score>> {
  const pageSize = f.pageSize ?? DEFAULT_PAGE_SIZE;
  const db = publicDb();
  if (db) {
    let q = db.from("scores").select(SCORE_COLS, { count: "exact" });
    if (f.instrument) q = q.eq("instrument", f.instrument);
    if (f.difficulty) q = q.eq("difficulty", f.difficulty);
    if (f.genre) q = q.eq("genre", f.genre);
    if (f.q) q = q.ilike("title", likePattern(f.q));
    q = f.sort === "popular" ? q.order("download_count", { ascending: false }) : q.order("created_at", { ascending: false });
    const [from, to] = range(f.page ?? 1, pageSize);
    const { data, count, error } = await q.range(from, to);
    if (error) throw new Error(`악보 목록을 불러오지 못했어요: ${error.message}`);
    return toPaged((data ?? []).map(mapScore), count ?? 0, f.page ?? 1, pageSize);
  }

  const items = DEMO_SCORES.filter(
    (s) =>
      (!f.instrument || s.instrument === f.instrument) &&
      (!f.difficulty || s.difficulty === f.difficulty) &&
      (!f.genre || s.genre === f.genre) &&
      matches(f.q, s.title, s.artist, s.genre),
  ).sort(f.sort === "popular" ? (a, b) => b.downloads - a.downloads : byNewest);
  return paginate(items, f.page, pageSize);
}

export async function getScore(instrument: string, slug: string): Promise<Score | null> {
  const db = publicDb();
  if (db) {
    const { data, error } = await db.from("scores").select(SCORE_COLS).eq("instrument", instrument).eq("slug", slug).maybeSingle();
    if (error) throw new Error(`악보를 불러오지 못했어요: ${error.message}`);
    return data ? mapScore(data) : null;
  }
  return DEMO_SCORES.find((s) => s.instrument === instrument && s.slug === slug) ?? null;
}

/** 같은 악기의 다른 악보 (인기순) */
export async function listRelatedScores(score: Score, n = 4): Promise<Score[]> {
  const { items } = await listScores({ instrument: score.instrument, sort: "popular", pageSize: n + 1 });
  return items.filter((s) => s.id !== score.id).slice(0, n);
}

export async function listScoreRequests(): Promise<ScoreRequest[]> {
  const db = publicDb();
  if (db) {
    const { data, error } = await db
      .from("score_requests")
      .select(`id, song_title, instrument, description, status, created_at,
        author:profiles!score_requests_author_id_fkey(${PROFILE_COLS}),
        fulfilled:scores!score_requests_fulfilled_score_id_fkey(slug)`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(`악보 요청을 불러오지 못했어요: ${error.message}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => ({
      id: r.id,
      songTitle: r.song_title,
      instrument: r.instrument,
      description: r.description,
      status: r.status,
      fulfilledScoreSlug: (Array.isArray(r.fulfilled) ? r.fulfilled[0]?.slug : r.fulfilled?.slug) ?? null,
      author: toAuthor(r.author),
      createdAt: r.created_at,
    }));
  }
  return [...DEMO_SCORE_REQUESTS].sort(byNewest);
}
