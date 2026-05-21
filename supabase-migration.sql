-- ============================================================
-- 보드게임 크루 - Supabase DB 마이그레이션 스크립트
-- Supabase SQL Editor에서 전체 선택 후 실행하세요
-- ============================================================

-- 1. members 테이블 (4명 고정 멤버)
CREATE TABLE IF NOT EXISTS public.members (
  id        TEXT PRIMARY KEY,          -- 'm1', 'm2', 'm3', 'm4'
  name      TEXT NOT NULL,
  color     TEXT NOT NULL,             -- 'red', 'blue', 'green', 'yellow'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. board_games 테이블 (보드게임 라이브러리)
CREATE TABLE IF NOT EXISTS public.board_games (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name             TEXT NOT NULL,
  genre            TEXT NOT NULL,
  min_players      INT NOT NULL,
  max_players      INT NOT NULL,
  play_time_minutes INT NOT NULL,
  owner_id         TEXT NOT NULL REFERENCES public.members(id),
  result_type      TEXT NOT NULL DEFAULT 'unknown',  -- 'ranked' | 'winner_only' | 'no_result' | 'unknown'
  image_url        TEXT,
  description      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. gathering_records 테이블 (모임 기록)
CREATE TABLE IF NOT EXISTS public.gathering_records (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date       DATE NOT NULL,
  emoji      TEXT DEFAULT '🎲',
  memo       TEXT DEFAULT '',
  photo_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. play_logs 테이블 (모임 내 개별 게임 기록)
CREATE TABLE IF NOT EXISTS public.play_logs (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gathering_record_id  TEXT NOT NULL REFERENCES public.gathering_records(id) ON DELETE CASCADE,
  game_id              TEXT NOT NULL REFERENCES public.board_games(id),
  result_type          TEXT NOT NULL DEFAULT 'no_result',
  duration_minutes     INT NOT NULL DEFAULT 0,
  participating_members TEXT[],        -- 참여 멤버 ID 배열 ['m1','m2',...]
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 5. player_results 테이블 (플레이어별 게임 결과)
CREATE TABLE IF NOT EXISTS public.player_results (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  play_log_id TEXT NOT NULL REFERENCES public.play_logs(id) ON DELETE CASCADE,
  member_id   TEXT NOT NULL REFERENCES public.members(id),
  rank        INT,            -- ranked일 때
  score       INT,            -- ranked일 때 선택
  is_winner   BOOLEAN,        -- winner_only일 때
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS(Row Level Security) 설정
-- 현재 4명 고정 팀이라 인증된 사용자면 모두 읽기/쓰기 허용
-- ============================================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gathering_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_results ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자 전체 허용 정책
CREATE POLICY "allow_all_authenticated" ON public.members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_authenticated" ON public.board_games
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_authenticated" ON public.gathering_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_authenticated" ON public.play_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_authenticated" ON public.player_results
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 초기 멤버 데이터 삽입 (4명 고정)
-- ============================================================

INSERT INTO public.members (id, name, color) VALUES
  ('m1', '영준', 'red'),
  ('m2', '가영', 'blue'),
  ('m3', '윤혁', 'green'),
  ('m4', '한솔', 'yellow')
ON CONFLICT (id) DO NOTHING;
