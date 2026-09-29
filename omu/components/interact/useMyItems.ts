"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommentTarget } from "@/lib/data/types";
import { peekGuestSecret } from "@/lib/guest/client";
import { getMyItems, type MyItems } from "@/lib/interact/actions";

// 같은 글(스레드)에서 여러 컴포넌트(글 관리 버튼·댓글)가 함께 쓰므로 요청을 한 번으로 묶는다.
const cache = new Map<string, Promise<MyItems>>();

function load(type: CommentTarget, id: string, force = false): Promise<MyItems> {
  const key = `${type}:${id}`;
  if (force || !cache.has(key)) cache.set(key, getMyItems(type, id, peekGuestSecret()));
  return cache.get(key)!;
}

/** 지금 보는 사람(회원/비회원)과, 이 글에서 고치거나 지울 수 있는 항목 */
export function useMyItems(type: CommentTarget, id: string) {
  const [items, setItems] = useState<MyItems | null>(null);
  useEffect(() => {
    let alive = true;
    load(type, id)
      .then((v) => alive && setItems(v))
      .catch(() => alive && setItems(null));
    return () => {
      alive = false;
    };
  }, [type, id]);
  const reload = useCallback(() => {
    load(type, id, true)
      .then(setItems)
      .catch(() => setItems(null));
  }, [type, id]);
  return { items, reload };
}
