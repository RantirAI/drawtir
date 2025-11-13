-- Tighten and clarify posters SELECT policy for workspace members
-- Prevent accidental exposure of personal projects (workspace_id IS NULL)

BEGIN;

DROP POLICY IF EXISTS "Workspace members can view workspace posters" ON public.posters;

CREATE POLICY "Workspace members can view workspace posters"
ON public.posters
FOR SELECT
TO authenticated
USING (
  workspace_id IS NOT NULL
  AND public.is_workspace_member(auth.uid(), workspace_id)
);

COMMIT;