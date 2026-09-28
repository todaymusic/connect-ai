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
app/                 라우트 (/, /login, /signup, /auth/callback, /auth/signout, /admin, /search, /write)
components/          UI (header, home, auth, admin)
lib/                 사이트 상수·메뉴, 목데이터, Supabase 클라이언트, 인증·관리자 로직
proxy.ts             Supabase 세션 갱신 (Next 16의 middleware)
supabase/schema.sql  DB 스키마 (SQL Editor에서 1회 실행) — SCHEMA_README.md 참고
supabase/functions/  Edge Function 초안 (네이버 userinfo 프록시, 미배포)
docs/AUTH.md         카카오·네이버 로그인 설계
DEPLOYMENT.md        Vercel 배포 순서와 체크리스트 (Root Directory = omu)
```

## 현재 상태

- ✅ 헤더와 홈 랜딩(목데이터), 통합 검색(목데이터)
- ✅ 소셜 로그인
  - 카카오: 실제 OAuth 흐름 연결
  - 네이버: 준비 중 (`docs/AUTH.md` 참고)
- ✅ `/admin` 권한 가드와 대시보드 골격
- ⏳ 글쓰기, 각 게시판 목록·상세, 관리자 기능(등록·역할 변경·신고·스토리지)
