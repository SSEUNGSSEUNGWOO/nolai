-- E2E 전용 스키마
--
-- E2E는 실제 계정을 만들고 지운다. 그 코드가 public을 보고 있으면 언젠가
-- 진짜 아이의 데이터를 지운다. 스키마를 갈라 서로 닿지 못하게 한다.
--
-- 별도 프로젝트를 쓰면 더 깨끗하지만 월 $10이 계속 나간다. 지금 막으려는 것은
-- "테스트가 운영 데이터를 지우는 것" 하나뿐이고, 그건 스키마 분리로 달성된다.
-- 마이그레이션을 위험하게 실험하거나 부하 테스트를 돌릴 때 다시 판단한다.
--
-- 구조는 public과 같아야 한다. 다르면 테스트가 통과해도 운영에서 깨진다.
--
-- 적용 후 PostgREST에 아래 두 가지를 반드시 알려야 한다. 첫 번째만 보내면
-- 스키마 캐시가 옛것이라 test 테이블을 못 찾는다.
--   alter role authenticator set pgrst.db_schemas = 'public, graphql_public, test';
--   notify pgrst, 'reload config';
--   notify pgrst, 'reload schema';

create schema if not exists test;

create table test.kids (
  id         uuid primary key default gen_random_uuid(),
  nickname   text not null,
  code_hash  text not null,
  created_at timestamptz not null default now()
);

create index kids_nickname_idx on test.kids (nickname);

create table test.progress (
  kid_id       uuid not null references test.kids(id) on delete cascade,
  lesson_id    text not null,
  status       text not null check (status in ('in_progress', 'done')),
  completed_at timestamptz,
  primary key (kid_id, lesson_id)
);

create table test.artifacts (
  id         uuid primary key default gen_random_uuid(),
  kid_id     uuid not null references test.kids(id) on delete cascade,
  lesson_id  text not null,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

create index artifacts_kid_idx on test.artifacts (kid_id, created_at desc);

create table test.badges (
  kid_id    uuid not null references test.kids(id) on delete cascade,
  badge_id  text not null,
  earned_at timestamptz not null default now(),
  primary key (kid_id, badge_id)
);

create table test.auth_attempts (
  bucket       text primary key,
  window_start timestamptz not null default now(),
  attempts     integer not null default 0
);

create index auth_attempts_window_idx on test.auth_attempts (window_start);

alter table test.kids          enable row level security;
alter table test.progress      enable row level security;
alter table test.artifacts     enable row level security;
alter table test.badges        enable row level security;
alter table test.auth_attempts enable row level security;

create or replace function test.consume_attempt(
  p_bucket         text,
  p_limit          integer,
  p_window_seconds integer
) returns boolean
language plpgsql
as $$
declare
  v_attempts integer;
begin
  insert into test.auth_attempts as a (bucket, window_start, attempts)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update
    set attempts = case
          when a.window_start < now() - make_interval(secs => p_window_seconds)
            then 1
            else a.attempts + 1
          end,
        window_start = case
          when a.window_start < now() - make_interval(secs => p_window_seconds)
            then now()
            else a.window_start
          end
  returning a.attempts into v_attempts;

  return v_attempts <= p_limit;
end;
$$;

-- 서버 코드(service_role)만 이 스키마에 닿는다. anon에게는 USAGE도 주지 않아
-- 브라우저에서는 스키마 이름조차 쓸 수 없다.
grant usage on schema test to service_role;
grant all privileges on all tables in schema test to service_role;
grant execute on function test.consume_attempt(text, integer, integer) to service_role;
revoke execute on function test.consume_attempt(text, integer, integer)
  from public, anon, authenticated;

alter default privileges in schema test grant all on tables to service_role;
