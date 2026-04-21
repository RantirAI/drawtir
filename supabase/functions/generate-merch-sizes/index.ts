import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_LABELS: Record<string, string> = {
  hoodie: "hoodie", tshirt: "t-shirt", crewneck: "crewneck sweatshirt",
  cap: "baseball cap", tote: "canvas tote bag", mug: "ceramic mug",
};

const SIZE_PROMPTS: Record<string, string> = {
  small: "worn by a slim/petite model. The garment fits closely, showing a slimmer silhouette.",
  medium: "worn by an average build model. The garment has a regular, balanced fit.",
  large: "worn by a larger/broader model. The garment fits relaxed and roomy with more drape.",
};

async function generateImage(apiKey: string, prompt: string, inputImageUrl: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: inputImageUrl } },
        ],
      }],
      modalities: ["image", "text"],
    }),
  });
  if (!response.ok) throw new Error(`AI gateway error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("No image returned");
  return url;
}

async function uploadToStorage(supabase: any, dataUrl: string, path: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    contentType: "image/png", upsert: true,
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

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
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { design_id } = await req.json();
    if (!design_id) {
      return new Response(JSON.stringify({ error: "design_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: design, error: designError } = await serviceClient
      .from("merch_designs").select("*").eq("id", design_id).eq("user_id", userId).single();
    if (designError || !design) {
      return new Response(JSON.stringify({ error: "Design not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productLabel = PRODUCT_LABELS[design.product_type] || "t-shirt";
    const buildPrompt = (size: string) =>
      `Realistic e-commerce product photograph of a ${design.base_color} ${productLabel} ${SIZE_PROMPTS[size]} The garment shows the provided design printed on the front, naturally following the fabric drape. Studio lighting, clean light grey background, professional product photography, full body or three-quarter shot. The design should appear correctly scaled for the model size.`;

    console.log("Generating size variants...");
    const [smallRaw, mediumRaw, largeRaw] = await Promise.all([
      generateImage(LOVABLE_API_KEY, buildPrompt("small"), design.front_design_url),
      generateImage(LOVABLE_API_KEY, buildPrompt("medium"), design.front_design_url),
      generateImage(LOVABLE_API_KEY, buildPrompt("large"), design.front_design_url),
    ]);

    const basePath = `merch/${design.project_id}/${design_id}`;
    const [size_small_url, size_medium_url, size_large_url] = await Promise.all([
      uploadToStorage(serviceClient, smallRaw, `${basePath}/size-small.png`),
      uploadToStorage(serviceClient, mediumRaw, `${basePath}/size-medium.png`),
      uploadToStorage(serviceClient, largeRaw, `${basePath}/size-large.png`),
    ]);

    const { data: updated, error: updateError } = await serviceClient
      .from("merch_designs")
      .update({ size_small_url, size_medium_url, size_large_url })
      .eq("id", design_id).select().single();
    if (updateError) throw new Error(`Update failed: ${updateError.message}`);

    return new Response(JSON.stringify({ design: updated }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-merch-sizes error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
