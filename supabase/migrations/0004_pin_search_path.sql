-- consume_attempt의 search_path를 고정한다.
--
-- 함수 안에서 public.auth_attempts / test.auth_attempts로 스키마를 명시하고 있어
-- 악용 경로는 없었지만, 호출자의 search_path에 따라 동작이 달라질 여지를 아예
-- 닫는다. Supabase 보안 진단(function_search_path_mutable)의 유일한 우리 쪽
-- 경고였다. 2026-08-23에 MCP로 운영 DB에 적용했고 이 파일은 그 기록이다.

alter function public.consume_attempt(text, integer, integer) set search_path = public;
alter function test.consume_attempt(text, integer, integer) set search_path = test;
