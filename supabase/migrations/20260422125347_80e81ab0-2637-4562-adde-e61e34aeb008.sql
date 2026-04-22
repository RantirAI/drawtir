ALTER TABLE public.marketing_videos
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'monologue',
  ADD COLUMN IF NOT EXISTS host_a_voice_id text,
  ADD COLUMN IF NOT EXISTS host_a_voice_name text,
  ADD COLUMN IF NOT EXISTS host_b_voice_id text,
  ADD COLUMN IF NOT EXISTS host_b_voice_name text,
  ADD COLUMN IF NOT EXISTS dialog jsonb NOT NULL DEFAULT '[]'::jsonb;