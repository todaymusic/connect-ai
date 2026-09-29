-- =====================================================================
--  OMU 마이그레이션 2026-09-30 — 비회원 글·댓글, 신고, 수정·삭제(숨김), 장터 사진
-- =====================================================================
--  schema.sql(+ 20260929_write_fields.sql)을 이미 실행한 프로젝트에 **덧붙여** 실행한다.
--  · DROP 없음 · 기존 데이터 변경 없음 · 여러 번 실행해도 안전 · 전체가 하나의 트랜잭션
--
--  설계 요약
--    · 비회원 쓰기는 테이블 권한을 열지 않고 **검증된 RPC(security definer)** 로만 한다.
--      anon 역할에는 여전히 INSERT/UPDATE/DELETE 권한이 없다.
--    · 비회원 신원 = 브라우저가 만든 무작위 비밀값(localStorage). DB 에는 그 **해시**만 남는다.
--        guest_key   = sha256(비밀값 | '<대상종류>:<대상id>')  → 글·댓글 소유 확인용 (외부 API 로 읽을 수 없음)
--        actor(행위자) = sha256(비밀값 | 'actor')              → 도배 제한·중복 신고 확인용
--      같은 글(스레드) 안에서는 같은 비회원이 같은 표시 이름을 쓰고, 다른 글끼리는 연결되지 않는다.
--    · 개인정보(IP·이메일 등)는 저장하지 않는다. 서버가 넘기는 p_client 는 IP 의 단방향 해시이며
--      도배 제한용 기록(omu_guest_events)에만 쓰고 2일 뒤 지운다.
--    · 삭제는 실제 삭제 대신 deleted_at 을 채우는 **숨김(soft delete)**. 관리자만 계속 볼 수 있다.
--
--  추가하는 것
--    posts / comments   : guest_name, guest_key, edited_at, deleted_at
--    market_items / recruits : deleted_at
--    reports            : reporter_key(비회원 신고자 해시), target_title, target_path(관리자 화면용 스냅샷)
--    omu_guest_events   : 도배 제한 기록 (외부 접근 불가)
--    RPC                : omu_guest_create_post, omu_create_comment, omu_edit_post, omu_edit_comment,
--                         omu_soft_delete, omu_report, omu_my_items
--    변경               : omu_guard_row(보호 컬럼 추가), 조회 정책 4개(숨김 처리된 글 제외)
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) 컬럼
-- ---------------------------------------------------------------------
alter table public.posts
  add column if not exists guest_name text,
  add column if not exists guest_key  text,
  add column if not exists edited_at  timestamptz,
  add column if not exists deleted_at timestamptz;
alter table public.comments
  add column if not exists guest_name text,
  add column if not exists guest_key  text,
  add column if not exists edited_at  timestamptz,
  add column if not exists deleted_at timestamptz;
alter table public.market_items add column if not exists deleted_at timestamptz;
alter table public.recruits     add column if not exists deleted_at timestamptz;
alter table public.reports
  add column if not exists reporter_key text,
  add column if not exists target_title text,
  add column if not exists target_path  text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_guest_name_check') then
    alter table public.posts add constraint posts_guest_name_check
      check (guest_name is null or (char_length(guest_name) between 1 and 30 and author_id is null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comments_guest_name_check') then
    alter table public.comments add constraint comments_guest_name_check
      check (guest_name is null or (char_length(guest_name) between 1 and 30 and author_id is null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'posts_guest_key_check') then
    alter table public.posts add constraint posts_guest_key_check check (guest_key is null or guest_key ~ '^[0-9a-f]{64}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comments_guest_key_check') then
    alter table public.comments add constraint comments_guest_key_check check (guest_key is null or guest_key ~ '^[0-9a-f]{64}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reports_reporter_key_check') then
    alter table public.reports add constraint reports_reporter_key_check check (reporter_key is null or reporter_key ~ '^[0-9a-f]{64}$');
  end if;
end
$$;

-- 비회원이 같은 대상을 중복 신고하지 못하게
create unique index if not exists omu_reports_guest_once_idx
  on public.reports (reporter_key, target_type, target_id) where reporter_key is not null;
create index if not exists omu_posts_guest_key_idx    on public.posts (guest_key) where guest_key is not null;
create index if not exists omu_comments_guest_key_idx on public.comments (target_type, target_id, guest_key) where guest_key is not null;

-- ---------------------------------------------------------------------
-- 2) 도배 제한 기록 — 외부 API 로는 읽기·쓰기 모두 불가 (정책 없음 + 권한 회수)
-- ---------------------------------------------------------------------
create table if not exists public.omu_guest_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('post', 'comment', 'report', 'edit')),
  actor       text not null,
  client      text
);
create index if not exists omu_guest_events_actor_idx  on public.omu_guest_events (kind, actor, created_at desc);
create index if not exists omu_guest_events_client_idx on public.omu_guest_events (kind, client, created_at desc) where client is not null;
create index if not exists omu_guest_events_time_idx   on public.omu_guest_events (created_at);
alter table public.omu_guest_events enable row level security;
revoke all on public.omu_guest_events from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) 보호 컬럼 가드 갱신 — 새 컬럼(비회원 이름·키·숨김·수정 시각·신고 스냅샷)을
--    회원이 API 로 직접 조작하지 못하게 한다. (RPC 는 omu.bypass_guard 로 통과)
-- ---------------------------------------------------------------------
create or replace function public.omu_guard_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row        jsonb := to_jsonb(new);
  v_old        jsonb;
  v_patch      jsonb := '{}'::jsonb;
  v_col        text;
  v_claim_role text := coalesce((select auth.jwt()) ->> 'role', '');
  c_protected  constant text[] := array[
    'id', 'created_at', 'author_id', 'seller_id', 'reporter_id', 'public_author_id',
    'view_count', 'comment_count', 'download_count',
    'is_hidden', 'is_answered', 'is_accepted', 'is_published', 'published_at',
    'target_type', 'target_id', 'parent_id',
    'role', 'email',
    'guest_name', 'guest_key', 'edited_at', 'deleted_at',
    'reporter_key', 'target_title', 'target_path'
  ];
begin
  if coalesce(current_setting('omu.bypass_guard', true), '') = 'on'
     or v_claim_role not in ('anon', 'authenticated')
     or public.omu_is_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    foreach v_col in array c_protected loop
      if v_row ? v_col then
        v_patch := v_patch || jsonb_build_object(v_col, v_old -> v_col);
      end if;
    end loop;
  else -- INSERT: 카운터·상태값은 기본값으로, 비회원·숨김·스냅샷 컬럼은 비운다
    foreach v_col in array array['view_count', 'comment_count', 'download_count'] loop
      if v_row ? v_col then v_patch := v_patch || jsonb_build_object(v_col, 0); end if;
    end loop;
    foreach v_col in array array['is_hidden', 'is_answered', 'is_accepted', 'is_published'] loop
      if v_row ? v_col then v_patch := v_patch || jsonb_build_object(v_col, false); end if;
    end loop;
    foreach v_col in array array['published_at', 'guest_name', 'guest_key', 'edited_at', 'deleted_at',
                                 'reporter_key', 'target_title', 'target_path'] loop
      if v_row ? v_col then v_patch := v_patch || jsonb_build_object(v_col, null); end if;
    end loop;
    if v_row ? 'role' then v_patch := v_patch || '{"role": "user"}'::jsonb; end if;
  end if;

  if v_row ? 'author_display' and not public.omu_is_staff() then
    v_patch := v_patch || '{"author_display": "member"}'::jsonb;
  end if;

  if v_patch <> '{}'::jsonb then
    new := jsonb_populate_record(new, v_patch);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 4) 내부 도우미 (외부에서 직접 호출 불가)
-- ---------------------------------------------------------------------

-- 4-1. 비밀값 해시. 비밀값은 브라우저가 만든 32바이트 이상 무작위 문자열(base64url)
create or replace function public.omu_guest_hash(p_secret text, p_scope text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_secret is null or p_secret !~ '^[A-Za-z0-9_-]{32,128}$' then
    raise exception 'OMU:비회원 확인 정보가 올바르지 않아요. 페이지를 새로 고친 뒤 다시 시도해 주세요.';
  end if;
  return encode(sha256(convert_to(p_secret || '|' || p_scope, 'UTF8')), 'hex');
end;
$$;

-- 4-2. 도배 제한 — 최소 간격 / 시간당 한도 / 같은 접속지 한도 / 전체 한도
create or replace function public.omu_throttle(
  p_kind text, p_actor text, p_client text,
  p_min_gap integer, p_hour_max integer, p_client_hour_max integer, p_global_10min_max integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_last timestamptz;
  v_n    integer;
begin
  select max(created_at) into v_last from public.omu_guest_events
   where kind = p_kind and actor = p_actor and created_at > now() - interval '1 hour';
  if v_last is not null and v_last > now() - make_interval(secs => p_min_gap) then
    raise exception 'OMU:너무 빨리 다시 쓰고 있어요. %초 뒤에 다시 시도해 주세요.',
      greatest(1, ceil(extract(epoch from (v_last + make_interval(secs => p_min_gap) - now())))::integer);
  end if;

  select count(*) into v_n from public.omu_guest_events
   where kind = p_kind and actor = p_actor and created_at > now() - interval '1 hour';
  if v_n >= p_hour_max then
    raise exception 'OMU:한 시간에 쓸 수 있는 횟수를 넘었어요. 잠시 뒤에 다시 시도해 주세요.';
  end if;

  if p_client is not null and p_client_hour_max > 0 then
    select count(*) into v_n from public.omu_guest_events
     where kind = p_kind and client = p_client and created_at > now() - interval '1 hour';
    if v_n >= p_client_hour_max then
      raise exception 'OMU:같은 곳에서 너무 많이 쓰고 있어요. 잠시 뒤에 다시 시도해 주세요.';
    end if;
  end if;

  if p_global_10min_max > 0 then
    select count(*) into v_n from public.omu_guest_events
     where kind = p_kind and actor not like 'u:%' and created_at > now() - interval '10 minutes';
    if v_n >= p_global_10min_max then
      raise exception 'OMU:지금은 비회원 작성이 많아 잠시 막혀 있어요. 로그인하면 바로 쓸 수 있어요.';
    end if;
  end if;

  insert into public.omu_guest_events (kind, actor, client) values (p_kind, p_actor, p_client);
  -- 오래된 기록 정리 (2일)
  delete from public.omu_guest_events where created_at < now() - interval '2 days';
end;
$$;

-- 4-3. 비회원 표시 이름 — lib/guest/names.ts 와 같은 목록·같은 규칙
--      같은 스레드(글)에서 같은 키면 같은 이름, 다른 사람과는 겹치지 않게 고른다.
create or replace function public.omu_guest_names()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    '새벽 기타리스트', '느긋한 베이시스트', '리듬 드러머', '허밍 보컬', '초보 작곡가',
    '재즈 피아니스트', '합주실 단골', '코드 수집가', '메트로놈 요정', '카포 애호가',
    '피크 분실자', '튜너 장인', '리버브 장인', '아르페지오', '스타카토',
    '크레셴도', '페르마타', '알레그로', '싱코페이션', '버스킹 행인'
  ]::text[];
$$;

create or replace function public.omu_guest_pick_name(p_thread_type text, p_thread_id uuid, p_tag text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_names text[] := public.omu_guest_names();
  v_n     integer := cardinality(v_names);
  v_name  text;
  v_taken text[];
  v_idx   integer;
  i       integer;
begin
  select guest_name into v_name from public.comments
   where target_type = p_thread_type and target_id = p_thread_id and guest_key = p_tag and guest_name is not null
   limit 1;
  if v_name is null and p_thread_type = 'post' then
    select guest_name into v_name from public.posts where id = p_thread_id and guest_key = p_tag;
  end if;
  if v_name is not null then
    return v_name;
  end if;

  select coalesce(array_agg(distinct guest_name), '{}') into v_taken from (
    select guest_name from public.comments
     where target_type = p_thread_type and target_id = p_thread_id and guest_name is not null
    union all
    select guest_name from public.posts
     where p_thread_type = 'post' and id = p_thread_id and guest_name is not null
  ) t;

  v_idx := (('x' || substr(p_tag, 1, 8))::bit(32)::bigint % v_n)::integer;
  for i in 0 .. v_n - 1 loop
    v_name := v_names[((v_idx + i) % v_n) + 1];
    if not (v_name = any (v_taken)) then
      return v_name;
    end if;
  end loop;
  return v_names[v_idx + 1] || ' ' || (cardinality(v_taken) + 1)::text;
end;
$$;

-- 4-4. 댓글을 달 수 있는(공개 상태인) 대상인지
create or replace function public.omu_target_visible(p_type text, p_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v boolean;
begin
  case p_type
    when 'post'    then select exists (select 1 from public.posts where id = p_id and deleted_at is null and not is_hidden) into v;
    when 'market'  then select exists (select 1 from public.market_items where id = p_id and deleted_at is null and not is_hidden) into v;
    when 'recruit' then select exists (select 1 from public.recruits where id = p_id and deleted_at is null and not is_hidden) into v;
    when 'article' then select exists (select 1 from public.articles where id = p_id and is_published) into v;
    when 'score'   then select exists (select 1 from public.scores where id = p_id) into v;
    else v := false;
  end case;
  return coalesce(v, false);
end;
$$;

-- 4-5. 제목·본문 길이 검사 (화면 검증과 같은 기준)
create or replace function public.omu_check_len(p_value text, p_label text, p_min integer, p_max integer)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v text := btrim(coalesce(p_value, ''));
begin
  if char_length(v) < p_min then
    raise exception 'OMU:%이(가) 너무 짧아요. %자 이상 적어 주세요.', p_label, p_min;
  end if;
  if char_length(v) > p_max then
    raise exception 'OMU:%이(가) 너무 길어요. %자 이하로 적어 주세요.', p_label, p_max;
  end if;
  return v;
end;
$$;

-- ---------------------------------------------------------------------
-- 5) RPC
-- ---------------------------------------------------------------------

-- 5-1. 비회원 커뮤니티 글 작성
create or replace function public.omu_guest_create_post(
  p_category    text,
  p_qna_subject text,
  p_title       text,
  p_content     text,
  p_youtube_url text,
  p_tags        text[],
  p_secret      text,
  p_client      text default null
)
returns table (id uuid, guest_name text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_id    uuid := gen_random_uuid();
  v_actor text;
  v_tag   text;
  v_name  text;
  v_title text;
  v_body  text;
  v_tags  text[] := coalesce(p_tags, '{}');
begin
  if (select auth.uid()) is not null then
    raise exception 'OMU:로그인한 회원은 일반 글쓰기로 작성해 주세요.';
  end if;
  if p_category is null or p_category not in ('free', 'anon', 'qna', 'showcase', 'startup') then
    raise exception 'OMU:게시판을 골라 주세요.';
  end if;
  if p_category = 'qna' and (p_qna_subject is null or p_qna_subject not in ('piano', 'guitar', 'vocal', 'drum', 'bass', 'composition', 'etc')) then
    raise exception 'OMU:질문 과목을 골라 주세요.';
  end if;
  v_title := public.omu_check_len(p_title, '제목', 2, 100);
  v_body  := public.omu_check_len(p_content, '본문', 5, 10000);
  if cardinality(v_tags) > 5 or exists (select 1 from unnest(v_tags) t where char_length(t) > 20 or btrim(t) = '') then
    raise exception 'OMU:태그는 20자 이하로 5개까지 달 수 있어요.';
  end if;

  v_actor := public.omu_guest_hash(p_secret, 'actor');
  perform public.omu_throttle('post', v_actor, p_client, 30, 10, 20, 100);

  v_tag  := public.omu_guest_hash(p_secret, 'post:' || v_id::text);
  v_name := public.omu_guest_pick_name('post', v_id, v_tag);

  perform set_config('omu.bypass_guard', 'on', true);
  insert into public.posts (id, category, qna_subject, title, content, youtube_url, tags,
                            is_anonymous, author_id, guest_name, guest_key)
  values (v_id, p_category, case when p_category = 'qna' then p_qna_subject end, v_title, v_body,
          nullif(btrim(coalesce(p_youtube_url, '')), ''), v_tags,
          false, null, v_name, v_tag);
  perform set_config('omu.bypass_guard', 'off', true);

  return query select v_id, v_name;
end;
$$;

-- 5-2. 댓글 작성 (회원·비회원 공통). 대댓글은 1단계까지 (omu_comment_validate 트리거가 검사)
create or replace function public.omu_create_comment(
  p_target_type text,
  p_target_id   uuid,
  p_parent_id   uuid,
  p_content     text,
  p_anonymous   boolean,
  p_secret      text,
  p_client      text default null
)
returns table (id uuid, guest_name text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid   uuid := (select auth.uid());
  v_id    uuid := gen_random_uuid();
  v_body  text;
  v_actor text;
  v_tag   text;
  v_name  text;
begin
  if p_target_type is null or p_target_type not in ('post', 'recruit', 'market', 'article', 'score') then
    raise exception 'OMU:댓글을 달 수 없는 대상이에요.';
  end if;
  if not public.omu_target_visible(p_target_type, p_target_id) then
    raise exception 'OMU:댓글을 달 글을 찾을 수 없어요. 삭제됐거나 숨겨진 글일 수 있어요.';
  end if;
  v_body := public.omu_check_len(p_content, '댓글', 2, 2000);

  if v_uid is null then
    v_actor := public.omu_guest_hash(p_secret, 'actor');
    perform public.omu_throttle('comment', v_actor, p_client, 10, 30, 60, 300);
    v_tag  := public.omu_guest_hash(p_secret, p_target_type || ':' || p_target_id::text);
    v_name := public.omu_guest_pick_name(p_target_type, p_target_id, v_tag);
  else
    perform public.omu_throttle('comment', 'u:' || v_uid::text, null, 3, 120, 0, 0);
  end if;

  perform set_config('omu.bypass_guard', 'on', true);
  insert into public.comments (id, target_type, target_id, parent_id, content, is_anonymous, author_id, guest_name, guest_key)
  values (v_id, p_target_type, p_target_id, p_parent_id, v_body,
          case when v_uid is null then false else coalesce(p_anonymous, false) end,
          v_uid, v_name, v_tag);
  perform set_config('omu.bypass_guard', 'off', true);

  return query select v_id, v_name;
end;
$$;

-- 5-3. 글 수정 (작성 회원 · 관리자 · 같은 비밀값을 가진 비회원)
create or replace function public.omu_edit_post(p_id uuid, p_title text, p_content text, p_tags text[], p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := (select auth.uid());
  v_post public.posts;
  v_tags text[] := coalesce(p_tags, '{}');
begin
  select * into v_post from public.posts where id = p_id and deleted_at is null for update;
  if not found then
    raise exception 'OMU:글을 찾을 수 없어요.';
  end if;
  -- NULL 이 섞이면 NOT(NULL) = NULL 이 되어 검사를 통과해 버리므로 coalesce 로 막는다
  if not coalesce(
    (v_uid is not null and v_post.author_id = v_uid)
    or public.omu_is_admin()
    or (v_post.author_id is null and v_post.guest_key is not null and p_secret is not null
        and v_post.guest_key = public.omu_guest_hash(p_secret, 'post:' || v_post.id::text)),
    false
  ) then
    raise exception 'OMU:이 글을 고칠 권한이 없어요.';
  end if;
  if cardinality(v_tags) > 5 or exists (select 1 from unnest(v_tags) t where char_length(t) > 20 or btrim(t) = '') then
    raise exception 'OMU:태그는 20자 이하로 5개까지 달 수 있어요.';
  end if;
  if v_uid is null then
    perform public.omu_throttle('edit', public.omu_guest_hash(p_secret, 'actor'), null, 0, 60, 0, 0);
  end if;

  perform set_config('omu.bypass_guard', 'on', true);
  update public.posts
     set title = public.omu_check_len(p_title, '제목', 2, 100),
         content = public.omu_check_len(p_content, '본문', 5, 10000),
         tags = v_tags,
         edited_at = now()
   where id = p_id;
  perform set_config('omu.bypass_guard', 'off', true);
end;
$$;

-- 5-4. 댓글 수정
create or replace function public.omu_edit_comment(p_id uuid, p_content text, p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_c   public.comments;
begin
  select * into v_c from public.comments where id = p_id and deleted_at is null for update;
  if not found then
    raise exception 'OMU:댓글을 찾을 수 없어요.';
  end if;
  if not coalesce(
    (v_uid is not null and v_c.author_id = v_uid)
    or public.omu_is_admin()
    or (v_c.author_id is null and v_c.guest_key is not null and p_secret is not null
        and v_c.guest_key = public.omu_guest_hash(p_secret, v_c.target_type || ':' || v_c.target_id::text)),
    false
  ) then
    raise exception 'OMU:이 댓글을 고칠 권한이 없어요.';
  end if;
  if v_uid is null then
    perform public.omu_throttle('edit', public.omu_guest_hash(p_secret, 'actor'), null, 0, 60, 0, 0);
  end if;

  perform set_config('omu.bypass_guard', 'on', true);
  update public.comments
     set content = public.omu_check_len(p_content, '댓글', 2, 2000), edited_at = now()
   where id = p_id;
  perform set_config('omu.bypass_guard', 'off', true);
end;
$$;

-- 5-5. 삭제 = 숨김 처리(deleted_at). 글·댓글은 작성자/관리자/비회원 비밀값, 장터·구인은 작성 회원/관리자
create or replace function public.omu_soft_delete(p_target text, p_id uuid, p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_admin boolean := public.omu_is_admin();
  v_ok    boolean := false;
  v_post  public.posts;
  v_c     public.comments;
begin
  if p_target = 'post' then
    select * into v_post from public.posts where id = p_id and deleted_at is null for update;
    if not found then raise exception 'OMU:글을 찾을 수 없어요.'; end if;
    v_ok := v_admin or (v_uid is not null and v_post.author_id = v_uid)
            or (v_post.author_id is null and v_post.guest_key is not null and p_secret is not null
                and v_post.guest_key = public.omu_guest_hash(p_secret, 'post:' || v_post.id::text));
  elsif p_target = 'comment' then
    select * into v_c from public.comments where id = p_id and deleted_at is null for update;
    if not found then raise exception 'OMU:댓글을 찾을 수 없어요.'; end if;
    v_ok := v_admin or (v_uid is not null and v_c.author_id = v_uid)
            or (v_c.author_id is null and v_c.guest_key is not null and p_secret is not null
                and v_c.guest_key = public.omu_guest_hash(p_secret, v_c.target_type || ':' || v_c.target_id::text));
  elsif p_target = 'market' then
    select v_admin or (v_uid is not null and seller_id = v_uid) into v_ok
      from public.market_items where id = p_id and deleted_at is null;
    if not found then raise exception 'OMU:매물을 찾을 수 없어요.'; end if;
  elsif p_target = 'recruit' then
    select v_admin or (v_uid is not null and author_id = v_uid) into v_ok
      from public.recruits where id = p_id and deleted_at is null;
    if not found then raise exception 'OMU:모집글을 찾을 수 없어요.'; end if;
  else
    raise exception 'OMU:삭제할 수 없는 대상이에요.';
  end if;

  if not coalesce(v_ok, false) then
    raise exception 'OMU:삭제할 권한이 없어요.';
  end if;

  perform set_config('omu.bypass_guard', 'on', true);
  execute format('update public.%I set deleted_at = now() where id = $1', public.omu_target_table(p_target)) using p_id;
  if p_target = 'comment' then
    -- 숨긴 댓글은 댓글 수에서 뺀다
    execute format('update public.%I set comment_count = greatest(comment_count - 1, 0) where id = $1',
                   public.omu_target_table(v_c.target_type)) using v_c.target_id;
    if v_c.is_accepted and v_c.target_type = 'post' then
      update public.comments set is_accepted = false where id = v_c.id;
      update public.posts set is_answered = false
       where id = v_c.target_id
         and not exists (select 1 from public.comments
                          where target_type = 'post' and target_id = v_c.target_id
                            and is_accepted and deleted_at is null and id <> v_c.id);
    end if;
  end if;
  perform set_config('omu.bypass_guard', 'off', true);
end;
$$;

-- 5-6. 신고 (회원·비회원 공통). 같은 대상은 한 번만, 도배 제한 적용.
--      관리자 화면용으로 대상 제목·주소를 함께 남긴다(DB 에서 직접 계산 — 위조 불가)
create or replace function public.omu_report(
  p_target_type text,
  p_target_id   uuid,
  p_reason      text,
  p_detail      text,
  p_secret      text,
  p_client      text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_actor  text;
  v_title  text;
  v_path   text;
  v_detail text := nullif(btrim(coalesce(p_detail, '')), '');
  v_c      public.comments;
begin
  if p_reason is null or p_reason not in ('spam', 'abuse', 'illegal', 'copyright', 'fraud', 'etc') then
    raise exception 'OMU:신고 사유를 골라 주세요.';
  end if;
  if v_detail is not null and char_length(v_detail) > 500 then
    raise exception 'OMU:신고 내용은 500자 이하로 적어 주세요.';
  end if;
  if p_reason = 'etc' and v_detail is null then
    raise exception 'OMU:기타 사유는 내용을 적어 주세요.';
  end if;

  case p_target_type
    when 'post' then
      select title, '/community/' || category || '/' || id into v_title, v_path from public.posts where id = p_target_id;
    when 'market' then
      select title, '/gear/market/' || id into v_title, v_path from public.market_items where id = p_target_id;
    when 'recruit' then
      select title, '/recruit/' || category || '/' || id into v_title, v_path from public.recruits where id = p_target_id;
    when 'score' then
      select title, '/score/' || instrument || '/' || slug into v_title, v_path from public.scores where id = p_target_id;
    when 'article' then
      select title,
             case when category in ('equipment', 'instrument') then '/gear/' else '/info/' end || category || '/' || slug
        into v_title, v_path from public.articles where id = p_target_id;
    when 'score_request' then
      select song_title, '/score/requests' into v_title, v_path from public.score_requests where id = p_target_id;
    when 'comment' then
      select * into v_c from public.comments where id = p_target_id;
      if found then
        v_title := left(v_c.content, 60);
        v_path := case v_c.target_type
          when 'post'    then (select '/community/' || category || '/' || id from public.posts where id = v_c.target_id)
          when 'market'  then '/gear/market/' || v_c.target_id
          when 'recruit' then (select '/recruit/' || category || '/' || id from public.recruits where id = v_c.target_id)
          when 'score'   then (select '/score/' || instrument || '/' || slug from public.scores where id = v_c.target_id)
          when 'article' then (select case when category in ('equipment', 'instrument') then '/gear/' else '/info/' end
                                      || category || '/' || slug from public.articles where id = v_c.target_id)
        end || '#comment-' || v_c.id;
      end if;
    else
      raise exception 'OMU:신고할 수 없는 대상이에요.';
  end case;
  if v_path is null then
    raise exception 'OMU:신고할 글을 찾을 수 없어요.';
  end if;

  if v_uid is not null then
    if exists (select 1 from public.reports where reporter_id = v_uid and target_type = p_target_type and target_id = p_target_id) then
      raise exception 'OMU:이미 신고한 글이에요. 운영자가 확인할 때까지 기다려 주세요.';
    end if;
    perform public.omu_throttle('report', 'u:' || v_uid::text, null, 5, 20, 0, 0);
  else
    v_actor := public.omu_guest_hash(p_secret, 'actor');
    if exists (select 1 from public.reports where reporter_key = v_actor and target_type = p_target_type and target_id = p_target_id) then
      raise exception 'OMU:이미 신고한 글이에요. 운영자가 확인할 때까지 기다려 주세요.';
    end if;
    perform public.omu_throttle('report', v_actor, p_client, 10, 10, 20, 200);
  end if;

  perform set_config('omu.bypass_guard', 'on', true);
  insert into public.reports (target_type, target_id, reason, detail, status, reporter_id, reporter_key, target_title, target_path)
  values (p_target_type, p_target_id, p_reason, v_detail, 'open', v_uid, v_actor, left(v_title, 120), v_path);
  perform set_config('omu.bypass_guard', 'off', true);
end;
$$;

-- 5-7. 이 스레드(글 + 댓글)에서 내가 수정·삭제할 수 있는 항목
--      kind: 'thread'(글 자체) / 'comment' / 'admin'(관리자라서 전부 가능)
create or replace function public.omu_my_items(p_thread_type text, p_thread_id uuid, p_secret text)
returns table (kind text, id uuid)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := (select auth.uid());
  v_tag text;
begin
  if p_thread_type is null or p_thread_type not in ('post', 'recruit', 'market', 'article', 'score') then
    return;
  end if;
  if public.omu_is_admin() then
    return query select 'admin'::text, null::uuid;
  end if;
  if p_secret is not null and p_secret ~ '^[A-Za-z0-9_-]{32,128}$' then
    v_tag := public.omu_guest_hash(p_secret, p_thread_type || ':' || p_thread_id::text);
  end if;

  if p_thread_type = 'post' then
    return query select 'thread'::text, p.id from public.posts p
      where p.id = p_thread_id and p.deleted_at is null
        and ((v_uid is not null and p.author_id = v_uid) or (v_tag is not null and p.guest_key = v_tag));
  elsif p_thread_type = 'market' and v_uid is not null then
    return query select 'thread'::text, m.id from public.market_items m
      where m.id = p_thread_id and m.deleted_at is null and m.seller_id = v_uid;
  elsif p_thread_type = 'recruit' and v_uid is not null then
    return query select 'thread'::text, r.id from public.recruits r
      where r.id = p_thread_id and r.deleted_at is null and r.author_id = v_uid;
  end if;

  return query select 'comment'::text, c.id from public.comments c
    where c.target_type = p_thread_type and c.target_id = p_thread_id and c.deleted_at is null
      and ((v_uid is not null and c.author_id = v_uid) or (v_tag is not null and c.guest_key = v_tag));
end;
$$;

-- ---------------------------------------------------------------------
-- 6) 권한
-- ---------------------------------------------------------------------
-- 새 공개 컬럼 읽기 권한 (guest_key 는 주지 않는다 → 외부 API 로 읽을 수 없음)
grant select (guest_name, edited_at, deleted_at) on public.posts    to anon, authenticated;
grant select (guest_name, edited_at, deleted_at) on public.comments to anon, authenticated;

revoke execute on function
  public.omu_guest_hash(text, text),
  public.omu_throttle(text, text, text, integer, integer, integer, integer),
  public.omu_guest_names(),
  public.omu_guest_pick_name(text, uuid, text),
  public.omu_target_visible(text, uuid),
  public.omu_check_len(text, text, integer, integer)
  from public, anon, authenticated;

revoke execute on function
  public.omu_guest_create_post(text, text, text, text, text, text[], text, text),
  public.omu_create_comment(text, uuid, uuid, text, boolean, text, text),
  public.omu_edit_post(uuid, text, text, text[], text),
  public.omu_edit_comment(uuid, text, text),
  public.omu_soft_delete(text, uuid, text),
  public.omu_report(text, uuid, text, text, text, text),
  public.omu_my_items(text, uuid, text)
  from public;
grant execute on function
  public.omu_guest_create_post(text, text, text, text, text, text[], text, text),
  public.omu_create_comment(text, uuid, uuid, text, boolean, text, text),
  public.omu_edit_post(uuid, text, text, text[], text),
  public.omu_edit_comment(uuid, text, text),
  public.omu_soft_delete(text, uuid, text),
  public.omu_report(text, uuid, text, text, text, text),
  public.omu_my_items(text, uuid, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------
-- 7) 조회 정책 — 숨김(삭제) 처리된 글·댓글·매물·모집글은 관리자만 본다
--    (정책을 지우지 않고 ALTER POLICY 로 조건만 바꾼다)
-- ---------------------------------------------------------------------
alter policy omu_posts_select_visible on public.posts
  using ((deleted_at is null and (not is_hidden or author_id = (select auth.uid()))) or (select public.omu_is_admin()));
alter policy omu_comments_select_visible on public.comments
  using ((deleted_at is null and (not is_hidden or author_id = (select auth.uid()))) or (select public.omu_is_admin()));
alter policy omu_market_select_visible on public.market_items
  using ((deleted_at is null and (not is_hidden or seller_id = (select auth.uid()))) or (select public.omu_is_admin()));
alter policy omu_recruits_select_visible on public.recruits
  using ((deleted_at is null and (not is_hidden or author_id = (select auth.uid()))) or (select public.omu_is_admin()));

commit;

-- 확인용 (선택)
--   select proname from pg_proc where proname like 'omu\_%' order by 1;
--   select column_name from information_schema.columns where table_name = 'posts' and column_name like 'guest%';
