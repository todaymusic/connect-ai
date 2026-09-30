import { getSupabasePublicEnv } from "../supabase/config";

type PublicBucket = "scores" | "thumbnails" | "market";

/**
 * 공개 버킷 파일 주소.
 *  - 이미 http(s) 주소면 그대로
 *  - 버킷 기준 상대 경로(예: piano/canon-easy.pdf)면 공개 주소로 변환 (앞에 붙은 '<버킷>/' 은 떼어 낸다)
 *  - 경로가 없거나 Supabase 미연결이면 null
 */
function publicObjectUrl(bucket: PublicBucket, path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const env = getSupabasePublicEnv();
  if (!env) return null;
  const clean = storageObjectPath(bucket, path);
  if (!clean) return null;
  return `${env.url}/storage/v1/object/public/${bucket}/${clean.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * DB 에 저장된 값(버킷 상대 경로 또는 예전 공개 주소) → 버킷 안의 파일 경로. 파일을 지울 때 쓴다.
 * 이 버킷의 공개 주소가 아닌 외부 주소면 null (지우지 않는다).
 */
export function storageObjectPath(bucket: PublicBucket, value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const at = value.indexOf(marker);
    if (at === -1) return null;
    try {
      return decodeURIComponent(value.slice(at + marker.length).split("?")[0]) || null;
    } catch {
      return null;
    }
  }
  return value.replace(/^\/+/, "").replace(new RegExp(`^${bucket}/`), "") || null;
}

/** 악보 PDF 공개 주소 (scores 버킷). 없으면 null → 다운로드 '준비 중' */
export function scoreFileUrl(path: string | null): string | null {
  return publicObjectUrl("scores", path);
}

/**
 * 악보 첫 페이지 미리보기 이미지 주소 (thumbnails 버킷, 경로는 scores/<악기>/<이름>.jpg).
 * 버킷 안의 'scores/' 폴더는 경로의 일부이므로 떼지 않는다.
 */
export function scoreThumbnailUrl(path: string | null | undefined): string | null {
  return publicObjectUrl("thumbnails", path);
}

/** 장터 사진 공개 주소 (market 버킷, 경로는 <uid>/파일이름) */
export function marketImageUrl(path: string): string | null {
  return publicObjectUrl("market", path);
}
