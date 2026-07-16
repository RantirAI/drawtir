import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/reve.ts";

const SYSTEM = `You are a motion designer. Given a list of canvas elements, output tasteful entrance animations that feel modern and choreographed (staggered, hierarchical). Return ONLY JSON:
{
  "animations": [
    { "id": "<element id>", "type": "fade-in"|"slide-in-from-top"|"slide-in-from-bottom"|"slide-in-from-left"|"slide-in-from-right"|"zoom-in", "delay": "<seconds>s", "duration": "<seconds>s", "timingFunction": "ease-out"|"ease-in-out"|"cubic-bezier(0.16,1,0.3,1)" }
  ]
}
Rules:
- Stagger delays 0.05-0.15s apart based on element order and hierarchy (headline first, decorations later).
- Duration 0.5-1.1s.
- Prefer slide-in-from-bottom or fade-in for text, zoom-in for CTAs, fade-in for background shapes.
- Every element in the input must appear exactly once in the output.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { elements } = await req.json();
    if (!Array.isArray(elements) || elements.length === 0) throw new Error("elements required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const minimal = elements.map((e: any) => ({
      id: e.id,
      type: e.type,
      name: e.name ?? e.text?.slice?.(0, 40) ?? e.type,
      hasText: !!e.text,
    }));

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify({ elements: minimal }) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) throw new Error("AI rate limit");
      if (res.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI failed ${res.status}: ${t.slice(0, 300)}`);
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw);
    return new Response(JSON.stringify({ animations: parsed.animations ?? [], success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[auto-animate] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
