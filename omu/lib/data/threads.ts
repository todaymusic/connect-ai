// 댓글 묶기 — 서버(목록)와 브라우저(데모 댓글 합치기)가 같이 쓴다
import type { Comment, CommentThread } from "./types";

/** 1단계 답글 구조로 묶는다. 부모가 삭제(숨김)된 답글은 '삭제된 댓글입니다' 자리 아래에 남긴다 */
export function buildThreads(rows: Comment[]): CommentThread[] {
  const roots: CommentThread[] = rows.filter((c) => !c.parentId).map((c) => ({ ...c, replies: [] }));
  const byId = new Map(roots.map((c) => [c.id, c]));
  for (const c of rows) {
    if (!c.parentId) continue;
    let parent = byId.get(c.parentId);
    if (!parent) {
      parent = { ...c, id: c.parentId, parentId: null, content: "", isAccepted: false, author: null, guestName: null, editedAt: null, deleted: true, replies: [] };
      byId.set(parent.id, parent);
      roots.push(parent);
    }
    parent.replies.push(c);
  }
  return roots.sort((a, b) => Number(b.isAccepted) - Number(a.isAccepted) || (a.createdAt < b.createdAt ? -1 : 1));
}
