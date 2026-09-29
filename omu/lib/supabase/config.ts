// Supabase 연결 설정 — 환경변수가 없으면 null (데모 모드: 목데이터로 UI만 동작)
// 주의: 여기에는 공개(anon) 키만 다룬다. service_role 키는 절대 NEXT_PUBLIC_ 으로 노출하지 않는다.

export type SupabasePublicEnv = { url: string; anonKey: string };

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicEnv() !== null;
}
