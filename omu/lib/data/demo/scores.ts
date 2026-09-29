import type { Score, ScoreRequest } from "../types";

// 공개 전 정리: 실제 PDF 가 준비된 악보가 없으므로 비워 둔다.
// 악보 공유는 '준비 중' — 에디터가 PDF 를 등록하면(Supabase) 그때부터 보인다.
export const DEMO_SCORES: Score[] = [];

// 악보 요청도 실제 요청이 아니므로 비워 둔다.
export const DEMO_SCORE_REQUESTS: ScoreRequest[] = [];
