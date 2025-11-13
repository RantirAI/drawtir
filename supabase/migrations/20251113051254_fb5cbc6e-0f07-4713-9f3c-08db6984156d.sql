-- Allow invited users to join a workspace by inserting themselves as members
CREATE POLICY "Invitees can join workspace"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.workspace_invitations wi
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE wi.workspace_id = workspace_members.workspace_id
      AND wi.email = p.email
      AND wi.accepted_at IS NULL
      AND wi.expires_at > now()
      AND wi.role = workspace_members.role
  )
);