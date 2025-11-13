import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
  workspaces: {
    name: string;
  } | null;
  inviter: {
    display_name: string | null;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export const useWorkspaceInvitations = () => {
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (!profile?.email) return;

      const { data, error } = await supabase
        .from('workspace_invitations')
        .select(`
          *,
          workspaces!workspace_invitations_workspace_id_fkey(name),
          inviter:profiles!workspace_invitations_invited_by_fkey(display_name, email, first_name, last_name)
        `)
        .eq('email', profile.email)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations((data as any) || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitationId: string, workspaceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the invitation details
      const { data: invitation } = await supabase
        .from('workspace_invitations')
        .select('role')
        .eq('id', invitationId)
        .single();

      if (!invitation) throw new Error('Invitation not found');

      // Add user to workspace
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          role: invitation.role,
        });

      if (memberError) throw memberError;

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('workspace_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      await fetchInvitations();
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return false;
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      await fetchInvitations();
      return true;
    } catch (error) {
      console.error('Error declining invitation:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchInvitations();

    // Subscribe to changes
    const channel = supabase
      .channel('invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_invitations',
        },
        () => {
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    invitations,
    loading,
    acceptInvitation,
    declineInvitation,
    refetch: fetchInvitations,
  };
};
