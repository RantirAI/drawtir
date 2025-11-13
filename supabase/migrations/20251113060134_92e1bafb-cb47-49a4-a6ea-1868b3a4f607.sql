
-- Fix RLS policies on posters table to be PERMISSIVE instead of RESTRICTIVE
-- This allows ANY policy to grant access (OR logic) instead of requiring ALL (AND logic)

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own posters" ON posters;
DROP POLICY IF EXISTS "Anyone can view public templates" ON posters;
DROP POLICY IF EXISTS "Workspace members can view workspace posters" ON posters;

-- Recreate as PERMISSIVE policies (default behavior)
CREATE POLICY "Users can view their own posters"
ON posters
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public templates"
ON posters
FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "Workspace members can view workspace posters"
ON posters
FOR SELECT
TO authenticated
USING ((workspace_id IS NULL) OR is_workspace_member(auth.uid(), workspace_id));
