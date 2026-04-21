CREATE TABLE public.merch_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.marketing_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'tshirt',
  base_color TEXT NOT NULL DEFAULT 'black',
  style TEXT NOT NULL DEFAULT 'minimal',
  prompt TEXT DEFAULT '',
  front_design_url TEXT,
  back_design_url TEXT,
  front_mockup_url TEXT,
  back_mockup_url TEXT,
  use_logo BOOLEAN NOT NULL DEFAULT true,
  use_brand_color BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.merch_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own merch designs"
  ON public.merch_designs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own merch designs"
  ON public.merch_designs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merch designs"
  ON public.merch_designs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own merch designs"
  ON public.merch_designs FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_merch_designs_updated_at
  BEFORE UPDATE ON public.merch_designs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_merch_designs_project_id ON public.merch_designs(project_id);
CREATE INDEX idx_merch_designs_user_id ON public.merch_designs(user_id);