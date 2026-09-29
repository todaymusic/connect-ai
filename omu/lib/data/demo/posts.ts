import type { Comment, Post } from "../types";

// 공개 전 정리: 실제 회원이 쓴 글이 아니므로 공지·예시 글·댓글을 모두 비워 둔다.
// 커뮤니티는 열려 있다 — 첫 글은 이용자가 직접 남긴다(Supabase 연결 전에는 이 브라우저에만 저장).
// ⚠️ 음악창업 고민방은 정확한 정보가 필요한 영역이라 어떤 예시 글도 넣지 않는다.
export const DEMO_POSTS: Post[] = [];

export const DEMO_COMMENTS: Comment[] = [];
