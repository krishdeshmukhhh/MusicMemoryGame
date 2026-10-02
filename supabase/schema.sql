-- supabase/schema.sql
-- Schema used by the app. All access goes through the Next.js API routes with the
-- service-role key (which bypasses RLS), so RLS is enabled with NO public policies:
-- the anon key cannot read or write anything directly.
-- Safe to re-run: every statement is idempotent.

-- Daily pitch leaderboard: best verified score per device per puzzle date.
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  date_str DATE NOT NULL,
  score FLOAT NOT NULL CHECK (score >= 0 AND score <= 50),
  player_sequence JSONB NOT NULL,          -- 5 rounds × 4 notes, used to verify the score
  initials TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (device_id, date_str)
);
CREATE INDEX IF NOT EXISTS scores_date_score_idx ON scores (date_str, score DESC);

-- Every completed pitch game (daily + endless) — global play counter.
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  score FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Every completed BPM game — global play counter.
CREATE TABLE IF NOT EXISTS bpm_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  total_score FLOAT NOT NULL CHECK (total_score >= 0 AND total_score <= 20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE scores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpm_sessions  ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- MIGRATING AN EXISTING (V1/V2) DATABASE
-- ==========================================
-- Earlier versions of this file created public policies that let anyone holding the
-- anon key insert arbitrary leaderboard rows, bypassing server-side verification.
DROP POLICY IF EXISTS "Anyone can insert scores" ON scores;
DROP POLICY IF EXISTS "Anyone can read scores" ON scores;

ALTER TABLE scores ADD COLUMN IF NOT EXISTS initials TEXT;
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_score_check;
ALTER TABLE scores ALTER COLUMN score TYPE FLOAT;
ALTER TABLE scores ADD CONSTRAINT scores_score_check CHECK (score >= 0 AND score <= 50) NOT VALID;

-- Unused by the app since v2; drop once you have confirmed nothing else reads them:
-- DROP TABLE IF EXISTS daily_puzzles;
-- DROP TABLE IF EXISTS user_stats;
