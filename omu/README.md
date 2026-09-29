# OMU — 음악 커뮤니티 포털

악보 공유 · 음악정보 · 중고 악기 장터 · 밴드/세션 구인 · 커뮤니티를 한곳에 모은 웹서비스.

- **스택:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth + Storage) · Vercel
- **폰트:** Pretendard(본문), Space Grotesk(로고·숫자). 둘 다 npm 패키지에서 불러와 직접 서빙한다.

## 로컬 실행

```bash
cd omu
npm install
cp .env.example .env.local   # Supabase 값을 채우면 로그인 활성화, 비우면 데모 모드
npm run dev                  # http://localhost:3000
```

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | 타입 검사 (처음이면 `npx next typegen` 먼저) |
| `npm run build` | 운영 빌드 |

## 폴더 구조

```
app/                 라우트
  score/ info/ gear/ recruit/ community/   게시판 목록·상세 (없는 주소는 404)
  write/  write/[type]/                    작성 허브와 작성 폼
  terms/ privacy/ contact/ about/          약관·개인정보·문의 (초안)
  sitemap.ts robots.ts                     SEO
  login/ signup/ auth/ admin/ search/
components/          UI (header, home, cards, list, detail, pages, write, legal, auth, admin)
lib/data/            데이터 계층 — 도메인별 조회 함수 (데모 목데이터 ↔ Supabase)
lib/data/demo/       도메인별 목데이터
lib/write/           글쓰기 — 권한(config), 검증(validate), 서버 액션(actions), 데모 보관(demo-store)
lib/supabase/        Supabase 클라이언트 (browser / server / public)
proxy.ts             Supabase 세션 갱신 (Next 16의 middleware)
supabase/schema.sql  DB 스키마 (SQL Editor에서 1회 실행) — SCHEMA_README.md 참고
supabase/migrations/ schema.sql 이후 추가 변경 (예: 20260929_write_fields.sql)
supabase/functions/  Edge Function 초안 (네이버 userinfo 프록시, 미배포)
docs/AUTH.md         카카오·네이버 로그인 설계
DEPLOYMENT.md        Vercel 배포 순서와 체크리스트 (Root Directory = omu)
```

## 데이터 계층

페이지는 `lib/data/*` 의 함수만 부른다 (`listScores`, `getScore`, `listArticles`, `listMarketItems`, `listRecruits`, `listPosts`, `listComments`, `getHomeData`, `searchAll` …).
각 함수 안에서 데이터 출처를 고른다.

| 조건 | 출처 |
|---|---|
| Supabase 환경변수 없음 | `lib/data/demo/*` 목데이터 (데모 모드) |
| Supabase 환경변수 있음 | Supabase (공개 anon 클라이언트, RLS 적용, 5분 ISR) |
| `OMU_DATA_SOURCE=demo` | 환경변수가 있어도 강제로 데모 (디자인 확인용, 운영에는 넣지 말 것) |

- posts·comments 는 `author_id` 를 읽을 수 없게 막혀 있다(익명 보호). 작성자는 `public_author_id` 조인으로만 가져온다.
- `select('*')` 를 쓰지 않는다. 필요한 컬럼만 명시한다.

## 글쓰기

`/write` 는 작성 허브다. 글 종류를 고르면 `/write/<type>` 폼으로 간다.

| 종류 | 주소 | 쓸 수 있는 사람 |
|---|---|---|
| 커뮤니티 (자유·Q&A·익명·후기) | `/write/community` | **비회원도 가능** (회원은 닉네임·익명 선택) |
| 악기/중고장터 (판매·구매·나눔) | `/write/market` | 회원 이상 |
| 구인·모집 | `/write/recruit` | 회원 이상 |
| 악보 요청 | `/write/score-request` | 회원 이상 |
| 악보 공유 (PDF) | `/write/score` | 에디터·관리자 |
| 음악정보 글 | `/write/article` | 에디터·관리자 (발행은 관리자만, 에디터는 초안) |

- 비로그인: 로그인 안내 (로그인 후 원래 폼으로 돌아옴). 권한 부족: 이유를 설명한다.
- 검증 규칙은 `lib/write/validate.ts` 하나를 클라이언트·서버가 같이 쓴다.
- **Supabase 모드:** 서버 액션이 로그인 세션으로 해당 테이블에 insert → 상세 페이지로 이동. 권한은 RLS 가 최종 판정한다. 악보 PDF 는 브라우저에서 `scores` 버킷에 먼저 올린 뒤 경로만 저장한다.
- **데모 모드:** 화면 상단 "데모 작성 모드" 표시와 역할 선택기(비로그인·회원·에디터·관리자)가 나온다. 제출하면 검증·권한 확인까지 실제와 같이 돌고, 결과는 서버가 아니라 이 브라우저 localStorage(`omu-demo-writes`)에만 보관된다. 역할 쿠키(`omu_demo_role`)는 Supabase 모드에서는 무시된다.
- 새 입력 항목(태그·모집 역할·마감일·물건 상태)을 쓰려면 `supabase/migrations/20260929_write_fields.sql` 을 schema.sql 다음에 실행해야 한다.

## 비회원 글·댓글, 신고, 수정·삭제, 장터 사진

가입 없이도 바로 참여할 수 있게 **커뮤니티 글·댓글·신고는 로그인 없이** 쓸 수 있다. 장터·구인은 거래 책임 때문에 회원만 쓸 수 있다.

| 기능 | 내용 | 코드 |
|---|---|---|
| 자동 표시 이름 | ‘새벽 기타리스트’ 같은 음악 이름 20개 중에서 고른다. 같은 글 안에서는 같은 비회원이 같은 이름, 다른 사람과는 겹치지 않음. 다른 글끼리는 연결되지 않음 | `lib/guest/names.ts` ↔ DB `omu_guest_pick_name` |
| 비회원 신원 | 브라우저가 만든 32바이트 무작위 값(localStorage `omu-guest-secret`). DB 에는 `sha256(값\|대상)` 해시만 저장. 개인정보 없음 | `lib/guest/client.ts` |
| 수정·삭제 | 회원은 본인 글(user id), 비회원은 **같은 브라우저**(해시 대조). 삭제는 `deleted_at` 숨김(soft delete) — 관리자만 계속 봄 | `lib/interact/actions.ts`, RPC `omu_edit_*`, `omu_soft_delete` |
| 댓글 | 모든 상세 페이지. 답글 1단계, 수정·삭제·신고, 회원은 익명 선택. 지운 댓글에 답글이 있으면 ‘삭제된 댓글이에요’ 자리 표시 | `components/interact/CommentsLive.tsx` |
| 신고 | 글·댓글. 사유 6가지 + 내용, 같은 대상 1회(브라우저 + DB), 연속 신고 제한 | `components/interact/ReportButton.tsx`, RPC `omu_report` |
| 스팸 방지 | 숨은 입력칸(honeypot), 폼 연 뒤 2초 이내 제출 거절, 최소 길이(제목 2·본문 5·댓글 2자), 연속 작성 제한(브라우저 → 서버 메모리 → **DB 최종**: 글 30초·댓글 10초 간격, 시간당 한도, 같은 접속지 한도, 전체 비회원 폭주 차단) | `lib/guard/server.ts`, DB `omu_throttle` |
| 장터 사진 | JPG·PNG·WEBP·GIF, 장당 10MB, 6장. Supabase: 브라우저가 `market/<본인 uid>/` 에 올리고 주소만 저장 / 데모: 미리보기만(작은 썸네일을 이 브라우저에 보관) | `components/write/ImagePicker.tsx` |
| 관리자 | `/admin/reports` 신고 목록(미처리·처리 완료·기각), 처리·기각·대상 숨기기. 대시보드에 비회원 글·댓글 수, market 버킷 상태 | `lib/admin*.ts`, `components/admin/*` |

- **Supabase 모드:** 비회원은 테이블에 직접 쓸 수 없고(anon 권한 없음), 검증된 `SECURITY DEFINER` RPC 로만 쓴다. `service_role` 키는 쓰지 않는다.
- **데모 모드:** 같은 검증·제한을 서버 액션이 거친 뒤, 결과를 이 브라우저 localStorage 에 보관한다(`omu-demo-comments`, `omu-demo-reports`, `omu-demo-hidden`). 데모에서 ‘관리자’ 역할을 고르면 `/admin` 을 예시 데이터로 미리 볼 수 있다.
- 비회원 글은 검색엔진에 노출하지 않는다(noindex, sitemap 제외).
- DB 는 `supabase/migrations/20260930_guest_community.sql` 이 필요하다. 적용 전에는 목록·상세는 그대로 보이고, 비회원 쓰기·댓글·신고는 “DB 업데이트가 필요해요” 안내가 나온다.

## 공개 전 정리 (허위 콘텐츠 금지)

- 목데이터 중 실제가 아닌 것은 비웠다: 장터 매물·구인 글·커뮤니티 글·댓글·악보·악보 요청 = 빈 배열. 정보글 15개만 남기고 조회수는 0(0이면 화면에 숨김), 작성자는 OMU 에디터 표기.
- ⚠️ 정보글 본문(`lib/data/demo/articles.ts` 의 `demoBody`)은 아직 범용 문구 — 에디터 검수·교체 필요(특히 공모전 모음 글).
- 콘텐츠가 없는 코너는 '준비 중'으로 보인다(홈 섹션, `/score`, `/gear/market`, `/recruit`). 커뮤니티는 '첫 글 쓰기' 안내.
- 중고 장터·구인 글쓰기는 닫혀 있다: `lib/write/config.ts` 의 `closed` — 허브는 '준비 중' 비활성, 폼·서버 액션 모두 거부. 열 때는 `closed` 만 지우면 된다.
- 공식 연락처는 `lib/site.ts` 의 `CONTACT`(email·phone) 한 곳에 넣는다. 비어 있으면 푸터에 표시하지 않고, 고객센터·개인정보처리방침은 '문의 채널 준비 중'으로 나온다.
- 홈 소식 띠(`components/home/NewsStrip.tsx`)·인기 검색어(`lib/data/home.ts`)는 실제 소식·집계가 생길 때까지 비워 둔다(비어 있으면 숨김).

## 현재 상태

- ✅ 헤더와 홈 랜딩, 통합 검색 (데이터 계층 연결)
- ✅ 악보·음악정보·장비·장터·구인·커뮤니티 목록(탭·필터·검색·페이지)과 상세
- ✅ 글쓰기 (커뮤니티·장터·구인·악보 요청·악보·정보글), 데모/실제 모드
- ✅ 비회원 커뮤니티 글·댓글·신고, 자동 표시 이름, 스팸 방지, 수정·삭제(숨김), 장터 사진, 관리자 신고 처리
- ✅ 메타데이터·JSON-LD·sitemap.xml·robots.txt, 약관·개인정보·문의 초안
- ✅ 소셜 로그인
  - 카카오: 실제 OAuth 흐름 연결
  - 네이버: 준비 중 (`docs/AUTH.md` 참고)
- ✅ `/admin` 권한 가드와 대시보드 골격
- ⏳ 1:1 채팅, 장터·구인 글 **수정**(삭제는 됨), Q&A 답변 채택 버튼, 관리자 등록·역할 변경·스토리지 정리, CAPTCHA(도배가 심해지면)
