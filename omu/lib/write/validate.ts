// 글쓰기 입력 검증 — 클라이언트(즉시 안내)와 서버 액션(최종 판정)이 같은 함수를 쓴다.
// 한도는 schema.sql 의 CHECK 제약과 맞췄다(화면 한도가 DB 보다 조금 더 엄격).
import {
  ARTICLE_CATEGORIES,
  COMMUNITY_CATEGORIES,
  DIFFICULTIES,
  ITEM_CONDITIONS,
  MARKET_CATEGORIES,
  QNA_SUBJECTS,
  RECRUIT_CATEGORIES,
  RECRUIT_LEVELS,
  REGIONS,
  SCORE_GENRES,
  SCORE_INSTRUMENTS,
  SKILL_LEVELS,
  TRADE_TYPES,
  isKey,
  type ArticleCategory,
  type CommunityCategory,
  type Difficulty,
  type ItemCondition,
  type MarketCategory,
  type QnaSubject,
  type RecruitCategory,
  type RecruitLevel,
  type ScoreInstrument,
  type SkillLevel,
  type TradeType,
} from "../site";
import { SLUG_PATTERN, autoSlug } from "../slug";

export type Raw = Record<string, string | undefined>;
export type FieldErrors = Record<string, string>;
export type Validated<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

export const LIMITS = {
  title: 100,
  content: 10000,
  description: 5000,
  contact: 100,
  tag: 20,
  tags: 5,
  positions: 5,
  meta: 160,
  maxPrice: 100_000_000,
  /** 너무 짧은 글 막기 (비회원 RPC 와 같은 기준) */
  minTitle: 2,
  minContent: 5,
  comment: 2000,
  minComment: 2,
  reportDetail: 500,
  images: 6,
  imageBytes: 10 * 1024 * 1024,
} as const;

/** 장터 사진 — schema.sql 의 market 버킷 허용 형식과 같다 */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const IMAGE_NAME = /^[^\\<>:"|?*]{1,200}\.(jpe?g|png|webp|gif)$/i;

/* ───────── 공통 도우미 ───────── */
/** 받침에 맞는 조사 (을/를, 은/는) */
function josa(word: string, withBatchim: string, without: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const has = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (has ? withBatchim : without);
}
const str = (raw: Raw, k: string) => (raw[k] ?? "").trim();
const opt = (raw: Raw, k: string) => str(raw, k) || null;
const bool = (raw: Raw, k: string) => raw[k] === "on" || raw[k] === "true" || raw[k] === "1";

function required(errors: FieldErrors, k: string, v: string, label: string, max: number) {
  if (!v) errors[k] = `${josa(label, "을", "를")} 입력해 주세요.`;
  else if (v.length > max) errors[k] = `${josa(label, "은", "는")} ${max}자 이하로 적어 주세요.`;
}
function minLen(errors: FieldErrors, k: string, v: string, label: string, min: number) {
  if (v && v.length < min && !errors[k]) errors[k] = `${josa(label, "이", "가")} 너무 짧아요. ${min}자 이상 적어 주세요.`;
}
function maxLen(errors: FieldErrors, k: string, v: string | null, label: string, max: number) {
  if (v && v.length > max) errors[k] = `${josa(label, "은", "는")} ${max}자 이하로 적어 주세요.`;
}
function listOf(raw: Raw, k: string): string[] {
  return str(raw, k)
    .split(/[,，#\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s, i, a) => a.indexOf(s) === i);
}
const YOUTUBE = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i;
function youtube(errors: FieldErrors, raw: Raw): string | null {
  const v = opt(raw, "youtube_url");
  if (v && !YOUTUBE.test(v)) errors.youtube_url = "유튜브 주소(youtube.com 또는 youtu.be)만 넣을 수 있어요.";
  return v;
}
function todayKst(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}
const done = <T,>(errors: FieldErrors, data: T): Validated<T> => (Object.keys(errors).length ? { ok: false, errors } : { ok: true, data });

/* ───────── 커뮤니티 ───────── */
export type CommunityInput = {
  category: CommunityCategory;
  qna_subject: QnaSubject | null;
  title: string;
  content: string;
  youtube_url: string | null;
  is_anonymous: boolean;
  tags: string[];
};
export function validateCommunity(raw: Raw): Validated<CommunityInput> {
  const e: FieldErrors = {};
  const category = str(raw, "category");
  if (!isKey(COMMUNITY_CATEGORIES, category)) e.category = "게시판을 골라 주세요.";
  const subject = opt(raw, "qna_subject");
  if (category === "qna" && !isKey(QNA_SUBJECTS, subject)) e.qna_subject = "질문 과목을 골라 주세요.";
  const title = str(raw, "title");
  required(e, "title", title, "제목", LIMITS.title);
  minLen(e, "title", title, "제목", LIMITS.minTitle);
  const content = str(raw, "content");
  required(e, "content", content, "본문", LIMITS.content);
  minLen(e, "content", content, "본문", LIMITS.minContent);
  const youtube_url = youtube(e, raw);
  const tags = listOf(raw, "tags");
  if (tags.length > LIMITS.tags) e.tags = `태그는 ${LIMITS.tags}개까지 달 수 있어요.`;
  else if (tags.some((t) => t.length > LIMITS.tag)) e.tags = `태그 하나는 ${LIMITS.tag}자 이하로 적어 주세요.`;
  return done(e, {
    category: category as CommunityCategory,
    qna_subject: category === "qna" ? (subject as QnaSubject) : null,
    title,
    content,
    youtube_url,
    // 익명 게시판은 항상 익명 (DB 트리거도 강제한다)
    is_anonymous: category === "anon" || bool(raw, "is_anonymous"),
    tags,
  });
}

/* ───────── 중고 장터 ───────── */
export type MarketInput = {
  trade_type: TradeType;
  category: MarketCategory;
  title: string;
  description: string;
  price: number;
  is_free_share: boolean;
  region: string;
  item_condition: ItemCondition | null;
  contact: string | null;
  /** Supabase 모드: market 버킷 경로(<uid>/파일) · 데모 모드: 파일 이름 */
  images: string[];
};
export function validateMarket(raw: Raw): Validated<MarketInput> {
  const e: FieldErrors = {};
  const trade = str(raw, "trade_type");
  if (!isKey(TRADE_TYPES, trade)) e.trade_type = "판매·구매·나눔 중 하나를 골라 주세요.";
  const category = str(raw, "category");
  if (!isKey(MARKET_CATEGORIES, category)) e.category = "종류를 골라 주세요.";
  const title = str(raw, "title");
  required(e, "title", title, "제목", LIMITS.title);
  const description = str(raw, "description");
  required(e, "description", description, "설명", LIMITS.description);
  let price = 0;
  if (trade !== "share") {
    const p = str(raw, "price").replace(/[,\s원]/g, "");
    price = Number(p);
    if (!p || !Number.isInteger(price) || price < 0) e.price = "가격을 숫자로 입력해 주세요.";
    else if (price > LIMITS.maxPrice) e.price = "가격이 너무 커요. 다시 확인해 주세요.";
  }
  const region = str(raw, "region");
  if (!(REGIONS as readonly string[]).includes(region)) e.region = "지역을 골라 주세요.";
  const cond = opt(raw, "item_condition");
  if (cond && !isKey(ITEM_CONDITIONS, cond)) e.item_condition = "물건 상태를 다시 골라 주세요.";
  if (trade === "sell" && !cond) e.item_condition = "판매글은 물건 상태를 골라 주세요.";
  const contact = opt(raw, "contact");
  maxLen(e, "contact", contact, "연락 안내", LIMITS.contact);
  const images = imageList(e, raw);
  return done(e, {
    images,
    trade_type: trade as TradeType,
    category: category as MarketCategory,
    title,
    description,
    price,
    is_free_share: trade === "share",
    region,
    item_condition: trade === "buy" ? null : (cond as ItemCondition | null),
    contact,
  });
}

function imageList(e: FieldErrors, raw: Raw): string[] {
  const v = str(raw, "images");
  if (!v) return [];
  let list: unknown;
  try {
    list = JSON.parse(v);
  } catch {
    list = null;
  }
  if (!Array.isArray(list) || list.some((x) => typeof x !== "string")) {
    e.images = "사진 정보가 올바르지 않아요. 사진을 다시 골라 주세요.";
    return [];
  }
  if (list.length > LIMITS.images) e.images = `사진은 ${LIMITS.images}장까지 올릴 수 있어요.`;
  else if ((list as string[]).some((x) => !IMAGE_NAME.test(x))) e.images = "JPG·PNG·WEBP·GIF 사진만 올릴 수 있어요.";
  return list as string[];
}

/* ───────── 댓글 · 신고 (lib/interact) ───────── */
export function validateComment(content: string): string | null {
  const v = content.trim();
  if (!v) return "댓글을 입력해 주세요.";
  if (v.length < LIMITS.minComment) return `댓글이 너무 짧아요. ${LIMITS.minComment}자 이상 적어 주세요.`;
  if (v.length > LIMITS.comment) return `댓글은 ${LIMITS.comment}자 이하로 적어 주세요.`;
  return null;
}

export const REPORT_REASONS = {
  spam: "스팸·광고",
  abuse: "욕설·비방",
  illegal: "불법·유해 정보",
  copyright: "저작권 침해",
  fraud: "사기·거래 문제",
  etc: "기타",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;

export function validateReport(reason: string, detail: string): string | null {
  if (!isKey(REPORT_REASONS, reason)) return "신고 사유를 골라 주세요.";
  if (reason === "etc" && !detail.trim()) return "기타 사유는 내용을 적어 주세요.";
  if (detail.length > LIMITS.reportDetail) return `신고 내용은 ${LIMITS.reportDetail}자 이하로 적어 주세요.`;
  return null;
}

/** 글 수정(제목·본문·태그) — 커뮤니티 글과 같은 기준 */
export function validatePostEdit(raw: Raw): Validated<{ title: string; content: string; tags: string[] }> {
  const v = validateCommunity({ ...raw, category: "free" });
  if (!v.ok) {
    const { title, content, tags } = v.errors;
    return { ok: false, errors: Object.fromEntries(Object.entries({ title, content, tags }).filter(([, m]) => m)) as FieldErrors };
  }
  return { ok: true, data: { title: v.data.title, content: v.data.content, tags: v.data.tags } };
}

/* ───────── 구인·모집 ───────── */
export type RecruitInput = {
  category: RecruitCategory;
  recruit_level: RecruitLevel | null;
  title: string;
  description: string;
  region: string;
  positions: string[];
  genre: string | null;
  skill_level: SkillLevel | null;
  deadline: string | null;
  contact: string | null;
};
export function validateRecruit(raw: Raw): Validated<RecruitInput> {
  const e: FieldErrors = {};
  const category = str(raw, "category");
  if (!isKey(RECRUIT_CATEGORIES, category)) e.category = "모집 유형을 골라 주세요.";
  const level = opt(raw, "recruit_level");
  if (category === "band" && !isKey(RECRUIT_LEVELS, level)) e.recruit_level = "밴드 모집은 성격(취미·세미프로·현역)을 꼭 골라 주세요.";
  else if (level && !isKey(RECRUIT_LEVELS, level)) e.recruit_level = "성격을 다시 골라 주세요.";
  const title = str(raw, "title");
  required(e, "title", title, "제목", LIMITS.title);
  const description = str(raw, "description");
  required(e, "description", description, "설명", LIMITS.description);
  const region = str(raw, "region");
  if (!(REGIONS as readonly string[]).includes(region)) e.region = "지역(또는 온라인)을 골라 주세요.";
  const positions = listOf(raw, "positions");
  if (positions.length > LIMITS.positions) e.positions = `모집 역할은 ${LIMITS.positions}개까지 적을 수 있어요.`;
  const genre = opt(raw, "genre");
  maxLen(e, "genre", genre, "장르", 30);
  const skill = opt(raw, "skill_level");
  if (skill && !isKey(SKILL_LEVELS, skill)) e.skill_level = "실력을 다시 골라 주세요.";
  const deadline = opt(raw, "deadline");
  if (deadline) {
    const today = todayKst();
    const max = new Date(Date.parse(`${today}T00:00:00Z`) + 365 * 86_400_000).toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) e.deadline = "마감일 형식이 올바르지 않아요.";
    else if (deadline < today) e.deadline = "마감일은 오늘 이후로 골라 주세요.";
    else if (deadline > max) e.deadline = "마감일은 1년 안으로 골라 주세요.";
  }
  const contact = opt(raw, "contact");
  maxLen(e, "contact", contact, "연락 안내", LIMITS.contact);
  return done(e, {
    category: category as RecruitCategory,
    recruit_level: (level as RecruitLevel | null) ?? null,
    title,
    description,
    region,
    positions,
    genre,
    skill_level: (skill as SkillLevel | null) ?? null,
    deadline,
    contact,
  });
}

/* ───────── 악보 요청 ───────── */
export type ScoreRequestInput = { song_title: string; instrument: ScoreInstrument; description: string | null };
export function validateScoreRequest(raw: Raw): Validated<ScoreRequestInput> {
  const e: FieldErrors = {};
  const song = str(raw, "song_title");
  required(e, "song_title", song, "곡명", LIMITS.title);
  const instrument = str(raw, "instrument");
  if (!isKey(SCORE_INSTRUMENTS, instrument)) e.instrument = "악기를 골라 주세요.";
  const description = opt(raw, "description");
  maxLen(e, "description", description, "설명", 1000);
  return done(e, { song_title: song, instrument: instrument as ScoreInstrument, description });
}

/* ───────── 자동 주소 ───────── */
/**
 * 악보·정보글 주소(slug)는 입력받지 않고 제목으로 만든다(로마자, 없으면 '<prefix>-랜덤').
 * 같은 주소가 이미 있으면 서버 액션이 저장 직전에 -2, -3 … 을 붙인다(lib/write/actions.ts).
 */
function checkedSlug(e: FieldErrors, title: string, prefix: string): string {
  const slug = autoSlug(title, prefix);
  if (title && !e.title && (!SLUG_PATTERN.test(slug) || slug.length > 80)) e.title = "이 제목으로는 주소를 만들 수 없어요. 제목을 조금 바꿔 주세요.";
  return slug;
}

/** 악보 미리보기 이미지 경로 — thumbnails 버킷의 scores/<악기>/<이름>.jpg */
const THUMB_PATH = /^scores\/[a-z0-9-]+\/[a-z0-9-]+\.(jpe?g|png|webp)$/;

/* ───────── 악보 (에디터) ───────── */
export type ScoreInput = {
  title: string;
  slug: string;
  instrument: ScoreInstrument;
  difficulty: Difficulty;
  genre: string | null;
  artist: string | null;
  meta_description: string;
  file_path: string | null;
  file_name: string | null;
  /** thumbnails 버킷 상대 경로 (브라우저가 만든 PDF 첫 페이지 이미지). 없으면 null */
  thumbnail_path: string | null;
};
export function validateScore(raw: Raw, { requireFile }: { requireFile: boolean }): Validated<ScoreInput> {
  const e: FieldErrors = {};
  const title = str(raw, "title");
  required(e, "title", title, "곡 제목", LIMITS.title);
  const slug = checkedSlug(e, title, "score");
  const instrument = str(raw, "instrument");
  if (!isKey(SCORE_INSTRUMENTS, instrument)) e.instrument = "악기를 골라 주세요.";
  const difficulty = str(raw, "difficulty");
  if (!isKey(DIFFICULTIES, difficulty)) e.difficulty = "난이도를 골라 주세요.";
  const genre = opt(raw, "genre");
  if (genre && !(SCORE_GENRES as readonly string[]).includes(genre)) e.genre = "장르를 다시 골라 주세요.";
  const artist = opt(raw, "artist");
  maxLen(e, "artist", artist, "작곡가·아티스트", 60);
  const meta = str(raw, "meta_description");
  required(e, "meta_description", meta, "검색 설명", LIMITS.meta);
  const file_path = opt(raw, "file_path");
  const file_name = opt(raw, "file_name");
  if (requireFile && !file_path) e.file = "악보 PDF 파일을 올려 주세요.";
  // 미리보기 이미지는 선택 — 형식이 이상하면 등록은 막지 않고 버린다
  const thumb = opt(raw, "thumbnail_path");
  const thumbnail_path = thumb && THUMB_PATH.test(thumb) && thumb.length <= 200 ? thumb : null;
  return done(e, {
    title,
    slug,
    instrument: instrument as ScoreInstrument,
    difficulty: difficulty as Difficulty,
    genre,
    artist,
    meta_description: meta,
    file_path,
    file_name,
    thumbnail_path,
  });
}

/* ───────── 정보글 (에디터) ───────── */
export type ArticleInput = {
  category: ArticleCategory;
  title: string;
  slug: string;
  meta_description: string;
  content: string;
  keywords: string;
  youtube_url: string | null;
  author_display: "editor" | "member";
  is_published: boolean;
};
export function validateArticle(raw: Raw): Validated<ArticleInput> {
  const e: FieldErrors = {};
  const category = str(raw, "category");
  if (!isKey(ARTICLE_CATEGORIES, category)) e.category = "분류를 골라 주세요.";
  const title = str(raw, "title");
  required(e, "title", title, "제목", LIMITS.title);
  const slug = checkedSlug(e, title, "article");
  const meta = str(raw, "meta_description");
  required(e, "meta_description", meta, "요약(검색 설명)", LIMITS.meta);
  const content = str(raw, "content");
  required(e, "content", content, "본문", 50000);
  const keywords = listOf(raw, "keywords");
  if (keywords.length > 10) e.keywords = "키워드는 10개까지 적을 수 있어요.";
  const youtube_url = youtube(e, raw);
  const display = str(raw, "author_display") === "member" ? "member" : "editor";
  return done(e, {
    category: category as ArticleCategory,
    title,
    slug,
    meta_description: meta,
    content,
    keywords: keywords.join(", "),
    youtube_url,
    author_display: display,
    is_published: bool(raw, "is_published"),
  });
}

/** FormData → Raw (파일 필드는 제외) */
export function formToRaw(fd: FormData): Raw {
  const raw: Raw = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") raw[k] = v;
  return raw;
}
