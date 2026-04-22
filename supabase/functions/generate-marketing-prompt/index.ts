import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      project_id,
      goal,
      target,
      notes,
      count = 4,
    } = await req.json();

    if (!project_id || !goal) {
      return new Response(
        JSON.stringify({ error: "project_id and goal are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: project, error: projErr } = await supabase
      .from("marketing_projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: featured } = await supabase
      .from("marketing_featured_images")
      .select("label, description")
      .eq("project_id", project_id)
      .order("sort_order", { ascending: true });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const featuredList = (featured || [])
      .map((f) => `- ${f.label}${f.description ? `: ${f.description}` : ""}`)
      .join("\n") || "(none)";

    const forbidden = (project.forbidden_words || []).join(", ") || "(none)";

    const brandContext = `BRAND: ${project.name}
DESCRIPTION: ${project.description || "(none)"}
KNOWLEDGE BASE:
${project.knowledge_base || "(empty)"}

BRAND VOICE: ${project.brand_voice || "(default)"}
COUNTRY: ${project.country || "United States"}
CURRENCY: ${project.currency || "USD"}
LANGUAGE: ${project.language || "English"}
FORBIDDEN WORDS/CLAIMS: ${forbidden}

FEATURED PRODUCT SCREENSHOTS AVAILABLE:
${featuredList}`;

    const systemPrompt = `You are an expert marketing prompt engineer. You craft tight, ready-to-use prompts for an AI marketing video/content generator, grounded in the brand's real knowledge base.

Rules:
- Each prompt must read like a clear creative brief: angle, audience, key benefit, call to action.
- Reference real things from the knowledge base (features, pages, offers) — never invent facts.
- Respect the brand voice and locale (${project.country || "US"}, ${project.currency || "USD"}, ${project.language || "English"}).
- Avoid forbidden words: ${forbidden}.
- When relevant, suggest using specific featured screenshots by their label.
- Keep each prompt 2-4 sentences. No fluff, no quotes around it.
- Vary angles: feature spotlight, social proof, problem→solution, seasonal, localized, comparison, founder voice, etc.`;

    const userPrompt = `${brandContext}

USER GOAL: ${goal}
TARGET CHANNEL/FORMAT: ${target || "any"}
EXTRA NOTES: ${notes || "(none)"}

Generate ${count} distinct, production-ready prompts the user can paste into the marketing video / content generator.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_prompts",
              description: "Return crafted marketing prompts.",
              parameters: {
                type: "object",
                properties: {
                  prompts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        angle: { type: "string", description: "Short label, e.g. 'Feature spotlight: Event add page'" },
                        prompt: { type: "string", description: "The full ready-to-use prompt." },
                        suggested_featured_labels: {
                          type: "array",
                          items: { type: "string" },
                          description: "Featured image labels that fit this prompt (use empty array if none).",
                        },
                      },
                      required: ["angle", "prompt", "suggested_featured_labels"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["prompts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_prompts" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = null;
    try {
      parsed = JSON.parse(toolCall?.function?.arguments || "{}");
    } catch {
      parsed = null;
    }

    const prompts = Array.isArray(parsed?.prompts) ? parsed.prompts : [];
    if (prompts.length === 0) {
      return new Response(JSON.stringify({ error: "No prompts generated. Try refining your goal." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ prompts }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-marketing-prompt error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
