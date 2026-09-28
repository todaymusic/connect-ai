// 랜딩용 목데이터 — Supabase 연결 전까지 화면을 채우는 더미 데이터.
// 실제 콘텐츠가 아니며, DB 연동 시 lib/data 계층으로 교체한다.
import type {
  ArticleCategory,
  CommunityCategory,
  Difficulty,
  MarketCategory,
  MarketStatus,
  QnaSubject,
  RecruitCategory,
  RecruitLevel,
  ScoreInstrument,
  TradeType,
} from "./site";

export type MockScore = {
  id: string;
  title: string;
  slug: string;
  artist: string;
  instrument: ScoreInstrument;
  difficulty: Difficulty;
  genre: string;
  downloads: number;
  pages: number;
  byEditor: boolean;
};

export type MockArticle = {
  id: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  summary: string;
  views: number;
  readMinutes: number;
  authorDisplay: "editor" | "member";
  authorName: string;
  hasVideo?: boolean;
};

export type MockMarketItem = {
  id: string;
  title: string;
  category: MarketCategory;
  tradeType: TradeType;
  price: number;
  status: MarketStatus;
  region: string;
  timeAgo: string;
  comments: number;
};

export type MockPost = {
  id: string;
  title: string;
  category: CommunityCategory;
  qnaSubject?: QnaSubject;
  authorName: string;
  isAnonymous: boolean;
  isNotice?: boolean;
  isAnswered?: boolean;
  views: number;
  comments: number;
  timeAgo: string;
};

export type MockRecruit = {
  id: string;
  title: string;
  category: RecruitCategory;
  level?: RecruitLevel;
  genre: string;
  region: string;
  positions: string[];
  timeAgo: string;
  isClosed?: boolean;
};

/* ───────── 이번 주 무료 악보 ───────── */
export const MOCK_SCORES: MockScore[] = [
  { id: "s1", title: "캐논 변주곡 (쉬운 편곡)", slug: "canon-easy", artist: "파헬벨", instrument: "piano", difficulty: "easy", genre: "클래식", downloads: 1284, pages: 3, byEditor: true },
  { id: "s2", title: "엘리제를 위하여", slug: "fur-elise", artist: "베토벤", instrument: "piano", difficulty: "intermediate", genre: "클래식", downloads: 962, pages: 4, byEditor: true },
  { id: "s3", title: "작은 별 변주 입문", slug: "twinkle-variation", artist: "모차르트", instrument: "piano", difficulty: "beginner", genre: "동요·민요", downloads: 540, pages: 2, byEditor: true },
  { id: "s4", title: "짐노페디 1번", slug: "gymnopedie-1", artist: "사티", instrument: "piano", difficulty: "intermediate", genre: "클래식", downloads: 731, pages: 3, byEditor: true },
  { id: "s5", title: "아리랑 핑거스타일", slug: "arirang-fingerstyle", artist: "전통민요", instrument: "guitar", difficulty: "intermediate", genre: "동요·민요", downloads: 812, pages: 3, byEditor: true },
  { id: "s6", title: "로망스 (금지된 장난)", slug: "romance-anonimo", artist: "작자 미상", instrument: "guitar", difficulty: "advanced", genre: "클래식", downloads: 1103, pages: 4, byEditor: true },
  { id: "s7", title: "첫 코드 4개로 치는 연습곡", slug: "four-chords-etude", artist: "OMU 연습보", instrument: "guitar", difficulty: "beginner", genre: "연습곡", downloads: 2210, pages: 2, byEditor: true },
  { id: "s8", title: "그린슬리브스", slug: "greensleeves-guitar", artist: "잉글랜드 민요", instrument: "guitar", difficulty: "easy", genre: "동요·민요", downloads: 455, pages: 2, byEditor: true },
  { id: "s9", title: "8비트 기본 그루브 20선", slug: "8beat-groove-20", artist: "OMU 연습보", instrument: "drum", difficulty: "beginner", genre: "연습곡", downloads: 1530, pages: 5, byEditor: true },
  { id: "s10", title: "셔플 필인 모음", slug: "shuffle-fill-in", artist: "OMU 연습보", instrument: "drum", difficulty: "intermediate", genre: "연습곡", downloads: 688, pages: 3, byEditor: true },
  { id: "s11", title: "보사노바 리듬 패턴", slug: "bossa-nova-pattern", artist: "OMU 연습보", instrument: "drum", difficulty: "intermediate", genre: "재즈", downloads: 402, pages: 2, byEditor: true },
  { id: "s12", title: "하프타임 셔플 입문", slug: "half-time-shuffle", artist: "OMU 연습보", instrument: "drum", difficulty: "advanced", genre: "연습곡", downloads: 377, pages: 3, byEditor: true },
  { id: "s13", title: "도레미 발성 스케일 연습", slug: "vocal-scale-basic", artist: "OMU 연습보", instrument: "vocal", difficulty: "beginner", genre: "연습곡", downloads: 1920, pages: 2, byEditor: true },
  { id: "s14", title: "아메이징 그레이스", slug: "amazing-grace-vocal", artist: "존 뉴턴", instrument: "vocal", difficulty: "easy", genre: "CCM", downloads: 845, pages: 2, byEditor: true },
  { id: "s15", title: "워킹 베이스 기초 12마디", slug: "walking-bass-12bar", artist: "OMU 연습보", instrument: "bass", difficulty: "intermediate", genre: "재즈", downloads: 612, pages: 3, byEditor: true },
  { id: "s16", title: "메이저 스케일 전 조성표", slug: "major-scale-chart", artist: "OMU 연습보", instrument: "chord", difficulty: "beginner", genre: "연습곡", downloads: 3012, pages: 2, byEditor: true },
  { id: "s17", title: "호흡·립트릴 10분 루틴", slug: "breath-lip-trill", artist: "OMU 연습보", instrument: "vocal", difficulty: "beginner", genre: "연습곡", downloads: 1377, pages: 2, byEditor: true },
  { id: "s18", title: "오 대니 보이", slug: "danny-boy-vocal", artist: "아일랜드 민요", instrument: "vocal", difficulty: "intermediate", genre: "동요·민요", downloads: 508, pages: 3, byEditor: true },
  { id: "s19", title: "8분음표 피킹 루트 연습", slug: "bass-root-eighth", artist: "OMU 연습보", instrument: "bass", difficulty: "beginner", genre: "연습곡", downloads: 934, pages: 2, byEditor: true },
  { id: "s20", title: "슬랩 입문 패턴 8가지", slug: "slap-basic-8", artist: "OMU 연습보", instrument: "bass", difficulty: "advanced", genre: "연습곡", downloads: 721, pages: 3, byEditor: true },
  { id: "s21", title: "미뉴에트 G장조 베이스 편곡", slug: "minuet-g-bass", artist: "OMU 연습보", instrument: "bass", difficulty: "easy", genre: "클래식", downloads: 288, pages: 2, byEditor: true },
  { id: "s22", title: "기타 오픈 코드표 30", slug: "open-chord-30", artist: "OMU 연습보", instrument: "chord", difficulty: "beginner", genre: "연습곡", downloads: 4105, pages: 2, byEditor: true },
  { id: "s23", title: "펜타토닉 5포지션 지도", slug: "pentatonic-5-positions", artist: "OMU 연습보", instrument: "chord", difficulty: "intermediate", genre: "연습곡", downloads: 2380, pages: 3, byEditor: true },
  { id: "s24", title: "16비트 리듬패턴 카드", slug: "16beat-rhythm-cards", artist: "OMU 연습보", instrument: "chord", difficulty: "easy", genre: "연습곡", downloads: 1164, pages: 2, byEditor: true },
];

/* ───────── 음악정보 최신 ───────── */
export const MOCK_ARTICLES: MockArticle[] = [
  { id: "a1", title: "첫 통기타, 30만 원 안에서 고르는 체크리스트", slug: "guitar-first-buy", category: "beginner", summary: "바디 모양·넥 두께·액션 높이까지, 매장에서 바로 확인할 수 있는 항목만 추렸어요.", views: 4210, readMinutes: 6, authorDisplay: "editor", authorName: "OMU 에디터" },
  { id: "a2", title: "실용음악과 입시, 1년 준비 로드맵", slug: "exam-one-year-roadmap", category: "exam", summary: "전공 실기·청음·시창 준비를 분기별로 나눠 정리한 준비 흐름.", views: 3187, readMinutes: 8, authorDisplay: "editor", authorName: "OMU 에디터" },
  { id: "a3", title: "명연 라이브로 보는 재즈 스탠더드 입문", slug: "jazz-standard-live", category: "story", summary: "처음 재즈를 들을 때 추천하는 라이브 영상과 감상 포인트.", views: 1956, readMinutes: 5, authorDisplay: "member", authorName: "재즈듣는밤", hasVideo: true },
];

/* ───────── 중고 장터 ───────── */
export const MOCK_MARKET: MockMarketItem[] = [
  { id: "m1", title: "야마하 디지털피아노 P-125 (거의 새것)", category: "keyboard", tradeType: "sell", price: 520000, status: "selling", region: "서울", timeAgo: "12분 전", comments: 3 },
  { id: "m2", title: "스트랫 타입 일렉기타 + 소프트케이스", category: "guitar", tradeType: "sell", price: 280000, status: "reserved", region: "경기", timeAgo: "1시간 전", comments: 7 },
  { id: "m3", title: "연습용 전자드럼 스틱·패드 세트 나눔", category: "drum", tradeType: "share", price: 0, status: "selling", region: "인천", timeAgo: "3시간 전", comments: 12 },
  { id: "m4", title: "USB 오디오인터페이스 2in2 구해요", category: "equipment", tradeType: "buy", price: 150000, status: "selling", region: "부산", timeAgo: "5시간 전", comments: 2 },
];

/* ───────── 커뮤니티 ───────── */
export const MOCK_QNA: MockPost[] = [
  { id: "p1", title: "F코드 바레가 계속 뭉개지는데 손목 각도 문제일까요?", category: "qna", qnaSubject: "guitar", authorName: "초보기타", isAnonymous: false, isAnswered: false, views: 128, comments: 0, timeAgo: "20분 전" },
  { id: "p2", title: "고음에서 목이 조이는 느낌, 발성 연습 순서가 궁금해요", category: "qna", qnaSubject: "vocal", authorName: "노래하는곰", isAnonymous: false, isAnswered: false, views: 96, comments: 1, timeAgo: "1시간 전" },
  { id: "p3", title: "체르니 30 들어가기 전에 뭘 더 해야 할까요", category: "qna", qnaSubject: "piano", authorName: "건반연습생", isAnonymous: false, isAnswered: false, views: 74, comments: 0, timeAgo: "2시간 전" },
  { id: "p4", title: "베이스 톤, 앰프 EQ 먼저? 이펙터 먼저?", category: "qna", qnaSubject: "bass", authorName: "저음왕", isAnonymous: false, isAnswered: false, views: 61, comments: 2, timeAgo: "4시간 전" },
];

export const MOCK_POPULAR: MockPost[] = [
  { id: "n1", title: "OMU 오픈 베타 안내 — 무료 악보·중고장터 먼저 열었어요", category: "free", authorName: "OMU 운영자", isAnonymous: false, isNotice: true, views: 5320, comments: 41, timeAgo: "공지" },
  { id: "p5", title: "합주실 첫 대관할 때 챙기면 좋은 것들 정리", category: "free", authorName: "주말밴드", isAnonymous: false, views: 2140, comments: 38, timeAgo: "어제" },
  { id: "p6", title: "3년 차 보컬 학원 강사인데 요즘 고민이 많아요", category: "anon", authorName: "익명", isAnonymous: true, views: 1873, comments: 52, timeAgo: "어제" },
  { id: "p7", title: "첫 버스킹 영상 올려봐요, 피드백 부탁드립니다", category: "showcase", authorName: "홍대기타", isAnonymous: false, views: 1422, comments: 27, timeAgo: "2일 전" },
  { id: "p8", title: "20평 연습실 창업 초기 비용 공유합니다", category: "startup", authorName: "합주실사장", isAnonymous: false, views: 1308, comments: 33, timeAgo: "3일 전" },
];

/* ───────── 밴드·팀원 모집 ───────── */
export const MOCK_RECRUITS: MockRecruit[] = [
  { id: "r1", title: "직장인 주말 밴드, 드러머 한 분 모셔요", category: "band", level: "hobby", genre: "모던락", region: "서울", positions: ["드럼"], timeAgo: "30분 전" },
  { id: "r2", title: "공연 준비 중인 팝펑크 밴드 베이시스트 구인", category: "band", level: "semipro", genre: "팝펑크", region: "경기", positions: ["베이스"], timeAgo: "2시간 전" },
  { id: "r3", title: "정규 앨범 세션 작업, 키보디스트 찾습니다", category: "band", level: "pro", genre: "R&B", region: "서울", positions: ["키보드"], timeAgo: "5시간 전" },
  { id: "r4", title: "대학가 어쿠스틱 듀오, 보컬 겸 기타 구해요", category: "band", level: "hobby", genre: "어쿠스틱", region: "대전", positions: ["보컬", "기타"], timeAgo: "어제" },
];

export const POPULAR_KEYWORDS = ["캐논 변주곡", "통기타 입문", "F코드", "디지털피아노", "드럼 연습실", "실용음악 입시"];

/** 히어로 '오늘의 OMU' 요약 수치 (목데이터) */
export const TODAY_STATS = {
  freeScores: 48,
  newMarket: 26,
  waitingQuestions: 14,
  newRecruits: 9,
};
