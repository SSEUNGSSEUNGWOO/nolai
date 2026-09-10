-- 단어 실험실 사전 (설계 문서 17장)
--
-- 5천 개 남짓한 단어의 원본 임베딩(KURE-v1, 1024차원)을 담는다. 서버는 이 벡터로
-- 코사인 유사도만 계산하고, 벡터 자체는 어떤 응답에도 내려보내지 않는다.
-- 테이블은 tools/embed/build_dictionary.py --upload 가 채운다. 손으로 고치지 않는다.
--
-- 인덱스를 두지 않는다. 5천 행 전수 비교는 수 ms다.
-- ponytail: 5만 행을 넘으면 hnsw (embedding vector_cosine_ops) 를 단다.
--
-- 2026-09-10에 MCP로 운영 DB에 적용했고 이 파일은 그 기록이다. test 스키마를
-- 건드리므로 0003 머리말의 PostgREST reload 두 줄을 같이 보낸다.

create extension if not exists vector with schema extensions;

create table public.words (
  id        integer primary key,
  word      text not null unique,
  grade     smallint not null,
  model     text not null,
  embedding extensions.vector(1024) not null
);

alter table public.words enable row level security;

/**
 * p_word_id와 가까운 단어를 유사도 내림차순으로 p_count개 돌려준다. 자기 자신은 뺀다.
 * similarity = 1 - 코사인 거리. 0~1 사이 실수.
 */
create or replace function public.nearest_words(p_word_id integer, p_count integer)
returns table (id integer, word text, similarity real)
language sql
stable
set search_path = public, extensions
as $$
  select w.id, w.word, (1 - (w.embedding <=> t.embedding))::real as similarity
  from public.words t
  join public.words w on w.id <> t.id
  where t.id = p_word_id
  order by w.embedding <=> t.embedding
  limit p_count;
$$;

revoke execute on function public.nearest_words(integer, integer)
  from public, anon, authenticated;

-- test 스키마. 구조는 public과 같아야 한다(0003 머리말).

create table test.words (
  id        integer primary key,
  word      text not null unique,
  grade     smallint not null,
  model     text not null,
  embedding extensions.vector(1024) not null
);

alter table test.words enable row level security;

create or replace function test.nearest_words(p_word_id integer, p_count integer)
returns table (id integer, word text, similarity real)
language sql
stable
set search_path = test, extensions
as $$
  select w.id, w.word, (1 - (w.embedding <=> t.embedding))::real as similarity
  from test.words t
  join test.words w on w.id <> t.id
  where t.id = p_word_id
  order by w.embedding <=> t.embedding
  limit p_count;
$$;

grant all privileges on table test.words to service_role;
grant execute on function test.nearest_words(integer, integer) to service_role;
revoke execute on function test.nearest_words(integer, integer)
  from public, anon, authenticated;
