-- 오늘의 단어 (설계 문서 17장)
--
-- daily_words: 날짜별 정답과 정답의 이웃 1000개(가까운 순). tools/embed/build_daily.py가
-- 365일치를 미리 채운다. 이웃을 미리 두는 이유: 온도·순위 힌트가 "정답 기준 몇 위"라
-- 요청마다 1000개 최근접을 돌리면 낭비다. 정답 id는 그날이 끝나기 전엔 어떤 응답에도
-- 담기지 않는다 -- 서버 코드가 지킨다.
--
-- guesses: 로그인한 아이의 시도. 비회원은 기기에만 남긴다. 같은 단어를 다시 넣어도
-- 행이 늘지 않는다(pk). hinted가 참인 행은 힌트로 받은 단어다.
--
-- 2026-09-10에 운영 DB에 적용했고 이 파일은 그 기록이다. test 스키마를 건드리므로
-- 0003 머리말의 PostgREST reload 두 줄을 같이 보낸다.

create table public.daily_words (
  date      date primary key,
  word_id   integer not null references public.words(id),
  neighbors integer[] not null
);

create table public.guesses (
  kid_id     uuid not null references public.kids(id) on delete cascade,
  date       date not null,
  word_id    integer not null references public.words(id),
  similarity real not null,
  rank       integer,
  hinted     boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (kid_id, date, word_id)
);

create index guesses_date_idx on public.guesses (date);

alter table public.daily_words enable row level security;
alter table public.guesses     enable row level security;

/** 그날 맞힌 아이들. 시도 수 오름차순. 동점 공동 순위는 서버 코드가 매긴다. */
create or replace function public.daily_board(p_date date)
returns table (kid_id uuid, nickname text, tries integer, hinted boolean)
language sql
stable
set search_path = public
as $$
  select g.kid_id, k.nickname, count(*)::integer as tries, bool_or(g.hinted) as hinted
  from public.guesses g
  join public.daily_words d on d.date = g.date
  join public.kids k on k.id = g.kid_id
  where g.date = p_date
  group by g.kid_id, k.nickname
  having bool_or(g.word_id = d.word_id)
  order by tries asc, min(g.created_at) asc
  limit 1000;
$$;

/** 그날 아이들이 가장 많이 넣은 단어. 정답은 뺀다. 어제 판 공개용. */
create or replace function public.daily_popular(p_date date, p_count integer)
returns table (word_id integer, word text, guessers integer)
language sql
stable
set search_path = public
as $$
  select g.word_id, w.word, count(distinct g.kid_id)::integer as guessers
  from public.guesses g
  join public.daily_words d on d.date = g.date
  join public.words w on w.id = g.word_id
  where g.date = p_date and g.word_id <> d.word_id
  group by g.word_id, w.word
  order by guessers desc, w.word asc
  limit p_count;
$$;

/** 한 아이의 날짜별 시도 수와 맞혔는지. 내 방의 연속 참여·최소 시도용. 최근 400일. */
create or replace function public.daily_history(p_kid uuid)
returns table (date date, tries integer, solved boolean)
language sql
stable
set search_path = public
as $$
  select g.date, count(*)::integer as tries, bool_or(g.word_id = d.word_id) as solved
  from public.guesses g
  join public.daily_words d on d.date = g.date
  where g.kid_id = p_kid
  group by g.date
  order by g.date desc
  limit 400;
$$;

revoke execute on function public.daily_board(date) from public, anon, authenticated;
revoke execute on function public.daily_popular(date, integer) from public, anon, authenticated;
revoke execute on function public.daily_history(uuid) from public, anon, authenticated;

-- test 스키마. 구조는 public과 같아야 한다(0003 머리말).

create table test.daily_words (
  date      date primary key,
  word_id   integer not null references test.words(id),
  neighbors integer[] not null
);

create table test.guesses (
  kid_id     uuid not null references test.kids(id) on delete cascade,
  date       date not null,
  word_id    integer not null references test.words(id),
  similarity real not null,
  rank       integer,
  hinted     boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (kid_id, date, word_id)
);

create index guesses_date_idx on test.guesses (date);

alter table test.daily_words enable row level security;
alter table test.guesses     enable row level security;

create or replace function test.daily_board(p_date date)
returns table (kid_id uuid, nickname text, tries integer, hinted boolean)
language sql
stable
set search_path = test
as $$
  select g.kid_id, k.nickname, count(*)::integer as tries, bool_or(g.hinted) as hinted
  from test.guesses g
  join test.daily_words d on d.date = g.date
  join test.kids k on k.id = g.kid_id
  where g.date = p_date
  group by g.kid_id, k.nickname
  having bool_or(g.word_id = d.word_id)
  order by tries asc, min(g.created_at) asc
  limit 1000;
$$;

create or replace function test.daily_popular(p_date date, p_count integer)
returns table (word_id integer, word text, guessers integer)
language sql
stable
set search_path = test
as $$
  select g.word_id, w.word, count(distinct g.kid_id)::integer as guessers
  from test.guesses g
  join test.daily_words d on d.date = g.date
  join test.words w on w.id = g.word_id
  where g.date = p_date and g.word_id <> d.word_id
  group by g.word_id, w.word
  order by guessers desc, w.word asc
  limit p_count;
$$;

create or replace function test.daily_history(p_kid uuid)
returns table (date date, tries integer, solved boolean)
language sql
stable
set search_path = test
as $$
  select g.date, count(*)::integer as tries, bool_or(g.word_id = d.word_id) as solved
  from test.guesses g
  join test.daily_words d on d.date = g.date
  where g.kid_id = p_kid
  group by g.date
  order by g.date desc
  limit 400;
$$;

grant all privileges on table test.daily_words, test.guesses to service_role;
grant execute on function test.daily_board(date) to service_role;
grant execute on function test.daily_popular(date, integer) to service_role;
grant execute on function test.daily_history(uuid) to service_role;
revoke execute on function test.daily_board(date) from public, anon, authenticated;
revoke execute on function test.daily_popular(date, integer) from public, anon, authenticated;
revoke execute on function test.daily_history(uuid) from public, anon, authenticated;
