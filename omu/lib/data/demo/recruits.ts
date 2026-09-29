import type { Recruit } from "../types";
import { AUTHORS, DAY, DEMO_NOTICE, HOUR, ago } from "./common";

const note = (s: string) => `${s}\n\n${DEMO_NOTICE}`;
/** 오늘 기준 n일 뒤 날짜(YYYY-MM-DD) — 데모 마감일 */
function inDays(n: number): string {
  const d = new Date(Date.now() + n * 86_400_000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(d);
}

export const DEMO_RECRUITS: Recruit[] = [
  { id: "r1", title: "직장인 주말 밴드, 드러머 한 분 모셔요", category: "band", level: "hobby", genre: "모던락", skillLevel: "intermediate", region: "서울", positions: ["드럼"], schedule: "매주 토요일 오후 3시간, 합정 합주실", deadline: inDays(14), description: note("30대 직장인 4명 밴드예요. 커버곡 위주로 분기마다 작은 공연을 해요. 즐겁게 오래 할 분이면 좋겠습니다."), contact: "댓글로 지원해 주세요", isClosed: false, author: AUTHORS.band, views: 412, commentCount: 4, createdAt: ago(30) },
  { id: "r2", title: "공연 준비 중인 팝펑크 밴드 베이시스트 구인", category: "band", level: "semipro", genre: "팝펑크", skillLevel: "advanced", region: "경기", positions: ["베이스"], schedule: "주 2회 평일 저녁", deadline: inDays(7), description: note("자작곡 6곡으로 클럽 공연 준비 중입니다. 합주 영상 먼저 보내주세요."), contact: "댓글로 지원해 주세요", isClosed: false, author: AUTHORS.bass, views: 287, commentCount: 3, createdAt: ago(2 * HOUR) },
  { id: "r3", title: "정규 앨범 세션 작업, 키보디스트 찾습니다", category: "band", level: "pro", genre: "R&B", skillLevel: "advanced", region: "서울", positions: ["키보드"], schedule: "10월 중 녹음 3회", deadline: inDays(5), description: note("녹음 경험 있는 분을 찾습니다. 조건은 연락 주시면 안내드려요."), contact: "댓글로 지원해 주세요", isClosed: false, author: AUTHORS.keys, views: 198, commentCount: 1, createdAt: ago(5 * HOUR) },
  { id: "r4", title: "대학가 어쿠스틱 듀오, 보컬 겸 기타 구해요", category: "band", level: "hobby", genre: "어쿠스틱", skillLevel: "beginner", region: "대전", positions: ["보컬", "기타"], schedule: "주 1회 협의", deadline: null, description: note("버스킹 위주로 즐겁게 하실 분!"), contact: "댓글로 지원해 주세요", isClosed: false, author: AUTHORS.busking, views: 176, commentCount: 2, createdAt: ago(DAY) },
  { id: "r5", title: "온라인 합작 프로젝트, 믹싱 가능한 분", category: "session", level: null, genre: "시티팝", skillLevel: "intermediate", region: "온라인", positions: ["믹싱"], schedule: "비대면, 2주 작업", deadline: inDays(10), description: note("보컬·기타 트랙은 준비돼 있어요. 레퍼런스 공유드립니다."), contact: "댓글로 지원해 주세요", isClosed: false, author: AUTHORS.jazz, views: 143, commentCount: 0, createdAt: ago(8 * HOUR) },
  { id: "r6", title: "웨딩 연주 세션 바이올린 1명", category: "session", level: null, genre: "클래식", skillLevel: "advanced", region: "부산", positions: ["바이올린"], schedule: "11월 둘째 주 토요일", deadline: inDays(20), description: note("현악 3중주 편성입니다."), contact: "댓글로 지원해 주세요", isClosed: false, author: AUTHORS.studio, views: 95, commentCount: 1, createdAt: ago(DAY + 4 * HOUR) },
  { id: "r7", title: "주말 성인 기타 레슨 강사님 구합니다", category: "lesson", level: null, genre: null, skillLevel: "beginner", region: "경기", positions: ["기타 강사"], schedule: "토·일 오전", deadline: inDays(9), description: note("성인 입문반 수업을 맡아주실 분을 찾아요."), contact: "댓글로 지원해 주세요", isClosed: false, author: AUTHORS.studio, views: 231, commentCount: 2, createdAt: ago(10 * HOUR) },
  { id: "r8", title: "보컬 개인 레슨 받을 분 모집 (입시 대비)", category: "lesson", level: null, genre: "발라드", skillLevel: "intermediate", region: "온라인", positions: ["수강생"], schedule: "주 1회 화상 레슨", deadline: null, description: note("입시 곡 준비 위주로 진행합니다."), contact: "댓글로 지원해 주세요", isClosed: false, author: AUTHORS.vocal, views: 167, commentCount: 0, createdAt: ago(2 * DAY) },
  { id: "r9", title: "지역 청년 음악 페스티벌 참가 팀 모집", category: "audition", level: null, genre: null, skillLevel: null, region: "광주", positions: ["밴드", "솔로"], schedule: "본선 11월 중", deadline: inDays(3), description: note("장르 제한 없이 자작곡 1곡 이상이면 지원 가능합니다."), contact: "댓글로 지원해 주세요", isClosed: false, author: AUTHORS.admin, views: 389, commentCount: 5, createdAt: ago(DAY + 9 * HOUR) },
  { id: "r10", title: "여름 버스킹 크루 멤버 (모집 마감)", category: "band", level: "hobby", genre: "팝", skillLevel: "beginner", region: "부산", positions: ["퍼커션"], schedule: null, deadline: null, description: note("모집이 끝났습니다. 관심 가져주셔서 감사해요."), contact: null, isClosed: true, author: AUTHORS.drum, views: 302, commentCount: 8, createdAt: ago(6 * DAY) },
];
