import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  your_role?: string;
}

export const useWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: memberWorkspaces, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(id, name, owner_id, created_at)')
        .eq('user_id', user.id);

      if (error) throw error;

      const workspacesData = memberWorkspaces?.map(m => ({
        ...(m.workspaces as any),
        your_role: m.role,
      })) || [];

      setWorkspaces(workspacesData);

      // Auto-select first workspace if none selected
      if (workspacesData.length > 0 && !selectedWorkspaceId) {
        const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
        const validWorkspace = workspacesData.find(w => w.id === savedWorkspaceId);
        setSelectedWorkspaceId(validWorkspace?.id || workspacesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    localStorage.setItem('selectedWorkspaceId', workspaceId);
  };

  const createWorkspace = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: workspaceId, error } = await supabase
        .rpc('create_workspace_with_member', {
          workspace_name: name,
          user_id: user.id
        });

      if (error) throw error;

      await fetchWorkspaces();
      selectWorkspace(workspaceId);
      return { id: workspaceId };
    } catch (error) {
      console.error('Error creating workspace:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  return {
    workspaces,
    selectedWorkspace,
    selectedWorkspaceId,
    loading,
    selectWorkspace,
    createWorkspace,
    refetch: fetchWorkspaces,
  };
};
