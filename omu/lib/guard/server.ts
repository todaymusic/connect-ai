import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * 서버 쪽 스팸 방지 (서버 액션에서 사용)
 *  1) honeypot  : 사람에게는 보이지 않는 입력칸(website). 값이 있으면 봇으로 본다.
 *  2) 작성 시간  : 폼을 연 뒤 너무 빨리(2초 미만) 제출되면 거절.
 *  3) 연속 작성 : 접속지(IP 해시)·비회원 키 기준 최소 간격·시간당 한도.
 *     ⚠️ 서버 메모리 기준이라 서버 인스턴스마다 따로 센다(Vercel 등). 최종 방어는 DB RPC 의 omu_throttle.
 *  IP 는 저장하지 않고, 해시만 메모리·DB 도배 기록(2일 보관)에 쓴다.
 */

export const HONEYPOT_FIELD = "website";
export const STARTED_FIELD = "started_at";
const MIN_FILL_MS = 2000;

export type SpamInput = { website?: string | null; startedAt?: string | number | null };

export function spamCheck(input: SpamInput): string | null {
  if (input.website && String(input.website).trim() !== "") return "제출하지 못했어요. 페이지를 새로 고친 뒤 다시 시도해 주세요.";
  const started = Number(input.startedAt);
  if (!Number.isFinite(started) || started <= 0) return "제출 정보가 올바르지 않아요. 페이지를 새로 고친 뒤 다시 시도해 주세요.";
  const age = Date.now() - started;
  if (age < MIN_FILL_MS) return "너무 빨리 제출됐어요. 내용을 확인하고 다시 눌러 주세요.";
  if (age > 1000 * 60 * 60 * 24) return "페이지를 연 지 오래됐어요. 새로 고친 뒤 다시 작성해 주세요.";
  return null;
}

/** 접속지 해시 (원본 IP 는 어디에도 남기지 않는다) */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  return createHash("sha256").update(`omu-client|${ip}`).digest("hex").slice(0, 32);
}

/* ───────── 메모리 기반 연속 작성 제한 ───────── */
const LOG = new Map<string, number[]>();
const MAX_KEYS = 5000;

export type Limit = { gapSec: number; perHour: number };
export const LIMITS: Record<"post" | "comment" | "report" | "edit", { guest: Limit; member: Limit }> = {
  post: { guest: { gapSec: 30, perHour: 10 }, member: { gapSec: 10, perHour: 30 } },
  comment: { guest: { gapSec: 10, perHour: 30 }, member: { gapSec: 3, perHour: 120 } },
  report: { guest: { gapSec: 10, perHour: 10 }, member: { gapSec: 5, perHour: 20 } },
  edit: { guest: { gapSec: 0, perHour: 60 }, member: { gapSec: 0, perHour: 120 } },
};

/** 제한에 걸리면 안내 문구, 아니면 null (통과하면 기록한다) */
export function memThrottle(kind: keyof typeof LIMITS, key: string, guest: boolean): string | null {
  const { gapSec, perHour } = LIMITS[kind][guest ? "guest" : "member"];
  const now = Date.now();
  const id = `${kind}:${key}`;
  const list = (LOG.get(id) ?? []).filter((t) => now - t < 3600_000);
  const last = list.at(-1);
  if (last && now - last < gapSec * 1000) {
    return `너무 빨리 다시 쓰고 있어요. ${Math.ceil((last + gapSec * 1000 - now) / 1000)}초 뒤에 다시 시도해 주세요.`;
  }
  if (list.length >= perHour) return "한 시간에 쓸 수 있는 횟수를 넘었어요. 잠시 뒤에 다시 시도해 주세요.";
  list.push(now);
  if (LOG.size > MAX_KEYS) LOG.delete(LOG.keys().next().value as string);
  LOG.set(id, list);
  return null;
}

/** DB RPC 가 던지는 'OMU:…' 안내 문구만 사용자에게 그대로 보여 준다 */
export function rpcMessage(e: { message?: string; code?: string } | null | undefined, fallback: string): string {
  const m = e?.message ?? "";
  const i = m.indexOf("OMU:");
  if (i >= 0) return m.slice(i + 4).trim();
  if (e?.code === "PGRST202" || e?.code === "42883" || /function .* does not exist/i.test(m)) {
    return "DB 업데이트가 필요해요. 관리자는 supabase/migrations/20260930_guest_community.sql 을 적용해 주세요.";
  }
  return fallback;
}

export const GUEST_SECRET_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

export function guestHashServer(secret: string, scope: string): string {
  return createHash("sha256").update(`${secret}|${scope}`).digest("hex");
}
