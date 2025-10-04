-- Make old columns nullable for backward compatibility
ALTER TABLE public.posters 
ALTER COLUMN image_url DROP NOT NULL,
ALTER COLUMN caption DROP NOT NULL;

-- Set default empty values for existing records that might not have these
UPDATE public.posters 
SET image_url = '' WHERE image_url IS NULL;

UPDATE public.posters 
SET caption = '' WHERE caption IS NULL;