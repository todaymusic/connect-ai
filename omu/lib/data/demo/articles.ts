import type { ArticleCategory } from "../../site";
import type { Article } from "../types";
import { AUTHORS } from "./common";

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

// 공개 전 정리 기준 (2026-09-29)
//  · 유지: 일반적인 팁·체크리스트 — 가격·일정·요건·제도·특정 브랜드/음반을 단정하지 않는 글
//  · 제거: 공모전 목록, 입시 일정, 브랜드별 특징, 특정 라이브 추천, 용어 정의처럼 정확한 사실이 필요한데 본문에 없는 글
//    (fall-songwriter-contests, exam-one-year-roadmap, beginner-electric-guitar-brands, jazz-standard-live, chord-progression-terms)
//  · 가짜 조회수 금지(0 → 화면에서 숨김), 작성자는 OMU 에디터, 게시일은 고정(빌드 때마다 '방금 전'으로 바뀌지 않게),
//    읽는 시간은 실제 본문 길이로 계산.
// ⚠️ 본문(demoBody)은 아직 범용 문구라 에디터 검수·교체가 필요하다.
// ⚠️ 이 목록은 데모 모드(Supabase 미연결)에서만 쓰인다. Supabase 를 연결하면 articles 테이블의 글이 보인다.

// [slug, 분류, 제목, 요약, 키워드]
const ROWS: [string, ArticleCategory, string, string, string[]][] = [
  ["guitar-first-buy", "beginner", "첫 통기타, 매장에서 확인할 체크리스트", "바디 모양·넥 두께·액션 높이처럼 매장에서 직접 확인해 볼 항목을 추렸어요.", ["기타", "입문", "구매"]],
  ["digital-piano-88-keys", "beginner", "디지털피아노 입문, 88건반이 꼭 필요할까", "건반 수·건반 무게감·스피커처럼 입문자가 따져볼 기준을 정리했어요.", ["피아노", "입문", "디지털피아노"]],
  ["drum-pad-first-month", "beginner", "드럼 연습패드로 시작하는 연습 루틴", "스틱 잡는 법부터 기본 스트로크까지, 집에서 해 볼 수 있는 연습 순서예요.", ["드럼", "입문", "연습"]],
  ["exam-audition-song", "exam", "입시 실기곡 고를 때 생각해 볼 기준", "내 음역과 강점이 드러나는 곡을 고를 때 참고할 기준이에요. 모집 요강은 학교별로 꼭 확인하세요.", ["입시", "실기곡"]],
  ["first-stage-checklist", "contest", "첫 공연 무대에 서기 전 체크리스트", "리허설·세팅·무대 매너까지 첫 공연 전에 챙길 것들.", ["공연", "무대"]],
  ["rehearsal-room-first-booking", "venue", "합주실 처음 대관할 때 확인할 것들", "예약 전에 장비 구성·이용 시간·취소 규정처럼 미리 확인하면 좋은 항목을 모았어요.", ["합주실", "대관"]],
  ["practice-room-monthly", "venue", "개인 연습실 월 대여, 무엇을 봐야 할까", "방음·출입 시간·관리비처럼 계약 전에 확인할 항목들.", ["연습실", "월대여"]],
  ["first-audio-interface", "equipment", "첫 오디오 인터페이스 고르는 법", "입출력 수·프리앰프·드라이버 안정성처럼 홈레코딩 입문 때 따져볼 기준.", ["오디오인터페이스", "홈레코딩"]],
  ["dynamic-vs-condenser", "equipment", "홈레코딩 마이크, 다이내믹 vs 콘덴서", "방 환경과 목소리에 따라 마이크를 고를 때 생각해 볼 점을 정리했어요.", ["마이크", "홈레코딩"]],
  ["edrum-entry-points", "instrument", "전자드럼 입문 모델 비교 포인트", "메시 헤드·모듈 음색·층간소음 대책처럼 모델을 비교할 때 볼 기준.", ["전자드럼", "입문"]],
];

/** 글을 정리해 둔 날짜 — 목록 순서를 위해 1분씩 차이를 둔다 */
const PUBLISHED = Date.parse("2026-09-29T09:00:00+09:00");

export const DEMO_ARTICLES: Article[] = ROWS.map(([slug, category, title, summary, keywords], i) => {
  const content = demoBody(summary);
  return {
    id: `a${i + 1}`,
    slug,
    category,
    title,
    summary,
    content,
    keywords,
    youtubeUrl: null,
    views: 0,
    // Supabase 모드(lib/data/articles.ts)와 같은 계산 — 실제 본문 길이 기준
    readMinutes: Math.max(1, Math.round(content.length / 500)),
    authorDisplay: "editor" as const,
    author: AUTHORS.editor,
    publishedAt: new Date(PUBLISHED - i * 60_000).toISOString(),
  };
});
