-- Create activity_logs table for workspace activities
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  resource_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_activity_logs_workspace ON public.activity_logs(workspace_id, created_at DESC);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_logs
CREATE POLICY "Workspace members can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can create activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add workspace customization columns
ALTER TABLE public.workspaces ADD COLUMN avatar_url TEXT;
ALTER TABLE public.workspaces ADD COLUMN primary_color TEXT DEFAULT '#9b87f5';
ALTER TABLE public.workspaces ADD COLUMN description TEXT;

-- Create project_views table for recently viewed tracking
CREATE TABLE public.project_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.posters(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Create index for efficient queries
CREATE INDEX idx_project_views_user ON public.project_views(user_id, viewed_at DESC);

-- Enable RLS on project_views
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_views
CREATE POLICY "Users can view their own project views"
  ON public.project_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project views"
  ON public.project_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project views"
  ON public.project_views FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to upsert project view
CREATE OR REPLACE FUNCTION public.upsert_project_view(_user_id UUID, _project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_views (user_id, project_id, viewed_at)
  VALUES (_user_id, _project_id, now())
  ON CONFLICT (user_id, project_id) 
  DO UPDATE SET viewed_at = now();
END;
$$;