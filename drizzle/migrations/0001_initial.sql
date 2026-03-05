-- SleepBot Initial Migration
-- Run this in your Supabase SQL Editor or via: npm run db:migrate

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  image_url TEXT,
  audio_type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  youtube_id TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[],
  thumbnail_path TEXT,
  video_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS videos_status_idx ON videos (status);
CREATE INDEX IF NOT EXISTS videos_created_at_idx ON videos (created_at DESC);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS jobs_video_id_idx ON jobs (video_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status);

CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  themes TEXT[] NOT NULL,
  audio_type TEXT NOT NULL DEFAULT 'rain',
  duration INTEGER NOT NULL DEFAULT 28800,
  frequency_days INTEGER NOT NULL DEFAULT 1,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
