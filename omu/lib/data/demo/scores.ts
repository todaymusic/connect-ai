import type { Difficulty, ScoreInstrument } from "../../site";
import { DIFFICULTIES, SCORE_DEFAULT_PARTS, SCORE_INSTRUMENTS } from "../../site";
import type { Score, ScoreRequest } from "../types";
import { AUTHORS, DAY, HOUR, ago } from "./common";


// [slug, 제목, 작곡/출처, 악기, 난이도, 장르, 다운로드, 페이지]
const ROWS: [string, string, string, ScoreInstrument, Difficulty, string, number, number][] = [
  ["canon-easy", "캐논 변주곡 (쉬운 편곡)", "파헬벨", "piano", "easy", "클래식", 42, 3],
  ["fur-elise", "엘리제를 위하여", "베토벤", "piano", "intermediate", "클래식", 31, 4],
  ["twinkle-variation", "작은 별 변주 입문", "모차르트", "piano", "beginner", "동요·민요", 18, 2],
  ["gymnopedie-1", "짐노페디 1번", "사티", "piano", "intermediate", "클래식", 25, 3],
  ["arirang-fingerstyle", "아리랑 핑거스타일", "전통민요", "guitar", "intermediate", "동요·민요", 27, 3],
  ["romance-anonimo", "로망스 (금지된 장난)", "작자 미상", "guitar", "advanced", "클래식", 36, 4],
  ["four-chords-etude", "첫 코드 4개로 치는 연습곡", "OMU 연습보", "guitar", "beginner", "연습곡", 48, 2],
  ["greensleeves-guitar", "그린슬리브스", "잉글랜드 민요", "guitar", "easy", "동요·민요", 15, 2],
  ["8beat-groove-20", "8비트 기본 그루브 20선", "OMU 연습보", "drum", "beginner", "연습곡", 34, 5],
  ["shuffle-fill-in", "셔플 필인 모음", "OMU 연습보", "drum", "intermediate", "연습곡", 688, 3],
  ["bossa-nova-pattern", "보사노바 리듬 패턴", "OMU 연습보", "drum", "intermediate", "재즈", 402, 2],
  ["half-time-shuffle", "하프타임 셔플 입문", "OMU 연습보", "drum", "advanced", "연습곡", 377, 3],
  ["vocal-scale-basic", "도레미 발성 스케일 연습", "OMU 연습보", "vocal", "beginner", "연습곡", 1920, 2],
  ["amazing-grace-vocal", "어메이징 그레이스", "존 뉴턴", "vocal", "easy", "CCM", 845, 2],
  ["breath-lip-trill", "호흡·립트릴 10분 루틴", "OMU 연습보", "vocal", "beginner", "연습곡", 1377, 2],
  ["danny-boy-vocal", "오 대니 보이", "아일랜드 민요", "vocal", "intermediate", "동요·민요", 508, 3],
  ["walking-bass-12bar", "워킹 베이스 기초 12마디", "OMU 연습보", "bass", "intermediate", "재즈", 612, 3],
  ["bass-root-eighth", "8분음표 피킹 루트 연습", "OMU 연습보", "bass", "beginner", "연습곡", 934, 2],
  ["slap-basic-8", "슬랩 입문 패턴 8가지", "OMU 연습보", "bass", "advanced", "연습곡", 721, 3],
  ["minuet-g-bass", "미뉴에트 G장조 베이스 편곡", "페촐트", "bass", "easy", "클래식", 288, 2],
  ["when-the-saints-band", "성자의 행진 (밴드 편곡)", "미국 민요", "band", "easy", "재즈", 356, 6],
  ["major-scale-chart", "메이저 스케일 전 조성표", "OMU 연습보", "chord", "beginner", "연습곡", 3012, 2],
  ["open-chord-30", "기타 오픈 코드표 30", "OMU 연습보", "chord", "beginner", "연습곡", 4105, 2],
  ["pentatonic-5-positions", "펜타토닉 5포지션 지도", "OMU 연습보", "chord", "intermediate", "연습곡", 2380, 3],
  ["16beat-rhythm-cards", "16비트 리듬패턴 카드", "OMU 연습보", "chord", "easy", "연습곡", 1164, 2],
];

export const DEMO_SCORES: Score[] = ROWS.map(([slug, title, artist, instrument, difficulty, genre, downloads, pages], i) => ({
  id: `s${i + 1}`,
  slug,
  title,
  artist,
  instrument,
  difficulty,
  genre,
  parts: SCORE_DEFAULT_PARTS[instrument],
  pages,
  downloads,
  views: downloads + 8,
  description: `${title} ${SCORE_INSTRUMENTS[instrument]} 무료 악보(PDF ${pages}쪽, ${DIFFICULTIES[difficulty]}). ${artist} · ${genre}.`,
  fileUrl: null, // 데모: 아직 실제 PDF 없음 → 다운로드는 '준비 중'
  author: AUTHORS.editor,
  createdAt: ago(i * 9 * HOUR + 40),
}));

export const DEMO_SCORE_REQUESTS: ScoreRequest[] = [
  { id: "r-1", songTitle: "캐논 변주곡 (중급 편곡)", instrument: "piano", description: "쉬운 편곡 다음 단계로 칠 수 있는 버전이 있으면 좋겠어요.", status: "open", fulfilledScoreSlug: null, author: AUTHORS.piano, createdAt: ago(3 * HOUR) },
  { id: "r-2", songTitle: "아리랑 (쉬운 핑거스타일)", instrument: "guitar", description: null, status: "fulfilled", fulfilledScoreSlug: "arirang-fingerstyle", author: AUTHORS.guitar, createdAt: ago(2 * DAY) },
  { id: "r-3", songTitle: "보사노바 기본 컴핑", instrument: "guitar", description: "코드 보이싱 위주로요.", status: "open", fulfilledScoreSlug: null, author: AUTHORS.jazz, createdAt: ago(5 * HOUR) },
  { id: "r-4", songTitle: "셔플 그루브 연습보 (느린 템포)", instrument: "drum", description: null, status: "open", fulfilledScoreSlug: null, author: AUTHORS.drum, createdAt: ago(DAY + 2 * HOUR) },
  { id: "r-5", songTitle: "호흡 연습 루틴 (초급)", instrument: "vocal", description: "매일 10분짜리면 좋겠습니다.", status: "fulfilled", fulfilledScoreSlug: "breath-lip-trill", author: AUTHORS.vocal, createdAt: ago(4 * DAY) },
];
