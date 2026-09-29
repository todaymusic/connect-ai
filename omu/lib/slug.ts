// 한글 제목 → URL slug (국어의 로마자 표기법을 단순화: 음절 단위 변환, 자음동화는 생략)
// 예) "밤편지 쉬운 편곡" → "bampyeonji-swiun-pyeongok"

const INITIAL = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const MEDIAL = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
const FINAL = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t"];

function romanizeWord(word: string): string {
  let out = "";
  for (const ch of word) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const i = code - 0xac00;
      out += INITIAL[Math.floor(i / 588)] + MEDIAL[Math.floor((i % 588) / 28)] + FINAL[i % 28];
    } else if (/[a-z0-9]/i.test(ch)) {
      out += ch.toLowerCase();
    } else {
      out += " "; // 그 밖의 문자는 단어 경계로
    }
  }
  return out;
}

export function slugify(title: string, maxLength = 80): string {
  const slug = romanizeWord(title.normalize("NFC"))
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join("-")
    .replace(/-+/g, "-")
    .slice(0, maxLength)
    .replace(/-$/, "");
  return slug;
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/* ───────── 자동 주소 (악보·정보글 폼에는 주소 입력칸이 없다) ───────── */

const TOKEN_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/** 주소용 짧은 랜덤값 (영문 소문자·숫자) */
export function randomSlugToken(length = 6): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)), (b) => TOKEN_CHARS[b % TOKEN_CHARS.length]).join("");
}

/**
 * 제목 → 자동 주소. 로마자로 바꿀 글자(한글·영문·숫자)가 없으면 '<prefix>-<랜덤 6자>'.
 * 뒤에 '-2' 같은 번호가 붙을 자리를 남기려고 기본 72자로 자른다(DB·검증 한도 80자).
 */
export function autoSlug(title: string, prefix: string, maxLength = 72): string {
  return slugify(title, maxLength) || `${prefix}-${randomSlugToken()}`;
}

/** 이미 쓰인 주소와 겹치지 않게 -2, -3 … 을 붙인다 */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${randomSlugToken(4)}`;
}
