import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, reveCreateImage, uploadPngToMedia } from "../_shared/reve.ts";
import { ideogramCreateImage } from "../_shared/ideogram.ts";

const SCENE_SYSTEM = `You are a world-class art director. Convert the user's idea into a JSON scene spec for a poster/landing frame.

Return ONLY valid JSON matching this schema (no markdown, no prose):
{
  "title": string,                       // short frame title
  "aspectRatio": "16:9"|"1:1"|"9:16"|"4:3"|"3:4",
  "backgroundPrompt": string,            // rich, cinematic prompt for background image
  "backgroundColor": string,             // fallback hex, e.g. "#0a0a0b"
  "textColor": string,                   // hex, chosen for contrast on background
  "accentColor": string,                 // hex, brand accent for CTA
  "elements": [
    { "kind": "headline", "text": string, "fontSize": number, "fontWeight": "700"|"800"|"900", "x": number, "y": number, "width": number, "height": number, "textAlign": "left"|"center"|"right", "color": string },
    { "kind": "subheadline", "text": string, "fontSize": number, "x": number, "y": number, "width": number, "height": number, "textAlign": "left"|"center"|"right", "color": string },
    { "kind": "cta", "text": string, "x": number, "y": number, "width": number, "height": number, "bgColor": string, "textColor": string, "cornerRadius": number },
    { "kind": "shape", "shapeType": "rectangle"|"ellipse", "x": number, "y": number, "width": number, "height": number, "fill": string, "opacity": number, "cornerRadius": number }
  ]
}

Rules:
- Frame is 1600x900 for 16:9, 1200x1200 for 1:1, 900x1600 for 9:16, 1600x1200 for 4:3, 1200x1600 for 3:4.
- All x/y/width/height are in pixels within the frame.
- Include exactly 1 headline, 1 subheadline, 1 cta.
- Include 0-3 decorative shapes with low opacity (0.08-0.25) for depth.
- Choose a bold, opinionated color palette. Avoid generic purple/indigo gradients.
- Headline fontSize 72-140, subheadline 20-32, cta width 180-320 height 56-72.
- Position elements aesthetically (rule of thirds, generous whitespace).
- Text must be highly legible against the background (dark text on light bg, light text on dark bg).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") throw new Error("prompt required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    console.log("[generate-scene] prompt:", prompt.slice(0, 120));

    // 1) Ask Gemini for structured scene spec
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SCENE_SYSTEM },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      if (aiRes.status === 429) throw new Error("AI rate limit — try again in a moment");
      if (aiRes.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI failed ${aiRes.status}: ${t.slice(0, 400)}`);
    }

    const aiJson = await aiRes.json();
    const rawContent = aiJson.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("No scene spec returned");
    let spec: any;
    try {
      spec = JSON.parse(rawContent);
    } catch {
      throw new Error("Invalid scene JSON from AI");
    }

    console.log("[generate-scene] spec ready, generating background with Reve");

    // 2) Generate background via Reve
    const ar = spec.aspectRatio ?? "16:9";
    let bgUrl: string | null = null;
    try {
      const bytes = await reveCreateImage({
        prompt: spec.backgroundPrompt,
        aspect_ratio: ar,
        quality: 3,
      });
      const authHeader = req.headers.get("Authorization");
      const { publicUrl } = await uploadPngToMedia(authHeader, bytes, "scene-bg");
      bgUrl = publicUrl;
      console.log("[generate-scene] bg uploaded", bgUrl);
    } catch (e) {
      console.error("[generate-scene] Reve failed, using fallback color:", e);
    }

    return new Response(
      JSON.stringify({ spec, backgroundUrl: bgUrl, success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[generate-scene] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
