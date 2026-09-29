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
| 커뮤니티 (자유·Q&A·익명·후기) | `/write/community` | 회원 이상 |
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

## 현재 상태

- ✅ 헤더와 홈 랜딩, 통합 검색 (데이터 계층 연결)
- ✅ 악보·음악정보·장비·장터·구인·커뮤니티 목록(탭·필터·검색·페이지)과 상세
- ✅ 글쓰기 (커뮤니티·장터·구인·악보 요청·악보·정보글), 데모/실제 모드
- ✅ 메타데이터·JSON-LD·sitemap.xml·robots.txt, 약관·개인정보·문의 초안
- ✅ 소셜 로그인
  - 카카오: 실제 OAuth 흐름 연결
  - 네이버: 준비 중 (`docs/AUTH.md` 참고)
- ✅ `/admin` 권한 가드와 대시보드 골격
- ⏳ 댓글 작성, 신고, 장터 사진 업로드, 1:1 채팅, 글 수정·삭제, 관리자 기능(등록·역할 변경·신고·스토리지)
