import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BrandKit {
  id: string;
  user_id: string;
  name: string;
  colors: string[];
  fonts: string[];
  logo_urls: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useBrandKit = () => {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeBrandKit, setActiveBrandKit] = useState<BrandKit | null>(null);

  const loadBrandKits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setBrandKits(data || []);
      
      // Set the default brand kit as active
      const defaultKit = data?.find(kit => kit.is_default);
      if (defaultKit) {
        setActiveBrandKit(defaultKit);
      }
    } catch (error: any) {
      console.error('Error loading brand kits:', error);
      toast.error('Failed to load brand kits');
    } finally {
      setIsLoading(false);
    }
  };

  const saveBrandKit = async (brandKit: Partial<BrandKit>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('brand_kits')
        .insert([{
          user_id: user.id,
          name: brandKit.name || '',
          colors: brandKit.colors || [],
          fonts: brandKit.fonts || [],
          logo_urls: brandKit.logo_urls || [],
          is_default: brandKit.is_default || false,
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Brand kit saved successfully');
      await loadBrandKits();
      return data;
    } catch (error: any) {
      console.error('Error saving brand kit:', error);
      toast.error('Failed to save brand kit');
      throw error;
    }
  };

  const updateBrandKit = async (id: string, updates: Partial<BrandKit>) => {
    try {
      const { error } = await supabase
        .from('brand_kits')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Brand kit updated');
      await loadBrandKits();
    } catch (error: any) {
      console.error('Error updating brand kit:', error);
      toast.error('Failed to update brand kit');
    }
  };

  const deleteBrandKit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('brand_kits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Brand kit deleted');
      await loadBrandKits();
    } catch (error: any) {
      console.error('Error deleting brand kit:', error);
      toast.error('Failed to delete brand kit');
    }
  };

  useEffect(() => {
    loadBrandKits();
  }, []);

  return {
    brandKits,
    isLoading,
    activeBrandKit,
    setActiveBrandKit,
    saveBrandKit,
    updateBrandKit,
    deleteBrandKit,
    loadBrandKits,
  };
};
