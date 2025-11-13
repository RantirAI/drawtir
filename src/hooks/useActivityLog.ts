import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  id: string;
  workspace_id: string;
  user_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  metadata: any;
  created_at: string;
  profiles: {
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export const useActivityLog = (workspaceId: string | null) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles (
            display_name,
            email,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities((data as any) || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (
    workspaceId: string,
    actionType: string,
    resourceType: string,
    resourceId?: string,
    resourceName?: string,
    metadata?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activity_logs')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          action_type: actionType,
          resource_type: resourceType,
          resource_id: resourceId,
          resource_name: resourceName,
          metadata: metadata || {},
        });

      if (error) throw error;
      await fetchActivities();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  useEffect(() => {
    fetchActivities();

    if (!workspaceId) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`activity-logs-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return {
    activities,
    loading,
    logActivity,
    refetch: fetchActivities,
  };
};
