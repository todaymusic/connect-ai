"use client";

// 비회원 브라우저 신원 — 가입 없이 쓴 글·댓글을 '이 브라우저에서만' 수정·삭제할 수 있게 하는 무작위 비밀값.
//  · 처음 쓸 때 32바이트 무작위 값을 만들어 localStorage 에 둔다(개인정보 없음).
//  · 서버·DB 에는 이 값의 해시만 저장된다. 값을 잃어버리면(브라우저 기록 삭제 등) 수정·삭제할 수 없다.
const SECRET_KEY = "omu-guest-secret";
const THROTTLE_KEY = "omu-guest-throttle";

function randomSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 없으면 만든다. 저장이 막힌 브라우저에서는 이번 페이지에서만 쓰는 값을 돌려준다 */
let memorySecret: string | null = null;
export function getGuestSecret(): string {
  try {
    const saved = window.localStorage.getItem(SECRET_KEY);
    if (saved && /^[A-Za-z0-9_-]{32,128}$/.test(saved)) return saved;
    const next = randomSecret();
    window.localStorage.setItem(SECRET_KEY, next);
    return next;
  } catch {
    memorySecret ??= randomSecret();
    return memorySecret;
  }
}

/** 이미 만들어 둔 값만 읽는다(없으면 null) — 소유 확인용 */
export function peekGuestSecret(): string | null {
  try {
    const saved = window.localStorage.getItem(SECRET_KEY);
    return saved && /^[A-Za-z0-9_-]{32,128}$/.test(saved) ? saved : memorySecret;
  } catch {
    return memorySecret;
  }
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** DB 의 omu_guest_hash(비밀값, 범위) 와 같은 값 */
export function guestHash(secret: string, scope: string): Promise<string> {
  return sha256Hex(`${secret}|${scope}`);
}

/* ───────── 브라우저 쪽 연속 작성 제한 (서버·DB 도 따로 막는다. 여기는 즉시 안내용) ───────── */
type Stamps = Record<string, number>;
function readStamps(): Stamps {
  try {
    return JSON.parse(window.localStorage.getItem(THROTTLE_KEY) || "{}") as Stamps;
  } catch {
    return {};
  }
}

/** 남은 대기 시간(초). 0 이면 바로 가능 */
export function localWait(kind: string, gapSec: number): number {
  const last = readStamps()[kind];
  if (!last) return 0;
  const left = Math.ceil((last + gapSec * 1000 - Date.now()) / 1000);
  return left > 0 ? left : 0;
}

export function markLocal(kind: string) {
  try {
    window.localStorage.setItem(THROTTLE_KEY, JSON.stringify({ ...readStamps(), [kind]: Date.now() }));
  } catch {
    /* 저장 불가여도 서버 제한이 있으므로 무시 */
  }
}
