import type { Metadata } from "next";
import { connection } from "next/server";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminGuardNotice } from "@/components/admin/AdminGuardNotice";
import { getAdminAccess, getAdminSummary } from "@/lib/admin";

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

/**
 * /admin — 권한 가드
 *  - 비로그인: 로그인 안내  - 로그인 + 관리자 아님: 권한 없음 안내
 *  - Supabase 미연결: 운영은 비활성 안내 / 개발은 목데이터 미리보기
 *  - 관리자(profiles.role = 'admin'): 대시보드
 * 가드는 각 페이지에서 수행한다(레이아웃은 이동 시 다시 렌더되지 않으므로 가드에 쓰지 않음).
 */
export default async function AdminPage() {
  // 항상 요청 시점에 렌더 (권한·환경변수를 빌드 시점에 굳히지 않도록)
  await connection();
  const access = await getAdminAccess();

  if (access.kind === "admin" || access.kind === "preview") {
    const summary = await getAdminSummary(access);
    return <AdminDashboard summary={summary} adminName={access.kind === "admin" ? access.user.nickname : null} />;
  }
  return <AdminGuardNotice access={access} />;
}
