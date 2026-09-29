"use client";

import { useRouter } from "next/navigation";
import { Check, EyeOff, Loader2, X } from "lucide-react";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { hideReportTarget, setReportStatus } from "@/lib/admin-actions";
import { cachedSnapshot, readLocalReports, subscribeLocal, updateLocalReport, type LocalReport } from "@/lib/interact/local";
import { ReportSummaryClient } from "./ReportSummaryClient";

/** 신고 한 건 처리 버튼 (서버 액션). 처리되면 목록에서 빠지므로 결과 문구는 화면 위쪽에 보여 준다 */
export function ReportRowActions({ id, canHide, status }: { id: string; canHide: boolean; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const run = (kind: "resolved" | "dismissed" | "hidden", fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const res = await fn().catch(() => ({ ok: false, message: "처리하지 못했어요." }));
      if (res.ok) router.replace(`/admin/reports?${status !== "open" ? `status=${status}&` : ""}done=${kind}`, { scroll: false });
      else setMessage(res.message);
    });
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        <Btn onClick={() => run("resolved", () => setReportStatus(id, "resolved"))} disabled={pending} icon={<Check aria-hidden className="size-3.5" />}>
          처리 완료
        </Btn>
        <Btn onClick={() => run("dismissed", () => setReportStatus(id, "dismissed"))} disabled={pending} icon={<X aria-hidden className="size-3.5" />}>
          기각
        </Btn>
        {canHide && (
          <Btn
            danger
            onClick={() => window.confirm("신고 대상을 숨길까요? 숨긴 글은 관리자만 볼 수 있어요.") && run("hidden", () => hideReportTarget(id))}
            disabled={pending}
            icon={<EyeOff aria-hidden className="size-3.5" />}
          >
            대상 숨기기
          </Btn>
        )}
        {pending && <Loader2 aria-label="처리 중" className="size-4 animate-spin self-center text-ink-3" />}
      </div>
      {message && (
        <p role="status" className="mt-2 text-xs font-semibold text-ink-2">
          {message}
        </p>
      )}
    </div>
  );
}

function Btn({ children, icon, onClick, disabled, danger }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-bold disabled:opacity-60 ${
        danger ? "border-coral/40 text-coral-deep hover:bg-coral-soft/40" : "border-line-2 text-ink hover:border-ink-3"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

const EMPTY: LocalReport[] = [];

/** 데모 모드: 이 브라우저에서 보낸 신고 (localStorage) */
export function LocalDemoReports() {
  const snap = useMemo(() => cachedSnapshot(readLocalReports), []);
  const list = useSyncExternalStore(subscribeLocal, snap, () => EMPTY);
  if (list.length === 0) return null;
  return (
    <section aria-labelledby="local-reports-title" className="mt-8">
      <h2 id="local-reports-title" className="text-base font-extrabold text-ink">
        이 브라우저에서 보낸 데모 신고 <span className="font-display text-ink-3">{list.length}</span>
      </h2>
      <ul className="mt-3 space-y-2.5">
        {list.map((r) => (
          <li key={r.id} className="card p-4" data-testid="local-report">
            <ReportSummaryClient r={r} />
            {r.status === "open" ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Btn onClick={() => updateLocalReport(r.id, "resolved")} icon={<Check aria-hidden className="size-3.5" />}>
                  처리 완료
                </Btn>
                <Btn onClick={() => updateLocalReport(r.id, "dismissed")} icon={<X aria-hidden className="size-3.5" />}>
                  기각
                </Btn>
              </div>
            ) : (
              <p className="mt-2 text-xs text-ink-3">{r.status === "resolved" ? "처리 완료" : "기각"} (데모)</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
