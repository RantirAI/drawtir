import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id, output_type, platform, custom_prompt } = await req.json();

    if (!project_id || !output_type) {
      return new Response(JSON.stringify({ error: "project_id and output_type required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: project, error: projErr } = await supabase
      .from("marketing_projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const brandContext = `
PROJECT: ${project.name}
DESCRIPTION: ${project.description || "N/A"}
KNOWLEDGE BASE: ${project.knowledge_base || "No knowledge base provided"}
PRIMARY COLOR: ${project.primary_color || "#9b87f5"}
LOGOS: ${(project.logos || []).length > 0 ? project.logos.join(", ") : "No logos"}
IMAGES: ${(project.images || []).length > 0 ? project.images.join(", ") : "No images"}
    `.trim();

    let systemPrompt = "";
    let userPrompt = custom_prompt || `Generate marketing content for ${project.name}`;
    const targetPlatform = platform || "general";

    if (output_type === "poster") {
      systemPrompt = `You are a world-class creative director and visual designer. Generate exactly 3 self-contained HTML poster designs that look like they belong in a design magazine or Behance featured project.

Each poster MUST be a complete HTML document with:
- Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Google Fonts imported via <link> for premium typography (use combinations like Inter + Playfair Display, Space Grotesk + DM Serif, Outfit + Fraunces)
- The viewport set to a poster ratio (e.g. 1080x1350 or 1080x1080)

DESIGN PRINCIPLES - Follow these religiously:
1. LAYERED DEPTH: Use overlapping elements, glassmorphism (backdrop-blur, bg-white/10, border border-white/20), and z-index layering
2. BOLD TYPOGRAPHY: Mix font weights dramatically (100 vs 900), use massive hero text (text-6xl to text-9xl), creative letter-spacing (tracking-tighter or tracking-widest)
3. GRADIENT MASTERY: Use multi-stop gradients, mesh-gradient-style backgrounds with multiple radial gradients overlapping, gradient text (bg-clip-text text-transparent)
4. COLOR SOPHISTICATION: Primary color is ${project.primary_color}. Build a rich palette around it with complementary tones, use opacity variations (from /5 to /90) for depth
5. GEOMETRIC ACCENTS: Add decorative circles, lines, dots, grid patterns using CSS (border-radius, borders, pseudo-elements via inline styles)
6. NEGATIVE SPACE: Use generous whitespace strategically - let elements breathe
7. MODERN EFFECTS: Subtle shadows (shadow-2xl), rounded corners, blur effects, border accents
8. VISUAL HIERARCHY: One dominant element, clear reading order, intentional contrast

Each design should have a COMPLETELY DIFFERENT layout approach:
- Design 1: Bold editorial style with massive typography and geometric shapes
- Design 2: Minimalist luxury with lots of whitespace, thin fonts, and subtle gradients  
- Design 3: Dynamic and energetic with overlapping elements, bold colors, and creative composition

If logos are provided, incorporate them elegantly. Use the body with min-h-screen and overflow-hidden.
Return ONLY a JSON array of 3 objects: [{"title":"...","html":"<!DOCTYPE html>..."},...]
No markdown, no code fences, just the JSON array.`;
    } else if (output_type === "social_post") {
      systemPrompt = `You are a social media marketing expert. Generate 3 platform-specific posts for ${targetPlatform}.
Each post should include: caption, hashtags, and a suggested visual description.
${targetPlatform === "linkedin" ? "Use professional tone, longer form, industry insights." : ""}
${targetPlatform === "instagram" ? "Use casual, engaging tone with emojis and visual hooks." : ""}
${targetPlatform === "tiktok" ? "Use trendy, short-form, hook-driven style." : ""}
Return ONLY a JSON array of 3 objects: [{"title":"...","caption":"...","hashtags":["..."],"visual_description":"..."},...]
No markdown, no code fences, just the JSON array.`;
    } else if (output_type === "slide") {
      systemPrompt = `You are a presentation designer. Generate a complete slide deck as self-contained HTML.
Create 5-8 slides in a single HTML document with Tailwind CSS CDN.
Use the project's primary color (${project.primary_color}).
Include navigation arrows between slides using JavaScript.
Make it modern and professional with clean layouts.
Return ONLY a JSON array of 1 object: [{"title":"...","html":"<!DOCTYPE html>..."}]
No markdown, no code fences, just the JSON array.`;
    } else if (output_type === "strategy") {
      systemPrompt = `You are a marketing strategist. Create a comprehensive marketing plan.
Include: target audience analysis, content calendar (2 weeks), channel strategy, key messaging, and KPIs.
Format with clear sections and actionable items.
Return ONLY a JSON array of 1 object: [{"title":"Marketing Strategy","content":"...markdown formatted strategy..."}]
No markdown fences around the JSON, just the JSON array.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${brandContext}\n\nREQUEST: ${userPrompt}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    let rawContent = aiData.choices?.[0]?.message?.content || "[]";
    
    // Clean markdown fences if present
    rawContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let results;
    try {
      results = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent.substring(0, 500));
      results = [{ title: "Generated Content", content: rawContent }];
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
