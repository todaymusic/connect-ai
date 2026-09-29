"use client";

import { useEffect, useRef } from "react";

/**
 * 스팸 방지용 숨은 입력칸(honeypot).
 * 사람에게는 보이지 않고(화면 밖·탭 이동 제외·스크린리더 숨김) 자동 입력 봇만 채운다.
 * 값이 들어오면 서버가 제출을 거절한다.
 */
export function Honeypot({ inputRef }: { inputRef?: React.Ref<HTMLInputElement> }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        웹사이트 (비워 두세요)
        <input ref={inputRef} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

/** 폼(또는 입력창)을 연 시각 — 너무 빨리 제출하는 봇을 거른다 */
export function useStartedAt() {
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  return started;
}
