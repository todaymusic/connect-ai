// 사이트 전역 상수 — 메뉴 구조·카테고리 라벨·URL 규칙 (작업지시서 5장)

export const SITE_NAME = "OMU";
export const SITE_TAGLINE = "악보부터 밴드 구인까지, 음악하는 사람들의 모든 것";
export const SITE_DESCRIPTION =
  "무료 악보, 악기 입문·입시 정보, 중고 악기 장터, 밴드·세션 구인, 음악 커뮤니티를 한곳에서. OMU 음악 커뮤니티 포털.";

/**
 * 공식 연락처 — 정해지면 여기 한 곳에만 넣는다.
 * 비워 두면(null) 푸터에는 표시하지 않고, 고객센터·개인정보처리방침에는 '문의 채널 준비 중'으로 나온다.
 */
export const CONTACT: { email: string | null; phone: string | null } = {
  email: null,
  phone: null,
};
export const hasContact = () => Boolean(CONTACT.email || CONTACT.phone);

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** 상단 글로벌 메뉴 — 순서 고정 (5-1) */
export const MAIN_MENU = [
  { href: "/score", label: "악보공유" },
  { href: "/info", label: "음악정보" },
  { href: "/gear", label: "악기" },
  { href: "/recruit", label: "구인·모집" },
  { href: "/community", label: "커뮤니티" },
] as const;

/* ───────── 악보 ───────── */
export const SCORE_INSTRUMENTS = {
  piano: "피아노",
  guitar: "기타",
  vocal: "보컬",
  drum: "드럼",
  bass: "베이스",
  band: "밴드스코어",
  chord: "코드·연습보",
} as const;
export type ScoreInstrument = keyof typeof SCORE_INSTRUMENTS;

export const DIFFICULTIES = {
  beginner: "입문",
  easy: "초급",
  intermediate: "중급",
  advanced: "고급",
} as const;
export type Difficulty = keyof typeof DIFFICULTIES;

/** 악기별 기본 파트 구성 (DB 에 파트 정보가 없을 때 화면 표시용) */
export const SCORE_DEFAULT_PARTS: Record<ScoreInstrument, string[]> = {
  piano: ["멜로디", "반주(양손)"],
  guitar: ["TAB", "코드 다이어그램"],
  vocal: ["멜로디", "가사", "호흡 표시"],
  drum: ["드럼 악보", "카운트"],
  bass: ["TAB", "오선보"],
  band: ["보컬", "기타", "베이스", "드럼", "건반"],
  chord: ["차트"],
};

export const SCORE_GENRES = ["클래식", "가요", "팝", "재즈", "락", "OST", "동요·민요", "CCM", "연습곡"] as const;

/* ───────── 음악정보 (5-2) + 악기 탭의 정보 콘텐츠 ───────── */
export const INFO_CATEGORIES = {
  beginner: "악기 입문",
  exam: "입시 준비",
  contest: "공연·공모전",
  venue: "연습실·대관",
  story: "뮤직스토리",
} as const;
export type InfoCategory = keyof typeof INFO_CATEGORIES;

/** 악기 > 장비 정보·추천 / 악기 정보·추천 은 articles 테이블을 공유한다 */
export const GEAR_ARTICLE_CATEGORIES = {
  equipment: "장비 정보·추천",
  instrument: "악기 정보·추천",
} as const;
export type GearArticleCategory = keyof typeof GEAR_ARTICLE_CATEGORIES;

export const ARTICLE_CATEGORIES = { ...INFO_CATEGORIES, ...GEAR_ARTICLE_CATEGORIES } as const;
export type ArticleCategory = keyof typeof ARTICLE_CATEGORIES;

export function articlePath(category: string, slug: string) {
  if (category === "equipment" || category === "instrument") return `/gear/${category}/${slug}`;
  return `/info/${category}/${slug}`;
}

/* ───────── 중고 장터 ───────── */
export const MARKET_CATEGORIES = {
  guitar: "기타·베이스",
  keyboard: "건반",
  drum: "드럼·타악기",
  wind: "관악기",
  equipment: "음향·장비",
  etc: "기타 용품",
} as const;
export type MarketCategory = keyof typeof MARKET_CATEGORIES;

export const TRADE_TYPES = { sell: "판매", buy: "구매", share: "나눔" } as const;
export type TradeType = keyof typeof TRADE_TYPES;

export const MARKET_STATUS = { selling: "판매중", reserved: "예약중", sold: "거래완료" } as const;
export type MarketStatus = keyof typeof MARKET_STATUS;

/** 물건 상태 (중고 판매글) */
export const ITEM_CONDITIONS = { new: "새 상품", like_new: "거의 새것", good: "사용감 적음", fair: "사용감 있음" } as const;
export type ItemCondition = keyof typeof ITEM_CONDITIONS;

export const REGIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "온라인",
] as const;

/* ───────── 구인·모집 ───────── */
export const RECRUIT_CATEGORIES = {
  band: "밴드·팀원 모집",
  session: "세션·외주",
  lesson: "강사·레슨",
  audition: "공고·공모전·오디션",
} as const;
export type RecruitCategory = keyof typeof RECRUIT_CATEGORIES;

export const RECRUIT_LEVELS = { hobby: "취미", semipro: "세미프로", pro: "현역·프로" } as const;
export type RecruitLevel = keyof typeof RECRUIT_LEVELS;

export const SKILL_LEVELS = { beginner: "초급", intermediate: "중급", advanced: "고급" } as const;
export type SkillLevel = keyof typeof SKILL_LEVELS;

/* ───────── 커뮤니티 ───────── */
export const COMMUNITY_CATEGORIES = {
  free: "자유·잡담",
  anon: "익명 게시판",
  qna: "Q&A",
  showcase: "연주 자랑·피드백",
  startup: "음악창업 고민방",
} as const;
export type CommunityCategory = keyof typeof COMMUNITY_CATEGORIES;

export const QNA_SUBJECTS = {
  piano: "피아노",
  guitar: "기타",
  vocal: "보컬",
  drum: "드럼",
  bass: "베이스",
  composition: "작곡·편곡",
  etc: "기타",
} as const;
export type QnaSubject = keyof typeof QNA_SUBJECTS;

export const ROLES = { user: "일반 회원", editor: "에디터", admin: "관리자" } as const;
export type Role = keyof typeof ROLES;

export const EDITOR_DISPLAY_NAME = "OMU 에디터";

export function isKey<T extends object>(obj: T, key: unknown): key is keyof T {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(obj, key);
}
