-- 로그인·가입 시도 제한
--
-- 설계 문서 11장의 "IP당 분당 5회"를 구현한다. 문서에 없는 닉네임당 제한도
-- 함께 둔다 -- IP만 세면 IP를 바꿔가며 같은 닉네임을 때리는 공격에 무력하다.
--
-- 메모리 카운터를 쓰지 않는 이유: Vercel의 서버리스 인스턴스는 요청마다 다를
-- 수 있어 카운터가 인스턴스별로 따로 논다. 제한이 있는 척만 하게 된다.

create table public.auth_attempts (
  -- 'ip:1.2.3.4' 또는 'nick:번개토끼'
  bucket       text primary key,
  window_start timestamptz not null default now(),
  attempts     integer not null default 0
);

alter table public.auth_attempts enable row level security;

-- 오래된 행은 쌓이기만 한다. 행 하나가 수십 바이트고 서로 다른 IP·닉네임의
-- 수만큼만 늘어나므로 지금 규모에서는 문제가 없다. 커지면 pg_cron으로
-- window_start가 하루 지난 행을 지우면 된다.
create index auth_attempts_window_idx on public.auth_attempts (window_start);

/**
 * 시도를 하나 소비하고 아직 허용 범위인지 알려준다.
 *
 * 창(window)이 지났으면 카운터를 1로 되돌린다. upsert 한 문장이라 두 요청이
 * 동시에 들어와도 카운트가 새지 않는다 -- 읽고 나서 쓰는 방식이면 동시 요청이
 * 같은 값을 읽어 제한을 통과해버린다.
 *
 * SECURITY DEFINER를 쓰지 않는다. 호출자는 service_role뿐이고 그쪽은 RLS를
 * 우회하므로 필요가 없다. 굳이 붙이면 PostgREST를 통해 anon에게도 노출된다.
 */
create or replace function public.consume_attempt(
  p_bucket         text,
  p_limit          integer,
  p_window_seconds integer
) returns boolean
language plpgsql
as $$
declare
  v_attempts integer;
begin
  insert into public.auth_attempts as a (bucket, window_start, attempts)
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

-- 이 함수는 서버 코드만 부른다. PostgREST로 아무나 부르게 두면 남의 계정을
-- 잠글 수 있다(닉네임 버킷을 한도까지 소진시켜서).
revoke execute on function public.consume_attempt(text, integer, integer)
  from public, anon, authenticated;
