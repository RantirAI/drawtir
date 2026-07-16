import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, reveEditImage, fetchImageAsBase64, uploadPngToMedia } from "../_shared/reve.ts";
import { ideogramRemixImage, fetchImageBytes } from "../_shared/ideogram.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, instruction, provider, aspectRatio } = await req.json();
    if (!imageUrl || !instruction) throw new Error("imageUrl and instruction required");
    const imageProvider: "reve" | "ideogram" = provider === "ideogram" ? "ideogram" : "reve";

    console.log("[magic-replace] editing", {
      provider: imageProvider,
      instruction: String(instruction).slice(0, 100),
    });

    let bytes: Uint8Array;
    if (imageProvider === "ideogram") {
      const refBytes = await fetchImageBytes(imageUrl);
      bytes = await ideogramRemixImage({
        prompt: instruction,
        reference_image_bytes: refBytes,
        aspect_ratio: aspectRatio ?? "16:9",
        image_weight: 60,
        rendering_speed: "QUALITY",
      });
    } else {
      const base64 = await fetchImageAsBase64(imageUrl);
      bytes = await reveEditImage({
        edit_instruction: instruction,
        reference_image_base64: base64,
        quality: 3,
      });
    }

    const authHeader = req.headers.get("Authorization");
    const { publicUrl } = await uploadPngToMedia(authHeader, bytes, `magic-edit-${imageProvider}`);

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
