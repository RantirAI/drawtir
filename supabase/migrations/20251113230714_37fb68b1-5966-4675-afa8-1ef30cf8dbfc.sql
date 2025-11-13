-- Fix workspace collaboration permissions
-- The issue is that workspace editors couldn't update posters because 
-- the with_check clause was missing, causing permission conflicts

-- Drop existing workspace editor policy
DROP POLICY IF EXISTS "Workspace editors can update workspace posters" ON public.posters;

-- Recreate with proper with_check clause to allow editors full access
CREATE POLICY "Workspace editors can update workspace posters"
ON public.posters
FOR UPDATE
TO authenticated
USING (
  (workspace_id IS NULL AND auth.uid() = user_id) 
  OR 
  (workspace_id IS NOT NULL AND can_edit_workspace(auth.uid(), workspace_id))
)
WITH CHECK (
  (workspace_id IS NULL AND auth.uid() = user_id) 
  OR 
  (workspace_id IS NOT NULL AND can_edit_workspace(auth.uid(), workspace_id))
);

-- Also ensure workspace editors can insert into workspace projects
DROP POLICY IF EXISTS "Workspace editors can insert workspace posters" ON public.posters;

CREATE POLICY "Workspace editors can insert workspace posters"
ON public.posters
FOR INSERT
TO authenticated
WITH CHECK (
  (workspace_id IS NULL AND auth.uid() = user_id)
  OR
  (workspace_id IS NOT NULL AND can_edit_workspace(auth.uid(), workspace_id))
);

-- Ensure workspace editors can delete workspace posters
DROP POLICY IF EXISTS "Workspace editors can delete workspace posters" ON public.posters;

CREATE POLICY "Workspace editors can delete workspace posters"
ON public.posters
FOR DELETE
TO authenticated
USING (
  (workspace_id IS NULL AND auth.uid() = user_id)
  OR
  (workspace_id IS NOT NULL AND can_edit_workspace(auth.uid(), workspace_id))
);