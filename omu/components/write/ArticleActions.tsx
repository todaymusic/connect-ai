"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteArticle, publishArticle } from "@/lib/write/article-actions";
import { useCurrentUser } from "../auth/useCurrentUser";

const btn = "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-bold disabled:opacity-60";

/** 초안 발행 (확인창 → 서버 액션). 결과는 back 주소의 ?done= 으로 화면 위쪽에 보여 준다 */
export function PublishArticleButton({ id, title, back }: { id: string; title: string; back: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`‘${title}’ 글을 발행할까요? 발행하면 바로 누구나 볼 수 있고, 초안으로 되돌릴 수 없어요.`)) return;
          start(async () => {
            const res = await publishArticle(id).catch(() => ({ ok: false, message: "발행하지 못했어요. 잠시 후 다시 시도해 주세요." }));
            if (!res.ok) return setMessage(res.message);
            router.replace(`${back}?done=published`, { scroll: false });
          });
        }}
        className={`${btn} border-coral bg-coral text-white hover:bg-coral-deep`}
      >
        {pending ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <Send aria-hidden className="size-3.5" />}
        발행
      </button>
      {message && (
        <p role="status" className="basis-full text-xs font-semibold text-coral-deep">
          {message}
        </p>
      )}
    </>
  );
}

/** 정보글 삭제 (확인창 → 서버 액션) */
export function DeleteArticleButton({ id, title, back }: { id: string; title: string; back: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`‘${title}’ 글을 지울까요? 되돌릴 수 없어요.`)) return;
          start(async () => {
            const res = await deleteArticle(id).catch(() => ({ ok: false, message: "지우지 못했어요. 잠시 후 다시 시도해 주세요." }));
            if (!res.ok) return setMessage(res.message);
            router.replace(`${back}?done=deleted`, { scroll: false });
          });
        }}
        className={`${btn} border-coral/40 text-coral-deep hover:bg-coral-soft/40`}
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

export function EditArticleLink({ id }: { id: string }) {
  return (
    <Link href={`/write/article?edit=${id}`} className={`${btn} border-line-2 text-ink hover:border-ink-3`}>
      <Pencil aria-hidden className="size-3.5" />
      수정
    </Link>
  );
}

/**
 * 정보글 상세의 '수정·삭제' — 작성자 본인과 관리자에게만.
 * 상세 페이지는 ISR 로 캐시되므로 서버에서 분기하지 않고, 브라우저에서 로그인 사용자를 확인한 뒤 그린다.
 * (실제 권한은 서버 액션과 DB RLS 가 다시 확인한다)
 */
export function ArticleOwnerActions({ id, title, authorId }: { id: string; title: string; authorId: string | null }) {
  const user = useCurrentUser();
  if (!user || (user.id !== authorId && user.role !== "admin")) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl bg-stone px-3 py-2.5" data-testid="article-owner-actions">
      <span className="mr-1 text-xs font-semibold text-ink-2">{user.id === authorId ? "내가 쓴 글이에요" : "관리자"}</span>
      <EditArticleLink id={id} />
      <DeleteArticleButton id={id} title={title} back={user.id === authorId ? "/my/articles" : "/admin/content"} />
    </div>
  );
}
