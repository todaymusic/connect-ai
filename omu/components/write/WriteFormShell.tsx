"use client";

import Link from "next/link";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { WriteResult } from "@/lib/write/actions";
import { saveDemoWrite } from "@/lib/write/demo-store";
import type { FieldErrors, Raw } from "@/lib/write/validate";

export type FormState = { values: Raw; errors: FieldErrors };
type Action = (prev: WriteResult, fd: FormData) => Promise<WriteResult>;

const INITIAL: WriteResult = { status: "idle" };

/**
 * 글쓰기 폼 공통 틀
 *  - 서버 액션으로 제출 (Supabase 모드: 저장 후 상세로 이동 / 데모 모드: 결과를 이 브라우저에만 보관)
 *  - 오류가 나면 입력값을 그대로 되살리고, 오류 요약으로 포커스를 옮긴다
 *  - prepare: 제출 전에 브라우저에서 할 일(예: PDF 를 Storage 에 먼저 업로드)
 */
export function WriteFormShell({
  action,
  submitLabel,
  children,
  prepare,
  resetHref,
}: {
  action: Action;
  /** 데모/실제 모드 (데모 안내는 페이지의 역할 선택기가 보여준다) */
  mode: "demo" | "supabase";
  submitLabel: string;
  children: (s: FormState) => ReactNode;
  prepare?: (fd: FormData) => Promise<{ ok: true; fd: FormData } | { ok: false; message: string }>;
  resetHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [dismissedDemoId, setDismissedDemoId] = useState<string | null>(null);

  const demoRecord = state.status === "demo" && state.record.id !== dismissedDemoId ? state.record : null;

  // 데모 결과는 이 브라우저에 보관
  const savedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.status === "demo" && savedIdRef.current !== state.record.id) {
      savedIdRef.current = state.record.id;
      saveDemoWrite(state.record);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state]);

  useEffect(() => {
    if (state.status === "error" || prepareError) alertRef.current?.focus();
  }, [state, prepareError]);

  const formState: FormState =
    state.status === "error" ? { values: state.values ?? {}, errors: state.fieldErrors ?? {} } : { values: {}, errors: {} };

  // ⚠️ 제출은 onSubmit 에서 직접 서버 액션을 부른다.
  //    <form action> 에 맡기면 React 19 가 제출 뒤 폼을 자동 reset 해서, 오류가 났을 때
  //    선택값(지역 select·라디오)이 지워진다. JS 가 없을 때만 action 으로 제출된다.
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let fd = new FormData(e.currentTarget);
    setPrepareError(null);
    if (prepare) {
      setPreparing(true);
      const result = await prepare(fd);
      setPreparing(false);
      if (!result.ok) {
        setPrepareError(result.message);
        return;
      }
      fd = result.fd;
    }
    startTransition(() => formAction(fd));
  }

  if (demoRecord) {
    return (
      <div className="card p-5 sm:p-7" role="status">
        <p className="flex items-center gap-2 text-lg font-extrabold text-ink">
          <CheckCircle2 aria-hidden className="size-6 text-blue" />
          작성 흐름 확인 완료 (데모)
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          입력 검증과 권한 확인을 통과했어요. 지금은 <strong className="text-ink">데모 모드</strong>라 서버에는 저장되지 않고, 이 브라우저에만 보관돼요.
          Supabase 가 연결되면 같은 폼이 실제 게시글로 저장돼요.
        </p>
        <div className="mt-5 rounded-2xl border border-line bg-paper p-4">
          <p className="text-[17px] font-bold text-ink">{demoRecord.title}</p>
          <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
            {demoRecord.fields.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-ink-3">{k}</dt>
                <dd className="min-w-0 break-words font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {demoRecord.body && <p className="mt-3 line-clamp-6 whitespace-pre-line border-t border-line pt-3 text-sm leading-relaxed text-ink-2">{demoRecord.body}</p>}
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              setDismissedDemoId(demoRecord.id);
              setFormKey((k) => k + 1);
            }}
            className="inline-flex h-11 items-center rounded-full bg-coral px-5 text-sm font-bold text-white hover:bg-coral-deep"
          >
            하나 더 쓰기
          </button>
          <Link href="/write" className="inline-flex h-11 items-center rounded-full border border-line-2 bg-card px-5 text-sm font-bold text-ink hover:border-ink-3">
            작성 허브에서 보관함 보기
          </Link>
        </div>
      </div>
    );
  }

  const busy = pending || preparing;
  const message = prepareError ?? (state.status === "error" ? state.message : null);

  return (
    <form key={formKey} action={formAction} onSubmit={onSubmit} noValidate className="space-y-6">
      {message && (
        <div ref={alertRef} tabIndex={-1} role="alert" className="flex items-start gap-2 rounded-xl bg-coral-soft/50 px-4 py-3 text-sm text-coral-deep outline-none">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            {message}
            {Object.keys(formState.errors).length > 0 && <> ({Object.keys(formState.errors).length}개 항목)</>}
          </span>
        </div>
      )}

      {children(formState)}

      <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-line pt-5">
        <Link href={resetHref} className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-ink-3 hover:text-ink">
          취소
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-coral px-6 text-sm font-bold text-white transition-colors hover:bg-coral-deep disabled:opacity-60"
        >
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {preparing ? "파일 올리는 중…" : pending ? "저장 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
