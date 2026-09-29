-- =====================================================================
--  OMU 마이그레이션 2026-09-29 — 글쓰기 확장 컬럼
-- =====================================================================
--  schema.sql 을 이미 실행한 프로젝트에 **덧붙여** 실행한다(SQL Editor 에 통째로 붙여넣고 Run).
--  · DROP 없음 · 기존 데이터 변경 없음 · 여러 번 실행해도 안전(IF NOT EXISTS)
--  · 전체가 하나의 트랜잭션 — 실패하면 아무것도 반영되지 않는다
--
--  추가하는 것
--    posts.tags             커뮤니티 글 태그 (최대 5개)
--    recruits.positions     모집 역할 (최대 5개)
--    recruits.deadline      모집 마감일
--    market_items.item_condition  물건 상태 (new / like_new / good / fair)
--
--  ⚠️ posts 는 schema.sql 에서 컬럼 단위로 읽기 권한을 준다(익명 작성자 보호).
--     새 컬럼 tags 도 읽기 권한을 따로 줘야 목록에서 보인다 — 아래 GRANT 가 그 일을 한다.
-- =====================================================================

begin;

alter table public.posts
  add column if not exists tags text[] not null default '{}';
alter table public.recruits
  add column if not exists positions text[] not null default '{}',
  add column if not exists deadline date;
alter table public.market_items
  add column if not exists item_condition text;

-- CHECK 제약 (이미 있으면 건너뛴다)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_tags_limit') then
    alter table public.posts add constraint posts_tags_limit check (cardinality(tags) <= 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'recruits_positions_limit') then
    alter table public.recruits add constraint recruits_positions_limit check (cardinality(positions) <= 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'market_items_condition_check') then
    alter table public.market_items add constraint market_items_condition_check
      check (item_condition is null or item_condition in ('new', 'like_new', 'good', 'fair'));
  end if;
end
$$;

-- posts 새 컬럼 읽기 권한 (비회원·회원 모두 목록에서 태그를 볼 수 있게)
grant select (tags) on public.posts to anon, authenticated;

commit;

-- 확인용
--   select column_name from information_schema.columns
--   where table_schema = 'public' and table_name in ('posts', 'recruits', 'market_items')
--     and column_name in ('tags', 'positions', 'deadline', 'item_condition');
