-- supabase/schema.sql

CREATE TABLE IF NOT EXISTS daily_puzzles (
  date_str DATE PRIMARY KEY,
  sequence JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL, 
  date_str DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 40),
  player_sequence JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(device_id, date_str) 
);

CREATE TABLE IF NOT EXISTS user_stats (
  device_id TEXT PRIMARY KEY, 
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  played_days INTEGER DEFAULT 0,
  last_played_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Table for raw game volume tracking (Independent of Leaderboard)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  score FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Anonymous Setup)
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (make sure your Supabase anon key is used or service role)
CREATE POLICY "Anyone can insert scores"
ON scores FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read scores"
ON scores FOR SELECT USING (true);

-- ==========================================
-- V2 SCHEMA MIGRATION SCRIPT
-- ==========================================
-- If you are updating an existing V1 database, run these commands individually
-- in your Supabase SQL Editor to sync your tables for the V2 features.

ALTER TABLE scores ADD COLUMN IF NOT EXISTS initials TEXT;
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_score_check;
ALTER TABLE scores ALTER COLUMN score TYPE FLOAT;
