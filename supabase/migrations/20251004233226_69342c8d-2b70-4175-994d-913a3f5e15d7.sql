-- Add canvas snapshot columns to posters table
ALTER TABLE public.posters 
ADD COLUMN IF NOT EXISTS canvas_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS project_name TEXT DEFAULT 'Untitled Project';

-- Create index for faster queries on canvas_data
CREATE INDEX IF NOT EXISTS idx_posters_canvas_data ON public.posters USING GIN (canvas_data);

-- Update existing records to have default project names if null
UPDATE public.posters SET project_name = 'Untitled Project' WHERE project_name IS NULL;