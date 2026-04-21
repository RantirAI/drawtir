import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMerchDesigns(projectId: string | undefined) {
  return useQuery({
    queryKey: ["merch-designs", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("merch_designs")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useGenerateMerchDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      project_id: string;
      product_type: string;
      base_color: string;
      style: string;
      prompt: string;
      use_logo: boolean;
      use_brand_color: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-merch-design", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.design;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["merch-designs", vars.project_id] });
      toast.success("Merch design generated");
    },
    onError: (e: any) => toast.error(e.message || "Failed to generate design"),
  });
}

export function useDeleteMerchDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from("merch_designs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["merch-designs", vars.project_id] });
      toast.success("Design deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useRefineMerchDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ design_id, refine_prompt, sides }: { design_id: string; project_id: string; refine_prompt: string; sides: ("front" | "back")[] }) => {
      const { data, error } = await supabase.functions.invoke("refine-merch-design", {
        body: { design_id, refine_prompt, sides },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.design;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["merch-designs", vars.project_id] });
      toast.success("Design refined");
    },
    onError: (e: any) => toast.error(e.message || "Failed to refine design"),
  });
}

export function useGenerateMerchSizes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ design_id }: { design_id: string; project_id: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-merch-sizes", {
        body: { design_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.design;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["merch-designs", vars.project_id] });
      toast.success("Size variants generated");
    },
    onError: (e: any) => toast.error(e.message || "Failed to generate sizes"),
  });
}
