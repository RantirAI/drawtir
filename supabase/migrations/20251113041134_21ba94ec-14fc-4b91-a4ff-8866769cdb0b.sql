-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workspace role enum
CREATE TYPE public.workspace_role AS ENUM ('owner', 'editor', 'viewer');

-- Create workspace members table
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role workspace_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create workspace invitations table
CREATE TABLE public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role workspace_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES public.profiles(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update posters table to add workspace_id
ALTER TABLE public.posters ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
CREATE INDEX idx_posters_workspace ON public.posters(workspace_id);

-- Update profiles table for collaboration features
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN display_name TEXT;

-- Enable RLS on new tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
  )
$$;

-- Create security definer function to check workspace role
CREATE OR REPLACE FUNCTION public.has_workspace_role(_user_id UUID, _workspace_id UUID, _role workspace_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is owner or editor
CREATE OR REPLACE FUNCTION public.can_edit_workspace(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND role IN ('owner', 'editor')
  )
$$;

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they are members of"
  ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(auth.uid(), id));

CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their workspaces"
  ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their workspaces"
  ON public.workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- RLS Policies for workspace_members
CREATE POLICY "Users can view members of their workspaces"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Owners can add members to their workspaces"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    public.has_workspace_role(auth.uid(), workspace_id, 'owner')
  );

CREATE POLICY "Owners can update member roles"
  ON public.workspace_members FOR UPDATE
  USING (public.has_workspace_role(auth.uid(), workspace_id, 'owner'));

CREATE POLICY "Owners can remove members"
  ON public.workspace_members FOR DELETE
  USING (public.has_workspace_role(auth.uid(), workspace_id, 'owner'));

-- RLS Policies for workspace_invitations
CREATE POLICY "Users can view invitations for their workspaces"
  ON public.workspace_invitations FOR SELECT
  USING (
    public.is_workspace_member(auth.uid(), workspace_id) OR
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Owners can create invitations"
  ON public.workspace_invitations FOR INSERT
  WITH CHECK (public.has_workspace_role(auth.uid(), workspace_id, 'owner'));

CREATE POLICY "Owners can delete invitations"
  ON public.workspace_invitations FOR DELETE
  USING (public.has_workspace_role(auth.uid(), workspace_id, 'owner'));

CREATE POLICY "Users can update invitations sent to them"
  ON public.workspace_invitations FOR UPDATE
  USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Update posters RLS to include workspace access
CREATE POLICY "Workspace members can view workspace posters"
  ON public.posters FOR SELECT
  USING (
    workspace_id IS NULL OR
    public.is_workspace_member(auth.uid(), workspace_id)
  );

CREATE POLICY "Workspace editors can update workspace posters"
  ON public.posters FOR UPDATE
  USING (
    workspace_id IS NULL OR
    public.can_edit_workspace(auth.uid(), workspace_id)
  );

-- Enable realtime for posters table
ALTER PUBLICATION supabase_realtime ADD TABLE public.posters;

-- Create trigger for workspace updated_at
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();