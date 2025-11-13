-- Allow workspace owners to update invitations (e.g., change role)
CREATE POLICY "Owners can update invitations"
ON public.workspace_invitations
FOR UPDATE
USING (has_workspace_role(auth.uid(), workspace_id, 'owner'));
