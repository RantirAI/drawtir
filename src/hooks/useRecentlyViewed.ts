import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecentProject {
  id: string;
  project_name: string;
  thumbnail_url: string | null;
  viewed_at: string;
  workspace_id: string | null;
}

export const useRecentlyViewed = () => {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentlyViewed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('project_views')
        .select(`
          viewed_at,
          posters:project_id (
            id,
            project_name,
            thumbnail_url,
            workspace_id
          )
        `)
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const projects = data
        ?.filter(item => item.posters)
        .map(item => ({
          ...(item.posters as any),
          viewed_at: item.viewed_at,
        })) || [];

      setRecentProjects(projects);
    } catch (error) {
      console.error('Error fetching recently viewed:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackProjectView = async (projectId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('upsert_project_view', {
        _user_id: user.id,
        _project_id: projectId,
      });

      // Refresh the list
      await fetchRecentlyViewed();
    } catch (error) {
      console.error('Error tracking project view:', error);
    }
  };

  useEffect(() => {
    fetchRecentlyViewed();
  }, []);

  return {
    recentProjects,
    loading,
    trackProjectView,
    refetch: fetchRecentlyViewed,
  };
};
