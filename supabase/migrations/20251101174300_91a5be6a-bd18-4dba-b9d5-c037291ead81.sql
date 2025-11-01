-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create brand_kits table for saving brand assets
CREATE TABLE public.brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  colors TEXT[] DEFAULT '{}',
  fonts TEXT[] DEFAULT '{}',
  logo_urls TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own brand kits"
  ON public.brand_kits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brand kits"
  ON public.brand_kits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand kits"
  ON public.brand_kits
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand kits"
  ON public.brand_kits
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update timestamps
CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();