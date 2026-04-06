import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAssetProjects() {
  return useQuery({
    queryKey: ["asset-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAssetProject(id: string | undefined) {
  return useQuery({
    queryKey: ["asset-project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_projects")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useGeneratedAssets(projectId: string | undefined, category?: string) {
  return useQuery({
    queryKey: ["generated-assets", projectId, category],
    enabled: !!projectId,
    queryFn: async () => {
      let query = supabase
        .from("generated_assets")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (category && category !== "all") {
        query = query.eq("category", category);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAssetProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: project, error } = await supabase
        .from("asset_projects")
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asset-projects"] });
      toast.success("Project created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAssetProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; knowledge_base?: string; art_style?: string }) => {
      const { error } = await supabase
        .from("asset_projects")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["asset-project", vars.id] });
      qc.invalidateQueries({ queryKey: ["asset-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAssetProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("asset_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asset-projects"] });
      toast.success("Project deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("generated_assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["generated-assets"] });
      toast.success("Asset deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGameBuilds(projectId: string | undefined) {
  return useQuery({
    queryKey: ["game-builds", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_builds")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateGameBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { project_id: string; game_type: string; instructions: string; game_code: string; asset_ids: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: build, error } = await supabase
        .from("game_builds")
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return build;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["game-builds", vars.project_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateGameBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; game_code?: string; instructions?: string }) => {
      const { error } = await supabase
        .from("game_builds")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["game-builds"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGameBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("game_builds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["game-builds"] });
      toast.success("Game build deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
