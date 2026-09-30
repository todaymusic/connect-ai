-- =====================================================================
--  OMU 마이그레이션 2026-10-01 — 회원 정보글(음악정보) 작성·발행
-- =====================================================================
--  schema.sql → 20260929_write_fields.sql → 20260930_guest_community.sql 을 실행한 프로젝트에
--  **덧붙여** 실행한다. ⚠️ 20260930 을 나중에 다시 실행하면 omu_guard_row 가 예전 판으로 돌아가므로
--  그 경우 이 파일도 다시 실행한다(setup-all.sql 은 순서대로 들어 있어 괜찮다).
--  · DROP 없음 · 기존 데이터 변경 없음 · 여러 번 실행해도 안전 · 전체가 하나의 트랜잭션
--
--  정책
--    · 로그인한 회원 누구나 모든 분류의 정보글을 쓸 수 있다(비회원 불가).
--    · 배지(author_display)는 입력값이 아니라 **작성자 역할**로 DB 가 정한다.
--        작성자 role 이 editor·admin → 'editor'(OMU 에디터 배지), 그 외 → 'member'(닉네임 표기)
--    · 검수 없음: '발행'(is_published=true)이면 바로 공개, '임시저장'이면 초안(작성자·관리자만 봄).
--    · 초안 → 발행은 가능, **발행 → 초안 되돌리기는 누구도 불가**(관리자 포함, 보관 기능 없음).
--    · 수정·삭제: 작성자 본인 또는 관리자.
--    · 도배 제한: 일반 회원은 정보글 새로 쓰기 1시간 10건(작성자 기준으로 최근 글 수를 센다). 에디터·관리자는 제한 없음.
--
--  바꾸는 것
--    omu_guard_row          : 정보글의 is_published·published_at·author_display 는 아래 전용 트리거에 맡긴다
--    omu_article_rules()    : [새 트리거 omu_20_article_rules] 작성자·배지·발행 시각·되돌리기 차단·도배 제한
--    정책(ALTER POLICY)     : articles insert(로그인 회원 본인) · update/delete(본인 또는 관리자). select 는 그대로
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) 보호 컬럼 가드 — 20260930 판과 같고, 정보글의 발행 관련 컬럼만 omu_article_rules 가 처리하도록 비켜 준다
--    (가드가 먼저 실행되며 회원의 is_published 를 false 로 되돌려 버리면 회원이 발행할 수 없기 때문)
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
  -- 정보글: 이 컬럼들은 omu_20_article_rules 트리거가 작성자 역할·발행 규칙으로 정한다
  c_article_own constant text[] := array['is_published', 'published_at', 'author_display'];
  v_article    boolean := tg_table_name = 'articles';
begin
  if coalesce(current_setting('omu.bypass_guard', true), '') = 'on'
     or v_claim_role not in ('anon', 'authenticated')
     or public.omu_is_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    foreach v_col in array c_protected loop
      if v_row ? v_col and not (v_article and v_col = any (c_article_own)) then
        v_patch := v_patch || jsonb_build_object(v_col, v_old -> v_col);
      end if;
    end loop;
  else -- INSERT: 카운터·상태값은 기본값으로, 비회원·숨김·스냅샷 컬럼은 비운다
    foreach v_col in array array['view_count', 'comment_count', 'download_count'] loop
      if v_row ? v_col then v_patch := v_patch || jsonb_build_object(v_col, 0); end if;
    end loop;
    foreach v_col in array array['is_hidden', 'is_answered', 'is_accepted', 'is_published'] loop
      if v_row ? v_col and not (v_article and v_col = any (c_article_own)) then
        v_patch := v_patch || jsonb_build_object(v_col, false);
      end if;
    end loop;
    foreach v_col in array array['published_at', 'guest_name', 'guest_key', 'edited_at', 'deleted_at',
                                 'reporter_key', 'target_title', 'target_path'] loop
      if v_row ? v_col and not (v_article and v_col = any (c_article_own)) then
        v_patch := v_patch || jsonb_build_object(v_col, null);
      end if;
    end loop;
    if v_row ? 'role' then v_patch := v_patch || '{"role": "user"}'::jsonb; end if;
  end if;

  if v_row ? 'author_display' and not v_article and not public.omu_is_staff() then
    v_patch := v_patch || '{"author_display": "member"}'::jsonb;
  end if;

  if v_patch <> '{}'::jsonb then
    new := jsonb_populate_record(new, v_patch);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) [트리거] 정보글 규칙 — 가드(omu_10) 다음, 발행 시각(omu_40) 앞에서 실행
--    security definer + search_path 고정: 작성자 역할(profiles.role)과 최근 글 수(RLS 로 가려진 초안 포함)를 읽기 위해
-- ---------------------------------------------------------------------
create or replace function public.omu_article_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_api    boolean := coalesce((select auth.jwt()) ->> 'role', '') in ('anon', 'authenticated');
  v_bypass boolean := coalesce(current_setting('omu.bypass_guard', true), '') = 'on';
  v_uid    uuid := (select auth.uid());
  v_admin  boolean := public.omu_is_admin();
  v_role   text;
  v_recent integer;
begin
  -- 발행 → 초안 되돌리기 금지 (관리자·service_role 포함. 내리려면 삭제)
  if tg_op = 'UPDATE' and old.is_published and not new.is_published and not v_bypass then
    raise exception 'OMU:공개된 정보글은 초안으로 되돌릴 수 없어요. 내리려면 삭제해 주세요.';
  end if;

  if v_api and not v_bypass and not v_admin then
    if tg_op = 'INSERT' then
      if v_uid is null then
        raise exception 'OMU:로그인한 회원만 정보글을 쓸 수 있어요.';
      end if;
      -- 작성자·카운터·발행 시각은 입력값을 믿지 않는다
      new.author_id     := v_uid;
      new.view_count    := 0;
      new.comment_count := 0;
      new.published_at  := case when new.is_published then now() else null end;
      -- 일반 회원 도배 제한: 새 글 1시간 10건 (에디터·관리자는 제한 없음)
      -- omu_throttle 은 omu_guest_events.kind 체크 제약(post·comment·edit·report)에 'article' 이 없어
      -- 제약을 바꾸려면 DROP 이 필요하므로, 작성자 기준으로 최근 1시간 글 수를 센다(author_id 인덱스 사용).
      if not public.omu_is_staff() then
        select count(*) into v_recent from public.articles
         where author_id = v_uid and created_at > now() - interval '1 hour';
        if v_recent >= 10 then
          raise exception 'OMU:한 시간에 쓸 수 있는 정보글 수(10개)를 넘었어요. 잠시 뒤에 다시 시도해 주세요.';
        end if;
      end if;
    else
      new.author_id     := old.author_id;
      new.view_count    := old.view_count;
      new.comment_count := old.comment_count;
      new.published_at  := case
        when not new.is_published then null
        when old.is_published then old.published_at   -- 공개 글 수정: 처음 발행 시각 유지
        else now()                                     -- 초안 → 발행
      end;
    end if;
  else
    -- 관리자·내부 처리: 발행 시각만 규칙대로 채운다(관리자는 직접 지정한 값이 있으면 존중)
    if not new.is_published then
      new.published_at := null;
    elsif new.published_at is null or (tg_op = 'UPDATE' and not old.is_published and new.published_at is not distinct from old.published_at) then
      new.published_at := now();
    end if;
  end if;

  -- 배지: 작성자 역할로 강제 (에디터·관리자 → 'editor', 그 외 → 'member')
  if new.author_id is not null then
    select p.role into v_role from public.profiles p where p.id = new.author_id;
    new.author_display := case when v_role in ('editor', 'admin') then 'editor' else 'member' end;
  elsif v_api and not v_bypass then
    new.author_display := 'member';
  end if;

  return new;
end;
$$;

create or replace trigger omu_20_article_rules
  before insert or update on public.articles
  for each row execute function public.omu_article_rules();

revoke execute on function public.omu_article_rules() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) 정책 — 이름은 그대로 두고 조건만 바꾼다(ALTER POLICY, DROP 없음)
--    select(omu_articles_select_published: 발행 글 + 본인 초안 + 관리자)는 그대로
-- ---------------------------------------------------------------------
alter policy omu_articles_insert_staff on public.articles
  with check (
    (select auth.uid()) is not null
    and (author_id = (select auth.uid()) or (select public.omu_is_admin()))
  );
alter policy omu_articles_update_staff_own_or_admin on public.articles
  using ((select public.omu_is_admin()) or author_id = (select auth.uid()))
  with check ((select public.omu_is_admin()) or author_id = (select auth.uid()));
alter policy omu_articles_delete_staff_own_or_admin on public.articles
  using ((select public.omu_is_admin()) or author_id = (select auth.uid()));

comment on policy omu_articles_insert_staff on public.articles is '로그인 회원 누구나 본인 이름으로 작성 (관리자는 다른 작성자 지정 가능). 2026-10-01 부터 에디터 제한 없음';
comment on policy omu_articles_update_staff_own_or_admin on public.articles is '본인 글 또는 관리자. 2026-10-01 부터 에디터 제한 없음';
comment on policy omu_articles_delete_staff_own_or_admin on public.articles is '본인 글 또는 관리자. 2026-10-01 부터 에디터 제한 없음';

commit;

-- =====================================================================
-- 실행 후 확인용 쿼리 (선택)
--   select tgname from pg_trigger where tgrelid = 'public.articles'::regclass and not tgisinternal order by 1;
--     → omu_10_guard, omu_20_article_rules, omu_40_published_at, omu_90_updated_at, omu_cleanup_comments
--   select policyname, cmd, qual, with_check from pg_policies where tablename = 'articles';
-- =====================================================================
