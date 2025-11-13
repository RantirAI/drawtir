-- Create a function to create workspace with proper permissions
CREATE OR REPLACE FUNCTION public.create_workspace_with_member(
  workspace_name TEXT,
  user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create the workspace
  INSERT INTO public.workspaces (name, owner_id)
  VALUES (workspace_name, user_id)
  RETURNING id INTO new_workspace_id;
  
  -- Add the creator as owner member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, user_id, 'owner');
  
  RETURN new_workspace_id;
END;
$$;