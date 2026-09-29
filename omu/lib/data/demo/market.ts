import type { MarketItem } from "../types";
import { AUTHORS, DAY, DEMO_NOTICE, HOUR, ago } from "./common";

const note = (s: string) => `${s}\n\n${DEMO_NOTICE}`;

export const DEMO_MARKET: MarketItem[] = [
  { id: "m1", condition: "like_new", contact: "댓글로 문의 주세요. 평일 저녁 연락 가능", title: "야마하 디지털피아노 P-125 (거의 새것)", category: "keyboard", tradeType: "sell", price: 520000, status: "selling", region: "서울", description: note("1년 사용, 스탠드·페달 포함. 건반 소리 정상이고 외관 흠집 거의 없습니다. 직거래만 가능해요."), imageUrls: [], seller: AUTHORS.piano, views: 213, commentCount: 3, createdAt: ago(12) },
  { id: "m2", condition: "good", contact: "오픈채팅 링크는 댓글로 알려드려요", title: "스트랫 타입 일렉기타 + 소프트케이스", category: "guitar", tradeType: "sell", price: 280000, status: "reserved", region: "경기", description: note("넥 휨 없고 프렛 상태 좋습니다. 줄은 최근에 갈았어요."), imageUrls: [], seller: AUTHORS.guitar, views: 341, commentCount: 7, createdAt: ago(HOUR) },
  { id: "m3", condition: "fair", contact: null, title: "연습용 전자드럼 스틱·패드 세트 나눔", category: "drum", tradeType: "share", price: 0, status: "selling", region: "인천", description: note("이사하면서 정리해요. 직접 가져가실 분께 드립니다."), imageUrls: [], seller: AUTHORS.drum, views: 402, commentCount: 12, createdAt: ago(3 * HOUR) },
  { id: "m4", condition: null, contact: "댓글 남겨주시면 연락드릴게요", title: "USB 오디오인터페이스 2in2 구해요", category: "equipment", tradeType: "buy", price: 150000, status: "selling", region: "부산", description: note("홈레코딩 입문용으로 찾습니다. 작동 이상 없는 제품이면 좋겠어요."), imageUrls: [], seller: AUTHORS.vocal, views: 98, commentCount: 2, createdAt: ago(5 * HOUR) },
  { id: "m5", condition: "good", contact: null, title: "알토 색소폰 입문용 (케이스 포함)", category: "wind", tradeType: "sell", price: 390000, status: "selling", region: "대전", description: note("입문 2년 사용. 패드 교체 이력 있습니다."), imageUrls: [], seller: AUTHORS.band, views: 156, commentCount: 1, createdAt: ago(9 * HOUR) },
  { id: "m6", condition: "good", contact: null, title: "베이스 앰프 30W 판매", category: "equipment", tradeType: "sell", price: 110000, status: "sold", region: "서울", description: note("집 연습용으로 쓰던 앰프입니다. 잡음 없어요."), imageUrls: [], seller: AUTHORS.bass, views: 267, commentCount: 5, createdAt: ago(DAY + 2 * HOUR) },
  { id: "m7", condition: "like_new", contact: "주말 오후 직거래 선호", title: "통기타 입문용 (탑 솔리드)", category: "guitar", tradeType: "sell", price: 180000, status: "selling", region: "광주", description: note("줄 높이 낮게 세팅해 두었습니다. 입문용으로 좋아요."), imageUrls: [], seller: AUTHORS.busking, views: 188, commentCount: 4, createdAt: ago(DAY + 6 * HOUR) },
  { id: "m8", condition: "fair", contact: null, title: "보면대·메트로놈 나눔", category: "etc", tradeType: "share", price: 0, status: "reserved", region: "대구", description: note("레슨실 정리하며 나눔합니다."), imageUrls: [], seller: AUTHORS.studio, views: 120, commentCount: 6, createdAt: ago(2 * DAY) },
  { id: "m9", condition: null, contact: "택배 거래 가능", title: "61건반 신디사이저 구합니다", category: "keyboard", tradeType: "buy", price: 400000, status: "selling", region: "온라인", description: note("택배 거래 가능하신 분 찾아요. 모델은 상관없습니다."), imageUrls: [], seller: AUTHORS.keys, views: 74, commentCount: 0, createdAt: ago(2 * DAY + 5 * HOUR) },
  { id: "m10", condition: "good", contact: null, title: "카혼 (가방 포함)", category: "drum", tradeType: "sell", price: 90000, status: "selling", region: "경기", description: note("버스킹용으로 몇 번 사용했습니다."), imageUrls: [], seller: AUTHORS.busking, views: 133, commentCount: 2, createdAt: ago(3 * DAY) },
];
