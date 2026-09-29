"use client";

import { Flag, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { getGuestSecret } from "@/lib/guest/client";
import { submitReport, type ReportTarget } from "@/lib/interact/actions";
import { addLocalReport, hasReported, markReported, subscribeLocal } from "@/lib/interact/local";
import { LIMITS, REPORT_REASONS, type ReportReason } from "@/lib/write/validate";
import { Honeypot, useStartedAt } from "./SpamGuard";

/**
 * 신고 버튼 + 신고 창 — 회원·비회원 모두 가능.
 * 같은 대상은 한 번만(브라우저 기록 + 서버·DB 가 다시 확인), 연속 신고는 서버·DB 가 막는다.
 */
export function ReportButton({
  targetType,
  targetId,
  title,
  path,
  compact = false,
}: {
  targetType: ReportTarget;
  targetId: string;
  /** 관리자 화면(데모) 표시용 */
  title: string;
  path: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const reported = useSyncExternalStore(
    subscribeLocal,
    () => hasReported(targetType, targetId),
    () => false,
  );
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(true)}
        disabled={reported}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
          reported ? "cursor-default text-ink-3" : "text-ink-3 hover:bg-stone hover:text-ink"
        }`}
      >
        <Flag aria-hidden className="size-3.5" />
        {reported ? "신고함" : compact ? "신고" : "신고하기"}
      </button>
      {open && (
        <ReportDialog
          targetType={targetType}
          targetId={targetId}
          title={title}
          path={path}
          onClose={() => {
            setOpen(false);
            btnRef.current?.focus();
          }}
        />
      )}
    </>
  );
}

function ReportDialog({
  targetType,
  targetId,
  title,
  path,
  onClose,
}: {
  targetType: ReportTarget;
  targetId: string;
  title: string;
  path: string;
  onClose: () => void;
}) {
  const id = useId();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [demo, setDemo] = useState(false);
  const started = useStartedAt();
  const honeypot = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    if (done) closeRef.current?.focus();
  }, [done]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reason) return setError("신고 사유를 골라 주세요.");
    if (reason === "etc" && !detail.trim()) return setError("기타 사유는 내용을 적어 주세요.");
    if (hasReported(targetType, targetId)) return setError("이미 신고한 글이에요.");
    setBusy(true);
    const res = await submitReport({
      targetType,
      targetId,
      reason,
      detail,
      secret: getGuestSecret(),
      website: honeypot.current?.value ?? "",
      startedAt: started.current,
    }).catch(() => ({ status: "error" as const, message: "신고를 보내지 못했어요. 잠시 후 다시 시도해 주세요." }));
    setBusy(false);
    if (res.status === "error") {
      setError(res.message);
      if (/이미 신고/.test(res.message)) markReported(targetType, targetId);
      return;
    }
    if (res.status === "demo") {
      setDemo(true);
      addLocalReport({
        id: `lr-${Date.now().toString(36)}`,
        targetType,
        targetId,
        title,
        path,
        reason,
        detail: detail.trim(),
        createdAt: new Date().toISOString(),
        status: "open",
        reporter: res.reporter,
      });
    }
    markReported(targetType, targetId);
    setDone(true);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className="max-h-[92dvh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${id}-title`} className="text-lg font-extrabold text-ink">
            {done ? "신고가 접수됐어요" : "신고하기"}
          </h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="-mr-1 -mt-1 rounded-full p-1.5 text-ink-3 hover:bg-stone hover:text-ink">
            <X aria-hidden className="size-5" />
          </button>
        </div>

        {done ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              {demo
                ? "지금은 데모 모드라 신고가 서버로 전달되지 않고 이 브라우저에만 기록돼요. 정식 오픈 후에는 운영자에게 전달돼요."
                : "운영자가 확인한 뒤 필요하면 글을 숨기거나 정리해요. 같은 글은 다시 신고할 수 없어요."}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-ink text-sm font-bold text-paper"
            >
              확인
            </button>
          </>
        ) : (
          <form onSubmit={send} noValidate className="mt-3">
            <p className="truncate text-xs text-ink-3">대상: {title}</p>
            <fieldset className="mt-3">
              <legend className="text-sm font-bold text-ink">
                사유 <span className="text-coral-deep">*</span>
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {(Object.keys(REPORT_REASONS) as ReportReason[]).map((r, i) => (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                      reason === r ? "border-ink bg-ink text-paper" : "border-line-2 bg-paper text-ink-2 hover:border-ink-3"
                    }`}
                  >
                    <input
                      ref={i === 0 ? firstRef : undefined}
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="sr-only"
                    />
                    {REPORT_REASONS[r]}
                  </label>
                ))}
              </div>
            </fieldset>
            <label htmlFor={`${id}-detail`} className="mt-4 block text-sm font-bold text-ink">
              내용 {reason === "etc" ? <span className="text-coral-deep">*</span> : <span className="font-normal text-ink-3">(선택)</span>}
            </label>
            <textarea
              id={`${id}-detail`}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={LIMITS.reportDetail}
              rows={3}
              placeholder="어떤 점이 문제인지 알려 주시면 빨리 처리할 수 있어요."
              className="mt-1.5 w-full resize-none rounded-xl border border-line-2 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
            />
            <Honeypot inputRef={honeypot} />
            {error && (
              <p role="alert" className="mt-2 text-sm font-semibold text-coral-deep">
                {error}
              </p>
            )}
            <p className="mt-2 text-xs text-ink-3">허위 신고가 반복되면 신고가 제한될 수 있어요.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={onClose} className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-line-2 text-sm font-bold text-ink">
                취소
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-coral text-sm font-bold text-white hover:bg-coral-deep disabled:opacity-60"
              >
                {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
                신고 보내기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
