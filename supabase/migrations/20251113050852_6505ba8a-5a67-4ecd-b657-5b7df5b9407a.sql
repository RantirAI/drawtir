-- Allow invitees to view workspace basic info before joining
CREATE POLICY "Invitees can view invited workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_invitations wi
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE wi.workspace_id = workspaces.id
      AND wi.email = p.email
      AND wi.accepted_at IS NULL
      AND wi.expires_at > now()
  )
);

-- Allow invitees to view the inviter's profile (to show name/email in invite)
CREATE POLICY "Invitees can view inviter profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_invitations wi
    JOIN public.profiles me ON me.id = auth.uid()
    WHERE wi.invited_by = profiles.id
      AND wi.email = me.email
      AND wi.accepted_at IS NULL
      AND wi.expires_at > now()
  )
);