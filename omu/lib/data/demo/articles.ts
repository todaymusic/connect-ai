import type { ArticleCategory } from "../../site";
import type { Article } from "../types";
import { AUTHORS, DEMO_NOTICE, HOUR, ago } from "./common";

// 본문은 화면 구조 확인용 더미다 — 실제 정보글은 에디터가 관리자 페이지에서 올린다.
function demoBody(summary: string): string {
  return [
    summary,
    "## 먼저 알아두면 좋은 것",
    "이 자리에는 주제의 배경과 왜 중요한지가 들어갑니다. 실제 글에서는 경험과 기준을 구체적으로 적습니다.",
    "## 체크 포인트",
    "- 예시 항목 A — 실제 글에서는 구체적인 기준과 예시가 들어갑니다.",
    "- 예시 항목 B — 가격대, 난이도, 준비물처럼 비교할 수 있는 정보를 적습니다.",
    "- 예시 항목 C — 처음 하는 사람이 자주 놓치는 부분을 짚습니다.",
    "## 정리",
    DEMO_NOTICE,
  ].join("\n\n");
}

// [slug, 분류, 제목, 요약, 표기, 조회수, 읽는 시간(분), 몇 시간 전, 키워드]
const ROWS: [string, ArticleCategory, string, string, "editor" | "member", number, number, number, string[]][] = [
  ["guitar-first-buy", "beginner", "첫 통기타, 30만 원 안에서 고르는 체크리스트", "바디 모양·넥 두께·액션 높이까지, 매장에서 바로 확인할 수 있는 항목만 추렸어요.", "editor", 4210, 6, 5, ["기타", "입문", "구매"]],
  ["digital-piano-88-keys", "beginner", "디지털피아노 입문, 88건반이 꼭 필요할까", "건반 수·해머 액션·스피커까지 입문자가 따져볼 기준을 정리했어요.", "editor", 2876, 5, 30, ["피아노", "입문", "디지털피아노"]],
  ["drum-pad-first-month", "beginner", "드럼 연습패드로 시작하는 한 달 루틴", "스틱 잡는 법부터 기본 스트로크까지, 집에서 할 수 있는 연습 순서예요.", "editor", 1540, 4, 60, ["드럼", "입문", "연습"]],
  ["exam-one-year-roadmap", "exam", "실용음악과 입시, 1년 준비 로드맵", "전공 실기·청음·시창 준비를 분기별로 나눠 정리한 준비 흐름.", "editor", 3187, 8, 12, ["입시", "실용음악과"]],
  ["exam-audition-song", "exam", "입시 실기곡 고르는 기준 5가지", "내 음역과 강점이 드러나는 곡을 고르는 기준을 정리했어요.", "editor", 2014, 6, 80, ["입시", "실기곡"]],
  ["fall-songwriter-contests", "contest", "가을 싱어송라이터 공모전 모음", "접수 기간·참가 조건·제출 형식을 한눈에 비교할 수 있게 모았어요.", "editor", 1765, 5, 20, ["공모전", "싱어송라이터"]],
  ["first-stage-checklist", "contest", "첫 공연 무대에 서기 전 체크리스트", "리허설·세팅·무대 매너까지 첫 공연 전에 챙길 것들.", "member", 988, 4, 100, ["공연", "무대"]],
  ["rehearsal-room-first-booking", "venue", "합주실 첫 대관 가이드", "시간 단위 요금, 기본 장비, 예약 전 확인할 것들을 정리했어요.", "editor", 1432, 5, 40, ["합주실", "대관"]],
  ["practice-room-monthly", "venue", "개인 연습실 월 대여, 무엇을 봐야 할까", "방음·출입 시간·관리비처럼 계약 전에 확인할 항목들.", "member", 1120, 5, 130, ["연습실", "월대여"]],
  ["jazz-standard-live", "story", "명연 라이브로 보는 재즈 스탠더드 입문", "처음 재즈를 들을 때 추천하는 라이브와 감상 포인트.", "member", 1956, 5, 8, ["재즈", "라이브"]],
  ["chord-progression-terms", "story", "코드 진행 용어 한 번에 정리", "투파이브원, 세컨더리 도미넌트 같은 용어를 쉬운 말로 풀었어요.", "editor", 2650, 7, 55, ["화성", "용어"]],
  ["first-audio-interface", "equipment", "첫 오디오 인터페이스 고르는 법", "입출력 수·프리앰프·드라이버 안정성까지 홈레코딩 입문 기준.", "editor", 2210, 6, 18, ["오디오인터페이스", "홈레코딩"]],
  ["dynamic-vs-condenser", "equipment", "홈레코딩 마이크, 다이내믹 vs 콘덴서", "방 환경과 목소리에 따라 어떤 마이크가 맞는지 비교했어요.", "editor", 1874, 5, 90, ["마이크", "홈레코딩"]],
  ["beginner-electric-guitar-brands", "instrument", "입문용 일렉기타 브랜드별 특징", "브랜드별 넥 느낌과 픽업 성향을 입문자 눈높이로 정리했어요.", "editor", 2390, 6, 26, ["일렉기타", "입문"]],
  ["edrum-entry-points", "instrument", "전자드럼 입문 모델 비교 포인트", "메시 헤드·모듈 음색·층간소음 대책까지 비교 기준.", "editor", 1610, 5, 110, ["전자드럼", "입문"]],
];

export const DEMO_ARTICLES: Article[] = ROWS.map(([slug, category, title, summary, authorDisplay, views, readMinutes, hoursAgo, keywords], i) => ({
  id: `a${i + 1}`,
  slug,
  category,
  title,
  summary,
  content: demoBody(summary),
  keywords,
  youtubeUrl: null,
  views,
  readMinutes,
  authorDisplay,
  author: authorDisplay === "editor" ? AUTHORS.editor : i % 2 ? AUTHORS.jazz : AUTHORS.band,
  publishedAt: ago(hoursAgo * HOUR),
}));
