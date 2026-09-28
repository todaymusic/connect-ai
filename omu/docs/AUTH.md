# OMU 로그인 설계 (Supabase Auth + 카카오 · 네이버)

## 1. 한눈에 보기

| 항목 | 카카오 | 네이버 |
|---|---|---|
| Supabase 지원 방식 | **내장 Provider** (`'kakao'`) | 내장 Provider **없음** → **커스텀 OAuth2 Provider** (`custom:naver`) |
| 앱 코드 | `signInWithOAuth({ provider: 'kakao' })` | `signInWithOAuth({ provider: 'custom:naver' })` |
| 타입 확인 근거 | `@supabase/auth-js` 2.117.2 `Provider` 타입에 `'kakao'` 포함 | 같은 타입에 `naver` 없음. 대신 `` `custom:${string}` `` 허용 |
| 앱에서 켜는 법 | `NEXT_PUBLIC_AUTH_KAKAO_ENABLED=true` (기본값) | `NEXT_PUBLIC_NAVER_PROVIDER_ID=custom:naver` |
| 현재 상태 | Supabase에서 Kakao를 켜면 바로 동작 | **준비 중**. 환경변수가 비어 있으면 버튼이 "네이버 로그인 준비 중"으로 비활성화된다 |

- 소셜 로그인은 **로그인 = 회원가입**이다. 처음 로그인하면 Supabase가 `auth.users`를 만든다.
- 그러면 `schema.sql`의 가입 트리거(`omu_on_auth_user_created`)가 `profiles`를 자동으로 만든다.
- `/login`과 `/signup`은 같은 버튼을 쓰고, 안내 문구만 다르다.

## 2. 로그인 흐름

```
[사용자] /login 에서 "카카오로 계속하기" 클릭
   │  supabase.auth.signInWithOAuth({ provider, options: { redirectTo: <사이트>/auth/callback?next=… } })
   │  (PKCE: code_verifier 를 브라우저 쿠키에 저장)
   ▼
[카카오/네이버 동의 화면]
   ▼  Provider 가 Supabase 로 돌려보냄
https://<project-ref>.supabase.co/auth/v1/callback        ← ① Provider 콘솔에 등록하는 콜백 URL
   ▼  Supabase 가 사용자 생성/조회 후 redirectTo 로 보냄 (Redirect URLs 허용 목록에 있어야 함)
<사이트>/auth/callback?code=…&next=…                       ← ② Supabase Redirect URLs 에 등록하는 URL
   ▼  app/auth/callback/route.ts: exchangeCodeForSession(code) → 세션 쿠키 저장
<사이트><next>  (next 는 내부 경로만 허용. 외부 URL 은 / 로 대체)
```

**관련 파일**

| 파일 | 역할 |
|---|---|
| `lib/supabase/config.ts` | 환경변수 확인. 없으면 데모 모드 |
| `lib/supabase/client.ts` | 브라우저 클라이언트 (소셜 로그인 시작, 헤더의 로그인 상태 표시) |
| `lib/supabase/server.ts` | 서버 클라이언트 (Server Component·Route Handler) |
| `proxy.ts` | 요청마다 세션 토큰 갱신 (Next.js 16에서 middleware가 proxy로 이름이 바뀜) |
| `lib/auth.ts` | `getAuthState()`: 현재 사용자와 `profiles.role` 조회 |
| `lib/auth-providers.ts` | 카카오·네이버 버튼 설정, `safeNextPath()` |
| `app/auth/callback/route.ts` | OAuth 코드를 세션으로 교환 |
| `app/auth/signout/route.ts` | 로그아웃 (POST 전용) |
| `components/auth/*` | 로그인 화면, 소셜 버튼, 헤더용 `useCurrentUser` |

**보안 메모**

- 로그아웃은 POST로만 처리한다. 링크 미리보기나 프리페치로 로그아웃되는 것을 막기 위해서다.
- `next` 파라미터는 `/`로 시작하는 내부 경로만 허용한다. `//evil.com` 같은 외부 이동(오픈 리다이렉트)을 차단한다.
- 관리자 여부는 서버에서 `profiles.role`로 판단한다. 실제 데이터 보호는 DB의 RLS가 담당한다.
- `profiles.email`은 `schema.sql`의 컬럼 권한 때문에 API로 읽을 수 없다. 앱은 `id, nickname, role, avatar_url`만 조회한다.

## 3. 카카오 설정 (실제 OAuth 흐름)

### 3-1. Kakao Developers (https://developers.kakao.com)

1. **애플리케이션 추가**: 앱 이름은 "OMU"로 한다.
2. **앱 키 확인**: 앱 설정 → 앱 키에서 **REST API 키**를 확인한다. 이 값이 Supabase의 Client ID다.
3. **Client Secret 발급**: 제품 설정 → 카카오 로그인 → 보안에서 **Client Secret**을 생성하고 활성화 상태를 **사용함**으로 둔다. 이 값이 Supabase의 Client Secret이다.
4. **카카오 로그인 활성화**: 제품 설정 → 카카오 로그인에서 활성화를 **ON**으로 둔다.
5. **Redirect URI 등록**: `https://<project-ref>.supabase.co/auth/v1/callback`
6. **동의항목 설정**
   - 닉네임(`profile_nickname`), 프로필 사진(`profile_image`)을 설정한다.
   - 카카오계정 이메일(`account_email`)은 **비즈 앱 전환 후**에만 필수로 받을 수 있다. 사업자가 없어도 개인 개발자 비즈 앱으로 전환할 수 있다.
7. **Web 사이트 도메인 등록**: 앱 설정 → 플랫폼 → Web에 아래 주소를 등록한다.
   - `http://localhost:3000`
   - Vercel 주소
   - `https://omu.kr`

### 3-2. Supabase

1. Authentication → Sign In / Providers → **Kakao**를 켠다.
2. REST API 키와 Client Secret을 입력한다.
3. 이메일 동의항목을 못 받는 동안에는 **Allow users without an email**을 켠다.
   - Supabase Kakao Provider는 기본으로 `account_email` 범위를 요청한다.
   - 비즈 앱이 아니면 이메일이 없어서 가입이 실패할 수 있다.

### 3-3. 최초 관리자

- `schema.sql`은 **이메일 인증이 끝난** `todaymusic2407@gmail.com` 계정을 자동으로 admin으로 만든다.
- 카카오 계정 이메일이 이 주소이고 카카오가 인증된 이메일로 넘겨 주면, 로그인하자마자 관리자가 된다.
- 이메일이 다르면 SQL Editor에서 한 번 지정한다.

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = '<카카오 계정 이메일>');
```

## 4. 네이버 연결: 현재 **준비 중**

### 4-1. 왜 바로 켤 수 없나

1. **내장 Provider가 없다.** Supabase 내장 Provider에 네이버가 없다(`@supabase/auth-js`의 `Provider` 타입으로 확인). 그래서 `provider: 'naver'`로 억지 호출하면 타입 오류가 나고, 실제 요청도 실패한다.
2. **커스텀 Provider는 조건을 맞춰야 한다.** Supabase의 커스텀 OAuth2 Provider(무료 플랜은 최대 3개)로 연결할 수는 있다. 다만 네이버는 OIDC 디스커버리를 제공하지 않으므로 OAuth2 방식으로 등록해야 하고, 아래 조건이 맞아야 한다.
   - **프로필 응답이 중첩돼 있다.** 네이버 프로필 API(`https://openapi.naver.com/v1/nid/me`)는 사용자 정보를 `{"resultcode":"00","response":{"id":…,"email":…}}`처럼 `response` 아래에 넣어 돌려준다. Supabase 문서에는 중첩 필드를 매핑하는 방법이 명시돼 있지 않다.
   - **토큰 요청 방식이 불확실하다.** 네이버는 토큰 요청 시 `client_id`와 `client_secret`을 폼·쿼리 파라미터로 받는다. Supabase가 이 방식으로 보내는지는 실제 연결 시험이 필요하다.
   - **PKCE 지원 여부가 불확실하다.** 네이버의 PKCE 지원 여부가 불명확하다. 실패하면 Provider의 `pkce_enabled`를 `false`로 바꿔 다시 시험한다.

그래서 코드는 **환경변수로 켜는 스위치**만 두었다. 연결이 검증되기 전까지는 버튼을 비활성 상태("네이버 로그인 준비 중")로 둔다.

### 4-2. 권장 방식 A: 커스텀 OAuth2 Provider + userinfo 프록시 (코드 포함, 미배포)

`supabase/functions/naver-userinfo/index.ts`는 네이버 프로필을 표준 필드로 펼쳐 주는 Edge Function 초안이다. 받은 액세스 토큰을 네이버에 그대로 전달할 뿐 비밀값은 쓰지 않는다.

**1. 네이버 개발자센터 (https://developers.naver.com)**

1. Application → 애플리케이션 등록 → 사용 API로 **네이버 로그인**을 고른다.
2. 제공 정보: 별명, 프로필 사진은 필수, 이메일은 필수 또는 선택으로 한다.
3. 서비스 환경을 **PC웹**으로 한다.
   - 서비스 URL: `https://omu.kr` (오픈 전에는 Vercel 주소)
   - 네이버 로그인 Callback URL: 다음 단계에서 Supabase가 보여 주는 **Callback URL**. 보통 `https://<project-ref>.supabase.co/auth/v1/callback`이다.
4. Client ID와 Client Secret을 확인한다.
5. 개발 중 상태에서는 **멤버관리에 등록된 네이버 ID만** 로그인할 수 있다. 오픈 전에 **검수 요청**이 필요하다.

**2. Edge Function 배포**

```bash
cd omu
supabase functions deploy naver-userinfo --no-verify-jwt --project-ref <project-ref>
```

`--no-verify-jwt`가 필요한 이유는, 이 함수를 호출하는 쪽이 Supabase Auth 서버이고 Supabase JWT 대신 네이버 토큰을 보내기 때문이다.

**3. Supabase 커스텀 Provider 생성**

Authentication → Providers → New Provider → **Manual configuration (OAuth2)**에서 아래처럼 입력한다.

| 필드 | 값 |
|---|---|
| Identifier | `custom:naver` |
| Name | 네이버 |
| Client ID / Secret | 네이버 개발자센터 값 |
| Authorization URL | `https://nid.naver.com/oauth2.0/authorize` |
| Token URL | `https://nid.naver.com/oauth2.0/token` |
| UserInfo URL | `https://<project-ref>.supabase.co/functions/v1/naver-userinfo` |
| Scopes | 비움 (네이버는 앱 설정의 제공 정보로 범위를 정함) |
| Email optional | 켬 (이메일 제공에 동의하지 않은 사용자도 가입 가능) |

**4. 시험**

1. 테스트용 네이버 ID로 로그인해 본다.
2. `auth.users`와 `profiles`가 생성되는지 확인한다.
3. 실패하면 Supabase 대시보드 Logs → Auth에서 원인을 확인한다. PKCE, 토큰 요청 방식, userinfo 응답을 순서대로 본다.

**5. 앱에서 켜기**

Vercel 환경변수에 `NEXT_PUBLIC_NAVER_PROVIDER_ID=custom:naver`를 넣고 재배포한다. 그러면 버튼이 활성화된다.

### 4-3. 대안 B: 프록시 없이 직접 매핑

Supabase의 `attribute_mapping`이 `response.id` 같은 중첩 경로를 지원한다면, UserInfo URL에 네이버 API를 바로 넣고 매핑만 지정해도 된다. 지원 여부가 문서에 없으므로 스테이징 프로젝트에서 먼저 시험한다. 되면 방식 A의 Edge Function은 필요 없다.

### 4-4. 대안 C: 앱이 직접 네이버 OAuth를 처리 (최후 수단)

`/auth/naver/start`와 `/auth/naver/callback` 라우트에서 네이버 OAuth를 직접 처리한다. 그다음 서버 전용 `SUPABASE_SERVICE_ROLE_KEY`로 사용자를 찾거나 만들고 세션을 발급한다(`admin.generateLink` → `verifyOtp` 등).

- **장점:** Supabase 커스텀 Provider의 제약과 무관하게 동작한다.
- **단점:** 비밀키를 다루는 코드가 앱에 들어와 보안 검토 범위가 커진다. 계정 연결 규칙도 직접 책임져야 한다.

A와 B가 모두 안 될 때만 고려한다.

## 5. 로컬에서 로그인 시험하기

1. `cp .env.example .env.local` 후 Supabase URL과 anon 키를 입력한다.
2. Supabase → Authentication → URL Configuration → Redirect URLs에 `http://localhost:3000/**`를 추가한다.
3. `npm run dev`를 실행하고 http://localhost:3000/login 에서 카카오로 로그인한다.
4. 로그인하면 헤더에 닉네임이 표시되는지 확인한다. 관리자 계정이면 메뉴에 "관리자 페이지"가 보여야 한다.
