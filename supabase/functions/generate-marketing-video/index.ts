import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Words per second for ElevenLabs at default speed (~2.5 wps)
const WPS = 2.5;

interface SceneSpec {
  caption: string;       // on-screen overlay text
  visual_prompt: string; // image generation prompt
  start: number;         // seconds
  duration: number;      // seconds
}

async function callAI(apiKey: string, body: any) {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI gateway ${r.status}: ${t}`);
  }
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

async function uploadDataUrl(supabase: any, dataUrl: string, path: string, contentType = "image/png") {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    contentType, upsert: true,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

async function generateVoiceover(text: string, voiceId: string): Promise<ArrayBuffer> {
  const KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!KEY) throw new Error("ELEVENLABS_API_KEY not configured");

  const tryModel = async (model: string) => {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": KEY,
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    });
    return r;
  };

  let r = await tryModel("eleven_multilingual_v2");
  if (!r.ok) r = await tryModel("eleven_turbo_v2_5");
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`ElevenLabs error ${r.status}: ${t}`);
  }
  return r.arrayBuffer();
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
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const {
      project_id,
      duration_seconds = 30,
      voice_id,
      voice_name = "Voice",
      prompt = "",
      title = "Marketing video",
      tone = "professional",
    } = body;

    if (!project_id || !voice_id) {
      return new Response(JSON.stringify({ error: "project_id and voice_id are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: project, error: pErr } = await serviceClient
      .from("marketing_projects")
      .select("name, knowledge_base, primary_color, logos, images")
      .eq("id", project_id)
      .eq("user_id", userId)
      .single();
    if (pErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sceneCount = duration_seconds <= 15 ? 4 : duration_seconds <= 30 ? 6 : 8;
    const targetWords = Math.round(duration_seconds * WPS);
    const logoUrl = project.logos?.[0] ?? null;
    const brandColor = project.primary_color || "#9b87f5";
    const kb = (project.knowledge_base || "").slice(0, 1500);

    // 1. Generate script + scene plan via structured tool calling
    console.log("Generating script + scenes...");
    const scriptSystem = `You are a senior marketing video writer. Write a tight, professional voiceover script and a matching visual scene plan for a brand marketing video. The script must be spoken in roughly ${duration_seconds} seconds (~${targetWords} words total). Tone: ${tone}. Use the brand context — never invent unrelated facts. Keep it punchy, benefit-driven, ending with a clear CTA.`;

    const userMsg = `BRAND: ${project.name}
BRAND COLOR: ${brandColor}
DURATION: ${duration_seconds}s (~${targetWords} words)
SCENES: ${sceneCount}

BRAND KNOWLEDGE:
${kb || "(no extra context — keep it generic but on-brand)"}

USER DIRECTION (optional): ${prompt || "(none — write a strong general brand promo)"}

Write the script and split it into ${sceneCount} sequential scenes. Each scene needs:
- caption: a 2-6 word on-screen overlay (NOT the full voiceover line)
- voiceover: the spoken line for that scene (combined across scenes = full script)
- visual_prompt: a vivid, cinematic image prompt for that scene. Photographic, premium, brand-appropriate, 16:9, with a tasteful place for text. Reference brand color ${brandColor} as accent. NEVER include real text, fake logos, or written words inside the image — text will be overlaid separately.

Final scene must include a clear CTA caption.`;

    const planResp = await callAI(LOVABLE_API_KEY, {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: scriptSystem },
        { role: "user", content: userMsg },
      ],
      tools: [{
        type: "function",
        function: {
          name: "build_video_plan",
          description: "Return the script and scene breakdown.",
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

    // 2. Generate scene images in parallel
    console.log(`Generating ${planScenes.length} scene images...`);
    const visualBaseSuffix = `\n\nStyle: cinematic, premium brand marketing photography, high production value, soft natural lighting, shallow depth of field. 16:9 widescreen. Leave room for overlay text. Use ${brandColor} as a subtle accent color in the scene (lighting, props, environment) but keep the overall palette tasteful. Absolutely no text, no letters, no logos, no signage in the image.`;
    const imageUrls = await Promise.all(
      planScenes.map((s, i) =>
        generateImage(LOVABLE_API_KEY, s.visual_prompt + visualBaseSuffix, i === 0 && logoUrl ? logoUrl : undefined)
      )
    );

    // 3. Generate voiceover (single take for natural prosody)
    console.log("Generating voiceover...");
    const audioBuf = await generateVoiceover(fullScript, voice_id);

    // 4. Upload assets
    const videoId = crypto.randomUUID();
    const basePath = `marketing-videos/${project_id}/${videoId}`;

    console.log("Uploading scene images...");
    const sceneImageUrls = await Promise.all(
      imageUrls.map((url, i) => uploadDataUrl(serviceClient, url, `${basePath}/scene-${i + 1}.png`))
    );

    console.log("Uploading voiceover...");
    const { error: audioErr } = await serviceClient.storage
      .from("media")
      .upload(`${basePath}/voiceover.mp3`, audioBuf, { contentType: "audio/mpeg", upsert: true });
    if (audioErr) throw new Error(`Audio upload: ${audioErr.message}`);
    const { data: audioPub } = serviceClient.storage.from("media").getPublicUrl(`${basePath}/voiceover.mp3`);
    const audio_url = audioPub.publicUrl;

    // 5. Build scene timing (evenly distributed; client refines on render)
    const perScene = duration_seconds / planScenes.length;
    const scenes: (SceneSpec & { voiceover: string; image_url: string })[] = planScenes.map((s, i) => ({
      caption: s.caption,
      voiceover: s.voiceover,
      visual_prompt: s.visual_prompt,
      image_url: sceneImageUrls[i],
      start: +(i * perScene).toFixed(2),
      duration: +perScene.toFixed(2),
    }));

    // 6. Save row (video_url remains null until client renders & uploads)
    const { data: inserted, error: insErr } = await serviceClient
      .from("marketing_videos")
      .insert({
        id: videoId,
        project_id,
        user_id: userId,
        title,
        duration_seconds,
        voice_id,
        voice_name,
        prompt,
        script: fullScript,
        scenes,
        audio_url,
        thumbnail_url: sceneImageUrls[0],
        status: "rendering",
      })
      .select()
      .single();
    if (insErr) throw new Error(`Insert: ${insErr.message}`);

    return new Response(JSON.stringify({ video: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("generate-marketing-video error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
