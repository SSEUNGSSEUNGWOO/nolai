-- 두 단어의 유사도 (설계 문서 17장, 실험실 "두 단어 비교")
--
-- nearest_words()는 한 단어의 이웃만 준다. 임의의 두 단어를 재려면 벡터 둘을
-- 직접 비교해야 한다. similarity = 1 - 코사인 거리. 둘 중 하나라도 없으면 null.
--
-- 2026-09-10에 운영 DB에 적용했고 이 파일은 그 기록이다. test 스키마를
-- 건드리므로 0003 머리말의 PostgREST reload 두 줄을 같이 보낸다.

create or replace function public.word_similarity(p_a integer, p_b integer)
returns real
language sql
stable
set search_path = public, extensions
as $$
  select (1 - (a.embedding <=> b.embedding))::real
  from public.words a
  join public.words b on b.id = p_b
  where a.id = p_a;
$$;

revoke execute on function public.word_similarity(integer, integer)
  from public, anon, authenticated;

create or replace function test.word_similarity(p_a integer, p_b integer)
returns real
language sql
stable
set search_path = test, extensions
as $$
  select (1 - (a.embedding <=> b.embedding))::real
  from test.words a
  join test.words b on b.id = p_b
  where a.id = p_a;
$$;

grant execute on function test.word_similarity(integer, integer) to service_role;
revoke execute on function test.word_similarity(integer, integer)
  from public, anon, authenticated;
