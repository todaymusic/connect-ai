import type { Metadata } from "next";
import { connection } from "next/server";
import { AdminGuardNotice } from "@/components/admin/AdminGuardNotice";
import { ContentBoard, type ContentDone } from "@/components/admin/ContentBoard";
import { countOpenReports, getAdminAccess, listAdminContent } from "@/lib/admin";
import { first } from "@/lib/url";

export const metadata: Metadata = {
  title: "악보·정보글 등록 — 관리자",
  robots: { index: false, follow: false },
};

/** 삭제 후 남은 파일 표시용 — 버킷/경로 형식만 받는다 */
const LEFTOVER = /^(scores|thumbnails)\/[A-Za-z0-9._\/-]{1,200}$/;

/** /admin/content — 악보·정보글 등록 바로가기와 최근 목록 (관리자 전용, /admin 과 같은 가드) */
export default async function AdminContentPage({ searchParams }: PageProps<"/admin/content">) {
  // 항상 요청 시점에 렌더 (권한·목록을 빌드 시점에 굳히지 않도록)
  await connection();
  const access = await getAdminAccess();
  if (access.kind !== "admin" && access.kind !== "preview") return <AdminGuardNotice access={access} />;

  const sp = await searchParams;
  const kind = first(sp.done);
  const left = ([] as string[]).concat(sp.left ?? []).filter((p) => LEFTOVER.test(p)).slice(0, 4);
  const done: ContentDone = kind === "score" || kind === "article" ? { kind, leftovers: left } : null;

  const [content, openReports] = await Promise.all([listAdminContent(access), countOpenReports(access)]);
  return <ContentBoard content={content} preview={access.kind === "preview"} openReports={openReports} done={done} />;
}
