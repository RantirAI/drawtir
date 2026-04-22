import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketingVideoScene {
  caption: string;
  voiceover: string;
  visual_prompt: string;
  image_url: string;
  start: number;
  duration: number;
}

export interface MarketingVideo {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  duration_seconds: number;
  voice_id: string;
  voice_name: string;
  prompt: string | null;
  script: string | null;
  scenes: MarketingVideoScene[];
  audio_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useMarketingVideos(projectId: string | undefined) {
  return useQuery({
    queryKey: ["marketing-videos", projectId],
    queryFn: async () => {
      if (!projectId) return [] as MarketingVideo[];
      const { data, error } = await supabase
        .from("marketing_videos")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MarketingVideo[];
    },
    enabled: !!projectId,
  });
}

export function useGenerateMarketingVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      project_id: string;
      duration_seconds: number;
      voice_id: string;
      voice_name: string;
      prompt: string;
      title: string;
      tone: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-marketing-video", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.video as MarketingVideo;
    },
    onSuccess: (_v, vars) => {
      qc.invalidateQueries({ queryKey: ["marketing-videos", vars.project_id] });
      toast.success("Script & scenes generated. Rendering video...");
    },
    onError: (e: any) => toast.error(e.message || "Failed to generate"),
  });
}

export function useSaveMarketingVideoBlob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      video_id: string;
      project_id: string;
      blob: Blob;
      mime_type: string;
    }) => {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const fd = new FormData();
      fd.append("video_id", params.video_id);
      fd.append("project_id", params.project_id);
      fd.append("mime_type", params.mime_type);
      fd.append("file", params.blob, `final.${params.mime_type.includes("mp4") ? "mp4" : "webm"}`);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-marketing-video`;
      const r = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || "Upload failed");
      }
      return r.json();
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["marketing-videos", vars.project_id] });
    },
    onError: (e: any) => toast.error(e.message || "Save failed"),
  });
}

export function useRefineMarketingVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      video_id: string;
      project_id: string;
      feedback?: string;
      voice_id?: string;
      voice_name?: string;
      regenerate_images?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke("refine-marketing-video", { body: params });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.video as MarketingVideo;
    },
    onSuccess: (_v, vars) => {
      qc.invalidateQueries({ queryKey: ["marketing-videos", vars.project_id] });
      toast.success("Refined! Re-rendering video...");
    },
    onError: (e: any) => toast.error(e.message || "Refine failed"),
  });
}

export function useDeleteMarketingVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; project_id: string }) => {
      const { error } = await supabase.from("marketing_videos").delete().eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["marketing-videos", vars.project_id] });
      toast.success("Video deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
