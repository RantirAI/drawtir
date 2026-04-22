-- Marketing project enterprise fields
ALTER TABLE public.marketing_projects
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United States',
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS brand_voice TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS forbidden_words TEXT[] DEFAULT '{}'::text[];

-- Featured product images table (labeled screenshots / pages)
CREATE TABLE IF NOT EXISTS public.marketing_featured_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.marketing_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_featured_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own featured images"
  ON public.marketing_featured_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own featured images"
  ON public.marketing_featured_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own featured images"
  ON public.marketing_featured_images FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own featured images"
  ON public.marketing_featured_images FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_featured_images_project ON public.marketing_featured_images(project_id);

-- Marketing video extra fields for locale + subtitles + scene type
ALTER TABLE public.marketing_videos
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS subtitles JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS burn_subtitles BOOLEAN NOT NULL DEFAULT true;