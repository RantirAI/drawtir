import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FeaturedImage {
  id: string;
  project_id: string;
  user_id: string;
  image_url: string;
  label: string;
  description: string;
  sort_order: number;
  created_at: string;
}

export function useFeaturedImages(projectId: string | undefined) {
  return useQuery({
    queryKey: ["featured-images", projectId],
    queryFn: async () => {
      if (!projectId) return [] as FeaturedImage[];
      const { data, error } = await supabase
        .from("marketing_featured_images")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as FeaturedImage[];
    },
    enabled: !!projectId,
  });
}

export function useUploadFeaturedImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      project_id: string;
      file: File;
      label: string;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const path = `${user.id}/marketing/${params.project_id}/featured/${Date.now()}-${params.file.name}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, params.file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      const { error } = await supabase.from("marketing_featured_images").insert({
        project_id: params.project_id,
        user_id: user.id,
        image_url: publicUrl,
        label: params.label,
        description: params.description || "",
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["featured-images", vars.project_id] });
      toast.success("Featured image added");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateFeaturedImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; project_id: string; label?: string; description?: string }) => {
      const { id, project_id, ...updates } = params;
      const { error } = await supabase.from("marketing_featured_images").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["featured-images", vars.project_id] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteFeaturedImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; project_id: string }) => {
      const { error } = await supabase.from("marketing_featured_images").delete().eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["featured-images", vars.project_id] }),
    onError: (e: any) => toast.error(e.message),
  });
}
