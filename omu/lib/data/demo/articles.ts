import type { ArticleCategory } from "../../site";
import type { Article } from "../types";
import { AUTHORS, HOUR, ago } from "./common";

function demoBody(summary: string): string {
  return [
    summary,
    "## 핵심 기준",
    "처음 선택할 때는 가격보다 오래 쓸 수 있는 기준을 먼저 잡는 게 좋아요. 연습 환경, 현재 실력, 앞으로의 목표를 함께 놓고 보면 필요한 선택지가 훨씬 좁혀집니다.",
    "## 확인할 것",
    "- 지금 바로 필요한 기능과 나중에 있으면 좋은 기능을 나눠 봅니다.",
    "- 매장이나 연습실에서 직접 확인할 수 있는 항목은 짧게라도 테스트해 봅니다.",
    "- 처음 시작하는 사람이라면 관리가 쉬운 선택지를 우선으로 두는 편이 안전합니다.",
    "## 마무리",
    "처음부터 완벽한 선택을 하기는 어렵습니다. 다만 기준을 정해 두면 불필요한 지출을 줄이고, 연습을 이어가기 쉬운 방향으로 고를 수 있어요.",
  ].join("\n\n");
}

// [slug, 분류, 제목, 요약, 표기, 조회수, 읽는 시간(분), 몇 시간 전, 키워드]
// 공개 전 정리: 가짜 조회수 금지(모두 0) · 가상의 회원 작성자 대신 OMU 에디터 표기.
// ⚠️ 본문(demoBody)은 아직 범용 문구라 에디터 검수·교체가 필요하다.
const ROWS: [string, ArticleCategory, string, string, "editor" | "member", number, number, number, string[]][] = [
  ["guitar-first-buy", "beginner", "첫 통기타, 30만 원 안에서 고르는 체크리스트", "바디 모양·넥 두께·액션 높이까지, 매장에서 바로 확인할 수 있는 항목만 추렸어요.", "editor", 0, 6, 5, ["기타", "입문", "구매"]],
  ["digital-piano-88-keys", "beginner", "디지털피아노 입문, 88건반이 꼭 필요할까", "건반 수·해머 액션·스피커까지 입문자가 따져볼 기준을 정리했어요.", "editor", 0, 5, 30, ["피아노", "입문", "디지털피아노"]],
  ["drum-pad-first-month", "beginner", "드럼 연습패드로 시작하는 한 달 루틴", "스틱 잡는 법부터 기본 스트로크까지, 집에서 할 수 있는 연습 순서예요.", "editor", 0, 4, 60, ["드럼", "입문", "연습"]],
  ["exam-one-year-roadmap", "exam", "실용음악과 입시, 1년 준비 로드맵", "전공 실기·청음·시창 준비를 분기별로 나눠 정리한 준비 흐름.", "editor", 0, 8, 12, ["입시", "실용음악과"]],
  ["exam-audition-song", "exam", "입시 실기곡 고르는 기준 5가지", "내 음역과 강점이 드러나는 곡을 고르는 기준을 정리했어요.", "editor", 0, 6, 80, ["입시", "실기곡"]],
  ["fall-songwriter-contests", "contest", "가을 싱어송라이터 공모전 모음", "접수 기간·참가 조건·제출 형식을 한눈에 비교할 수 있게 모았어요.", "editor", 0, 5, 20, ["공모전", "싱어송라이터"]],
  ["first-stage-checklist", "contest", "첫 공연 무대에 서기 전 체크리스트", "리허설·세팅·무대 매너까지 첫 공연 전에 챙길 것들.", "editor", 0, 4, 100, ["공연", "무대"]],
  ["rehearsal-room-first-booking", "venue", "합주실 첫 대관 가이드", "시간 단위 요금, 기본 장비, 예약 전 확인할 것들을 정리했어요.", "editor", 0, 5, 40, ["합주실", "대관"]],
  ["practice-room-monthly", "venue", "개인 연습실 월 대여, 무엇을 봐야 할까", "방음·출입 시간·관리비처럼 계약 전에 확인할 항목들.", "editor", 0, 5, 130, ["연습실", "월대여"]],
  ["jazz-standard-live", "story", "명연 라이브로 보는 재즈 스탠더드 입문", "처음 재즈를 들을 때 추천하는 라이브와 감상 포인트.", "editor", 0, 5, 8, ["재즈", "라이브"]],
  ["chord-progression-terms", "story", "코드 진행 용어 한 번에 정리", "투파이브원, 세컨더리 도미넌트 같은 용어를 쉬운 말로 풀었어요.", "editor", 0, 7, 55, ["화성", "용어"]],
  ["first-audio-interface", "equipment", "첫 오디오 인터페이스 고르는 법", "입출력 수·프리앰프·드라이버 안정성까지 홈레코딩 입문 기준.", "editor", 0, 6, 18, ["오디오인터페이스", "홈레코딩"]],
  ["dynamic-vs-condenser", "equipment", "홈레코딩 마이크, 다이내믹 vs 콘덴서", "방 환경과 목소리에 따라 어떤 마이크가 맞는지 비교했어요.", "editor", 0, 5, 90, ["마이크", "홈레코딩"]],
  ["beginner-electric-guitar-brands", "instrument", "입문용 일렉기타 브랜드별 특징", "브랜드별 넥 느낌과 픽업 성향을 입문자 눈높이로 정리했어요.", "editor", 0, 6, 26, ["일렉기타", "입문"]],
  ["edrum-entry-points", "instrument", "전자드럼 입문 모델 비교 포인트", "메시 헤드·모듈 음색·층간소음 대책까지 비교 기준.", "editor", 0, 5, 110, ["전자드럼", "입문"]],
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
  author: AUTHORS.editor,
  publishedAt: ago(hoursAgo * HOUR),
}));
