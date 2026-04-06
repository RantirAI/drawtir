import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMarketingProjects() {
  return useQuery({
    queryKey: ["marketing-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMarketingProject(id: string | undefined) {
  return useQuery({
    queryKey: ["marketing-project", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("marketing_projects")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useMarketingOutputs(projectId: string | undefined) {
  return useQuery({
    queryKey: ["marketing-outputs", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("marketing_outputs")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateMarketingProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("marketing_projects")
        .insert({ name, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing-projects"] });
      toast.success("Project created");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateMarketingProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("marketing_projects")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["marketing-project", vars.id] });
      qc.invalidateQueries({ queryKey: ["marketing-projects"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteMarketingProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_projects")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing-projects"] });
      toast.success("Project deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useGenerateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      project_id: string;
      output_type: string;
      platform: string;
      custom_prompt: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-marketing-content", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.results;
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSaveMarketingOutput() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      project_id: string;
      output_type: string;
      title: string;
      content: any;
      platform: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("marketing_outputs")
        .insert({ ...params, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["marketing-outputs", vars.project_id] });
      toast.success("Output saved");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
