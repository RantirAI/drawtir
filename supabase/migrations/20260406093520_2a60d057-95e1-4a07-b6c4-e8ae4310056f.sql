
-- Create marketing_projects table
CREATE TABLE public.marketing_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  knowledge_base TEXT DEFAULT '',
  primary_color TEXT DEFAULT '#9b87f5',
  logos TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own marketing projects"
  ON public.marketing_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own marketing projects"
  ON public.marketing_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketing projects"
  ON public.marketing_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketing projects"
  ON public.marketing_projects FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_marketing_projects_updated_at
  BEFORE UPDATE ON public.marketing_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create marketing_outputs table
CREATE TABLE public.marketing_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.marketing_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  output_type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB NOT NULL DEFAULT '{}',
  platform TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own marketing outputs"
  ON public.marketing_outputs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own marketing outputs"
  ON public.marketing_outputs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketing outputs"
  ON public.marketing_outputs FOR DELETE
  USING (auth.uid() = user_id);
