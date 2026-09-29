# OMU 배포 가이드 (Vercel + Supabase)

> 이 문서는 **배포 순서와 체크리스트**다. 실제 배포는 담당자가 이 순서대로 진행한다.
> 로그인(카카오·네이버) 설계와 세부 설정은 [`docs/AUTH.md`](docs/AUTH.md)를 참고한다.

---

## ⚠️ 가장 중요한 것 3가지

1. **Vercel Root Directory = `omu`**
   - GitHub 저장소(`connect-ai`)의 루트에는 기존 VS Code 확장 프로젝트가 있다.
   - OMU 웹서비스는 `omu/` 폴더에 있다.
   - Root Directory를 `omu`로 지정하지 않으면 빌드가 실패하거나 엉뚱한 프로젝트가 배포된다.
2. **비밀키는 Vercel 환경변수에만 넣는다.** 저장소, 채팅, 스크린샷에 올리지 않는다.
   - 여기서 비밀키란 `service_role` 키, 카카오·네이버 Client Secret을 말한다.
   - `NEXT_PUBLIC_` 변수에 비밀값을 넣지 않는다.
3. **콜백 URL은 두 종류다. 섞지 않는다.**
   - **카카오·네이버 콘솔:** `https://<project-ref>.supabase.co/auth/v1/callback` (Supabase 주소)
   - **Supabase Redirect URLs:** `https://<사이트 주소>/auth/callback` (OMU 사이트 주소)

---

## 0. 준비물

| 항목 | 어디서 | 비고 |
|---|---|---|
| GitHub 저장소 접근 권한 | `todaymusic/connect-ai` | 배포 브랜치 결정 필요(예: `main`) |
| Vercel 계정 | https://vercel.com | GitHub 연동 |
| Supabase 프로젝트 | https://supabase.com/dashboard | 서울(ap-northeast-2) 권장 |
| Kakao Developers 앱 | https://developers.kakao.com | 카카오 로그인 |
| 네이버 개발자센터 앱 | https://developers.naver.com | 네이버 로그인(준비 중, `docs/AUTH.md` 4장) |
| (오픈 시) 도메인 `omu.kr` | 도메인 등록처 | DNS를 Vercel에 연결 |

---

## 1단계: Supabase 준비

1. **스키마 적용**
   - SQL Editor에서 `omu/supabase/schema.sql` 전체를 한 번 실행한다.
   - 실행 전에 [`supabase/SCHEMA_README.md`](supabase/SCHEMA_README.md)의 위험 요소를 먼저 확인한다.
   - 이어서 `omu/supabase/migrations/20260929_write_fields.sql`을 실행한다.
     - 글쓰기 폼의 태그, 모집 역할, 마감일, 물건 상태 컬럼을 추가한다.
     - DROP이 없고 여러 번 실행해도 안전하다.
     - 새로 만드는 프로젝트라면 schema.sql 10번 섹션에 같은 내용이 들어 있어서 건너뛰어도 된다. 다시 실행해도 문제는 없다.
     - 이 파일을 실행하지 않으면 해당 항목이 들어간 글을 저장할 때 "DB에 새 입력 항목이 아직 없어요" 오류가 난다.
2. **API 값 확보**
   - Project Settings → API에서 아래 두 값을 복사해 둔다.
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - anon(public) 키 또는 publishable 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Auth URL 설정** (Authentication → URL Configuration)
   - **Site URL:** 운영 주소. 오픈 전에는 Vercel 운영 주소(`https://<프로젝트>.vercel.app`), 오픈 후에는 `https://omu.kr`.
   - **Redirect URLs** (허용 목록에 모두 추가):
     ```
     http://localhost:3000/**
     https://<프로젝트>.vercel.app/**
     https://<프로젝트>-*-<vercel-team>.vercel.app/**    ← Preview 배포용(선택)
     https://omu.kr/**                                  ← 도메인 연결 후
     https://www.omu.kr/**                              ← www 사용 시
     ```
4. **카카오 Provider 켜기**
   - Authentication → Sign In / Providers → Kakao ([`docs/AUTH.md`](docs/AUTH.md) 3장)
5. **네이버**
   - 준비 중이다. 연결을 검증할 때 [`docs/AUTH.md`](docs/AUTH.md) 4장을 따른다.
6. **Email Provider의 Confirm email은 켠 상태로 둔다.**
   - `schema.sql`은 이메일 인증이 끝난 계정만 최초 관리자로 승격한다.

## 2단계: 카카오 / 네이버 개발자 콘솔

| 콘솔 | 설정 위치 | 넣을 값 |
|---|---|---|
| 카카오 | 카카오 로그인 → Redirect URI | `https://<project-ref>.supabase.co/auth/v1/callback` |
| 카카오 | 앱 설정 → 플랫폼 → Web 사이트 도메인 | `http://localhost:3000`, `https://<프로젝트>.vercel.app`, `https://omu.kr` |
| 카카오 | 보안 → Client Secret | 발급 후 **사용함**. 값은 Supabase Kakao Provider에만 입력 |
| 카카오 | 동의항목 | 닉네임, 프로필 사진, (비즈 앱이면) 카카오계정 이메일 |
| 네이버 | 네이버 로그인 Callback URL | Supabase 커스텀 Provider 생성 화면의 Callback URL(보통 위와 같은 `/auth/v1/callback`) |
| 네이버 | 서비스 URL | `https://omu.kr` (오픈 전에는 Vercel 주소) |
| 네이버 | 멤버관리 / 검수 | 개발 중에는 등록 멤버만 로그인 가능. 오픈 전 검수 요청 |

## 3단계: Vercel 프로젝트 만들기

1. Vercel → **Add New… → Project**에서 GitHub `todaymusic/connect-ai`를 Import한다.
2. **Configure Project** 화면
   - **Root Directory: `omu`** (Edit를 눌러 `omu` 폴더 선택) ← 필수
   - Framework Preset: Next.js (자동 인식)
   - Build Command·Install Command·Output Directory: 기본값 그대로 (`next build`, `npm install`)
   - Node.js 버전: 20.x 이상. Next.js 16은 Node 20.9 이상이 필요하다. Project Settings → General에서 확인한다.
3. **Environment Variables** (아래 표). Production과 Preview에 각각 넣는다.
4. **Deploy**를 누른다.
5. Production Branch를 확인한다. Project Settings → Git에서 운영에 쓸 브랜치(예: `main`)를 지정한다.

### 환경변수 표 (`.env.example` 참고)

| 이름 | Production | Preview | 설명 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | anon/publishable 키 (공개 키) |
| `NEXT_PUBLIC_SITE_URL` | ✅ `https://omu.kr` (오픈 전엔 vercel 주소) | 비워도 됨 (자동 추정) | canonical·OG 기준 주소, 끝에 `/` 없이 |
| `NEXT_PUBLIC_AUTH_KAKAO_ENABLED` | `true` | `true` | Supabase에서 Kakao를 켜기 전이면 `false` |
| `NEXT_PUBLIC_NAVER_PROVIDER_ID` | (검증 후) `custom:naver` | (선택) | 비우면 "네이버 로그인 준비 중" |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | 오픈 시 | — | 구글 서치콘솔 소유확인 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | 오픈 시 | — | 네이버 서치어드바이저 소유확인 |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ 지금은 넣지 않음 | ❌ | 현재 코드에서 사용 안 함. 추후 서버 전용 기능에서만 |
| `OMU_ADMIN_PREVIEW` | ❌ **절대 넣지 말 것** | ❌ | 개발용 관리자 목데이터 미리보기 스위치 |
| `OMU_DATA_SOURCE` | ❌ 넣지 않음 | (선택) `demo` | `demo`면 Supabase가 있어도 목데이터·데모 글쓰기로 동작 |

> `NEXT_PUBLIC_*` 값은 **빌드할 때 코드에 박힌다.** 값을 바꾸면 반드시 **Redeploy**해야 반영된다.

## 4단계: 도메인 연결 (오픈 직전)

1. Vercel → Project → Settings → Domains에서 `omu.kr`(와 `www.omu.kr`)를 추가한다. 도메인 등록처 DNS에는 안내된 A/CNAME 레코드를 입력한다.
2. 연결되면 아래 값을 `omu.kr` 기준으로 바꾼다.
   - Vercel `NEXT_PUBLIC_SITE_URL` → Redeploy
   - Supabase Site URL, Redirect URLs
   - 카카오 Web 사이트 도메인
   - 네이버 서비스 URL
3. 검색엔진 소유확인 값을 넣고 Redeploy한다. 그다음 서치콘솔·서치어드바이저에서 확인을 누른다.
4. 서치콘솔과 서치어드바이저에 `https://omu.kr/sitemap.xml`을 제출한다. `robots.txt`는 `/robots.txt`에서 자동 생성된다.

## 5단계: 카카오·네이버 검수용 페이지

검수 신청서에는 아래 주소를 적는다.

| 항목 | 주소 |
|---|---|
| 서비스 이용약관 | `https://omu.kr/terms` |
| 개인정보처리방침 | `https://omu.kr/privacy` |
| 문의처 | `https://omu.kr/contact` |
| 서비스 소개 | `https://omu.kr/about` |

> ⚠️ 약관과 개인정보처리방침은 **초안**이다. 페이지 상단에 "확정본 아님" 표시가 있다.
> 검수 신청 전에 아래를 실제 값으로 채운다.
> - 사업자 정보, 개인정보 보호책임자, 시행일
> - 수집 항목: 카카오·네이버 동의항목과 맞출 것
>
> 법률 검토도 받는다. 확정하면 `components/legal/LegalDoc.tsx`의 초안 안내 문구와 "(초안)" 표시를 지운다.

---

## ✅ 배포 전 체크리스트

**코드**
- [ ] `cd omu && npm ci && npm run lint && npx tsc --noEmit && npm run build`가 로컬에서 통과한다.
- [ ] `git status`에 `.env.local`이 없다. `.env.example`에는 실제 값이 없다.
- [ ] 배포할 브랜치가 맞다.

**Supabase**
- [ ] `schema.sql` 적용 완료. RLS 정책 42개(public 35 + storage 7)가 있다.
- [ ] `migrations/20260929_write_fields.sql` 적용 완료. `posts.tags`, `recruits.deadline`, `market_items.item_condition` 컬럼이 있다.
- [ ] Site URL과 Redirect URLs에 운영, Vercel, localhost 주소가 모두 있다.
- [ ] Kakao Provider가 켜져 있다(REST API 키와 Client Secret 입력).
- [ ] Email Confirm이 켜져 있다.

**카카오 / 네이버**
- [ ] 카카오 Redirect URI가 `https://<project-ref>.supabase.co/auth/v1/callback`이다.
- [ ] 카카오 Web 사이트 도메인에 배포 주소가 있다.
- [ ] 네이버는 `NEXT_PUBLIC_NAVER_PROVIDER_ID`를 비워 둔다(준비 중). 검증을 마쳤다면 `custom:naver`로 설정한다.

**Vercel**
- [ ] Root Directory가 `omu`다.
- [ ] Production과 Preview 환경변수가 모두 입력됐다.
- [ ] Production에 `OMU_ADMIN_PREVIEW`, `OMU_DATA_SOURCE`, `SUPABASE_SERVICE_ROLE_KEY`가 **없다**.

## ✅ 배포 후 체크리스트

**페이지**
- [ ] `/` 홈, `/search?q=기타`, `/login`, `/signup`, `/write`가 뜬다. 모바일 폭에서도 확인한다.
- [ ] `/score`, `/info`, `/gear`, `/gear/market`, `/recruit`, `/community` 목록과 상세가 뜬다.
  - DB가 비어 있으면 "아직 글이 없어요"가 나오면 정상이다.
- [ ] 없는 주소(예: `/score/xyz`, `/score/guitar/없는-slug`)에서 404 페이지가 나온다.
- [ ] `/sitemap.xml`, `/robots.txt`가 운영 주소 기준으로 나온다.
- [ ] `/terms`, `/privacy`, `/contact`가 뜬다.
- [ ] 페이지 소스(view-source)에 `<title>`, `<meta name="description">`, `og:*`가 들어 있다.

**로그인**
- [ ] `/login`에서 카카오 로그인 → 동의 → 원래 페이지로 돌아온다. 헤더에 닉네임이 보인다.
- [ ] Supabase Table Editor에서 `profiles`에 새 행이 생겼는지 확인한다.
- [ ] 로그아웃 후 헤더가 "로그인"으로 돌아온다.
- [ ] 네이버 버튼이 "준비 중"으로 비활성화돼 있다(또는 검증 후 정상 로그인된다).

**글쓰기**
- [ ] 비로그인 상태에서 `/write/community`를 열면 "로그인이 필요해요"가 나온다.
  - 로그인하면 폼으로 돌아온다.
- [ ] 회원으로 커뮤니티, 장터, 구인 글을 저장할 수 있다.
  - 저장하면 상세 페이지로 이동하고, 목록에도 보인다(최대 5분 캐시; 저장 직후에는 바로 갱신).
- [ ] 회원으로 `/write/score`를 열면 "이 글은 쓸 수 없어요"가 나온다.
- [ ] 에디터로 악보 PDF를 등록할 수 있다.
  - 정보글은 초안으로만 저장된다.
  - 관리자가 발행해야 공개된다.
- [ ] 운영 화면에 "데모 작성 모드" 표시가 **없다**.
  - 표시가 있다면 Supabase 환경변수가 빠졌거나 `OMU_DATA_SOURCE=demo`가 설정된 것이다.

**관리자**
- [ ] 비로그인 상태에서 `/admin` → "관리자 로그인이 필요해요"가 나온다.
- [ ] 일반 회원으로 `/admin` → "접근 권한이 없어요"가 나온다.
- [ ] 관리자(`todaymusic2407@gmail.com` 또는 SQL로 지정한 계정)로 `/admin` → 대시보드 카드가 실제 숫자로 나온다. "미리보기" 배지가 없어야 한다.
- [ ] 대시보드 "배포 상태"에 환경 production, 커밋 해시, Supabase 연결됨이 표시된다.

**보안**
- [ ] 브라우저 개발자도구 → Sources에서 `service_role` 문자열이 검색되지 않는다.

## 문제 해결

| 증상 | 확인할 것 |
|---|---|
| 빌드 실패: `package.json` 없음, Next 미인식 | Root Directory가 `omu`인지 |
| 로그인 후 `/login?error=exchange_failed` | Supabase Redirect URLs에 해당 도메인이 있는지. 로그인 시작과 콜백 도메인이 같은지(쿠키) |
| 카카오 "KOE006" 등 Redirect URI 오류 | 카카오 콘솔 Redirect URI가 Supabase `/auth/v1/callback`인지 |
| 카카오 로그인 후 이메일 관련 오류 | 비즈 앱 이메일 동의항목, 또는 Supabase Kakao의 "Allow users without an email" |
| 로그인은 되는데 관리자가 아님 | `profiles.role` 확인. 최초 관리자는 이메일 인증된 계정만 자동 승격 |
| 환경변수를 바꿨는데 그대로 | `NEXT_PUBLIC_*`는 빌드 시 고정 → Redeploy |
| 관리자 대시보드 숫자가 "—" | `schema.sql` 미적용 또는 관리자 권한 아님 |
| 글 저장 시 "DB에 새 입력 항목이 아직 없어요" | `migrations/20260929_write_fields.sql` 미적용 |
| 글 저장 시 "이 글을 쓸 권한이 없어요" | 로그인 세션 만료, 또는 `profiles.role`이 해당 글 종류에 맞지 않음(RLS) |
| 운영에 "데모 작성 모드"가 보임 | Supabase 환경변수 누락 또는 `OMU_DATA_SOURCE=demo` → 수정 후 Redeploy |
