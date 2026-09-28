import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 로그아웃 — POST 전용 (GET 이면 링크 미리보기·프리페치만으로 로그아웃될 수 있어 막는다)
 * 헤더의 <form method="post" action="/auth/signout"> 에서 호출한다.
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  // 303: POST 이후 GET 으로 홈 이동
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 });
}
