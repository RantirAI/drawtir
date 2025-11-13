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

      // Auto-select workspace based on saved preference or first workspace
      const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
      
      if (savedWorkspaceId && savedWorkspaceId !== 'personal') {
        const validWorkspace = workspacesData.find(w => w.id === savedWorkspaceId);
        if (validWorkspace) {
          setSelectedWorkspaceId(validWorkspace.id);
        } else {
          // Saved workspace no longer exists, select first or null
          const newSelection = workspacesData.length > 0 ? workspacesData[0].id : null;
          setSelectedWorkspaceId(newSelection);
          if (newSelection) {
            localStorage.setItem('selectedWorkspaceId', newSelection);
          }
        }
      } else if (workspacesData.length > 0 && !selectedWorkspaceId) {
        // No valid saved workspace and user has workspaces - select first
        setSelectedWorkspaceId(workspacesData[0].id);
        localStorage.setItem('selectedWorkspaceId', workspacesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectWorkspace = (workspaceId: string) => {
    // Handle "personal" workspace selection
    const actualWorkspaceId = workspaceId === 'personal' ? null : workspaceId;
    setSelectedWorkspaceId(actualWorkspaceId);
    localStorage.setItem('selectedWorkspaceId', workspaceId);
    // Broadcast change to all components using this hook
    window.dispatchEvent(new CustomEvent<string | null>('workspaceChanged', { detail: actualWorkspaceId }));
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
    
    // Listen for invitation acceptance to refresh workspaces
    const handleInvitationAccepted = () => {
      fetchWorkspaces();
    };
    
    window.addEventListener('workspaceInvitationAccepted', handleInvitationAccepted);
    
    return () => {
      window.removeEventListener('workspaceInvitationAccepted', handleInvitationAccepted);
    };
  }, []);

  // Listen for workspace changes broadcasted from other components
  useEffect(() => {
    const handleWorkspaceChanged = (e: Event) => {
      const id = (e as CustomEvent<string | null>).detail;
      setSelectedWorkspaceId(id);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'selectedWorkspaceId') {
        setSelectedWorkspaceId(e.newValue === 'personal' ? null : e.newValue);
      }
    };

    window.addEventListener('workspaceChanged', handleWorkspaceChanged as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('workspaceChanged', handleWorkspaceChanged as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
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
