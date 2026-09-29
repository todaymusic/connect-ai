import "server-only";

import type { RecruitCategory, RecruitLevel } from "../site";
import { DEFAULT_PAGE_SIZE, PROFILE_COLS, byNewest, likePattern, matches, paginate, range, toAuthor, toPaged } from "./core";
import { DEMO_RECRUITS } from "./demo/recruits";
import { publicDb } from "./source";
import type { Paged, Recruit } from "./types";

export type RecruitFilter = {
  category?: RecruitCategory;
  level?: RecruitLevel;
  region?: string;
  openOnly?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
};

const RECRUIT_COLS = `id, title, category, recruit_level, genre, skill_level, region, positions, deadline, description,
  contact, is_closed, view_count, comment_count, created_at, author:profiles!recruits_author_id_fkey(${PROFILE_COLS})`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecruit(r: any): Recruit {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    level: r.recruit_level ?? null,
    genre: r.genre ?? null,
    skillLevel: r.skill_level ?? null,
    region: r.region ?? "",
    positions: r.positions ?? [],
    schedule: null,
    deadline: r.deadline ?? null,
    description: r.description ?? "",
    contact: r.contact ?? null,
    isClosed: Boolean(r.is_closed),
    author: toAuthor(r.author),
    views: r.view_count ?? 0,
    commentCount: r.comment_count ?? 0,
    createdAt: r.created_at,
  };
}

export async function listRecruits(f: RecruitFilter = {}): Promise<Paged<Recruit>> {
  const pageSize = f.pageSize ?? DEFAULT_PAGE_SIZE;
  const db = publicDb();
  if (db) {
    let q = db.from("recruits").select(RECRUIT_COLS, { count: "exact" });
    if (f.category) q = q.eq("category", f.category);
    if (f.level) q = q.eq("recruit_level", f.level);
    if (f.region) q = q.eq("region", f.region);
    if (f.openOnly) q = q.eq("is_closed", false);
    if (f.q) q = q.ilike("title", likePattern(f.q));
    const [from, to] = range(f.page ?? 1, pageSize);
    const { data, count, error } = await q
      .order("is_closed", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw new Error(`모집 목록을 불러오지 못했어요: ${error.message}`);
    return toPaged((data ?? []).map(mapRecruit), count ?? 0, f.page ?? 1, pageSize);
  }
  const items = DEMO_RECRUITS.filter(
    (r) =>
      (!f.category || r.category === f.category) &&
      (!f.level || r.level === f.level) &&
      (!f.region || r.region === f.region) &&
      (!f.openOnly || !r.isClosed) &&
      matches(f.q, r.title, r.genre, r.positions.join(" ")),
  )
    // 마감된 글은 뒤로
    .sort((a, b) => Number(a.isClosed) - Number(b.isClosed) || byNewest(a, b));
  return paginate(items, f.page, pageSize);
}

export async function getRecruit(category: string, id: string): Promise<Recruit | null> {
  const db = publicDb();
  if (db) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data, error } = await db.from("recruits").select(RECRUIT_COLS).eq("id", id).eq("category", category).maybeSingle();
    if (error) throw new Error(`모집글을 불러오지 못했어요: ${error.message}`);
    return data ? mapRecruit(data) : null;
  }
  return DEMO_RECRUITS.find((r) => r.id === id && r.category === category) ?? null;
}
