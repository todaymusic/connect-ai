# OMU DB 스키마 (`schema.sql`) 안내

`schema.sql` 한 파일을 Supabase **SQL Editor**에 통째로 붙여넣고 **Run** 한 번 누르면 된다.

- 파일 전체가 `BEGIN … COMMIT` 하나의 트랜잭션이다. 중간에 하나라도 실패하면 **아무것도 반영되지 않는다**(부분 적용 없음).
- `DROP` 문이 하나도 없다. 기존 테이블과 데이터를 지우거나 덮어쓰지 않는다.
- 여러 번 실행해도 안전하다. 이미 있는 것은 건너뛴다.

---

## 1. 실행 전 반드시 확인할 위험 요소

| # | 확인할 것 | 왜 위험한가 | 확인 방법 / 조치 |
|---|---|---|---|
| 1 | **이메일 인증(Confirm email)이 켜져 있는지** | 최초 관리자는 `todaymusic2407@gmail.com`로 가입한 뒤 **이메일 인증을 마친** 계정만 자동으로 admin이 된다. 인증이 꺼져 있으면 가입 즉시 '인증됨'으로 처리된다. 그러면 누군가 이 이메일로 먼저 가입했을 때 관리자 권한을 가져간다. | Authentication → Sign In / Providers → Email → **Confirm email = ON** 확인. 실행 직후 관리자 본인이 먼저 가입·인증하는 것을 권장. |
| 2 | **OMU 전용 프로젝트인지** | 다른 서비스와 같이 쓰는 프로젝트라면, 이미 가입된 모든 사용자에게 OMU 프로필이 자동 생성된다(9단계 보정). | 이미 가입자가 있다면 그 사람들이 OMU 회원이 되어도 괜찮은지 판단. |
| 3 | **같은 이름의 테이블이 이미 있는지**<br>(`profiles`, `posts`, `comments`, `scores`, `articles`, `market_items`, `recruits`, `score_requests`, `reports`) | 특히 `profiles`·`posts`·`comments`는 흔한 이름이다. 구조가 다르면 충돌한다. | 사전점검이 자동으로 **중단**시킨다. 이때 기존 데이터는 그대로 남는다. 오류 메시지에 없는 컬럼 목록이 나온다. 테이블을 지우지 말고 먼저 용도를 확인할 것. |
| 4 | **위 테이블에 다른 RLS 정책이 있는지** | RLS 정책은 OR로 합쳐진다. 예를 들어 "모두 허용" 정책이 남아 있으면 OMU 권한 설계가 무력화된다. | 사전점검이 자동으로 **중단**시킨다. Authentication → Policies에서 직접 검토·정리 후 재실행. |
| 5 | **`auth.users`에 다른 가입 트리거가 있는지**<br>(예: Supabase 예제의 `on_auth_user_created` / `handle_new_user`) | 다른 트리거가 `profiles`에 다른 컬럼으로 INSERT하면 회원가입 자체가 실패할 수 있다("Database error saving new user"). | Database → Triggers에서 `auth.users` 트리거 확인. OMU 트리거 이름은 `omu_on_auth_user_created`, `omu_on_auth_user_updated`. |
| 6 | **Storage에 같은 이름의 버킷**(`scores`, `thumbnails`, `market`)이나 **넓은 권한의 Storage 정책**이 있는지 | 같은 이름의 버킷이 있으면 건드리지 않는다. 그래서 용량·파일형식 제한이 적용되지 않는다. "로그인하면 모든 버킷에 업로드 가능" 같은 기존 정책이 있으면 OMU 제한보다 넓게 허용된다. | Storage → Buckets / Policies 확인. |
| 7 | **재실행 시 정책이 갱신되지 않음** | 이미 있는 정책은 이름만 보고 건너뛴다. 나중에 정책 내용을 바꿔도 이 파일을 다시 실행하는 것만으로는 반영되지 않는다. | 정책 변경은 별도 마이그레이션 파일로 진행. |
| 8 | **무료 플랜은 백업(PITR)이 없음** | 실행 자체는 트랜잭션이라 안전하다. 다만 이후 운영 데이터 복구 수단이 제한적이다. | 새 프로젝트라면 영향 없음. 운영 전 백업 정책 결정 권장. |

> 이 파일은 로컬 PostgreSQL 17에 **Supabase와 비슷한 가짜 환경(auth·storage 스키마, anon/authenticated 역할)**을 만들어 검증했다. 결과는 아래와 같다.
> - 처음 실행 성공 / 재실행 성공(데이터 보존)
> - 권한 시나리오 83개 전부 통과
> - 충돌 테이블·외부 정책이 있을 때 중단되고 기존 데이터가 보존됨
>
> 실제 Supabase에는 실행하지 않았다. 실제 환경에서 오류가 나더라도 트랜잭션 전체가 취소되므로 DB는 원래 상태로 남는다.

---

## 2. 권한 구분 (비회원 / 회원 / 에디터 / 관리자)

| 기능 | 비회원 (anon) | 회원 (user) | 에디터 (editor) | 관리자 (admin) |
|---|:-:|:-:|:-:|:-:|
| 악보·발행된 정보글·중고·구인·커뮤니티 읽기 | ✅ | ✅ | ✅ | ✅ |
| 숨김 처리된 글 보기 | ❌ | 본인 글만 | 본인 글만 | ✅ |
| 커뮤니티·구인·중고·악보요청·댓글 작성 | ❌ | ✅ (본인 명의) | ✅ | ✅ (회원 명의 지정 가능 — 마중물 글) |
| 본인 글 수정·삭제 | — | ✅ | ✅ | ✅ (전체) |
| 악보 등록 / 정보글 작성 | ❌ | ❌ | ✅ (본인 명의) | ✅ (작성자 지정 가능) |
| 정보글 **발행** | ❌ | ❌ | ❌ | ✅ |
| 'OMU 에디터' 명의 표기(`author_display='editor'`) | ❌ | ❌ (자동으로 member) | ✅ | ✅ |
| 중고 사진 업로드 (Storage `market/본인uid/…`) | ❌ | ✅ | ✅ | ✅ |
| 악보 PDF·썸네일 업로드 | ❌ | ❌ | ✅ | ✅ |
| 신고 | ❌ | ✅ (같은 대상 1회) | ✅ | ✅ |
| 신고 처리 / 숨김 / 회원 역할 변경 | ❌ | ❌ | ❌ | ✅ |
| 회원 이메일 조회 | ❌ | ❌ | ❌ | ✅ (`omu_admin_list_members` RPC) |

**API로 직접 조작해도 막히는 것들** (트리거 `omu_guard_row`)
- 조회수, 다운로드수, 댓글수
- 숨김·발행·답변채택 여부
- 작성자 변경
- 자기 역할(role) 승격

일반 회원이 이 값들을 바꾸려고 하면 원래 값으로 되돌려진다.

---

## 3. 작업지시서(6장) 대비 추가·변경 사항

| 테이블 | 추가 컬럼 / 변경 | 이유 |
|---|---|---|
| 공통 | `updated_at`, `comment_count`, `is_hidden`(중고·구인·커뮤니티·댓글) | 수정일 표시, 목록의 댓글 수, 관리자 숨김 기능 |
| `articles` | `category`에 `equipment`, `instrument` 추가 / `published_at` | 악기 탭의 '장비 정보·추천', '악기 정보·추천' 글을 같은 테이블로 관리 / sitemap·정렬용 발행시각 |
| `market_items` | `trade_type`(sell/buy/share), `contact` | 판매/구매/나눔 필터, 1차 연락처 노출 |
| `recruits` | `contact` / 밴드 모집 시 `recruit_level` 필수 제약 | 연락처, 성격 배지 필수 |
| `posts`, `comments` | `public_author_id` | 익명 글 작성자 역추적 방지(아래 4번) |
| `score_requests` | `fulfilled_score_id` | 요청 → 등록된 악보 연결 |
| `reports` (신규) | 신고 테이블 | 관리자 '신고 처리' 기능 |
| 제약 | slug 형식(영소문자·숫자·하이픈), 유튜브 URL만 임베드 허용, 길이 제한 | SEO URL 일관성, 임의 사이트 임베드 차단 |

---

## 4. 앱 개발 시 주의 (익명·개인정보 보호 때문에 생긴 규칙)

- `posts.author_id`, `comments.author_id`, `profiles.email`은 **외부 API(anon/authenticated)로 읽을 수 없다.**
  - 따라서 이 세 테이블은 `select('*')`를 쓰면 권한 오류가 난다. **읽을 컬럼을 명시**할 것.
    - 예: `.select('id,title,category,public_author_id,created_at,...')`
  - `.insert(...).select()`도 같다. 반환 컬럼을 명시할 것.
  - 작성자 표시는 `public_author_id`로 `profiles`를 조인한다. 익명이면 NULL이다.
  - 익명 글의 수정·삭제 버튼 표시 여부는 `rpc('omu_is_owner', { p_target: 'post', p_id })`로 확인한다.
- RPC 목록

  | 함수 | 호출 가능 | 용도 |
  |---|---|---|
  | `omu_increment_view(p_target, p_id)` | 누구나 | 조회수 +1 (`score`/`article`/`market`/`recruit`/`post`) |
  | `omu_increment_score_download(p_id)` | 누구나 | 다운로드수 +1 |
  | `omu_accept_answer(p_comment_id)` | 회원 | Q&A 답변 채택 (질문자·관리자) |
  | `omu_is_owner(p_target, p_id)` | 회원 | 내 글인지 확인 |
  | `omu_admin_list_members(p_search, p_limit, p_offset)` | 관리자 | 이메일 포함 회원 목록 |
  | `omu_admin_get_author(p_target, p_id)` | 관리자 | 익명 글·댓글 실제 작성자 확인(신고 처리용) |

- 중고 사진은 반드시 `market/<로그인한 사용자 uid>/파일명` 경로로 업로드해야 한다.
- 추가 관리자 3명은 가입 후 관리자 페이지(또는 SQL Editor)에서 지정한다. SQL Editor에서 할 때는 아래처럼 실행한다.
  ```sql
  update public.profiles set role = 'admin' where id = (select id from auth.users where email = '추가관리자@example.com');
  ```

---

## 5. 실행 후 확인

```sql
-- RLS 켜짐 확인 (OMU 테이블 9개 모두 true)
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;
-- 정책 확인 (public 35개 + storage 7개 = 42개)
select schemaname, tablename, policyname, cmd from pg_policies where policyname like 'omu\_%' order by 1, 2, 3;
-- 관리자 지정 확인
select id, nickname, role from public.profiles where role <> 'user';
```

대시보드 **Advisors → Security Advisor**를 한 번 실행해 보는 것도 권장한다.

## 6. 추가 마이그레이션

schema.sql을 이미 실행한 프로젝트에는 아래 파일을 순서대로 **덧붙여** 실행한다. 모두 DROP이 없고, 여러 번 실행해도 안전하다.

| 파일 | 내용 |
|---|---|
| `migrations/20260929_write_fields.sql` | `posts.tags` (최대 5), `recruits.positions` (최대 5)<br>`recruits.deadline`, `market_items.item_condition`<br>`posts.tags` 읽기 권한(GRANT) |
| `migrations/20260930_guest_community.sql` | 비회원 글·댓글·신고 RPC(`omu_guest_create_post`, `omu_create_comment`, `omu_report`)<br>수정·삭제 RPC(`omu_edit_post`, `omu_edit_comment`, `omu_soft_delete`), `omu_my_items`<br>`guest_name`·`guest_key`·`edited_at`·`deleted_at` 컬럼, `reports.reporter_key`·대상 스냅샷<br>도배 제한 `omu_guest_events`(외부 접근 불가), `omu_guard_row` 보호 컬럼 추가, 조회 정책 4개 `ALTER POLICY` |

| `migrations/20261001_member_articles.sql` | 정보글을 로그인 회원 누구나 작성: articles insert/update/delete 정책 `ALTER POLICY`(본인 또는 관리자)<br>트리거 `omu_20_article_rules`: 작성자·조회수·발행 시각 고정, 배지(author_display)를 작성자 역할로 강제, 발행 → 초안 되돌리기 금지(관리자 포함), 일반 회원 1시간 10건<br>`omu_guard_row` 갱신(정보글의 발행 관련 컬럼은 위 트리거에 맡김) |

### 20260930 실행 전 확인할 것
- **비회원 쓰기의 경계:** anon 역할에 테이블 쓰기 권한은 여전히 없다. 비회원은 위 RPC 로만 쓴다. RPC 는 제목·본문 길이, 게시판, 비밀값 형식, 도배 제한을 DB 에서 다시 검사한다.
- **도배 제한 한도:**
  - 비회원 글: 30초 간격, 시간당 10건, 같은 접속지 20건, 전체 10분 100건
  - 댓글: 10초, 30건, 60건, 300건
  - 한도는 각 RPC 안의 `omu_throttle(...)` 인자로 바꾼다.
  - 앱 서버가 넘기는 접속지 값은 IP 의 해시이고, 2일 뒤 지운다. RPC 를 직접 호출하면 접속지 값을 바꿀 수 있어서, 전체 한도가 최종 안전장치다.
- **삭제 정책:** 삭제는 `deleted_at` 을 채우는 숨김이다. 숨긴 행은 관리자만 조회한다(조회 정책 변경). 실제 삭제가 필요하면 관리자가 SQL 로 지운다.
- **표시 이름 목록:** `omu_guest_names()` 와 `lib/guest/names.ts` 는 같은 목록이어야 한다(바꿀 때 둘 다).

- 새 프로젝트라면 schema.sql 10번 섹션에 같은 내용이 들어 있다.
- posts는 컬럼 단위로 읽기 권한을 준다. 그래서 posts에 새 컬럼을 추가할 때는 `grant select (컬럼) on public.posts to anon, authenticated`도 함께 실행해야 목록에 보인다.
