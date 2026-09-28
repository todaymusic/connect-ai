-- =====================================================================
--  OMU 음악 커뮤니티 — 전체 DB 스키마 (Supabase SQL Editor 1회 실행용)
-- =====================================================================
--
--  실행 방법
--    Supabase 대시보드 → SQL Editor → New query → 이 파일 전체 붙여넣기 → Run
--
--  이 파일의 원칙
--    · DROP 문이 하나도 없다. 기존 테이블·데이터를 지우거나 덮어쓰지 않는다.
--    · 전체가 하나의 트랜잭션(BEGIN … COMMIT)이다. 중간에 하나라도 실패하면
--      아무것도 반영되지 않고 전부 원래대로 돌아간다(부분 적용 없음).
--    · 여러 번 실행해도 안전하다(IF NOT EXISTS / CREATE OR REPLACE / 존재 확인 후 생성).
--    · OMU가 만드는 함수·트리거·정책 이름은 모두 omu_ 로 시작한다.
--      (같은 프로젝트의 다른 객체와 이름이 겹치지 않게 하기 위함)
--
--  권한 구분
--    비회원(anon, 로그인 안 함) : 공개 콘텐츠 읽기만 가능. 쓰기·수정·삭제 불가.
--    회원(authenticated, role=user)
--                              : 커뮤니티·구인·중고·악보요청·댓글·신고 작성,
--                                본인 글만 수정·삭제. 악보·정보글 작성 불가.
--    에디터(role=editor)        : 회원 권한 + 악보·정보글 작성, 본인 것 수정·삭제.
--                                (정보글 '발행'은 관리자만)
--    관리자(role=admin)         : 전체 글 수정·삭제·숨김, 발행, 회원 역할 변경, 신고 처리.
--
--  실행 순서
--    0) 사전 점검(기존 테이블 구조 충돌·다른 RLS 정책 존재 시 중단)
--    1) 확장 기능  2) 테이블  3) 인덱스  4) 함수  5) 트리거
--    6) 테이블 권한(GRANT/REVOKE)  7) RLS 정책  8) Storage 버킷·정책
--    9) 기존 가입자 프로필 보정 + 최초 관리자 지정
--
--  ※ 위험 요소·실행 전 확인 사항은 같은 폴더의 SCHEMA_README.md 참고.
-- =====================================================================

begin;

-- =====================================================================
-- 0) 사전 점검 — 문제가 있으면 여기서 바로 중단(아무것도 바뀌지 않음)
-- =====================================================================
do $preflight$
declare
  expected jsonb := '{
    "profiles":       ["id","created_at","updated_at","email","nickname","role","avatar_url","region","bio"],
    "scores":         ["id","created_at","updated_at","title","slug","instrument","difficulty","genre","artist","file_url","thumbnail_url","is_free","price","download_count","author_id","meta_description","view_count","comment_count"],
    "articles":       ["id","created_at","updated_at","title","slug","category","content","thumbnail_url","youtube_url","meta_description","keywords","author_id","author_display","view_count","comment_count","is_published","published_at"],
    "market_items":   ["id","created_at","updated_at","title","category","trade_type","price","is_free_share","status","description","region","contact","image_urls","seller_id","view_count","comment_count","is_hidden"],
    "recruits":       ["id","created_at","updated_at","title","category","recruit_level","genre","skill_level","region","description","contact","author_id","is_closed","view_count","comment_count","is_hidden"],
    "posts":          ["id","created_at","updated_at","title","category","content","youtube_url","is_anonymous","qna_subject","author_id","public_author_id","author_display","is_answered","view_count","comment_count","is_hidden"],
    "comments":       ["id","created_at","updated_at","target_type","target_id","content","parent_id","is_anonymous","is_accepted","author_id","public_author_id","is_hidden"],
    "score_requests": ["id","created_at","updated_at","song_title","instrument","description","status","fulfilled_score_id","author_id"],
    "reports":        ["id","created_at","target_type","target_id","reason","detail","status","reporter_id","resolved_by","resolved_at"]
  }'::jsonb;
  t text;
  col text;
  missing text[] := '{}';
  foreign_policies text;
begin
  -- Supabase 프로젝트가 맞는지 확인
  if to_regclass('auth.users') is null then
    raise exception '[OMU 사전점검] auth.users 테이블이 없습니다. Supabase 프로젝트의 SQL Editor에서 실행하세요.';
  end if;
  if to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null then
    raise exception '[OMU 사전점검] storage 스키마가 없습니다. Supabase Storage가 활성화된 프로젝트인지 확인하세요.';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon')
     or not exists (select 1 from pg_roles where rolname = 'authenticated') then
    raise exception '[OMU 사전점검] anon / authenticated 역할이 없습니다. Supabase 프로젝트가 아닌 것 같습니다.';
  end if;

  -- 같은 이름의 테이블이 이미 있는데 OMU가 필요로 하는 컬럼이 없으면 중단
  -- (CREATE TABLE IF NOT EXISTS 는 기존 테이블을 건너뛰므로, 구조가 다르면 뒤에서 깨진다)
  for t in select jsonb_object_keys(expected) loop
    if to_regclass('public.' || t) is not null then
      for col in select jsonb_array_elements_text(expected -> t) loop
        if not exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = t and column_name = col
        ) then
          missing := missing || (t || '.' || col);
        end if;
      end loop;
    end if;
  end loop;
  if cardinality(missing) > 0 then
    raise exception '[OMU 사전점검] 이미 존재하는 테이블의 구조가 OMU 스키마와 다릅니다. 없는 컬럼: %', array_to_string(missing, ', ')
      using hint = '기존 테이블을 지우지 말고, 해당 테이블 이름/용도를 먼저 확인하세요. OMU 전용 새 프로젝트에서 실행하는 것을 권장합니다.';
  end if;

  -- OMU 테이블에 OMU가 만들지 않은 RLS 정책이 있으면 중단
  -- (Postgres RLS 정책은 OR로 합쳐지므로, 다른 정책이 남아 있으면 권한이 의도보다 넓어질 수 있다)
  select string_agg(format('%s.%s', tablename, policyname), ', ')
    into foreign_policies
  from pg_policies
  where schemaname = 'public'
    and tablename in (select jsonb_object_keys(expected))
    and policyname not like 'omu\_%';
  if foreign_policies is not null then
    raise exception '[OMU 사전점검] OMU 테이블에 OMU가 만들지 않은 RLS 정책이 있습니다: %', foreign_policies
      using hint = '해당 정책이 필요한지 검토 후 대시보드(Authentication → Policies)에서 직접 정리하고 다시 실행하세요.';
  end if;
end
$preflight$;


-- =====================================================================
-- 1) 확장 기능
-- =====================================================================
create schema if not exists extensions;
-- 제목 부분일치 검색(ILIKE '%검색어%') 가속용. 이미 설치돼 있으면 아무 일도 하지 않는다.
create extension if not exists pg_trgm with schema extensions;


-- =====================================================================
-- 2) 테이블
--    모든 테이블: id uuid 기본키 + created_at timestamptz default now()
--    ※ 작업지시서 6장 외에 추가된 컬럼(★ 표시)은 화면 기능(숨김·신고·댓글 수·
--      익명 보호 등)을 위해 필요한 것들이다.
-- =====================================================================

-- 2-1. profiles (회원 프로필) — auth.users 와 1:1
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),                         -- ★
  email       text,
  nickname    text not null check (char_length(btrim(nickname)) between 1 and 30),
  role        text not null default 'user' check (role in ('user', 'editor', 'admin')),
  avatar_url  text,
  region      text,
  bio         text check (bio is null or char_length(bio) <= 500)
);
comment on table public.profiles is 'OMU 회원 프로필. 가입 시 트리거로 자동 생성된다.';
comment on column public.profiles.role is 'user=일반회원 / editor=OMU 에디터 명의 콘텐츠 작성 / admin=관리자';

-- 2-2. scores (악보)
create table if not exists public.scores (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),                   -- ★
  title             text not null check (char_length(btrim(title)) between 1 and 200),
  slug              text not null unique
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  instrument        text not null check (instrument in ('piano', 'guitar', 'vocal', 'drum', 'bass', 'band', 'chord')),
  difficulty        text check (difficulty in ('beginner', 'easy', 'intermediate', 'advanced')),
  genre             text,
  artist            text,
  file_url          text not null,
  thumbnail_url     text,
  is_free           boolean not null default true,
  price             integer not null default 0 check (price >= 0),
  download_count    integer not null default 0 check (download_count >= 0),
  author_id         uuid references public.profiles (id) on delete set null,
  meta_description  text check (meta_description is null or char_length(meta_description) <= 300),
  view_count        integer not null default 0 check (view_count >= 0),
  comment_count     integer not null default 0 check (comment_count >= 0) -- ★
);
comment on column public.scores.price is '향후 유료화 대비 자리. 현재는 0(무료).';

-- 2-3. articles (음악정보 글 + 악기 탭의 장비/악기 정보글)
create table if not exists public.articles (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),                   -- ★
  title             text not null check (char_length(btrim(title)) between 1 and 200),
  slug              text not null unique
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  -- beginner/exam/contest/venue/story = /info/*,  ★equipment/instrument = /gear/*
  category          text not null check (category in ('beginner', 'exam', 'contest', 'venue', 'story', 'equipment', 'instrument')),
  content           text not null default '' check (char_length(content) <= 100000),
  thumbnail_url     text,
  youtube_url       text check (youtube_url is null or youtube_url ~* '^https?://(www\.|m\.)?(youtube\.com|youtu\.be)/'),
  meta_description  text check (meta_description is null or char_length(meta_description) <= 300),
  keywords          text,
  author_id         uuid references public.profiles (id) on delete set null,
  author_display    text not null default 'editor' check (author_display in ('editor', 'member')),
  view_count        integer not null default 0 check (view_count >= 0),
  comment_count     integer not null default 0 check (comment_count >= 0), -- ★
  is_published      boolean not null default false,
  published_at      timestamptz                                           -- ★ (발행 시각, sitemap·정렬용)
);

-- 2-4. market_items (중고 장터)
create table if not exists public.market_items (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),                      -- ★
  title          text not null check (char_length(btrim(title)) between 1 and 200),
  category       text not null check (category in ('guitar', 'keyboard', 'drum', 'wind', 'equipment', 'etc')),
  trade_type     text not null default 'sell' check (trade_type in ('sell', 'buy', 'share')), -- ★ 판매/구매/나눔
  price          integer not null default 0 check (price >= 0),
  is_free_share  boolean not null default false,
  status         text not null default 'selling' check (status in ('selling', 'reserved', 'sold')),
  description    text not null default '' check (char_length(description) <= 20000),
  region         text,
  contact        text check (contact is null or char_length(contact) <= 100), -- ★ (1차: 연락처 노출용, 선택)
  image_urls     text[] not null default '{}' check (cardinality(image_urls) <= 10),
  seller_id      uuid not null references public.profiles (id) on delete cascade,
  view_count     integer not null default 0 check (view_count >= 0),
  comment_count  integer not null default 0 check (comment_count >= 0),   -- ★
  is_hidden      boolean not null default false                           -- ★ 관리자 숨김
);

-- 2-5. recruits (구인·모집)
create table if not exists public.recruits (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),                      -- ★
  title          text not null check (char_length(btrim(title)) between 1 and 200),
  category       text not null check (category in ('band', 'session', 'lesson', 'audition')),
  recruit_level  text check (recruit_level in ('hobby', 'semipro', 'pro')),
  genre          text,
  skill_level    text check (skill_level in ('beginner', 'intermediate', 'advanced')),
  region         text,
  description    text not null default '' check (char_length(description) <= 20000),
  contact        text check (contact is null or char_length(contact) <= 100), -- ★
  author_id      uuid not null references public.profiles (id) on delete cascade,
  is_closed      boolean not null default false,
  view_count     integer not null default 0 check (view_count >= 0),
  comment_count  integer not null default 0 check (comment_count >= 0),   -- ★
  is_hidden      boolean not null default false,                          -- ★
  -- 밴드·팀원 모집은 성격 배지(취미/세미프로/현역) 필수
  constraint recruits_band_level_required check (category <> 'band' or recruit_level is not null)
);

-- 2-6. posts (커뮤니티 글)
create table if not exists public.posts (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),                   -- ★
  title             text not null check (char_length(btrim(title)) between 1 and 200),
  category          text not null check (category in ('free', 'anon', 'qna', 'showcase', 'startup')),
  content           text not null default '' check (char_length(content) <= 50000),
  youtube_url       text check (youtube_url is null or youtube_url ~* '^https?://(www\.|m\.)?(youtube\.com|youtu\.be)/'),
  is_anonymous      boolean not null default false,
  qna_subject       text check (qna_subject in ('piano', 'guitar', 'vocal', 'drum', 'bass', 'composition', 'etc')),
  author_id         uuid references public.profiles (id) on delete set null,
  -- ★ 공개용 작성자 id. 익명 글이면 NULL. (author_id 컬럼 자체는 외부 API로 읽을 수 없게 막는다 — 6번 참고)
  public_author_id  uuid references public.profiles (id) on delete set null,
  author_display    text not null default 'member' check (author_display in ('member', 'editor')),
  is_answered       boolean not null default false,
  view_count        integer not null default 0 check (view_count >= 0),
  comment_count     integer not null default 0 check (comment_count >= 0), -- ★
  is_hidden         boolean not null default false                        -- ★
);

-- 2-7. comments (댓글 — 모든 게시물 공통, 대댓글 1단계)
create table if not exists public.comments (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),                   -- ★
  target_type       text not null check (target_type in ('post', 'recruit', 'market', 'article', 'score')),
  target_id         uuid not null,
  content           text not null check (char_length(btrim(content)) between 1 and 5000),
  parent_id         uuid references public.comments (id) on delete cascade,
  is_anonymous      boolean not null default false,
  is_accepted       boolean not null default false,
  author_id         uuid references public.profiles (id) on delete set null,
  public_author_id  uuid references public.profiles (id) on delete set null, -- ★ 익명이면 NULL
  is_hidden         boolean not null default false                        -- ★
);

-- 2-8. score_requests (악보 요청 게시판)
create table if not exists public.score_requests (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),                 -- ★
  song_title          text not null check (char_length(btrim(song_title)) between 1 and 200),
  instrument          text not null check (instrument in ('piano', 'guitar', 'vocal', 'drum', 'bass', 'band', 'chord')),
  description         text check (description is null or char_length(description) <= 5000),
  status              text not null default 'open' check (status in ('open', 'fulfilled')),
  fulfilled_score_id  uuid references public.scores (id) on delete set null, -- ★ 등록된 악보 연결
  author_id           uuid references public.profiles (id) on delete set null
);

-- 2-9. reports (★ 신고 — 관리자 페이지 '신고 처리'용)
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  target_type  text not null check (target_type in ('post', 'recruit', 'market', 'article', 'score', 'comment', 'score_request')),
  target_id    uuid not null,
  reason       text not null check (reason in ('spam', 'abuse', 'illegal', 'copyright', 'fraud', 'etc')),
  detail       text check (detail is null or char_length(detail) <= 2000),
  status       text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  reporter_id  uuid references public.profiles (id) on delete set null,
  resolved_by  uuid references public.profiles (id) on delete set null,
  resolved_at  timestamptz
);


-- =====================================================================
-- 3) 인덱스 (목록 필터·정렬, 외래키, 검색)
-- =====================================================================
create index if not exists omu_profiles_role_idx            on public.profiles (role);
create index if not exists omu_profiles_email_idx           on public.profiles (lower(email));

create index if not exists omu_scores_instrument_idx        on public.scores (instrument, created_at desc);
create index if not exists omu_scores_popular_idx           on public.scores (download_count desc);
create index if not exists omu_scores_author_idx            on public.scores (author_id);

create index if not exists omu_articles_category_idx        on public.articles (category, is_published, published_at desc);
create index if not exists omu_articles_author_idx          on public.articles (author_id);

create index if not exists omu_market_list_idx              on public.market_items (category, status, created_at desc);
create index if not exists omu_market_region_idx            on public.market_items (region);
create index if not exists omu_market_seller_idx            on public.market_items (seller_id);

create index if not exists omu_recruits_list_idx            on public.recruits (category, recruit_level, created_at desc);
create index if not exists omu_recruits_region_idx          on public.recruits (region);
create index if not exists omu_recruits_author_idx          on public.recruits (author_id);

create index if not exists omu_posts_list_idx               on public.posts (category, created_at desc);
create index if not exists omu_posts_qna_idx                on public.posts (is_answered, created_at desc) where category = 'qna';
create index if not exists omu_posts_author_idx             on public.posts (author_id);
create index if not exists omu_posts_public_author_idx      on public.posts (public_author_id);

create index if not exists omu_comments_target_idx          on public.comments (target_type, target_id, created_at);
create index if not exists omu_comments_parent_idx          on public.comments (parent_id);
create index if not exists omu_comments_author_idx          on public.comments (author_id);
create index if not exists omu_comments_public_author_idx   on public.comments (public_author_id);

create index if not exists omu_score_requests_list_idx      on public.score_requests (status, created_at desc);
create index if not exists omu_score_requests_author_idx    on public.score_requests (author_id);
create index if not exists omu_score_requests_score_idx     on public.score_requests (fulfilled_score_id);

create index if not exists omu_reports_status_idx           on public.reports (status, created_at desc);
create index if not exists omu_reports_reporter_idx         on public.reports (reporter_id);
create index if not exists omu_reports_resolved_by_idx      on public.reports (resolved_by);
-- 같은 회원이 같은 대상을 중복 신고하지 못하게
create unique index if not exists omu_reports_once_idx      on public.reports (reporter_id, target_type, target_id) where reporter_id is not null;

-- 제목 부분일치 검색용 trigram 인덱스
-- (pg_trgm 이 extensions 가 아닌 다른 스키마에 이미 설치돼 있어도 동작하도록 위치를 찾아서 만든다)
do $trgm$
declare
  ops_schema text;
  spec record;
begin
  select n.nspname into ops_schema
  from pg_opclass o join pg_namespace n on n.oid = o.opcnamespace
  where o.opcname = 'gin_trgm_ops'
  limit 1;

  for spec in
    select * from (values
      ('omu_scores_title_trgm',          'scores',         'title'),
      ('omu_scores_artist_trgm',         'scores',         'artist'),
      ('omu_articles_title_trgm',        'articles',       'title'),
      ('omu_market_title_trgm',          'market_items',   'title'),
      ('omu_recruits_title_trgm',        'recruits',       'title'),
      ('omu_posts_title_trgm',           'posts',          'title'),
      ('omu_score_requests_title_trgm',  'score_requests', 'song_title')
    ) as v(idx, tbl, col)
  loop
    execute format('create index if not exists %I on public.%I using gin (%I %I.gin_trgm_ops)',
                   spec.idx, spec.tbl, spec.col, ops_schema);
  end loop;
end
$trgm$;


-- =====================================================================
-- 4) 함수
--    security definer 함수는 모두 search_path = '' 로 고정(스키마 하이재킹 방지)
-- =====================================================================

-- 4-1. 최초 관리자 이메일 목록 (이메일 인증을 마친 계정만 admin 이 된다)
--      추가 관리자 3명은 관리자 페이지에서 역할 변경으로 지정한다.
create or replace function public.omu_bootstrap_admin_emails()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['todaymusic2407@gmail.com']::text[];
$$;

-- 4-2. 역할 확인 (RLS 정책에서 사용)
create or replace function public.omu_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.omu_is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('editor', 'admin')
  );
$$;

-- 4-3. 댓글·신고 target_type → 실제 테이블 이름
create or replace function public.omu_target_table(p_target text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_target
    when 'score'         then 'scores'
    when 'article'       then 'articles'
    when 'market'        then 'market_items'
    when 'recruit'       then 'recruits'
    when 'post'          then 'posts'
    when 'comment'       then 'comments'
    when 'score_request' then 'score_requests'
  end;
$$;

-- 4-4. [트리거] updated_at 자동 갱신
create or replace function public.omu_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 4-5. [트리거] 보호 컬럼 가드
--   회원이 직접 API로 조회수·댓글수·다운로드수·숨김·채택·발행·작성자·역할 등을
--   조작하지 못하게 막는다. (RLS는 '어떤 행'을 고칠 수 있는지만 정하고,
--   '어떤 컬럼'을 고칠 수 있는지는 정하지 못하기 때문)
--   · 관리자, service_role 키, SQL Editor, OMU 내부 함수(omu.bypass_guard)는 통과
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
    'role', 'email'
  ];
begin
  -- 내부 함수 / service_role / SQL Editor / GoTrue(가입 처리) / 관리자는 통과
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
  else -- INSERT: 카운터·상태값은 기본값으로 강제
    foreach v_col in array array['view_count', 'comment_count', 'download_count'] loop
      if v_row ? v_col then v_patch := v_patch || jsonb_build_object(v_col, 0); end if;
    end loop;
    foreach v_col in array array['is_hidden', 'is_answered', 'is_accepted', 'is_published'] loop
      if v_row ? v_col then v_patch := v_patch || jsonb_build_object(v_col, false); end if;
    end loop;
    if v_row ? 'published_at' then v_patch := v_patch || '{"published_at": null}'::jsonb; end if;
    if v_row ? 'role'         then v_patch := v_patch || '{"role": "user"}'::jsonb; end if;
  end if;

  -- 'OMU 에디터' 명의 표기는 에디터·관리자만 사용 가능 (일반 회원 사칭 방지)
  if v_row ? 'author_display' and not public.omu_is_staff() then
    v_patch := v_patch || '{"author_display": "member"}'::jsonb;
  end if;

  if v_patch <> '{}'::jsonb then
    new := jsonb_populate_record(new, v_patch);
  end if;
  return new;
end;
$$;

-- 4-6. [트리거] 정보글 발행 시각 기록
create or replace function public.omu_article_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and new.published_at is null then
    new.published_at := now();
  elsif not new.is_published then
    new.published_at := null;
  end if;
  return new;
end;
$$;

-- 4-7. [트리거] 공개용 작성자 id 계산 (익명이면 NULL) — posts, comments
--      익명 게시판(category='anon') 글은 항상 익명으로 강제
create or replace function public.omu_set_public_author()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- (plpgsql 은 AND 를 단락 평가하지 않으므로 if 를 중첩해야 comments 에서 category 참조 오류가 안 난다)
  if tg_table_name = 'posts' then
    if new.category = 'anon' then
      new.is_anonymous := true;
    end if;
  end if;
  new.public_author_id := case when new.is_anonymous then null else new.author_id end;
  return new;
end;
$$;

-- 4-8. [트리거] 댓글 작성 전 검증
--      대상 글 존재 여부, 대댓글 대상 일치·1단계 제한, 익명 게시판 댓글 익명 강제
create or replace function public.omu_comment_validate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_table    text := public.omu_target_table(new.target_type);
  v_exists   boolean;
  v_parent   record;
  v_category text;
begin
  if v_table is null then
    raise exception '댓글 대상 종류가 올바르지 않습니다: %', new.target_type;
  end if;

  if new.target_type = 'article' then
    select exists (select 1 from public.articles
                   where id = new.target_id and (is_published or public.omu_is_staff()))
      into v_exists;
  else
    execute format('select exists (select 1 from public.%I where id = $1)', v_table)
      into v_exists using new.target_id;
  end if;
  if not v_exists then
    raise exception '댓글을 달 글이 존재하지 않습니다.';
  end if;

  if new.parent_id is not null then
    select target_type, target_id, parent_id into v_parent
    from public.comments where id = new.parent_id;
    if not found or v_parent.target_type <> new.target_type or v_parent.target_id <> new.target_id then
      raise exception '답글 대상 댓글이 올바르지 않습니다.';
    end if;
    if v_parent.parent_id is not null then
      raise exception '답글에는 다시 답글을 달 수 없습니다.';
    end if;
  end if;

  if new.target_type = 'post' then
    select category into v_category from public.posts where id = new.target_id;
    if v_category = 'anon' then
      new.is_anonymous := true;
    end if;
  end if;

  return new;
end;
$$;

-- 4-9. [트리거] 댓글 수 집계 + 채택 댓글 삭제 시 답변완료 해제
create or replace function public.omu_comment_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row   public.comments;
  v_delta integer;
begin
  if tg_op = 'INSERT' then
    v_row := new; v_delta := 1;
  else
    v_row := old; v_delta := -1;
  end if;

  perform set_config('omu.bypass_guard', 'on', true);

  execute format(
    'update public.%I set comment_count = greatest(comment_count + $1, 0) where id = $2',
    public.omu_target_table(v_row.target_type)
  ) using v_delta, v_row.target_id;

  if tg_op = 'DELETE' and old.is_accepted and old.target_type = 'post' then
    update public.posts set is_answered = false
    where id = old.target_id
      and not exists (select 1 from public.comments
                      where target_type = 'post' and target_id = old.target_id
                        and is_accepted and id <> old.id);
  end if;

  perform set_config('omu.bypass_guard', 'off', true);
  return null;
end;
$$;

-- 4-10. [트리거] 글이 삭제되면 그 글의 댓글도 삭제 (댓글은 여러 테이블을 가리키므로 FK 대신 트리거)
create or replace function public.omu_delete_target_comments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.comments
  where target_type = tg_argv[0] and target_id = old.id;
  return null;
end;
$$;

-- 4-11. [트리거] 신규 가입 → profiles 자동 생성
create or replace function public.omu_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nick text;
begin
  v_nick := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'nickname',
                                  new.raw_user_meta_data ->> 'name', '')), '');
  if v_nick is null then
    v_nick := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;
  if v_nick is null then
    v_nick := '회원' || substr(new.id::text, 1, 6);
  end if;

  insert into public.profiles (id, email, nickname, role)
  values (
    new.id,
    new.email,
    left(v_nick, 30),
    case
      when new.email_confirmed_at is not null
       and lower(new.email) = any (public.omu_bootstrap_admin_emails())
      then 'admin' else 'user'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 4-12. [트리거] 이메일 변경·인증 완료 → profiles 동기화 + 최초 관리자 승격
create or replace function public.omu_handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('omu.bypass_guard', 'on', true);

  update public.profiles
     set email = new.email
   where id = new.id and email is distinct from new.email;

  if new.email_confirmed_at is not null
     and lower(new.email) = any (public.omu_bootstrap_admin_emails()) then
    update public.profiles set role = 'admin'
     where id = new.id and role <> 'admin';
  end if;

  perform set_config('omu.bypass_guard', 'off', true);
  return new;
end;
$$;

-- 4-13. [RPC] 조회수 +1 (비회원 포함 누구나 호출 가능)
create or replace function public.omu_increment_view(p_target text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_target not in ('score', 'article', 'market', 'recruit', 'post') then
    raise exception '지원하지 않는 대상입니다: %', p_target;
  end if;
  perform set_config('omu.bypass_guard', 'on', true);
  execute format('update public.%I set view_count = view_count + 1 where id = $1',
                 public.omu_target_table(p_target))
    using p_id;
  perform set_config('omu.bypass_guard', 'off', true);
end;
$$;

-- 4-14. [RPC] 악보 다운로드 수 +1
create or replace function public.omu_increment_score_download(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('omu.bypass_guard', 'on', true);
  update public.scores set download_count = download_count + 1 where id = p_id;
  perform set_config('omu.bypass_guard', 'off', true);
end;
$$;

-- 4-15. [RPC] Q&A 답변 채택 (질문 작성자 또는 관리자만)
create or replace function public.omu_accept_answer(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comment public.comments;
  v_post    public.posts;
begin
  if (select auth.uid()) is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select * into v_comment from public.comments where id = p_comment_id;
  if not found or v_comment.target_type <> 'post' then
    raise exception '채택할 수 없는 댓글입니다.';
  end if;

  select * into v_post from public.posts where id = v_comment.target_id;
  if not found or v_post.category <> 'qna' then
    raise exception 'Q&A 게시판의 댓글만 채택할 수 있습니다.';
  end if;

  if v_post.author_id is distinct from (select auth.uid()) and not public.omu_is_admin() then
    raise exception '질문 작성자만 답변을 채택할 수 있습니다.';
  end if;
  if v_comment.author_id is not distinct from v_post.author_id then
    raise exception '본인 댓글은 채택할 수 없습니다.';
  end if;

  perform set_config('omu.bypass_guard', 'on', true);
  update public.comments set is_accepted = false
   where target_type = 'post' and target_id = v_post.id and is_accepted and id <> v_comment.id;
  update public.comments set is_accepted = true where id = v_comment.id;
  update public.posts set is_answered = true where id = v_post.id;
  perform set_config('omu.bypass_guard', 'off', true);
end;
$$;

-- 4-16. [RPC] 내가 쓴 글인지 확인 (익명 글은 author_id 를 공개하지 않으므로 이걸로 수정·삭제 버튼 노출 판단)
create or replace function public.omu_is_owner(p_target text, p_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result boolean;
  v_col    text := case when p_target = 'market' then 'seller_id' else 'author_id' end;
begin
  if (select auth.uid()) is null or public.omu_target_table(p_target) is null then
    return false;
  end if;
  execute format('select exists (select 1 from public.%I where id = $1 and %I = $2)',
                 public.omu_target_table(p_target), v_col)
    into v_result using p_id, (select auth.uid());
  return coalesce(v_result, false);
end;
$$;

-- 4-17. [RPC] 관리자 전용: 회원 목록(이메일 포함) — profiles.email 은 외부 API에서 직접 못 읽게 막았으므로
create or replace function public.omu_admin_list_members(
  p_search text default null,
  p_limit  integer default 100,
  p_offset integer default 0
)
returns table (
  id         uuid,
  email      text,
  nickname   text,
  role       text,
  region     text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.omu_is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;
  return query
    select p.id, p.email, p.nickname, p.role, p.region, p.created_at
    from public.profiles p
    where p_search is null or p_search = ''
       or p.nickname ilike '%' || p_search || '%'
       or p.email    ilike '%' || p_search || '%'
    order by p.created_at desc
    limit least(greatest(p_limit, 1), 500) offset greatest(p_offset, 0);
end;
$$;

-- 4-18. [RPC] 관리자 전용: 익명 글·댓글의 실제 작성자 확인(신고 처리용)
create or replace function public.omu_admin_get_author(p_target text, p_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_author uuid;
begin
  if not public.omu_is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;
  if p_target not in ('post', 'comment') then
    raise exception '지원하지 않는 대상입니다: %', p_target;
  end if;
  execute format('select author_id from public.%I where id = $1', public.omu_target_table(p_target))
    into v_author using p_id;
  return v_author;
end;
$$;


-- =====================================================================
-- 5) 트리거
--    같은 시점의 BEFORE 트리거는 이름 순으로 실행되므로 번호(10/20/30/90)로 순서를 고정
--    (CREATE OR REPLACE TRIGGER — Postgres 14 이상, 기존 트리거가 있어도 삭제 없이 갱신)
-- =====================================================================

-- 5-1. auth.users → profiles
create or replace trigger omu_on_auth_user_created
  after insert on auth.users
  for each row execute function public.omu_handle_new_user();

create or replace trigger omu_on_auth_user_updated
  after update of email, email_confirmed_at on auth.users
  for each row execute function public.omu_handle_user_updated();

-- 5-2. 보호 컬럼 가드 (INSERT·UPDATE)
create or replace trigger omu_10_guard before insert or update on public.profiles       for each row execute function public.omu_guard_row();
create or replace trigger omu_10_guard before insert or update on public.scores         for each row execute function public.omu_guard_row();
create or replace trigger omu_10_guard before insert or update on public.articles       for each row execute function public.omu_guard_row();
create or replace trigger omu_10_guard before insert or update on public.market_items   for each row execute function public.omu_guard_row();
create or replace trigger omu_10_guard before insert or update on public.recruits       for each row execute function public.omu_guard_row();
create or replace trigger omu_10_guard before insert or update on public.posts          for each row execute function public.omu_guard_row();
create or replace trigger omu_10_guard before insert or update on public.comments       for each row execute function public.omu_guard_row();
create or replace trigger omu_10_guard before insert or update on public.score_requests for each row execute function public.omu_guard_row();
create or replace trigger omu_10_guard before insert or update on public.reports        for each row execute function public.omu_guard_row();

-- 5-3. 댓글 검증 → 공개 작성자 계산
create or replace trigger omu_20_validate before insert on public.comments
  for each row execute function public.omu_comment_validate();
create or replace trigger omu_30_public_author before insert or update on public.comments
  for each row execute function public.omu_set_public_author();
create or replace trigger omu_30_public_author before insert or update on public.posts
  for each row execute function public.omu_set_public_author();

-- 5-4. 정보글 발행 시각
create or replace trigger omu_40_published_at before insert or update on public.articles
  for each row execute function public.omu_article_published_at();

-- 5-5. updated_at
create or replace trigger omu_90_updated_at before update on public.profiles       for each row execute function public.omu_set_updated_at();
create or replace trigger omu_90_updated_at before update on public.scores         for each row execute function public.omu_set_updated_at();
create or replace trigger omu_90_updated_at before update on public.articles       for each row execute function public.omu_set_updated_at();
create or replace trigger omu_90_updated_at before update on public.market_items   for each row execute function public.omu_set_updated_at();
create or replace trigger omu_90_updated_at before update on public.recruits       for each row execute function public.omu_set_updated_at();
create or replace trigger omu_90_updated_at before update on public.posts          for each row execute function public.omu_set_updated_at();
create or replace trigger omu_90_updated_at before update on public.comments       for each row execute function public.omu_set_updated_at();
create or replace trigger omu_90_updated_at before update on public.score_requests for each row execute function public.omu_set_updated_at();

-- 5-6. 댓글 수 집계
create or replace trigger omu_comment_count after insert or delete on public.comments
  for each row execute function public.omu_comment_after_change();

-- 5-7. 글 삭제 시 댓글 정리
create or replace trigger omu_cleanup_comments after delete on public.scores       for each row execute function public.omu_delete_target_comments('score');
create or replace trigger omu_cleanup_comments after delete on public.articles     for each row execute function public.omu_delete_target_comments('article');
create or replace trigger omu_cleanup_comments after delete on public.market_items for each row execute function public.omu_delete_target_comments('market');
create or replace trigger omu_cleanup_comments after delete on public.recruits     for each row execute function public.omu_delete_target_comments('recruit');
create or replace trigger omu_cleanup_comments after delete on public.posts        for each row execute function public.omu_delete_target_comments('post');


-- =====================================================================
-- 6) 테이블·함수 권한 (GRANT / REVOKE)
--    RLS 이전 단계의 '문지기'. 비회원(anon)은 읽기만, 회원(authenticated)은 읽기·쓰기.
--    실제로 어떤 행을 쓰고 고칠 수 있는지는 7) RLS 정책이 결정한다.
-- =====================================================================

-- 6-1. 비회원: 읽기 전용
revoke insert, update, delete, truncate, references, trigger
  on public.profiles, public.scores, public.articles, public.market_items, public.recruits,
     public.posts, public.comments, public.score_requests, public.reports
  from anon;
grant select
  on public.scores, public.articles, public.market_items, public.recruits, public.score_requests
  to anon;

-- 6-2. 회원: 읽기·쓰기 (TRUNCATE 등 위험 권한은 제거)
revoke truncate, references, trigger
  on public.profiles, public.scores, public.articles, public.market_items, public.recruits,
     public.posts, public.comments, public.score_requests, public.reports
  from authenticated;
grant select, insert, update, delete
  on public.scores, public.articles, public.market_items, public.recruits,
     public.score_requests, public.reports
  to authenticated;
grant insert, update, delete on public.posts, public.comments to authenticated;
grant insert, update on public.profiles to authenticated;

-- 6-3. 개인정보 보호용 컬럼 단위 읽기 권한
--   · profiles.email      : 외부 API로 읽기 불가 (관리자는 omu_admin_list_members RPC 사용)
--   · posts/comments.author_id : 외부 API로 읽기 불가 (익명 글 작성자 역추적 방지)
--                                → 화면 표시는 public_author_id 사용
revoke select on public.profiles, public.posts, public.comments from anon, authenticated;

grant select (id, created_at, updated_at, nickname, role, avatar_url, region, bio)
  on public.profiles to anon, authenticated;

grant select (id, created_at, updated_at, title, category, content, youtube_url, is_anonymous,
              qna_subject, public_author_id, author_display, is_answered, view_count,
              comment_count, is_hidden)
  on public.posts to anon, authenticated;

grant select (id, created_at, updated_at, target_type, target_id, content, parent_id,
              is_anonymous, is_accepted, public_author_id, is_hidden)
  on public.comments to anon, authenticated;

-- 6-4. 함수 실행 권한
--   트리거 전용 함수: 외부에서 직접 호출 불가
revoke execute on function
  public.omu_set_updated_at(),
  public.omu_guard_row(),
  public.omu_article_published_at(),
  public.omu_set_public_author(),
  public.omu_comment_validate(),
  public.omu_comment_after_change(),
  public.omu_delete_target_comments(),
  public.omu_handle_new_user(),
  public.omu_handle_user_updated()
  from public, anon, authenticated;

--   회원 전용 RPC
revoke execute on function
  public.omu_accept_answer(uuid),
  public.omu_is_owner(text, uuid),
  public.omu_admin_list_members(text, integer, integer),
  public.omu_admin_get_author(text, uuid)
  from public, anon;
grant execute on function
  public.omu_accept_answer(uuid),
  public.omu_is_owner(text, uuid),
  public.omu_admin_list_members(text, integer, integer),
  public.omu_admin_get_author(text, uuid)
  to authenticated;

--   누구나 호출 가능한 RPC·정책용 함수
grant execute on function
  public.omu_increment_view(text, uuid),
  public.omu_increment_score_download(uuid),
  public.omu_is_admin(),
  public.omu_is_staff(),
  public.omu_target_table(text)
  to anon, authenticated;

--   최초 관리자 이메일 목록은 내부 전용 (외부 API로 관리자 이메일이 노출되지 않게)
revoke execute on function public.omu_bootstrap_admin_emails() from public, anon, authenticated;


-- =====================================================================
-- 7) RLS (Row Level Security) 정책
--    Postgres 에는 CREATE POLICY IF NOT EXISTS 가 없으므로, 이 트랜잭션 안에서만 쓰는
--    임시 함수(pg_temp)로 "없을 때만 생성"한다. → DROP 없이 재실행 가능.
--    ※ 재실행 시 이미 있는 정책은 내용을 바꾸지 않는다(변경은 별도 마이그레이션으로).
-- =====================================================================

create or replace function pg_temp.omu_policy(p_schema text, p_table text, p_name text, p_sql text)
returns void
language plpgsql
as $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = p_schema and tablename = p_table and policyname = p_name
  ) then
    execute p_sql;
  end if;
end;
$$;

alter table public.profiles       enable row level security;
alter table public.scores         enable row level security;
alter table public.articles       enable row level security;
alter table public.market_items   enable row level security;
alter table public.recruits       enable row level security;
alter table public.posts          enable row level security;
alter table public.comments       enable row level security;
alter table public.score_requests enable row level security;
alter table public.reports        enable row level security;

-- 7-1. profiles ---------------------------------------------------------
select pg_temp.omu_policy('public', 'profiles', 'omu_profiles_select_all', $p$
  create policy omu_profiles_select_all on public.profiles
    for select to anon, authenticated
    using (true)
$p$);
-- 회원이 직접 만들 수 있는 건 '자기 자신 + user 역할' 뿐 (보통은 가입 트리거가 만든다)
select pg_temp.omu_policy('public', 'profiles', 'omu_profiles_insert_self', $p$
  create policy omu_profiles_insert_self on public.profiles
    for insert to authenticated
    with check (id = (select auth.uid()) and role = 'user')
$p$);
select pg_temp.omu_policy('public', 'profiles', 'omu_profiles_update_self_or_admin', $p$
  create policy omu_profiles_update_self_or_admin on public.profiles
    for update to authenticated
    using (id = (select auth.uid()) or (select public.omu_is_admin()))
    with check (id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);
-- (profiles 삭제 정책 없음 = 삭제 불가. 탈퇴는 auth 사용자 삭제 → cascade)

-- 7-2. scores (악보) — 쓰기는 에디터·관리자만 ------------------------------
select pg_temp.omu_policy('public', 'scores', 'omu_scores_select_all', $p$
  create policy omu_scores_select_all on public.scores
    for select to anon, authenticated
    using (true)
$p$);
select pg_temp.omu_policy('public', 'scores', 'omu_scores_insert_staff', $p$
  create policy omu_scores_insert_staff on public.scores
    for insert to authenticated
    with check (
      (select public.omu_is_staff())
      and (author_id = (select auth.uid()) or (select public.omu_is_admin()))
    )
$p$);
select pg_temp.omu_policy('public', 'scores', 'omu_scores_update_staff_own_or_admin', $p$
  create policy omu_scores_update_staff_own_or_admin on public.scores
    for update to authenticated
    using ((select public.omu_is_admin()) or ((select public.omu_is_staff()) and author_id = (select auth.uid())))
    with check ((select public.omu_is_admin()) or ((select public.omu_is_staff()) and author_id = (select auth.uid())))
$p$);
select pg_temp.omu_policy('public', 'scores', 'omu_scores_delete_staff_own_or_admin', $p$
  create policy omu_scores_delete_staff_own_or_admin on public.scores
    for delete to authenticated
    using ((select public.omu_is_admin()) or ((select public.omu_is_staff()) and author_id = (select auth.uid())))
$p$);

-- 7-3. articles (정보글) — 공개는 발행된 것만, 쓰기는 에디터·관리자만 ----------
select pg_temp.omu_policy('public', 'articles', 'omu_articles_select_published', $p$
  create policy omu_articles_select_published on public.articles
    for select to anon, authenticated
    using (
      is_published
      or author_id = (select auth.uid())
      or (select public.omu_is_admin())
    )
$p$);
select pg_temp.omu_policy('public', 'articles', 'omu_articles_insert_staff', $p$
  create policy omu_articles_insert_staff on public.articles
    for insert to authenticated
    with check (
      (select public.omu_is_staff())
      and (author_id = (select auth.uid()) or (select public.omu_is_admin()))
    )
$p$);
select pg_temp.omu_policy('public', 'articles', 'omu_articles_update_staff_own_or_admin', $p$
  create policy omu_articles_update_staff_own_or_admin on public.articles
    for update to authenticated
    using ((select public.omu_is_admin()) or ((select public.omu_is_staff()) and author_id = (select auth.uid())))
    with check ((select public.omu_is_admin()) or ((select public.omu_is_staff()) and author_id = (select auth.uid())))
$p$);
select pg_temp.omu_policy('public', 'articles', 'omu_articles_delete_staff_own_or_admin', $p$
  create policy omu_articles_delete_staff_own_or_admin on public.articles
    for delete to authenticated
    using ((select public.omu_is_admin()) or ((select public.omu_is_staff()) and author_id = (select auth.uid())))
$p$);

-- 7-4. market_items (중고) ----------------------------------------------
select pg_temp.omu_policy('public', 'market_items', 'omu_market_select_visible', $p$
  create policy omu_market_select_visible on public.market_items
    for select to anon, authenticated
    using (not is_hidden or seller_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);
select pg_temp.omu_policy('public', 'market_items', 'omu_market_insert_self', $p$
  create policy omu_market_insert_self on public.market_items
    for insert to authenticated
    with check (seller_id = (select auth.uid()))
$p$);
select pg_temp.omu_policy('public', 'market_items', 'omu_market_update_own_or_admin', $p$
  create policy omu_market_update_own_or_admin on public.market_items
    for update to authenticated
    using (seller_id = (select auth.uid()) or (select public.omu_is_admin()))
    with check (seller_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);
select pg_temp.omu_policy('public', 'market_items', 'omu_market_delete_own_or_admin', $p$
  create policy omu_market_delete_own_or_admin on public.market_items
    for delete to authenticated
    using (seller_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);

-- 7-5. recruits (구인) --------------------------------------------------
select pg_temp.omu_policy('public', 'recruits', 'omu_recruits_select_visible', $p$
  create policy omu_recruits_select_visible on public.recruits
    for select to anon, authenticated
    using (not is_hidden or author_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);
select pg_temp.omu_policy('public', 'recruits', 'omu_recruits_insert_self', $p$
  create policy omu_recruits_insert_self on public.recruits
    for insert to authenticated
    with check (author_id = (select auth.uid()))
$p$);
select pg_temp.omu_policy('public', 'recruits', 'omu_recruits_update_own_or_admin', $p$
  create policy omu_recruits_update_own_or_admin on public.recruits
    for update to authenticated
    using (author_id = (select auth.uid()) or (select public.omu_is_admin()))
    with check (author_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);
select pg_temp.omu_policy('public', 'recruits', 'omu_recruits_delete_own_or_admin', $p$
  create policy omu_recruits_delete_own_or_admin on public.recruits
    for delete to authenticated
    using (author_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);

-- 7-6. posts (커뮤니티) — 관리자는 다른 회원 명의로 마중물 글 작성 가능 ---------
select pg_temp.omu_policy('public', 'posts', 'omu_posts_select_visible', $p$
  create policy omu_posts_select_visible on public.posts
    for select to anon, authenticated
    using (not is_hidden or author_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);
select pg_temp.omu_policy('public', 'posts', 'omu_posts_insert_self_or_admin', $p$
  create policy omu_posts_insert_self_or_admin on public.posts
    for insert to authenticated
    with check (author_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);
select pg_temp.omu_policy('public', 'posts', 'omu_posts_update_own_or_admin', $p$
  create policy omu_posts_update_own_or_admin on public.posts
    for update to authenticated
    using (author_id = (select auth.uid()) or (select public.omu_is_admin()))
    with check (author_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);
select pg_temp.omu_policy('public', 'posts', 'omu_posts_delete_own_or_admin', $p$
  create policy omu_posts_delete_own_or_admin on public.posts
    for delete to authenticated
    using (author_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);

-- 7-7. comments ---------------------------------------------------------
select pg_temp.omu_policy('public', 'comments', 'omu_comments_select_visible', $p$
  create policy omu_comments_select_visible on public.comments
    for select to anon, authenticated
    using (not is_hidden or author_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);
select pg_temp.omu_policy('public', 'comments', 'omu_comments_insert_self', $p$
  create policy omu_comments_insert_self on public.comments
    for insert to authenticated
    with check (author_id = (select auth.uid()))
$p$);
select pg_temp.omu_policy('public', 'comments', 'omu_comments_update_own_or_admin', $p$
  create policy omu_comments_update_own_or_admin on public.comments
    for update to authenticated
    using (author_id = (select auth.uid()) or (select public.omu_is_admin()))
    with check (author_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);
select pg_temp.omu_policy('public', 'comments', 'omu_comments_delete_own_or_admin', $p$
  create policy omu_comments_delete_own_or_admin on public.comments
    for delete to authenticated
    using (author_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);

-- 7-8. score_requests (악보 요청) -----------------------------------------
select pg_temp.omu_policy('public', 'score_requests', 'omu_score_requests_select_all', $p$
  create policy omu_score_requests_select_all on public.score_requests
    for select to anon, authenticated
    using (true)
$p$);
select pg_temp.omu_policy('public', 'score_requests', 'omu_score_requests_insert_self', $p$
  create policy omu_score_requests_insert_self on public.score_requests
    for insert to authenticated
    with check (author_id = (select auth.uid()))
$p$);
-- 요청자 본인 또는 에디터·관리자(악보 등록 후 '완료' 처리)
select pg_temp.omu_policy('public', 'score_requests', 'omu_score_requests_update_own_or_staff', $p$
  create policy omu_score_requests_update_own_or_staff on public.score_requests
    for update to authenticated
    using (author_id = (select auth.uid()) or (select public.omu_is_staff()))
    with check (author_id = (select auth.uid()) or (select public.omu_is_staff()))
$p$);
select pg_temp.omu_policy('public', 'score_requests', 'omu_score_requests_delete_own_or_admin', $p$
  create policy omu_score_requests_delete_own_or_admin on public.score_requests
    for delete to authenticated
    using (author_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);

-- 7-9. reports (신고) — 신고자는 본인 신고만 보고, 처리는 관리자만 --------------
select pg_temp.omu_policy('public', 'reports', 'omu_reports_select_own_or_admin', $p$
  create policy omu_reports_select_own_or_admin on public.reports
    for select to authenticated
    using (reporter_id = (select auth.uid()) or (select public.omu_is_admin()))
$p$);
select pg_temp.omu_policy('public', 'reports', 'omu_reports_insert_self', $p$
  create policy omu_reports_insert_self on public.reports
    for insert to authenticated
    with check (reporter_id = (select auth.uid()) and status = 'open')
$p$);
select pg_temp.omu_policy('public', 'reports', 'omu_reports_update_admin', $p$
  create policy omu_reports_update_admin on public.reports
    for update to authenticated
    using ((select public.omu_is_admin()))
    with check ((select public.omu_is_admin()))
$p$);
select pg_temp.omu_policy('public', 'reports', 'omu_reports_delete_admin', $p$
  create policy omu_reports_delete_admin on public.reports
    for delete to authenticated
    using ((select public.omu_is_admin()))
$p$);


-- =====================================================================
-- 8) Storage 버킷 + 업로드 정책
--    scores     : 악보 PDF (공개 다운로드, 업로드는 에디터·관리자)
--    thumbnails : 악보·정보글 썸네일 (공개, 업로드는 에디터·관리자)
--    market     : 중고 매물 사진 (공개, 회원은 '본인 uid/' 폴더에만 업로드)
--    ※ 이미 같은 id 의 버킷이 있으면 건드리지 않는다(설정도 바꾸지 않음).
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('scores',     'scores',     true, 20971520, array['application/pdf']),
  ('thumbnails', 'thumbnails', true,  5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('market',     'market',     true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- 에디터·관리자: scores / thumbnails 버킷 관리
select pg_temp.omu_policy('storage', 'objects', 'omu_storage_staff_select', $p$
  create policy omu_storage_staff_select on storage.objects
    for select to authenticated
    using (bucket_id in ('scores', 'thumbnails') and (select public.omu_is_staff()))
$p$);
select pg_temp.omu_policy('storage', 'objects', 'omu_storage_staff_insert', $p$
  create policy omu_storage_staff_insert on storage.objects
    for insert to authenticated
    with check (bucket_id in ('scores', 'thumbnails') and (select public.omu_is_staff()))
$p$);
select pg_temp.omu_policy('storage', 'objects', 'omu_storage_staff_update', $p$
  create policy omu_storage_staff_update on storage.objects
    for update to authenticated
    using (bucket_id in ('scores', 'thumbnails') and (select public.omu_is_staff()))
    with check (bucket_id in ('scores', 'thumbnails') and (select public.omu_is_staff()))
$p$);
select pg_temp.omu_policy('storage', 'objects', 'omu_storage_staff_delete', $p$
  create policy omu_storage_staff_delete on storage.objects
    for delete to authenticated
    using (bucket_id in ('scores', 'thumbnails') and (select public.omu_is_staff()))
$p$);

-- 회원: market 버킷의 '본인 uid' 폴더만 (예: market/<uid>/photo1.jpg)
select pg_temp.omu_policy('storage', 'objects', 'omu_storage_market_select_own', $p$
  create policy omu_storage_market_select_own on storage.objects
    for select to authenticated
    using (
      bucket_id = 'market'
      and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.omu_is_admin()))
    )
$p$);
select pg_temp.omu_policy('storage', 'objects', 'omu_storage_market_insert_own', $p$
  create policy omu_storage_market_insert_own on storage.objects
    for insert to authenticated
    with check (bucket_id = 'market' and (storage.foldername(name))[1] = (select auth.uid())::text)
$p$);
select pg_temp.omu_policy('storage', 'objects', 'omu_storage_market_delete_own', $p$
  create policy omu_storage_market_delete_own on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'market'
      and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.omu_is_admin()))
    )
$p$);


-- =====================================================================
-- 9) 기존 가입자 보정 + 최초 관리자 지정
--    이 스키마보다 먼저 가입한 계정이 있으면 프로필을 만들어 준다(이미 있으면 건너뜀).
-- =====================================================================
insert into public.profiles (id, email, nickname, role)
select
  u.id,
  u.email,
  left(coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'nickname'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    '회원' || substr(u.id::text, 1, 6)
  ), 30),
  case
    when u.email_confirmed_at is not null
     and lower(u.email) = any (public.omu_bootstrap_admin_emails())
    then 'admin' else 'user'
  end
from auth.users u
on conflict (id) do nothing;

-- 최초 관리자(todaymusic2407@gmail.com)가 이미 가입·인증돼 있다면 admin 으로 승격
update public.profiles p
   set role = 'admin'
  from auth.users u
 where u.id = p.id
   and u.email_confirmed_at is not null
   and lower(u.email) = any (public.omu_bootstrap_admin_emails())
   and p.role <> 'admin';

commit;

-- =====================================================================
-- 실행 후 확인용 쿼리 (선택, 한 줄씩 실행)
--   select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;
--   select tablename, policyname, cmd from pg_policies where policyname like 'omu\_%' order by 1, 2;
--   select id, nickname, role from public.profiles where role <> 'user';
-- =====================================================================
