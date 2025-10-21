import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CanvasSnapshot } from '@/types/snapshot';
import { toast } from 'sonner';

export interface Template {
  id: string;
  project_name: string;
  canvas_data: CanvasSnapshot;
  thumbnail_url?: string;
  template_category?: string;
  user_id: string;
  created_at: string;
  is_template: boolean;
  is_public: boolean;
}

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posters')
        .select('*')
        .eq('is_public', true)
        .eq('is_template', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTemplates((data || []).map(d => ({
        ...d,
        canvas_data: d.canvas_data as unknown as CanvasSnapshot
      })));
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const makeDesignPublic = async (posterId: string, isTemplate: boolean = true) => {
    try {
      const { error } = await supabase
        .from('posters')
        .update({ 
          is_public: true,
          is_template: isTemplate,
          template_category: isTemplate ? 'user-created' : null
        })
        .eq('id', posterId);

      if (error) throw error;
      
      toast.success('Design made public! Others can now use it as a template.');
      await loadTemplates();
    } catch (error: any) {
      console.error('Error making design public:', error);
      toast.error('Failed to make design public');
    }
  };

  const makeDesignPrivate = async (posterId: string) => {
    try {
      const { error } = await supabase
        .from('posters')
        .update({ 
          is_public: false,
          is_template: false
        })
        .eq('id', posterId);

      if (error) throw error;
      
      toast.success('Design made private');
      await loadTemplates();
    } catch (error: any) {
      console.error('Error making design private:', error);
      toast.error('Failed to make design private');
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    isLoading,
    loadTemplates,
    makeDesignPublic,
    makeDesignPrivate
  };
};
