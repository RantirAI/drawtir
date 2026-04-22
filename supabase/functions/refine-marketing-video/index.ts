import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WPS = 2.5;

async function callAI(apiKey: string, body: any) {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`AI gateway ${r.status}: ${await r.text()}`);
  return r.json();
}

async function generateImage(apiKey: string, prompt: string, refImageUrl?: string): Promise<string> {
  const content: any[] = [{ type: "text", text: prompt }];
  if (refImageUrl) content.push({ type: "image_url", image_url: { url: refImageUrl } });
  const data = await callAI(apiKey, {
    model: "google/gemini-3.1-flash-image-preview",
    messages: [{ role: "user", content }],
    modalities: ["image", "text"],
  });
  const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("No image returned");
  return url;
}

async function uploadDataUrl(supabase: any, dataUrl: string, path: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const { error } = await supabase.storage.from("media").upload(path, blob, { contentType: "image/png", upsert: true });
  if (error) throw new Error(`Upload: ${error.message}`);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

async function generateVoiceover(text: string, voiceId: string): Promise<ArrayBuffer> {
  const KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!KEY) throw new Error("ELEVENLABS_API_KEY not configured");
  const tryModel = async (model: string) => fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": KEY },
    body: JSON.stringify({
      text, model_id: model,
      voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  });
  let r = await tryModel("eleven_multilingual_v2");
  if (!r.ok) r = await tryModel("eleven_turbo_v2_5");
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${await r.text()}`);
  return r.arrayBuffer();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const {
      video_id,
      feedback = "",
      voice_id,         // optional new voice
      voice_name,       // optional new voice name
      regenerate_images = false, // default: only redo script + audio
    } = body;

    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: video, error: vErr } = await serviceClient
      .from("marketing_videos").select("*").eq("id", video_id).eq("user_id", userId).single();
    if (vErr || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: project } = await serviceClient
      .from("marketing_projects").select("name, knowledge_base, primary_color, logos").eq("id", video.project_id).single();
    if (!project) throw new Error("Project not found");

    const finalVoiceId = voice_id || video.voice_id;
    const finalVoiceName = voice_name || video.voice_name;
    const duration = video.duration_seconds;
    const sceneCount = (video.scenes as any[])?.length || (duration <= 15 ? 4 : duration <= 30 ? 6 : 8);
    const targetWords = Math.round(duration * WPS);
    const brandColor = project.primary_color || "#9b87f5";
    const logoUrl = project.logos?.[0] ?? null;
    const kb = (project.knowledge_base || "").slice(0, 1500);

    // 1. Regenerate plan with prior script + feedback as context
    const sys = `You are refining an existing marketing video script. Apply the user's feedback while keeping it ~${duration}s (~${targetWords} words). Return ${sceneCount} scenes. Brand: ${project.name}. Color accent: ${brandColor}.`;
    const userMsg = `BRAND KNOWLEDGE:
${kb || "(none)"}

PREVIOUS SCRIPT:
${video.script || "(none)"}

PREVIOUS DIRECTION:
${video.prompt || "(none)"}

USER FEEDBACK / CHANGES REQUESTED:
${feedback || "(no specific feedback — just improve and tighten)"}

Rewrite the full script and split into ${sceneCount} scenes. Each scene needs caption (2-6 words), voiceover (spoken line), visual_prompt (cinematic 16:9, no text/letters in image, accent ${brandColor}). End with clear CTA.`;

    const planResp = await callAI(LOVABLE_API_KEY, {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
      tools: [{
        type: "function",
        function: {
          name: "build_video_plan",
          parameters: {
            type: "object",
            properties: {
              full_script: { type: "string" },
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    caption: { type: "string" },
                    voiceover: { type: "string" },
                    visual_prompt: { type: "string" },
                  },
                  required: ["caption", "voiceover", "visual_prompt"],
                  additionalProperties: false,
                },
              },
            },
            required: ["full_script", "scenes"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "build_video_plan" } },
    });

    const toolCall = planResp.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No plan returned");
    const plan = JSON.parse(toolCall.function.arguments);
    const planScenes: { caption: string; voiceover: string; visual_prompt: string }[] = plan.scenes;
    const fullScript: string = plan.full_script;

    const basePath = `marketing-videos/${video.project_id}/${video.id}`;
    const stamp = Date.now();

    // 2. Optionally regenerate images
    let sceneImageUrls: string[];
    const existingScenes = (video.scenes as any[]) || [];
    if (regenerate_images) {
      const visualSuffix = `\n\nStyle: cinematic, premium brand marketing photography, high production value, soft natural lighting, shallow depth of field. 16:9 widescreen. Leave room for overlay text. Use ${brandColor} as a subtle accent. No text, letters, logos, or signage in the image.`;
      const dataUrls = await Promise.all(
        planScenes.map((s, i) => generateImage(LOVABLE_API_KEY, s.visual_prompt + visualSuffix, i === 0 && logoUrl ? logoUrl : undefined))
      );
      sceneImageUrls = await Promise.all(
        dataUrls.map((url, i) => uploadDataUrl(serviceClient, url, `${basePath}/scene-${i + 1}-${stamp}.png`))
      );
    } else {
      // Reuse existing images, padding/truncating to match new scene count
      sceneImageUrls = planScenes.map((_, i) => existingScenes[i]?.image_url || existingScenes[existingScenes.length - 1]?.image_url || video.thumbnail_url);
    }

    // 3. Regenerate voiceover (always — script or voice changed)
    const audioBuf = await generateVoiceover(fullScript, finalVoiceId);
    const audioPath = `${basePath}/voiceover-${stamp}.mp3`;
    const { error: audioErr } = await serviceClient.storage.from("media").upload(audioPath, audioBuf, { contentType: "audio/mpeg", upsert: true });
    if (audioErr) throw new Error(`Audio upload: ${audioErr.message}`);
    const audio_url = serviceClient.storage.from("media").getPublicUrl(audioPath).data.publicUrl;

    // 4. Rebuild scene timing
    const perScene = duration / planScenes.length;
    const scenes = planScenes.map((s, i) => ({
      caption: s.caption,
      voiceover: s.voiceover,
      visual_prompt: s.visual_prompt,
      image_url: sceneImageUrls[i],
      start: +(i * perScene).toFixed(2),
      duration: +perScene.toFixed(2),
    }));

    // 5. Update row, clear video_url so client re-renders
    const { data: updated, error: updErr } = await serviceClient
      .from("marketing_videos")
      .update({
        voice_id: finalVoiceId,
        voice_name: finalVoiceName,
        prompt: feedback ? (video.prompt ? `${video.prompt}\n\nRefinement: ${feedback}` : feedback) : video.prompt,
        script: fullScript,
        scenes,
        audio_url,
        video_url: null,
        thumbnail_url: sceneImageUrls[0] || video.thumbnail_url,
        status: "rendering",
        updated_at: new Date().toISOString(),
      })
      .eq("id", video.id)
      .select()
      .single();
    if (updErr) throw new Error(`Update: ${updErr.message}`);

    return new Response(JSON.stringify({ video: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    console.error("refine-marketing-video error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
