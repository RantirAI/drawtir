ALTER TABLE public.merch_designs
  ADD COLUMN IF NOT EXISTS size_small_url TEXT,
  ADD COLUMN IF NOT EXISTS size_medium_url TEXT,
  ADD COLUMN IF NOT EXISTS size_large_url TEXT;