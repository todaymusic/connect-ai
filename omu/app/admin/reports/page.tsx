import type { Metadata } from "next";
import { connection } from "next/server";
import { AdminGuardNotice } from "@/components/admin/AdminGuardNotice";
import { ReportsBoard } from "@/components/admin/ReportsBoard";
import { getAdminAccess, listReports, type ReportStatus } from "@/lib/admin";
import { first } from "@/lib/url";

export const metadata: Metadata = {
  title: "신고 처리 — 관리자",
  robots: { index: false, follow: false },
};

const STATUSES = ["open", "resolved", "dismissed", "all"] as const;

/** /admin/reports — 신고 목록과 처리 (관리자 전용, /admin 과 같은 가드) */
export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await connection();
  const access = await getAdminAccess();
  if (access.kind !== "admin" && access.kind !== "preview") return <AdminGuardNotice access={access} />;

  const sp = await searchParams;
  const raw = first(sp.status);
  const status = (STATUSES as readonly string[]).includes(raw ?? "") ? (raw as ReportStatus | "all") : "open";
  const [{ items, error }, open] = await Promise.all([listReports(access, status), listReports(access, "open")]);
  return <ReportsBoard items={items} error={error} status={status} openCount={open.items.length} preview={access.kind === "preview"} done={first(sp.done) ?? null} />;
}
