-- Add a column to store all editor settings as JSON
ALTER TABLE public.posters 
ADD COLUMN IF NOT EXISTS editor_settings JSONB DEFAULT '{}'::jsonb;