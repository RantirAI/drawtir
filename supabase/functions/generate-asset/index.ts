import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id, prompt, category } = await req.json();
    if (!project_id || !prompt) {
      return new Response(JSON.stringify({ error: "project_id and prompt are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project context
    const { data: project, error: projErr } = await supabase
      .from("asset_projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build style-aware prompt
    const styleMap: Record<string, string> = {
      pixel_art: "pixel art style, 16-bit retro game aesthetic, clean pixels, no anti-aliasing",
      hand_drawn: "hand-drawn illustration style, sketch-like, organic lines, watercolor textures",
      vector: "clean vector art style, flat design, bold outlines, smooth gradients",
      realistic: "realistic digital painting style, detailed textures, proper lighting and shadows",
      anime: "anime/manga art style, cel-shaded, vibrant colors, expressive",
      low_poly: "low-poly 3D rendered style, geometric shapes, minimal detail, modern aesthetic",
    };

    const styleDesc = styleMap[project.art_style] || styleMap["pixel_art"];
    const contextParts = [
      `Create a SINGLE 2D game asset in ${styleDesc}.`,
      "IMPORTANT: Generate exactly ONE asset/character/item centered in the image. Do NOT place multiple characters, sprites, or variations in the same image. Only one isolated element.",
      "CRITICAL: The asset MUST be on a completely clean, solid white background. No gradients, no scenery, no shadows on the background, no ground, no environment. Just the single isolated asset/character on pure white. This is essential so the background can be removed cleanly.",
      project.knowledge_base ? `Game context: ${project.knowledge_base}` : "",
      `Asset request: ${prompt}`,
      "Make the asset high quality, well-composed, and ready to use in a game.",
    ].filter(Boolean);

    const fullPrompt = contextParts.join("\n");

    // Generate image via Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      return new Response(JSON.stringify({ error: "Failed to generate image" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Remove background using remove.bg API
    let finalBase64 = base64;
    const REMOVE_BG_API_KEY = Deno.env.get("REMOVE_BG_API_KEY");
    if (REMOVE_BG_API_KEY) {
      try {
        console.log("Removing background...");
        const formData = new FormData();
        const blob = new Blob([bytes], { type: "image/png" });
        formData.append("image_file", blob, "image.png");
        formData.append("size", "auto");

        const bgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: { "X-Api-Key": REMOVE_BG_API_KEY },
          body: formData,
        });

        if (bgResponse.ok) {
          const resultBlob = await bgResponse.blob();
          const arrayBuffer = await resultBlob.arrayBuffer();
          finalBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          console.log("Background removed successfully");
        } else {
          console.error("Background removal failed, using original image:", bgResponse.status);
        }
      } catch (bgErr) {
        console.error("Background removal error, using original:", bgErr);
      }
    } else {
      console.log("REMOVE_BG_API_KEY not set, skipping background removal");
    }

    // Upload to storage
    const finalBytes = Uint8Array.from(atob(finalBase64), (c) => c.charCodeAt(0));
    const fileName = `assets/${project_id}/${crypto.randomUUID()}.png`;

    const { error: uploadErr } = await supabase.storage
      .from("media")
      .upload(fileName, finalBytes, { contentType: "image/png", upsert: false });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "Failed to upload image" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);

    return new Response(JSON.stringify({ 
      image_url: publicUrl,
      file_name: fileName.split("/").pop(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
