// 글로벌 메뉴 + 소분류 링크 (헤더·모바일 메뉴·푸터·카테고리 카드가 공유)
import {
  COMMUNITY_CATEGORIES,
  GEAR_ARTICLE_CATEGORIES,
  INFO_CATEGORIES,
  MAIN_MENU,
  RECRUIT_CATEGORIES,
  SCORE_INSTRUMENTS,
} from "./site";

export type NavSection = {
  href: string;
  label: string;
  description: string;
  children: { href: string; label: string }[];
};

const [score, info, gear, recruit, community] = MAIN_MENU;

export const NAV_SECTIONS: NavSection[] = [
  {
    ...score,
    description: "과목별 무료 악보와 코드·연습보, 악보 요청까지",
    children: [
      ...Object.entries(SCORE_INSTRUMENTS).map(([key, label]) => ({ href: `/score/${key}`, label })),
      { href: "/score/requests", label: "악보 요청" },
    ],
  },
  {
    ...info,
    description: "입문·입시·공모전·연습실 정보와 뮤직스토리",
    children: Object.entries(INFO_CATEGORIES).map(([key, label]) => ({ href: `/info/${key}`, label })),
  },
  {
    ...gear,
    description: "중고 장터에서 사고팔고, 장비·악기 추천 읽기",
    children: [
      { href: "/gear/market", label: "중고 장터" },
      ...Object.entries(GEAR_ARTICLE_CATEGORIES).map(([key, label]) => ({ href: `/gear/${key}`, label })),
    ],
  },
  {
    ...recruit,
    description: "밴드 멤버·세션·강사·오디션 공고",
    children: Object.entries(RECRUIT_CATEGORIES).map(([key, label]) => ({ href: `/recruit/${key}`, label })),
  },
  {
    ...community,
    description: "자유·익명·Q&A·연주 자랑·음악창업 이야기",
    children: Object.entries(COMMUNITY_CATEGORIES).map(([key, label]) => ({ href: `/community/${key}`, label })),
  },
];

/** 글쓰기 CTA 드롭다운 항목 */
export const WRITE_ACTIONS = [
  { href: "/community/new", label: "커뮤니티 글쓰기", hint: "자유·익명·Q&A·연주 자랑" },
  { href: "/gear/market/new", label: "중고 판매글", hint: "판매·구매·나눔" },
  { href: "/recruit/new", label: "모집글", hint: "밴드·세션·레슨·오디션" },
  { href: "/score/requests/new", label: "악보 요청", hint: "이 곡 악보 있나요?" },
] as const;
