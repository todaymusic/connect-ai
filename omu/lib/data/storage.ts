import { getSupabasePublicEnv } from "../supabase/config";

/**
 * 악보 PDF 공개 주소.
 *  - 이미 http(s) 주소면 그대로
 *  - Storage 경로(예: piano/canon-easy.pdf)면 공개 버킷 'scores' 주소로 변환
 *  - 없으면 null (다운로드 '준비 중')
 */
export function scoreFileUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const env = getSupabasePublicEnv();
  if (!env) return null;
  const clean = path.replace(/^\/+/, "").replace(/^scores\//, "");
  return `${env.url}/storage/v1/object/public/scores/${clean.split("/").map(encodeURIComponent).join("/")}`;
}
