// 날짜·숫자 표시 — 모두 한국 시간 기준. 서버 컴포넌트에서만 쓴다(클라이언트와 시각이 달라 하이드레이션이 어긋나지 않도록).

const TZ = "Asia/Seoul";

function kstParts(d: Date) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour"), mm: get("minute") };
}

/** 목록용: 방금 · N분 전 · N시간 전 · 어제 · MM.DD · YYYY.MM.DD */
export function formatRelative(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 24 * 60) return `${Math.floor(diffMin / 60)}시간 전`;
  if (diffMin < 48 * 60) return "어제";
  const a = kstParts(date);
  const b = kstParts(now);
  return a.y === b.y ? `${a.m}.${a.d}` : `${a.y}.${a.m}.${a.d}`;
}

/** 상세용: 2026.09.28 14:30 */
export function formatDateTime(iso: string): string {
  const p = kstParts(new Date(iso));
  return `${p.y}.${p.m}.${p.d} ${p.hh}:${p.mm}`;
}

/** 2026.09.28 */
export function formatDate(iso: string): string {
  const p = kstParts(new Date(iso.length === 10 ? `${iso}T12:00:00+09:00` : iso));
  return `${p.y}.${p.m}.${p.d}`;
}

/** 마감일까지 남은 일수 (오늘 마감 = 0, 지났으면 음수) */
export function daysUntil(ymd: string, now = new Date()): number {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(now);
  return Math.round((Date.parse(`${ymd}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

export function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}만`;
  return n.toLocaleString("ko-KR");
}

export function formatPrice(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}
