CREATE TABLE public.game_builds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.asset_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'platformer',
  instructions TEXT DEFAULT '',
  game_code TEXT NOT NULL DEFAULT '',
  asset_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game builds"
ON public.game_builds FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game builds"
ON public.game_builds FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game builds"
ON public.game_builds FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game builds"
ON public.game_builds FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_game_builds_updated_at
BEFORE UPDATE ON public.game_builds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();