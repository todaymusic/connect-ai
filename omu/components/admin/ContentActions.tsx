"use client";

import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteContent } from "@/lib/admin-actions";

/**
 * 악보·정보글 삭제 버튼 (확인창 → 서버 액션).
 * 지운 행은 목록에서 빠지므로 결과는 주소(?done=…)로 넘겨 화면 위쪽에 보여 준다.
 */
export function DeleteContentButton({ kind, id, title, preview }: { kind: "score" | "article"; id: string; title: string; preview?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onClick() {
    const what = kind === "score" ? "악보를" : "정보글을";
    const files = kind === "score" ? " PDF·미리보기 파일도 함께 지워지고," : "";
    if (!window.confirm(`‘${title}’ ${what} 지울까요?${files} 되돌릴 수 없어요.`)) return;
    start(async () => {
      const res = await deleteContent(kind, id).catch(() => ({ ok: false, message: "지우지 못했어요. 잠시 후 다시 시도해 주세요.", leftovers: undefined }));
      if (!res.ok) return setMessage(res.message);
      const q = new URLSearchParams({ done: kind });
      res.leftovers?.forEach((p) => q.append("left", p));
      router.replace(`/admin/content?${q}`, { scroll: false });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending || preview}
        title={preview ? "미리보기에서는 지울 수 없어요" : undefined}
        className="inline-flex h-8 items-center gap-1 rounded-full border border-coral/40 px-3 text-xs font-bold text-coral-deep hover:bg-coral-soft/40 disabled:opacity-60"
      >
        {pending ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <Trash2 aria-hidden className="size-3.5" />}
        삭제
      </button>
      {message && (
        <p role="status" className="basis-full text-xs font-semibold text-coral-deep">
          {message}
        </p>
      )}
    </>
  );
}
