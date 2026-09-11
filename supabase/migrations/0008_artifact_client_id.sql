-- 작품 재전송 중복 방지 (0005~0007과 같은 날 다른 세션에서 만들어 번호를 뒤로 미룸)
--
-- 레슨 완료 시 /api/progress가 실패하면 브라우저가 작품을 대기열에 두었다가
-- 다시 보낸다(설계 문서 14장 2026-09-11). 같은 작품이 두 번 도착할 수 있으므로
-- 브라우저가 붙인 id를 함께 받아 (kid_id, client_id)로 한 번만 저장한다.
-- 옛 행과 id 없이 온 요청은 null이라 유니크 제약에 걸리지 않는다.
-- 2026-09-11에 MCP로 운영 DB에 적용했고 이 파일은 그 기록이다.

alter table public.artifacts add column client_id uuid;
create unique index artifacts_client_uidx on public.artifacts (kid_id, client_id);

alter table test.artifacts add column client_id uuid;
create unique index artifacts_client_uidx on test.artifacts (kid_id, client_id);

notify pgrst, 'reload schema';
