import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STYLE_PROMPTS: Record<string, string> = {
  corporate: "professional corporate design, clean modern aesthetic, refined and tasteful, sophisticated typography (sans-serif like Helvetica/Inter), structured layout with strong grid alignment, restrained color palette, premium business-appropriate look, suitable for company merchandise and team apparel",
  minimal: "minimal design, clean lines, monochrome palette, lots of negative space, refined typography, modern and understated",
  vintage: "vintage retro design, distressed textures, weathered look, retro typography (70s/80s), faded and aged color palette, classic Americana feel",
  streetwear: "streetwear graphic design, bold layered graphics, oversized typography, urban aesthetic, hype-beast style, high contrast",
  bold_typography: "bold typography-driven design, oversized text as the main subject, geometric letterforms, wordmark hero, strong type hierarchy",
  illustrated: "hand-drawn illustration, organic linework, character or scene-based artwork, sketchy ink style, expressive and playful",
  y2k: "Y2K aesthetic, chrome and metallic gradients, futuristic 2000s style, glossy 3D elements, cyber/tech vibe, vibrant gradients",
  grunge: "grunge style, torn edges, splatter and ink textures, rough distressed look, punk/rock aesthetic, dark moody palette",
};

const PRODUCT_LABELS: Record<string, string> = {
  hoodie: "hoodie",
  tshirt: "t-shirt",
  crewneck: "crewneck sweatshirt",
  cap: "baseball cap",
  tote: "canvas tote bag",
  mug: "ceramic mug",
  handbag: "structured handbag (leather-look)",
  paper_bag: "premium retail paper shopping bag with rope handles",
  shopping_bag: "reusable woven shopping bag",
  backpack: "minimal everyday backpack",
  drawstring_bag: "cinch drawstring bag",
};

const BAG_PRODUCTS = new Set(["tote", "handbag", "paper_bag", "shopping_bag", "backpack", "drawstring_bag"]);

async function generateImage(apiKey: string, prompt: string, inputImageUrl?: string): Promise<string> {
  const content: any[] = [{ type: "text", text: prompt }];
  if (inputImageUrl) {
    content.push({ type: "image_url", image_url: { url: inputImageUrl } });
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
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
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: formData,
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

async function uploadToStorage(
  supabase: any,
  dataUrl: string,
  path: string
): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    contentType: "image/png",
    upsert: true,
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
    const {
      project_id, product_type = "tshirt", base_color = "black",
      style = "minimal", prompt = "", use_logo = true, use_brand_color = true,
    } = body;

    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: project, error: projectError } = await serviceClient
      .from("marketing_projects")
      .select("name, knowledge_base, primary_color, logos")
      .eq("id", project_id)
      .eq("user_id", userId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const styleDesc = STYLE_PROMPTS[style] || STYLE_PROMPTS.corporate;
    const productLabel = PRODUCT_LABELS[product_type] || "t-shirt";
    const brandColor = use_brand_color && project.primary_color ? project.primary_color : null;
    const logoUrl = use_logo && project.logos?.length ? project.logos[0] : null;
    const knowledgeContext = project.knowledge_base
      ? `\n\nBrand context (use this to inform tone and message — do NOT invent unrelated taglines): ${project.knowledge_base.slice(0, 800)}`
      : "";
    const customPrompt = prompt ? `\n\nUser direction: ${prompt}` : "";
    const colorDirective = brandColor ? `Use the brand color ${brandColor} as the primary accent. Do not introduce unrelated colors.` : "Use a restrained, intentional color palette. Avoid random rainbow colors.";

    const logoDirective = logoUrl
      ? `\n\nBRAND LOGO: A reference image of the official brand logo is provided. You MUST use THIS EXACT logo in the design — do not redraw it, do not invent a new logo, do not modify its shape or letterforms. Place it cleanly and integrate it into the composition. The logo's identity must remain perfectly recognizable.`
      : "";

    const baseDesignPrompt = `Design a professional, print-ready apparel graphic for a ${productLabel}. Brand: "${project.name}".

Style: ${styleDesc}
${colorDirective}${logoDirective}${knowledgeContext}${customPrompt}

CRITICAL QUALITY REQUIREMENTS:
- The design must be ISOLATED on a pure solid white background (#FFFFFF)
- No mockup, no garment, no person, no model — just the flat graphic design
- Clean, intentional, professional composition — NOT random, NOT cluttered, NOT chaotic
- Typography must be perfectly legible, correctly spelled, and properly kerned (no garbled or fake letters)
- All text must be real readable words tied to the brand — never lorem ipsum or nonsense
- Sharp vector-quality edges, high resolution, suitable for screen printing or DTG
- Centered with balanced margins
- Tasteful and brand-appropriate — avoid amateurish clip-art, avoid overly busy elements
- The result should look like work from a senior apparel designer, not AI noise`;

    const frontPrompt = `${baseDesignPrompt}

PANEL: FRONT design — a refined hero graphic or wordmark for the chest area. Medium scale, balanced, immediately readable. If a logo is provided, the front should feature it prominently and cleanly.`;

    const backPrompt = `${baseDesignPrompt}

PANEL: BACK design — a larger complementary piece that feels like the same collection as the front. Can include a tagline (drawn from brand context only), supporting graphic, or expanded wordmark. Maintain the same color palette and visual language as the front.`;

    console.log("Generating front design...");
    const frontRaw = await generateImage(LOVABLE_API_KEY, frontPrompt, logoUrl ?? undefined);
    console.log("Generating back design...");
    const backRaw = await generateImage(LOVABLE_API_KEY, backPrompt, logoUrl ?? undefined);

    console.log("Removing backgrounds...");
    const [frontTransparent, backTransparent] = await Promise.all([
      removeBackground(REMOVE_BG_API_KEY, frontRaw),
      removeBackground(REMOVE_BG_API_KEY, backRaw),
    ]);

    const mockupBase = `Create a realistic, professional product photograph of a ${base_color} ${productLabel}. Studio lighting, clean light grey background, slightly angled flat-lay or ghost-mannequin style. Place the provided design centered on the FRONT_OR_BACK of the garment, scaled appropriately and following the natural fabric drape. The design should look professionally printed onto the fabric. High-quality e-commerce product photography style.`;

    console.log("Generating front mockup...");
    const frontMockupRaw = await generateImage(
      LOVABLE_API_KEY,
      mockupBase.replace("FRONT_OR_BACK", "front (chest area)"),
      frontTransparent
    );
    console.log("Generating back mockup...");
    const backMockupRaw = await generateImage(
      LOVABLE_API_KEY,
      mockupBase.replace("FRONT_OR_BACK", "back"),
      backTransparent
    );

    const designId = crypto.randomUUID();
    const basePath = `merch/${project_id}/${designId}`;
    console.log("Uploading to storage...");
    const [front_design_url, back_design_url, front_mockup_url, back_mockup_url] = await Promise.all([
      uploadToStorage(serviceClient, frontTransparent, `${basePath}/front-design.png`),
      uploadToStorage(serviceClient, backTransparent, `${basePath}/back-design.png`),
      uploadToStorage(serviceClient, frontMockupRaw, `${basePath}/front-mockup.png`),
      uploadToStorage(serviceClient, backMockupRaw, `${basePath}/back-mockup.png`),
    ]);

    const { data: inserted, error: insertError } = await serviceClient
      .from("merch_designs")
      .insert({
        id: designId, project_id, user_id: userId,
        product_type, base_color, style, prompt,
        use_logo, use_brand_color,
        front_design_url, back_design_url, front_mockup_url, back_mockup_url,
      })
      .select()
      .single();

    if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

    return new Response(JSON.stringify({ design: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("generate-merch-design error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
