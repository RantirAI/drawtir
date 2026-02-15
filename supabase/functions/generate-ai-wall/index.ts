import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, count = 4 } = await req.json();
    if (!prompt) throw new Error("Prompt is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert web designer. Generate ${count} COMPLETELY DIFFERENT self-contained HTML designs based on the user's request.

CRITICAL RULES:
- Each design MUST be a complete, self-contained HTML document
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Create visually stunning designs inspired by Aceternity UI aesthetics:
  - Glassmorphism (backdrop-blur, semi-transparent backgrounds)
  - Gradient backgrounds (mesh gradients, radial gradients)
  - Smooth animations using CSS @keyframes
  - Floating elements, glowing effects, spotlight effects
  - Modern typography with Google Fonts
  - Dark themes with accent colors
  - Grid patterns, dot patterns as subtle backgrounds
  - Card hover effects with transforms
  - Text gradient effects
  - Beam/ray effects using CSS
- Each design should have a DIFFERENT layout, color scheme, and style approach
- Make designs responsive and visually complete
- Include realistic placeholder content relevant to the user's request
- Use inline <style> tags for custom CSS animations
- Images should use https://images.unsplash.com with relevant search terms
- Keep each HTML under 8000 characters

Return a JSON array of objects with this exact format:
[
  { "title": "Design Name", "html": "<!DOCTYPE html>..." },
  { "title": "Design Name", "html": "<!DOCTYPE html>..." }
]

Return ONLY the JSON array, no markdown, no code fences, no explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content returned from AI");

    // Parse the JSON response - handle potential markdown fences
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let designs;
    try {
      designs = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleaned.substring(0, 500));
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!Array.isArray(designs)) throw new Error("Expected array of designs");

    return new Response(JSON.stringify({ designs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-ai-wall error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
