import type { Comment, Post } from "../types";
import { AUTHORS, DAY, HOUR, ago } from "./common";

const body = (s: string) => s;

type P = Partial<Post> & Pick<Post, "id" | "category" | "title" | "createdAt">;
function post(p: P): Post {
  return {
    qnaSubject: null,
    content: body(p.title),
    youtubeUrl: null,
    isAnonymous: false,
    author: null,
    authorDisplay: "member",
    isNotice: false,
    isAnswered: false,
    views: 0,
    commentCount: 0,
    relatedScoreSlug: null,
    tags: [],
    guestName: null,
    editedAt: null,
    ...p,
  };
}

export const DEMO_POSTS: Post[] = [
  post({ id: "n1", category: "free", title: "처음 오신 분들을 위한 OMU 이용 안내", content: body("악보를 찾고, 연습 질문을 남기고, 장터와 모집 게시판을 함께 이용할 수 있어요. 처음 이용하시는 분들은 게시판별 안내를 한 번 확인해 주세요."), author: AUTHORS.admin, isNotice: true, views: 1320, commentCount: 3, createdAt: ago(3 * DAY) }),
  post({ id: "p1", category: "qna", qnaSubject: "guitar", title: "F코드 바레가 계속 뭉개지는데 손목 각도 문제일까요?", content: body("검지로 6줄을 다 누르면 2·3번 줄이 계속 뭉개져요. 손목을 더 꺾어야 하는지, 엄지 위치 문제인지 궁금합니다."), author: AUTHORS.guitar, views: 12, commentCount: 3, isAnswered: true, relatedScoreSlug: "four-chords-etude", tags: ["F코드", "바레"], createdAt: ago(20) }),
  post({ id: "p2", category: "qna", qnaSubject: "vocal", title: "고음에서 목이 조이는 느낌, 발성 연습 순서가 궁금해요", content: body("미 이상 올라가면 목이 조여요. 호흡 연습부터 해야 할까요?"), author: AUTHORS.vocal, views: 16, commentCount: 1, relatedScoreSlug: "breath-lip-trill", createdAt: ago(HOUR) }),
  post({ id: "p3", category: "qna", qnaSubject: "piano", title: "체르니 30 들어가기 전에 뭘 더 해야 할까요", content: body("체르니 100을 막 끝냈어요. 바로 30으로 가도 될지 고민입니다."), author: AUTHORS.piano, views: 5, commentCount: 0, relatedScoreSlug: "canon-easy", createdAt: ago(2 * HOUR) }),
  post({ id: "p4", category: "qna", qnaSubject: "bass", title: "베이스 톤, 앰프 EQ 먼저? 이펙터 먼저?", content: body("합주실마다 소리가 달라서요. 기준을 어디에 두면 좋을까요?"), author: AUTHORS.bass, views: 4, commentCount: 2, relatedScoreSlug: "walking-bass-12bar", createdAt: ago(4 * HOUR) }),
  post({ id: "p9", category: "qna", qnaSubject: "drum", title: "8비트 칠 때 하이햇이 자꾸 빨라져요", content: body("메트로놈 켜도 하이햇만 앞서 나가요. 연습 방법 추천 부탁드립니다."), author: AUTHORS.drum, views: 6, commentCount: 0, relatedScoreSlug: "8beat-groove-20", createdAt: ago(7 * HOUR) }),
  post({ id: "p5", category: "free", title: "합주실 첫 대관할 때 챙기면 좋은 것들 정리", tags: ["합주실", "준비물"], content: body("케이블 여분, 이어플러그, 녹음용 휴대폰 거치대… 첫 합주 때 없어서 아쉬웠던 것들을 모아봤어요."), author: AUTHORS.band, views: 240, commentCount: 4, createdAt: ago(DAY) }),
  post({ id: "p6", category: "anon", title: "3년 차 보컬 학원 강사인데 요즘 고민이 많아요", content: body("수업 준비와 개인 연습 사이 균형을 어떻게 잡으시나요?"), isAnonymous: true, views: 28, commentCount: 12, createdAt: ago(DAY + 3 * HOUR) }),
  post({ id: "p7", category: "showcase", title: "첫 버스킹 영상 올려봐요, 피드백 부탁드립니다", content: body("긴장해서 템포가 빨라졌는데 어떤 부분을 먼저 고치면 좋을까요?"), author: AUTHORS.busking, views: 122, commentCount: 2, createdAt: ago(2 * DAY) }),
  post({ id: "p8", category: "startup", title: "20평 연습실 창업 초기 비용 공유합니다", content: body("방음 공사, 장비, 예약 시스템까지 대략적인 항목별 비용을 정리했어요."), author: AUTHORS.studio, views: 19, commentCount: 3, createdAt: ago(3 * DAY) }),
  post({ id: "p10", category: "free", title: "메트로놈 앱 뭐 쓰세요?", content: body("박자 쪼개기 기능 있는 앱 추천 부탁드려요."), author: AUTHORS.keys, views: 32, commentCount: 1, createdAt: ago(5 * HOUR) }),
  post({ id: "p11", category: "anon", title: "밴드 탈퇴를 말하기가 어렵네요", content: body("5년 같이 한 팀인데, 방향이 너무 달라졌어요."), isAnonymous: true, views: 120, commentCount: 2, createdAt: ago(9 * HOUR) }),
  post({ id: "p12", category: "showcase", title: "재즈 스탠더드 솔로 카피해봤어요", content: body("두 달 걸렸네요. 프레이징 피드백 환영합니다."), author: AUTHORS.jazz, views: 12, commentCount: 1, createdAt: ago(DAY + 8 * HOUR) }),
  post({ id: "p13", category: "startup", title: "레슨실 공유 운영해보신 분 계신가요", content: body("시간대별로 강사님들과 나눠 쓰는 방식을 고민 중입니다."), author: AUTHORS.studio, views: 130, commentCount: 1, createdAt: ago(4 * DAY) }),
  // 비회원 작성 글
  post({ id: "g1", category: "free", title: "가입 없이 처음 써봐요, 통기타 줄 얼마나 자주 가세요?", content: body("주 3~4번 치는데 한 달이면 소리가 먹먹해지는 것 같아요. 다들 주기가 어떻게 되시나요?"), guestName: "새벽 기타리스트", views: 17, commentCount: 2, tags: ["통기타", "기타줄"], createdAt: ago(40) }),
  post({ id: "p14", category: "qna", qnaSubject: "composition", title: "코드 진행만 있고 멜로디가 안 떠올라요", content: body("작곡 입문인데 멜로디를 붙이는 연습 방법이 있을까요?"), author: AUTHORS.keys, views: 8, commentCount: 1, isAnswered: true, createdAt: ago(DAY + 2 * HOUR) }),
];

type C = Omit<Comment, "guestName" | "editedAt"> & Partial<Pick<Comment, "guestName" | "editedAt">>;
const comment = (c: C): Comment => ({ guestName: null, editedAt: null, ...c });

export const DEMO_COMMENTS: Comment[] = ([
  // Q&A p1 — 채택 답변 + 답글
  { id: "c1", targetType: "post", targetId: "p1", parentId: null, content: "엄지를 넥 뒤 가운데쯤으로 내리고, 검지를 살짝 옆으로 눕혀서 뼈 쪽으로 누르면 훨씬 덜 뭉개져요.", isAnonymous: false, isAccepted: true, author: AUTHORS.busking, createdAt: ago(15) },
  { id: "c2", targetType: "post", targetId: "p1", parentId: "c1", content: "와 검지 눕히니까 바로 소리가 나네요. 감사합니다!", isAnonymous: false, isAccepted: false, author: AUTHORS.guitar, createdAt: ago(10) },
  { id: "c3", targetType: "post", targetId: "p1", parentId: null, content: "처음엔 1~3번 줄만 잡는 작은 F부터 연습해 보세요.", isAnonymous: false, isAccepted: false, author: AUTHORS.jazz, createdAt: ago(8) },
  { id: "c4", targetType: "post", targetId: "p5", parentId: null, content: "여분 피크랑 튜너도 꼭 챙기세요 ㅎㅎ", isAnonymous: false, isAccepted: false, author: AUTHORS.guitar, createdAt: ago(DAY - 60) },
  { id: "c5", targetType: "post", targetId: "p6", parentId: null, content: "저도 비슷한 고민이었어요. 주 1회는 제 연습만 하는 날로 정해뒀어요.", isAnonymous: true, isAccepted: false, author: null, createdAt: ago(DAY) },
  { id: "c6", targetType: "market", targetId: "m1", parentId: null, content: "혹시 주말에 직거래 가능할까요?", isAnonymous: false, isAccepted: false, author: AUTHORS.keys, createdAt: ago(8) },
  { id: "c7", targetType: "market", targetId: "m1", parentId: "c6", content: "네 토요일 오후 가능해요.", isAnonymous: false, isAccepted: false, author: AUTHORS.piano, createdAt: ago(5) },
  { id: "c8", targetType: "recruit", targetId: "r1", parentId: null, content: "드럼 5년 차입니다. 합주 영상 보내드려도 될까요?", isAnonymous: false, isAccepted: false, author: AUTHORS.drum, createdAt: ago(20) },
  { id: "c9", targetType: "score", targetId: "s1", parentId: null, content: "쉬운 편곡이라 아이랑 같이 치기 좋네요.", isAnonymous: false, isAccepted: false, author: AUTHORS.piano, createdAt: ago(3 * HOUR) },
  { id: "c10", targetType: "article", targetId: "a1", parentId: null, content: "액션 높이 확인하는 법 덕분에 매장에서 헤매지 않았어요.", isAnonymous: false, isAccepted: false, author: AUTHORS.guitar, createdAt: ago(2 * HOUR) },
  // 비회원 댓글 — 같은 글 안에서 같은 사람은 같은 이름
  { id: "c11", targetType: "post", targetId: "g1", parentId: null, content: "저는 한 달 반 정도요. 코팅 줄 쓰면 좀 더 오래 가요.", isAnonymous: false, isAccepted: false, author: null, guestName: "재즈 피아니스트", createdAt: ago(30) },
  { id: "c12", targetType: "post", targetId: "g1", parentId: "c11", content: "코팅 줄 한번 써볼게요, 감사해요!", isAnonymous: false, isAccepted: false, author: null, guestName: "새벽 기타리스트", createdAt: ago(25) },
] as C[]).map(comment);
