
-- Create asset_projects table
CREATE TABLE public.asset_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  knowledge_base TEXT DEFAULT '',
  art_style TEXT DEFAULT 'pixel_art',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own asset projects" ON public.asset_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own asset projects" ON public.asset_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own asset projects" ON public.asset_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own asset projects" ON public.asset_projects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_asset_projects_updated_at
  BEFORE UPDATE ON public.asset_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create generated_assets table
CREATE TABLE public.generated_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.asset_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  file_name TEXT NOT NULL DEFAULT 'asset.png',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated assets" ON public.generated_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own generated assets" ON public.generated_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own generated assets" ON public.generated_assets FOR DELETE USING (auth.uid() = user_id);
