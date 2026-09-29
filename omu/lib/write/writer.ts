import "server-only";

import { cookies } from "next/headers";
import { getAuthState } from "../auth";
import type { Role } from "../site";
import { getDataSource } from "../data/source";
import { DEMO_ROLE_COOKIE, DEMO_ROLES, type DemoRole } from "./config";

export type Writer = { id: string; nickname: string; role: Role };

export type WriterState =
  | { mode: "supabase"; writer: Writer | null; error?: string }
  | { mode: "demo"; writer: Writer | null; demoRole: DemoRole };

/**
 * 글쓴이 판정
 *  - Supabase 연결: 실제 로그인 세션 + profiles.role
 *  - 미연결(또는 OMU_DATA_SOURCE=demo): 쿠키로 고른 데모 역할. 데모 글은 서버에 저장되지 않는다.
 */
export async function getWriterState(): Promise<WriterState> {
  if (getDataSource() === "supabase") {
    const auth = await getAuthState();
    if (auth.status === "signed-in") {
      return { mode: "supabase", writer: { id: auth.user.id, nickname: auth.user.nickname, role: auth.user.role } };
    }
    return { mode: "supabase", writer: null, error: auth.status === "error" ? auth.message : undefined };
  }

  const value = (await cookies()).get(DEMO_ROLE_COOKIE)?.value;
  const demoRole: DemoRole = value && value in DEMO_ROLES ? (value as DemoRole) : "signed_out";
  if (demoRole === "signed_out") return { mode: "demo", writer: null, demoRole };
  return {
    mode: "demo",
    demoRole,
    writer: { id: `demo-${demoRole}`, nickname: `데모 ${DEMO_ROLES[demoRole]}`, role: demoRole },
  };
}
