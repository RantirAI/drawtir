import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_LABELS: Record<string, string> = {
  hoodie: "hoodie", tshirt: "t-shirt", crewneck: "crewneck sweatshirt",
  cap: "baseball cap", tote: "canvas tote bag", mug: "ceramic mug",
};

async function generateImage(apiKey: string, prompt: string, inputImageUrls: string[] = []): Promise<string> {
  const content: any[] = [{ type: "text", text: prompt }];
  for (const url of inputImageUrls) {
    if (url) content.push({ type: "image_url", image_url: { url } });
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image-preview",
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${t}`);
  }
  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) throw new Error("No image returned from AI");
  return imageUrl;
}

async function removeBackground(apiKey: string, imageDataUrl: string): Promise<string> {
  const imageResponse = await fetch(imageDataUrl);
  const imageBlob = await imageResponse.blob();
  const formData = new FormData();
  formData.append("image_file", imageBlob, "design.png");
  formData.append("size", "auto");
  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST", headers: { "X-Api-Key": apiKey }, body: formData,
  });
  if (!response.ok) {
    const t = await response.text();
    throw new Error(`remove.bg error ${response.status}: ${t}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return `data:image/png;base64,${btoa(binary)}`;
}

async function uploadToStorage(supabase: any, dataUrl: string, path: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    contentType: "image/png", upsert: true,
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
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
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
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
    const REMOVE_BG_API_KEY = Deno.env.get("REMOVE_BG_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!REMOVE_BG_API_KEY) throw new Error("REMOVE_BG_API_KEY not configured");

    const body = await req.json();
    const { design_id, refine_prompt, sides = ["front", "back"] } = body;

    if (!design_id || !refine_prompt) {
      return new Response(JSON.stringify({ error: "design_id and refine_prompt required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: design, error: designError } = await serviceClient
      .from("merch_designs").select("*").eq("id", design_id).eq("user_id", userId).single();

    if (designError || !design) {
      return new Response(JSON.stringify({ error: "Design not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project } = await serviceClient
      .from("marketing_projects")
      .select("name, primary_color, logos")
      .eq("id", design.project_id).single();

    const productLabel = PRODUCT_LABELS[design.product_type] || "t-shirt";
    const logoUrl = design.use_logo && project?.logos?.length ? project.logos[0] : null;
    const brandColor = design.use_brand_color && project?.primary_color ? project.primary_color : null;

    const refinePromptBase = (side: "front" | "back", originalUrl: string) => `Refine and redesign this existing apparel ${side} graphic for a ${productLabel}. Brand: "${project?.name || ""}".

USER REFINEMENT REQUEST: ${refine_prompt}

CRITICAL:
- Keep the overall identity, brand voice and visual language of the ORIGINAL design (provided as the first image reference) — this is a refinement, not a completely new design.
- Apply the user's refinement request precisely.
${logoUrl ? "- A brand logo reference is also provided. If the design uses the logo, keep it EXACTLY as provided — do not redraw or alter it." : ""}
${brandColor ? `- Maintain the brand accent color ${brandColor}.` : ""}
- Output must be ISOLATED on a pure solid white background (#FFFFFF), no garment, no model, no mockup.
- Professional, print-ready, sharp, perfectly legible typography (real words, properly kerned).
- Senior apparel designer quality — clean, intentional, not chaotic.`;

    const updates: Record<string, string> = {};
    const basePath = `merch/${design.project_id}/${design.id}`;
    const ts = Date.now();

    for (const side of sides as ("front" | "back")[]) {
      const originalUrl = side === "front" ? design.front_design_url : design.back_design_url;
      if (!originalUrl) continue;

      console.log(`Refining ${side} design...`);
      const refs = [originalUrl];
      if (logoUrl) refs.push(logoUrl);
      const raw = await generateImage(LOVABLE_API_KEY, refinePromptBase(side, originalUrl), refs);
      const transparent = await removeBackground(REMOVE_BG_API_KEY, raw);

      console.log(`Regenerating ${side} mockup...`);
      const mockupPrompt = `Create a realistic, professional product photograph of a ${design.base_color} ${productLabel}. Studio lighting, clean light grey background, slightly angled flat-lay or ghost-mannequin style. Place the provided design centered on the ${side === "front" ? "front (chest area)" : "back"} of the garment, scaled appropriately and following the natural fabric drape. The design should look professionally printed onto the fabric. High-quality e-commerce product photography style.`;
      const mockupRaw = await generateImage(LOVABLE_API_KEY, mockupPrompt, [transparent]);

      const designUrl = await uploadToStorage(serviceClient, transparent, `${basePath}/${side}-design-${ts}.png`);
      const mockupUrl = await uploadToStorage(serviceClient, mockupRaw, `${basePath}/${side}-mockup-${ts}.png`);
      updates[`${side}_design_url`] = designUrl;
      updates[`${side}_mockup_url`] = mockupUrl;
    }

    // Clear stale size variants since base design changed
    updates.size_small_url = null as any;
    updates.size_medium_url = null as any;
    updates.size_large_url = null as any;
    updates.prompt = `${design.prompt || ""}\n[refine] ${refine_prompt}`.trim();

    const { data: updated, error: updateError } = await serviceClient
      .from("merch_designs").update(updates).eq("id", design.id).select().single();

    if (updateError) throw new Error(`Update failed: ${updateError.message}`);

    return new Response(JSON.stringify({ design: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("refine-merch-design error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
