import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, reveCreateImage, uploadPngToMedia } from "../_shared/reve.ts";
import { ideogramCreateImage } from "../_shared/ideogram.ts";

const SCENE_SYSTEM = `You are a world-class art director. Convert the user's idea into a JSON scene spec for a poster/landing frame.

Return ONLY valid JSON matching this schema (no markdown, no prose):
{
  "title": string,
  "aspectRatio": "16:9"|"1:1"|"9:16"|"4:3"|"3:4",
  "backgroundPrompt": string,
  "backgroundColor": string,
  "textColor": string,
  "accentColor": string,
  "elements": [
    { "kind": "headline", "text": string, "fontSize": number, "fontWeight": "700"|"800"|"900", "x": number, "y": number, "width": number, "height": number, "textAlign": "left"|"center"|"right", "color": string },
    { "kind": "subheadline", "text": string, "fontSize": number, "x": number, "y": number, "width": number, "height": number, "textAlign": "left"|"center"|"right", "color": string },
    { "kind": "cta", "text": string, "x": number, "y": number, "width": number, "height": number, "bgColor": string, "textColor": string, "cornerRadius": number },
    { "kind": "shape", "shapeType": "rectangle"|"ellipse", "x": number, "y": number, "width": number, "height": number, "fill": string, "opacity": number, "cornerRadius": number }
  ]
}

Frame sizes (pixels): 16:9=1600x900, 1:1=1200x1200, 9:16=900x1600, 4:3=1600x1200, 3:4=1200x1600.

LAYOUT RULES (critical — obey exactly):
- All x/y/width/height in pixels within the frame. NOTHING may exceed the frame bounds. Keep a 64px safe margin from every edge.
- Exactly 1 headline, 1 subheadline, 1 cta. 0-2 decorative shapes.
- Headline width MUST be at least 70% of frame width and fit on 1-2 lines. Pick fontSize based on text length:
  * ≤20 chars: 96-120
  * 21-35 chars: 72-92
  * 36-60 chars: 52-68
  * >60 chars: 40-52
  Headline height = fontSize * 2.4 (allow 2 lines).
- Subheadline: fontSize 20-28, width 55-75% of frame, placed 24-40px below headline.
- CTA: width 200-280, height 56-64, placed 40-60px below subheadline, cornerRadius 12.
- Decorative shapes must have visible fill with opacity 0.15-0.35 (never below 0.12, never outlined-only). Place them in corners/edges, NOT overlapping text. Size 300-600px.
- Use rule-of-thirds. Left-align typical for landing hero; center-align for posters.
- Text color must contrast strongly with backgroundColor (WCAG AA).
- Pick a bold, opinionated palette. Avoid generic purple/indigo gradients.
- backgroundPrompt: rich cinematic description, no text/logos in the image.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, provider } = await req.json();
    const imageProvider: "reve" | "ideogram" = provider === "ideogram" ? "ideogram" : "reve";
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

    console.log(`[generate-scene] spec ready, generating background with ${imageProvider}`);

    // 2) Generate background via chosen provider
    const ar = spec.aspectRatio ?? "16:9";
    let bgUrl: string | null = null;
    try {
      const bytes = imageProvider === "ideogram"
        ? await ideogramCreateImage({
            prompt: spec.backgroundPrompt,
            aspect_ratio: ar,
            rendering_speed: "QUALITY",
          })
        : await reveCreateImage({
            prompt: spec.backgroundPrompt,
            aspect_ratio: ar as any,
            quality: 3,
          });
      const authHeader = req.headers.get("Authorization");
      const { publicUrl } = await uploadPngToMedia(authHeader, bytes, `scene-bg-${imageProvider}`);
      bgUrl = publicUrl;
      console.log("[generate-scene] bg uploaded", bgUrl);
    } catch (e) {
      console.error(`[generate-scene] ${imageProvider} failed, using fallback color:`, e);
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
