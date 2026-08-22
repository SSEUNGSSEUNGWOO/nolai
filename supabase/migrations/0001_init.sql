-- 놀AI 초기 스키마
--
-- 설계 문서 8장의 데이터 모델을 옮긴 것이다.
-- docs/superpowers/specs/2026-08-21-nolai-design.md
--
-- 보안 모델: 브라우저는 이 DB에 직접 붙지 않는다. 모든 접근은 Next.js의
-- Route Handler를 거치고, 거기서 service_role 키로 접속하며 권한 판단은 서버
-- 코드가 한다. 그래서 아래 테이블들은 RLS를 켜되 정책을 하나도 두지 않는다 --
-- anon 키로는 아무것도 읽거나 쓸 수 없다는 뜻이다(service_role은 RLS를 우회).
--
-- 설계 문서 8장은 "세션 쿠키의 kid_id를 기준으로 RLS"라고 적었지만, Supabase
-- RLS는 Supabase Auth가 발급한 JWT의 auth.uid()를 본다. 우리가 직접 만든 쿠키는
-- DB가 알 수 없다. 커스텀 JWT를 서명해 물릴 수도 있으나 만료·회전 관리가 늘고,
-- 브라우저가 DB에 붙지 않는 이상 얻는 것이 없다.

create table public.kids (
  id         uuid primary key default gen_random_uuid(),
  -- 중복을 허용한다. 로그인은 닉네임과 코드의 조합으로 이루어진다.
  nickname   text not null,
  -- scrypt 해시. 원문 코드는 어디에도 저장하지 않는다.
  code_hash  text not null,
  created_at timestamptz not null default now()
);

-- 로그인은 닉네임으로 후보를 좁힌 뒤 코드를 검증한다.
create index kids_nickname_idx on public.kids (nickname);

create table public.progress (
  kid_id       uuid not null references public.kids(id) on delete cascade,
  lesson_id    text not null,
  -- 설계 문서는 not_started도 적었지만 저장하지 않는다. 행이 없는 것이
  -- 곧 not_started이고, 레슨이 늘 때마다 빈 행을 채우는 것은 낭비다.
  status       text not null check (status in ('in_progress', 'done')),
  completed_at timestamptz,
  primary key (kid_id, lesson_id)
);

create table public.artifacts (
  id         uuid primary key default gen_random_uuid(),
  kid_id     uuid not null references public.kids(id) on delete cascade,
  lesson_id  text not null,
  -- 놀이터가 만든 결과물. 아이의 자유 입력이 아니라 놀이터가 조립한 id 목록이다
  -- (예: {"datasetId":"...","placedIds":[...]}). 이 서비스에는 자유 텍스트
  -- 입력이 없으므로 여기에 개인정보가 들어올 경로가 구조적으로 없다.
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

create index artifacts_kid_idx on public.artifacts (kid_id, created_at desc);

create table public.badges (
  kid_id    uuid not null references public.kids(id) on delete cascade,
  badge_id  text not null,
  earned_at timestamptz not null default now(),
  primary key (kid_id, badge_id)
);

-- 정책을 두지 않은 채로 켠다: anon/authenticated 역할은 아무것도 못 한다.
alter table public.kids      enable row level security;
alter table public.progress  enable row level security;
alter table public.artifacts enable row level security;
alter table public.badges    enable row level security;
