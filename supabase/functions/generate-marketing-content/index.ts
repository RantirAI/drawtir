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
      systemPrompt = `You are an expert marketing designer. Generate exactly 3 self-contained HTML poster designs.
Each poster must be a complete HTML document with inline Tailwind CSS via CDN.
Use the project's primary color (${project.primary_color}) as the main accent.
If logos are provided, include them as <img> tags.
Make the designs modern, professional, and visually striking with gradients, shadows, and clean typography.
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
