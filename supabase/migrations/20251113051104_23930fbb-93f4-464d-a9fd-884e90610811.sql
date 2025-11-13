-- Drop the problematic policies
DROP POLICY IF EXISTS "Invitees can view invited workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Invitees can view inviter profile" ON public.profiles;

-- Create a security definer function to check if user can view invitation
CREATE OR REPLACE FUNCTION public.user_can_view_invitation(_invitation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_invitations wi
    JOIN public.profiles p ON p.id = _user_id
    WHERE wi.id = _invitation_id
      AND wi.email = p.email
      AND wi.accepted_at IS NULL
      AND wi.expires_at > now()
  );
$$;

-- Create a security definer function to check if user has pending invitation to workspace
CREATE OR REPLACE FUNCTION public.user_has_invitation_to_workspace(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_invitations wi
    JOIN public.profiles p ON p.id = _user_id
    WHERE wi.workspace_id = _workspace_id
      AND wi.email = p.email
      AND wi.accepted_at IS NULL
      AND wi.expires_at > now()
  );
$$;

-- Create a security definer function to check if user invited someone
CREATE OR REPLACE FUNCTION public.user_invited_by(_inviter_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_invitations wi
    JOIN public.profiles p ON p.id = _user_id
    WHERE wi.invited_by = _inviter_id
      AND wi.email = p.email
      AND wi.accepted_at IS NULL
      AND wi.expires_at > now()
  );
$$;

-- Allow invitees to view invited workspaces using the function
CREATE POLICY "Invitees can view invited workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (public.user_has_invitation_to_workspace(id, auth.uid()));

-- Allow invitees to view the inviter's profile using the function
CREATE POLICY "Invitees can view inviter profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.user_invited_by(id, auth.uid()));