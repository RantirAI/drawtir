import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, reveEditImage, fetchImageAsBase64, uploadPngToMedia } from "../_shared/reve.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, instruction } = await req.json();
    if (!imageUrl || !instruction) throw new Error("imageUrl and instruction required");

    console.log("[magic-replace] editing", { instruction: String(instruction).slice(0, 100) });

    const base64 = await fetchImageAsBase64(imageUrl);
    const bytes = await reveEditImage({
      edit_instruction: instruction,
      reference_image_base64: base64,
      quality: 3,
    });

    const authHeader = req.headers.get("Authorization");
    const { publicUrl } = await uploadPngToMedia(authHeader, bytes, "magic-edit");

    return new Response(
      JSON.stringify({ imageUrl: publicUrl, success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[magic-replace] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
