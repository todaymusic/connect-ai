// OMU 도메인 타입 — 화면은 이 타입만 본다.
// 데이터 출처(데모 / Supabase)가 바뀌어도 화면 코드는 그대로 두기 위한 경계다.
// 날짜는 모두 ISO 문자열이다(서버 → 클라이언트 컴포넌트로 넘길 때 직렬화가 안전하도록).
import type {
  ArticleCategory,
  ItemCondition,
  CommunityCategory,
  Difficulty,
  MarketCategory,
  MarketStatus,
  QnaSubject,
  RecruitCategory,
  RecruitLevel,
  Role,
  ScoreInstrument,
  SkillLevel,
  TradeType,
} from "../site";

export type Author = {
  id: string;
  nickname: string;
  role: Role;
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type Score = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  instrument: ScoreInstrument;
  difficulty: Difficulty;
  genre: string;
  /** 악보에 들어 있는 파트 (예: 멜로디·반주, 기타 TAB) */
  parts: string[];
  /** 쪽수. DB 스키마에 없는 값이라 모르면 null */
  pages: number | null;
  downloads: number;
  views: number;
  /** 검색결과 설명문 (SEO meta_description) */
  description: string;
  /** Storage 경로. 아직 파일이 없으면 null → 다운로드는 '준비 중' */
  fileUrl: string | null;
  author: Author | null;
  createdAt: string;
};

export type Article = {
  id: string;
  slug: string;
  category: ArticleCategory;
  title: string;
  summary: string;
  /** 마크다운 일부(## 제목, - 목록, 빈 줄 문단)만 지원 */
  content: string;
  keywords: string[];
  youtubeUrl: string | null;
  views: number;
  readMinutes: number;
  authorDisplay: "editor" | "member";
  author: Author | null;
  publishedAt: string;
};

export type MarketItem = {
  id: string;
  title: string;
  category: MarketCategory;
  tradeType: TradeType;
  price: number;
  status: MarketStatus;
  /** 물건 상태 (확장 필드 item_condition) */
  condition: ItemCondition | null;
  region: string;
  description: string;
  /** 연락 안내 (1차: 오픈채팅 링크·연락 가능 시간 등 판매자가 적은 문구) */
  contact: string | null;
  imageUrls: string[];
  seller: Author | null;
  views: number;
  commentCount: number;
  createdAt: string;
};

export type Recruit = {
  id: string;
  title: string;
  category: RecruitCategory;
  level: RecruitLevel | null;
  genre: string | null;
  skillLevel: SkillLevel | null;
  region: string;
  /** 모집 역할(포지션). DB 스키마에는 아직 없는 확장 필드 — 없으면 빈 배열 */
  positions: string[];
  /** 활동 일정 안내(확장 필드, 선택) */
  schedule: string | null;
  /** 마감일 YYYY-MM-DD (확장 필드, 선택) */
  deadline: string | null;
  description: string;
  contact: string | null;
  isClosed: boolean;
  author: Author | null;
  views: number;
  commentCount: number;
  createdAt: string;
};

export type Post = {
  id: string;
  category: CommunityCategory;
  qnaSubject: QnaSubject | null;
  title: string;
  content: string;
  youtubeUrl: string | null;
  isAnonymous: boolean;
  /** 익명 글이면 null (작성자를 화면·API 어디에도 내보내지 않는다) */
  author: Author | null;
  authorDisplay: "member" | "editor";
  isNotice: boolean;
  isAnswered: boolean;
  tags: string[];
  views: number;
  commentCount: number;
  createdAt: string;
  /** 이 글과 연결된 악보 slug (곡 중심 동선용, 선택) */
  relatedScoreSlug: string | null;
  /** 비회원 글이면 자동 표시 이름 (예: 새벽 기타리스트) */
  guestName: string | null;
  /** 작성자가 고친 시각 */
  editedAt: string | null;
};

export type CommentTarget = "post" | "recruit" | "market" | "article" | "score";

export type Comment = {
  id: string;
  targetType: CommentTarget;
  targetId: string;
  parentId: string | null;
  content: string;
  isAnonymous: boolean;
  isAccepted: boolean;
  author: Author | null;
  createdAt: string;
  guestName: string | null;
  editedAt: string | null;
  /** 삭제(숨김)된 댓글 자리 — 답글이 남아 있을 때만 '삭제된 댓글입니다' 로 보인다 */
  deleted?: boolean;
};

export type CommentThread = Comment & { replies: Comment[] };

export type ScoreRequest = {
  id: string;
  songTitle: string;
  instrument: ScoreInstrument;
  description: string | null;
  status: "open" | "fulfilled";
  fulfilledScoreSlug: string | null;
  author: Author | null;
  createdAt: string;
};
