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

interface DialogTurn { speaker: "A" | "B"; text: string; scene_index: number; }

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
  const words: any[] = [];
  let duration = 0;
  if (align?.characters?.length) {
    const chars: string[] = align.characters;
    const starts: number[] = align.character_start_times_seconds;
    const ends: number[] = align.character_end_times_seconds;
    duration = ends[ends.length - 1] || 0;
    let buf = ""; let wStart = 0;
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (/\s/.test(c)) { if (buf) { words.push({ word: buf, start: wStart, end: ends[i - 1] ?? wStart }); buf = ""; } }
      else { if (!buf) wStart = starts[i]; buf += c; }
    }
    if (buf) words.push({ word: buf, start: wStart, end: ends[ends.length - 1] });
  }
  return { audio, words, duration };
}

async function generatePodcastAudio(
  turns: DialogTurn[],
  hostA: { id: string; name: string },
  hostB: { id: string; name: string },
  gapSeconds = 0.18,
) {
  const parts: ArrayBuffer[] = [];
  const allWords: any[] = [];
  const turnTimings: any[] = [];
  let cursor = 0;
  for (const turn of turns) {
    const voiceId = turn.speaker === "A" ? hostA.id : hostB.id;
    const speakerName = turn.speaker === "A" ? hostA.name : hostB.name;
    const r = await generateVoiceWithAlignment(turn.text, voiceId);
    parts.push(r.audio);
    const turnStart = cursor;
    for (const w of r.words) {
      allWords.push({
        word: w.word,
        start: +(w.start + cursor).toFixed(3),
        end: +(w.end + cursor).toFixed(3),
        speaker: turn.speaker,
        speaker_name: speakerName,
      });
    }
    cursor += r.duration + gapSeconds;
    turnTimings.push({
      speaker: turn.speaker,
      speaker_name: speakerName,
      start: +turnStart.toFixed(3),
      end: +(cursor - gapSeconds).toFixed(3),
      scene_index: turn.scene_index,
      text: turn.text,
    });
  }
  const total = parts.reduce((s, p) => s + p.byteLength, 0);
  const merged = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { merged.set(new Uint8Array(p), off); off += p.byteLength; }
  return { audio: merged.buffer, words: allWords, turnTimings };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
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
      voice_id,
      voice_name,
      regenerate_images = false,
      // Podcast voice swaps
      host_a_voice_id,
      host_a_voice_name,
      host_b_voice_id,
      host_b_voice_name,
    } = body;

    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: video, error: vErr } = await serviceClient
      .from("marketing_videos")
      .select("*")
      .eq("id", video_id)
      .eq("user_id", userId)
      .single();
    if (vErr || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isPodcast = (video.format || "monologue") === "podcast";

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
    const finalHostA = {
      id: host_a_voice_id || video.host_a_voice_id,
      name: host_a_voice_name || video.host_a_voice_name || "Host A",
    };
    const finalHostB = {
      id: host_b_voice_id || video.host_b_voice_id,
      name: host_b_voice_name || video.host_b_voice_name || "Host B",
    };

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

    const localeBlock = `LOCALE: Brand operates in ${country}. Audience speaks ${language}. ALL currency figures must be ${currency}.
${brandVoice ? `BRAND VOICE: ${brandVoice}\n` : ""}${forbidden.length ? `FORBIDDEN: never use ${forbidden.join(", ")}\n` : ""}`;

    const sys = isPodcast
      ? `You are refining a brand-podcast video script: a natural conversation between TWO hosts (A=${finalHostA.name}, B=${finalHostB.name}). Apply the user's feedback while keeping it ~${duration}s (~${targetWords} words). Return ${sceneCount} scenes AND a dialog array of 6–14 turns alternating between A and B. Tone natural, end with B delivering CTA. ${localeBlock}`
      : `You are refining an existing marketing video script. Apply the user's feedback while keeping it ~${duration}s (~${targetWords} words). Return ${sceneCount} scenes. Brand: ${project.name}. Color accent: ${brandColor}. ${localeBlock}`;

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
Each scene: caption (2-6 words), voiceover line, visual_prompt (no text/letters/logos in image, accent ${brandColor}). End with clear CTA.${
      isPodcast
        ? `\n\nALSO produce 'dialog' — back-and-forth turns between A/B that, read in order, fill ~${targetWords} words. Each turn maps to a scene_index (0-based, < ${sceneCount}).`
        : ""
    }`;

    const sceneItem: any = {
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
    };
    const planParams: any = {
      type: "object",
      properties: { full_script: { type: "string" }, scenes: { type: "array", items: sceneItem } },
      required: ["full_script", "scenes"],
      additionalProperties: false,
    };
    if (isPodcast) {
      planParams.properties.dialog = {
        type: "array",
        items: {
          type: "object",
          properties: {
            speaker: { type: "string", enum: ["A", "B"] },
            text: { type: "string" },
            scene_index: { type: "integer" },
          },
          required: ["speaker", "text", "scene_index"],
          additionalProperties: false,
        },
      };
      planParams.required = ["full_script", "scenes", "dialog"];
    }

    const planResp = await callAI(LOVABLE_API_KEY, {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
      tools: [{ type: "function", function: { name: "build_video_plan", parameters: planParams } }],
      tool_choice: { type: "function", function: { name: "build_video_plan" } },
    });

    const toolCall = planResp.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No plan returned");
    const plan = JSON.parse(toolCall.function.arguments);
    const planScenes: PlanScene[] = plan.scenes;
    const fullScript: string = plan.full_script;
    const dialog: DialogTurn[] = isPodcast ? (plan.dialog || []) : [];

    const basePath = `marketing-videos/${video.project_id}/${video.id}`;
    const stamp = Date.now();
    const baseStyle = `\n\nStyle: cinematic, premium brand marketing photography, high production value, soft natural lighting, shallow depth of field. 16:9 widescreen. Leave room for overlay text. Use ${brandColor} as a subtle accent. No text, letters, logos, or signage in the image.`;
    const existingScenes = (video.scenes as any[]) || [];

    const sceneAssetPromises = planScenes.map(async (s, i): Promise<any> => {
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
              return { image_url: bg, featured_image_url: match.image_url, featured_image_label: match.label, featured_image_treatment: "device_mockup", scene_type: "featured" };
            } catch (e) {
              console.warn(`Mockup compose failed scene ${i + 1}:`, e);
            }
          }
          return { image_url: match.image_url, featured_image_url: match.image_url, featured_image_label: match.label, featured_image_treatment: s.featured_image_treatment || "fullscreen", scene_type: "featured" };
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

    let audioBuf: ArrayBuffer; let words: any[]; let turnTimings: any[] = [];
    let actualDuration = duration;

    if (isPodcast) {
      if (!finalHostA.id || !finalHostB.id) throw new Error("Podcast video missing host voices");
      const r = await generatePodcastAudio(dialog, finalHostA, finalHostB);
      audioBuf = r.audio; words = r.words; turnTimings = r.turnTimings;
      if (turnTimings.length) actualDuration = Math.max(turnTimings[turnTimings.length - 1].end, duration);
    } else {
      const r = await generateVoiceWithAlignment(fullScript, finalVoiceId);
      audioBuf = r.audio; words = r.words;
      if (r.duration) actualDuration = Math.max(r.duration, duration);
    }

    const audioPath = `${basePath}/voiceover-${stamp}.mp3`;
    const { error: audioErr } = await serviceClient.storage.from("media").upload(audioPath, audioBuf, {
      contentType: "audio/mpeg",
      upsert: true,
    });
    if (audioErr) throw new Error(`Audio upload: ${audioErr.message}`);
    const audio_url = serviceClient.storage.from("media").getPublicUrl(audioPath).data.publicUrl;

    let scenes: any[];
    if (isPodcast && turnTimings.length) {
      const firstStart: Record<number, number> = {};
      for (const t of turnTimings) if (firstStart[t.scene_index] === undefined) firstStart[t.scene_index] = t.start;
      scenes = planScenes.map((s, i) => {
        const start = firstStart[i] ?? (i === 0 ? 0 : firstStart[i - 1] ?? 0);
        let nextStart = actualDuration;
        for (let j = i + 1; j < planScenes.length; j++) {
          if (firstStart[j] !== undefined) { nextStart = firstStart[j]; break; }
        }
        return {
          caption: s.caption,
          voiceover: s.voiceover,
          visual_prompt: s.visual_prompt,
          scene_type: sceneAssets[i].scene_type,
          image_url: sceneAssets[i].image_url,
          featured_image_url: sceneAssets[i].featured_image_url,
          featured_image_label: sceneAssets[i].featured_image_label,
          featured_image_treatment: sceneAssets[i].featured_image_treatment,
          start: +start.toFixed(2),
          duration: +Math.max(0.5, nextStart - start).toFixed(2),
        };
      });
    } else {
      const perScene = actualDuration / planScenes.length;
      scenes = planScenes.map((s, i) => ({
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
    }

    const updatePayload: any = {
      voice_id: isPodcast ? finalHostA.id : finalVoiceId,
      voice_name: isPodcast ? `${finalHostA.name} & ${finalHostB.name}` : finalVoiceName,
      prompt: feedback ? (video.prompt ? `${video.prompt}\n\nRefinement: ${feedback}` : feedback) : video.prompt,
      script: fullScript,
      scenes,
      audio_url,
      video_url: null,
      thumbnail_url: scenes[0]?.image_url || video.thumbnail_url,
      status: "rendering",
      subtitles: words,
      duration_seconds: Math.round(actualDuration),
      updated_at: new Date().toISOString(),
    };
    if (isPodcast) {
      updatePayload.host_a_voice_id = finalHostA.id;
      updatePayload.host_a_voice_name = finalHostA.name;
      updatePayload.host_b_voice_id = finalHostB.id;
      updatePayload.host_b_voice_name = finalHostB.name;
      updatePayload.dialog = turnTimings;
    }

    const { data: updated, error: updErr } = await serviceClient
      .from("marketing_videos")
      .update(updatePayload)
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
