import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WPS = 2.5;

interface PlanScene {
  caption: string;
  voiceover: string;
  scene_type: "cinematic" | "featured" | "logo_subject";
  visual_prompt: string;
  featured_image_label?: string;
  featured_image_treatment?: "fullscreen" | "device_mockup";
  logo_subject_kind?: "shirt" | "hat" | "mug" | "laptop" | "tote" | "phone_case";
}

async function callAI(apiKey: string, body: any) {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`AI gateway ${r.status}: ${await r.text()}`);
  return r.json();
}

async function generateImage(apiKey: string, prompt: string, refUrls: string[] = []): Promise<string> {
  const content: any[] = [{ type: "text", text: prompt }];
  for (const url of refUrls) content.push({ type: "image_url", image_url: { url } });
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
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw new Error(`Upload: ${error.message}`);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

async function generateVoiceWithAlignment(text: string, voiceId: string) {
  const KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!KEY) throw new Error("ELEVENLABS_API_KEY not configured");

  const tryModel = async (model: string) =>
    fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "xi-api-key": KEY },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: { stability: 0.55, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true },
      }),
    });

  let r = await tryModel("eleven_multilingual_v2");
  if (!r.ok) r = await tryModel("eleven_turbo_v2_5");
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${await r.text()}`);

  const json = await r.json();
  const audio = Uint8Array.from(atob(json.audio_base64), (c) => c.charCodeAt(0)).buffer;
  const align = json.alignment || json.normalized_alignment;
  const words: { word: string; start: number; end: number }[] = [];
  if (align?.characters?.length) {
    const chars: string[] = align.characters;
    const starts: number[] = align.character_start_times_seconds;
    const ends: number[] = align.character_end_times_seconds;
    let buf = "";
    let wStart = 0;
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (/\s/.test(c)) {
        if (buf) {
          words.push({ word: buf, start: wStart, end: ends[i - 1] ?? wStart });
          buf = "";
        }
      } else {
        if (!buf) wStart = starts[i];
        buf += c;
      }
    }
    if (buf) words.push({ word: buf, start: wStart, end: ends[ends.length - 1] });
  }
  return { audio, words };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const {
      video_id,
      feedback = "",
      voice_id,
      voice_name,
      regenerate_images = false,
    } = body;

    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: video, error: vErr } = await serviceClient
      .from("marketing_videos")
      .select("*")
      .eq("id", video_id)
      .eq("user_id", userId)
      .single();
    if (vErr || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project } = await serviceClient
      .from("marketing_projects")
      .select("name, knowledge_base, primary_color, logos, country, currency, language, brand_voice, forbidden_words")
      .eq("id", video.project_id)
      .single();
    if (!project) throw new Error("Project not found");

    const { data: featured } = await serviceClient
      .from("marketing_featured_images")
      .select("id, image_url, label, description")
      .eq("project_id", video.project_id)
      .order("sort_order");
    const featuredList = featured || [];

    const finalVoiceId = voice_id || video.voice_id;
    const finalVoiceName = voice_name || video.voice_name;
    const duration = video.duration_seconds;
    const sceneCount = (video.scenes as any[])?.length || (duration <= 15 ? 4 : duration <= 30 ? 6 : 8);
    const targetWords = Math.round(duration * WPS);
    const brandColor = project.primary_color || "#9b87f5";
    const logoUrl = project.logos?.[0] ?? null;
    const kb = (project.knowledge_base || "").slice(0, 1500);

    const country = (video.country || project.country || "United States").trim();
    const currency = (video.currency || project.currency || "USD").trim().toUpperCase();
    const language = (video.language || project.language || "English").trim();
    const brandVoice = (project.brand_voice || "").trim();
    const forbidden: string[] = Array.isArray(project.forbidden_words) ? project.forbidden_words : [];

    const featuredCatalog = featuredList.length
      ? featuredList.map((f, i) => `${i + 1}. "${f.label}" — ${f.description || "(no description)"}`).join("\n")
      : "(no labeled product screenshots — do NOT use scene_type=featured)";

    const sys = `You are refining an existing marketing video script. Apply the user's feedback while keeping it ~${duration}s (~${targetWords} words). Return ${sceneCount} scenes. Brand: ${project.name}. Color accent: ${brandColor}.

LOCALE: Brand operates in ${country}. Audience speaks ${language}. ALL currency figures must be ${currency}.
${brandVoice ? `BRAND VOICE: ${brandVoice}\n` : ""}
${forbidden.length ? `FORBIDDEN: never use ${forbidden.join(", ")}\n` : ""}`;

    const userMsg = `BRAND KNOWLEDGE:
${kb || "(none)"}

PREVIOUS SCRIPT:
${video.script || "(none)"}

PREVIOUS DIRECTION:
${video.prompt || "(none)"}

USER FEEDBACK / CHANGES REQUESTED:
${feedback || "(no specific feedback — just improve and tighten)"}

LABELED PRODUCT SCREENSHOTS AVAILABLE:
${featuredCatalog}

Rewrite the full script and split into ${sceneCount} scenes. Each scene chooses scene_type:
- "cinematic" — premium photography (visual_prompt only)
- "featured" — show real product screenshot (set featured_image_label EXACTLY from catalog, treatment fullscreen|device_mockup)
- "logo_subject" — person/product with brand applied (set logo_subject_kind)
Each scene: caption (2-6 words), voiceover line, visual_prompt (no text/letters/logos in image, accent ${brandColor}). End with clear CTA.`;

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
                    scene_type: { type: "string", enum: ["cinematic", "featured", "logo_subject"] },
                    visual_prompt: { type: "string" },
                    featured_image_label: { type: "string" },
                    featured_image_treatment: { type: "string", enum: ["fullscreen", "device_mockup"] },
                    logo_subject_kind: { type: "string", enum: ["shirt", "hat", "mug", "laptop", "tote", "phone_case"] },
                  },
                  required: ["caption", "voiceover", "scene_type", "visual_prompt"],
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
    const planScenes: PlanScene[] = plan.scenes;
    const fullScript: string = plan.full_script;

    const basePath = `marketing-videos/${video.project_id}/${video.id}`;
    const stamp = Date.now();
    const baseStyle = `\n\nStyle: cinematic, premium brand marketing photography, high production value, soft natural lighting, shallow depth of field. 16:9 widescreen. Leave room for overlay text. Use ${brandColor} as a subtle accent. No text, letters, logos, or signage in the image.`;
    const existingScenes = (video.scenes as any[]) || [];

    const sceneAssetPromises = planScenes.map(async (s, i): Promise<any> => {
      // FEATURED scenes always use the actual screenshot (fast — no AI needed for fullscreen).
      if (s.scene_type === "featured" && s.featured_image_label) {
        const match = featuredList.find(
          (f) => f.label.toLowerCase().trim() === s.featured_image_label!.toLowerCase().trim(),
        ) || featuredList[0];
        if (match) {
          if (s.featured_image_treatment === "device_mockup" && regenerate_images) {
            try {
              const composed = await generateImage(
                LOVABLE_API_KEY,
                `Place this exact UI screenshot, unmodified and pixel-perfect, displayed on the screen of a sleek modern laptop sitting on a beautiful desk in a premium environment. Cinematic lighting with ${brandColor} as a subtle accent. The screenshot must remain readable. 16:9.`,
                [match.image_url],
              );
              const bg = await uploadDataUrl(serviceClient, composed, `${basePath}/scene-${i + 1}-${stamp}.png`);
              return {
                image_url: bg,
                featured_image_url: match.image_url,
                featured_image_label: match.label,
                featured_image_treatment: "device_mockup",
                scene_type: "featured",
              };
            } catch (e) {
              console.warn(`Mockup compose failed scene ${i + 1}:`, e);
            }
          }
          return {
            image_url: match.image_url,
            featured_image_url: match.image_url,
            featured_image_label: match.label,
            featured_image_treatment: s.featured_image_treatment || "fullscreen",
            scene_type: "featured",
          };
        }
      }

      if (regenerate_images) {
        if (s.scene_type === "logo_subject" && logoUrl) {
          try {
            const baseImg = await generateImage(
              LOVABLE_API_KEY,
              `${s.visual_prompt}. The subject's ${s.logo_subject_kind || "shirt"} is plain with a clean blank surface. ${baseStyle}`,
            );
            const composed = await generateImage(
              LOVABLE_API_KEY,
              `Take the supplied photo and naturally apply the supplied brand logo onto the ${s.logo_subject_kind || "shirt"} of the subject. Logo should look printed/embroidered, follow contours and lighting. Photorealistic, no extra text. 16:9.`,
              [baseImg, logoUrl],
            );
            const finalUrl = await uploadDataUrl(serviceClient, composed, `${basePath}/scene-${i + 1}-${stamp}.png`);
            return { image_url: finalUrl, featured_image_url: null, featured_image_label: null, featured_image_treatment: null, scene_type: "logo_subject" };
          } catch (e) {
            console.warn(`Logo composite failed scene ${i + 1}:`, e);
          }
        }
        const url = await generateImage(LOVABLE_API_KEY, s.visual_prompt + baseStyle);
        const stored = await uploadDataUrl(serviceClient, url, `${basePath}/scene-${i + 1}-${stamp}.png`);
        return { image_url: stored, featured_image_url: null, featured_image_label: null, featured_image_treatment: null, scene_type: s.scene_type };
      }

      // Reuse existing image
      const fallback = existingScenes[i] || existingScenes[existingScenes.length - 1] || {};
      return {
        image_url: fallback.image_url || video.thumbnail_url,
        featured_image_url: fallback.featured_image_url || null,
        featured_image_label: fallback.featured_image_label || null,
        featured_image_treatment: fallback.featured_image_treatment || null,
        scene_type: s.scene_type,
      };
    });

    const sceneAssets = await Promise.all(sceneAssetPromises);

    // Voiceover always regenerates (script or voice may have changed)
    const { audio: audioBuf, words } = await generateVoiceWithAlignment(fullScript, finalVoiceId);
    const audioPath = `${basePath}/voiceover-${stamp}.mp3`;
    const { error: audioErr } = await serviceClient.storage.from("media").upload(audioPath, audioBuf, {
      contentType: "audio/mpeg",
      upsert: true,
    });
    if (audioErr) throw new Error(`Audio upload: ${audioErr.message}`);
    const audio_url = serviceClient.storage.from("media").getPublicUrl(audioPath).data.publicUrl;

    const perScene = duration / planScenes.length;
    const scenes = planScenes.map((s, i) => ({
      caption: s.caption,
      voiceover: s.voiceover,
      visual_prompt: s.visual_prompt,
      scene_type: sceneAssets[i].scene_type,
      image_url: sceneAssets[i].image_url,
      featured_image_url: sceneAssets[i].featured_image_url,
      featured_image_label: sceneAssets[i].featured_image_label,
      featured_image_treatment: sceneAssets[i].featured_image_treatment,
      start: +(i * perScene).toFixed(2),
      duration: +perScene.toFixed(2),
    }));

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
        thumbnail_url: scenes[0]?.image_url || video.thumbnail_url,
        status: "rendering",
        subtitles: words,
        updated_at: new Date().toISOString(),
      })
      .eq("id", video.id)
      .select()
      .single();
    if (updErr) throw new Error(`Update: ${updErr.message}`);

    return new Response(JSON.stringify({ video: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("refine-marketing-video error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
