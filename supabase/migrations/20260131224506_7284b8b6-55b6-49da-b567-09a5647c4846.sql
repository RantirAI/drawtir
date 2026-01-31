
-- Create approval status enum
CREATE TYPE public.approval_status AS ENUM ('draft', 'pending_review', 'changes_requested', 'approved', 'published');

-- Create poster_comments table
CREATE TABLE public.poster_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id UUID NOT NULL REFERENCES public.posters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.poster_comments(id) ON DELETE CASCADE,
  position_x NUMERIC,
  position_y NUMERIC,
  frame_id TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create poster_approvals table
CREATE TABLE public.poster_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id UUID NOT NULL UNIQUE REFERENCES public.posters(id) ON DELETE CASCADE,
  status public.approval_status NOT NULL DEFAULT 'draft',
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create comment_mentions table
CREATE TABLE public.comment_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.poster_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.poster_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poster_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user can access poster (owner or workspace member)
CREATE OR REPLACE FUNCTION public.can_access_poster(_user_id UUID, _poster_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.posters p
    WHERE p.id = _poster_id
    AND (
      p.user_id = _user_id
      OR p.is_public = true
      OR (p.workspace_id IS NOT NULL AND is_workspace_member(_user_id, p.workspace_id))
    )
  )
$$;

-- Helper function to check if user can edit poster
CREATE OR REPLACE FUNCTION public.can_edit_poster(_user_id UUID, _poster_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.posters p
    WHERE p.id = _poster_id
    AND (
      p.user_id = _user_id
      OR (p.workspace_id IS NOT NULL AND can_edit_workspace(_user_id, p.workspace_id))
    )
  )
$$;

-- RLS Policies for poster_comments
CREATE POLICY "Users can view comments on accessible posters"
ON public.poster_comments FOR SELECT
USING (can_access_poster(auth.uid(), poster_id));

CREATE POLICY "Users can create comments on accessible posters"
ON public.poster_comments FOR INSERT
WITH CHECK (auth.uid() = user_id AND can_access_poster(auth.uid(), poster_id));

CREATE POLICY "Users can update their own comments"
ON public.poster_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.poster_comments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Editors can resolve comments"
ON public.poster_comments FOR UPDATE
USING (can_edit_poster(auth.uid(), poster_id));

-- RLS Policies for poster_approvals
CREATE POLICY "Users can view approvals on accessible posters"
ON public.poster_approvals FOR SELECT
USING (can_access_poster(auth.uid(), poster_id));

CREATE POLICY "Editors can create approvals"
ON public.poster_approvals FOR INSERT
WITH CHECK (can_edit_poster(auth.uid(), poster_id));

CREATE POLICY "Editors can update approvals"
ON public.poster_approvals FOR UPDATE
USING (can_edit_poster(auth.uid(), poster_id));

-- RLS Policies for comment_mentions
CREATE POLICY "Users can view mentions for accessible comments"
ON public.comment_mentions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.poster_comments pc
    WHERE pc.id = comment_id
    AND can_access_poster(auth.uid(), pc.poster_id)
  )
);

CREATE POLICY "Comment authors can create mentions"
ON public.comment_mentions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.poster_comments pc
    WHERE pc.id = comment_id
    AND pc.user_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_poster_comments_updated_at
BEFORE UPDATE ON public.poster_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_poster_approvals_updated_at
BEFORE UPDATE ON public.poster_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.poster_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poster_approvals;
