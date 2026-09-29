// 비회원 표시 이름 — supabase 의 omu_guest_names() / omu_guest_pick_name() 과 같은 목록·같은 규칙.
// (데모 모드는 브라우저·서버에서 이 함수로, Supabase 모드는 DB 가 같은 방식으로 고른다)
//
// 규칙: 스레드(글) 단위 키(tag = sha256(비밀값|대상종류:대상id))의 앞 8자리로 시작 위치를 정하고,
//       같은 스레드에서 이미 다른 사람이 쓰는 이름은 건너뛴다. 모두 쓰였으면 번호를 붙인다.
export const GUEST_NAMES = [
  "새벽 기타리스트",
  "느긋한 베이시스트",
  "리듬 드러머",
  "허밍 보컬",
  "초보 작곡가",
  "재즈 피아니스트",
  "합주실 단골",
  "코드 수집가",
  "메트로놈 요정",
  "카포 애호가",
  "피크 분실자",
  "튜너 장인",
  "리버브 장인",
  "아르페지오",
  "스타카토",
  "크레셴도",
  "페르마타",
  "알레그로",
  "싱코페이션",
  "버스킹 행인",
] as const;

export function pickGuestName(tag: string, taken: string[]): string {
  const n = GUEST_NAMES.length;
  const idx = parseInt(tag.slice(0, 8), 16) % n;
  for (let i = 0; i < n; i++) {
    const name = GUEST_NAMES[(idx + i) % n];
    if (!taken.includes(name)) return name;
  }
  return `${GUEST_NAMES[idx]} ${taken.length + 1}`;
}

/** 같은 스레드에서 같은 키가 이미 쓴 이름이 있으면 그 이름, 없으면 새로 고른다 */
export function guestNameInThread(tag: string, entries: { tag: string | null; name: string | null }[]): string {
  const mine = entries.find((e) => e.tag === tag && e.name);
  if (mine?.name) return mine.name;
  const taken = [...new Set(entries.filter((e) => e.name && e.tag !== tag).map((e) => e.name as string))];
  return pickGuestName(tag, taken);
}
