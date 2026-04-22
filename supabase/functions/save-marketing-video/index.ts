import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const formData = await req.formData();
    const videoId = formData.get("video_id") as string;
    const projectId = formData.get("project_id") as string;
    const file = formData.get("file") as File | null;
    const mimeType = (formData.get("mime_type") as string) || "video/webm";
    if (!videoId || !projectId || !file) {
      return new Response(JSON.stringify({ error: "video_id, project_id and file are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify ownership
    const { data: row, error: fErr } = await service
      .from("marketing_videos")
      .select("id, user_id")
      .eq("id", videoId)
      .single();
    if (fErr || !row || row.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const path = `marketing-videos/${projectId}/${videoId}/final.${ext}`;
    const { error: upErr } = await service.storage.from("media").upload(path, file, {
      contentType: mimeType, upsert: true,
    });
    if (upErr) throw new Error(`Upload: ${upErr.message}`);
    const { data: pub } = service.storage.from("media").getPublicUrl(path);

    const { error: updErr } = await service
      .from("marketing_videos")
      .update({ video_url: pub.publicUrl, status: "ready", updated_at: new Date().toISOString() })
      .eq("id", videoId);
    if (updErr) throw new Error(`Update: ${updErr.message}`);

    return new Response(JSON.stringify({ video_url: pub.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    console.error("save-marketing-video error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
