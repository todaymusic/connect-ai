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
