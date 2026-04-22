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

interface DialogTurn {
  speaker: "A" | "B";
  text: string;
  scene_index: number;
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

interface VoiceResult {
  audio: ArrayBuffer;
  words: { word: string; start: number; end: number }[];
  duration: number;
}

// ElevenLabs TTS with character-level alignment → word-level timings.
async function generateVoiceWithAlignment(text: string, voiceId: string): Promise<VoiceResult> {
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
  let duration = 0;
  if (align?.characters?.length) {
    const chars: string[] = align.characters;
    const starts: number[] = align.character_start_times_seconds;
    const ends: number[] = align.character_end_times_seconds;
    duration = ends[ends.length - 1] || 0;
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

  return { audio, words, duration };
}

// Concatenate raw MP3 buffers (frames append cleanly) and offset word timings per turn.
async function generatePodcastAudio(
  turns: DialogTurn[],
  hostA: { id: string; name: string },
  hostB: { id: string; name: string },
  gapSeconds = 0.18,
): Promise<{ audio: ArrayBuffer; words: any[]; turnTimings: { speaker: "A" | "B"; start: number; end: number; scene_index: number }[] }> {
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
    });
  }

  // Concat MP3 buffers
  const total = parts.reduce((s, p) => s + p.byteLength, 0);
  const merged = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    merged.set(new Uint8Array(p), off);
    off += p.byteLength;
  }
  return { audio: merged.buffer, words: allWords, turnTimings };
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
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
      project_id,
      duration_seconds = 30,
      voice_id,
      voice_name = "Voice",
      prompt = "",
      title = "Marketing video",
      tone = "professional",
      country: countryOverride,
      currency: currencyOverride,
      language: languageOverride,
      burn_subtitles = true,
      // Podcast mode
      format = "monologue", // 'monologue' | 'podcast'
      host_a_voice_id,
      host_a_voice_name,
      host_b_voice_id,
      host_b_voice_name,
    } = body;

    const isPodcast = format === "podcast";

    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (isPodcast) {
      if (!host_a_voice_id || !host_b_voice_id) {
        return new Response(JSON.stringify({ error: "Podcast mode requires host_a_voice_id and host_b_voice_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (!voice_id) {
      return new Response(JSON.stringify({ error: "voice_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: project, error: pErr } = await serviceClient
      .from("marketing_projects")
      .select("name, knowledge_base, primary_color, logos, images, country, currency, language, brand_voice, forbidden_words")
      .eq("id", project_id)
      .eq("user_id", userId)
      .single();
    if (pErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: featured } = await serviceClient
      .from("marketing_featured_images")
      .select("id, image_url, label, description")
      .eq("project_id", project_id)
      .order("sort_order");
    const featuredList = featured || [];

    const sceneCount = duration_seconds <= 15 ? 4 : duration_seconds <= 30 ? 6 : 8;
    const targetWords = Math.round(duration_seconds * WPS);
    const logoUrl = project.logos?.[0] ?? null;
    const brandColor = project.primary_color || "#9b87f5";
    const kb = (project.knowledge_base || "").slice(0, 1500);

    const country = (countryOverride || project.country || "United States").trim();
    const currency = (currencyOverride || project.currency || "USD").trim().toUpperCase();
    const language = (languageOverride || project.language || "English").trim();
    const brandVoice = (project.brand_voice || "").trim();
    const forbidden: string[] = Array.isArray(project.forbidden_words) ? project.forbidden_words : [];

    const featuredCatalog = featuredList.length
      ? featuredList.map((f, i) => `${i + 1}. "${f.label}" — ${f.description || "(no description)"}`).join("\n")
      : "(no labeled product screenshots — do NOT use scene_type=featured)";

    // ---------- Plan generation ----------
    const localeBlock = `LOCALE: This brand operates in ${country}. The audience speaks ${language}. ANY currency figure MUST be in ${currency} with the correct symbol/code (never default to USD). Use units, spelling, idioms, and references appropriate for ${country}.

${brandVoice ? `BRAND VOICE GUIDELINES (must follow strictly):\n${brandVoice}\n` : ""}${forbidden.length ? `FORBIDDEN WORDS/CLAIMS — never use these or close synonyms: ${forbidden.join(", ")}\n` : ""}`;

    const scriptSystem = isPodcast
      ? `You are writing a short brand-podcast video script: a natural conversation between TWO hosts about a brand. Total spoken length: ~${duration_seconds}s (~${targetWords} words). Tone: ${tone}.

Host A = "${host_a_voice_name || "Host A"}" (warm, curious, asks questions).
Host B = "${host_b_voice_name || "Host B"}" (knowledgeable, gives the answers, shares brand details).

Write 6–14 short conversational exchanges (alternating A/B, sometimes back-to-back is OK). Each turn 1–2 sentences max. Sound like real humans talking — natural reactions ("Right.", "Exactly.", "Wait, really?"), no monologuing. End with B delivering a clean CTA.

${localeBlock}`
      : `You are a senior marketing video director writing voiceover scripts and shot lists for a brand marketing video. Be specific, accurate, and never invent facts. Total spoken length: ~${duration_seconds}s (~${targetWords} words). Tone: ${tone}.

${localeBlock}`;

    const baseUserMsg = `BRAND: ${project.name}
BRAND COLOR: ${brandColor}
DURATION: ${duration_seconds}s (~${targetWords} words)
SCENES: ${sceneCount}

BRAND KNOWLEDGE:
${kb || "(no extra context — keep it generic but on-brand)"}

USER DIRECTION (optional): ${prompt || "(none — write a strong general brand promo)"}

LABELED PRODUCT SCREENSHOTS AVAILABLE:
${featuredCatalog}`;

    const sceneRules = `For each scene choose ONE scene_type:
- "cinematic" — generic premium brand photography. Provide visual_prompt. Use for emotional/lifestyle moments.
- "featured" — show a real product screenshot from the catalog above. Set featured_image_label to the EXACT label string. Set featured_image_treatment to "fullscreen" or "device_mockup". Use to demonstrate actual product features.
- "logo_subject" — a person or product visibly wearing/displaying the brand. Set logo_subject_kind. Provide visual_prompt describing subject and setting. The brand logo will be composited onto the subject in post — do NOT describe the logo's visual.

Each scene also needs:
- caption: 2-6 word on-screen overlay
- visual_prompt: vivid cinematic description (16:9, premium, leave room for overlay text, accent color ${brandColor}). NO text/letters/logos/signage in image — they're added in post.

RULES:
- Use scene_type="featured" for at least ${Math.min(featuredList.length, Math.max(1, Math.floor(sceneCount / 2)))} scenes if screenshots are available.
- Include 1 logo_subject scene if a logo exists, ideally near the start.
- Final scene must have a clear CTA caption.`;

    const userMsg = isPodcast
      ? `${baseUserMsg}

${sceneRules}

PODCAST DIALOG:
Also produce a 'dialog' array — the actual back-and-forth between Host A and Host B that, read aloud sequentially, fills ~${targetWords} words. Each turn maps to a scene_index (0-based, < ${sceneCount}); multiple turns can share the same scene_index. The 'voiceover' field on each scene should summarize what's being discussed during that scene (used as fallback only — actual audio comes from dialog).`
      : `${baseUserMsg}

${sceneRules}

- voiceover: spoken line for that scene (combined = full script, ~${targetWords} words total)
- Keep voiceover lines locale-correct (${currency} for prices, ${country} references).`;

    const sceneItemSchema: any = {
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
      properties: {
        full_script: { type: "string" },
        scenes: { type: "array", items: sceneItemSchema },
      },
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
      messages: [
        { role: "system", content: scriptSystem },
        { role: "user", content: userMsg },
      ],
      tools: [{
        type: "function",
        function: {
          name: "build_video_plan",
          description: "Return the script and scene breakdown.",
          parameters: planParams,
        },
      }],
      tool_choice: { type: "function", function: { name: "build_video_plan" } },
    });

    const toolCall = planResp.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No plan returned");
    const plan = JSON.parse(toolCall.function.arguments);
    const planScenes: PlanScene[] = plan.scenes;
    const fullScript: string = plan.full_script;
    const dialog: DialogTurn[] = isPodcast ? (plan.dialog || []) : [];

    const videoId = crypto.randomUUID();
    const basePath = `marketing-videos/${project_id}/${videoId}`;

    // ---------- Scene assets ----------
    console.log(`Generating ${planScenes.length} scene assets (format=${format})...`);
    const baseStyle = `\n\nStyle: cinematic, premium brand marketing photography, high production value, soft natural lighting, shallow depth of field. 16:9 widescreen. Leave room for overlay text. Use ${brandColor} as a subtle accent color. Absolutely no text, letters, logos, or signage in the image.`;

    const sceneAssetPromises = planScenes.map(async (s, i) => {
      if (s.scene_type === "featured" && s.featured_image_label) {
        const match = featuredList.find(
          (f) => f.label.toLowerCase().trim() === s.featured_image_label!.toLowerCase().trim(),
        ) || featuredList[0];
        if (match) {
          if (s.featured_image_treatment === "device_mockup") {
            try {
              const composed = await generateImage(
                LOVABLE_API_KEY,
                `Place this exact UI screenshot, unmodified and pixel-perfect, displayed on the screen of a sleek modern laptop sitting on a beautiful desk in a premium environment. Cinematic lighting with ${brandColor} as a subtle accent in the room. The screenshot must remain readable and undistorted. 16:9.`,
                [match.image_url],
              );
              const bg = await uploadDataUrl(serviceClient, composed, `${basePath}/scene-${i + 1}.png`);
              return { image_url: bg, featured_image_url: match.image_url, featured_image_label: match.label, featured_image_treatment: "device_mockup", scene_type: "featured" };
            } catch (e) {
              console.warn(`Mockup compose failed for scene ${i + 1}, falling back to fullscreen:`, e);
            }
          }
          return { image_url: match.image_url, featured_image_url: match.image_url, featured_image_label: match.label, featured_image_treatment: "fullscreen", scene_type: "featured" };
        }
      }

      if (s.scene_type === "logo_subject" && logoUrl) {
        try {
          const basePrompt = `${s.visual_prompt}. The subject's ${s.logo_subject_kind || "shirt"} is plain, with a clean blank surface area where a logo could be applied later. Premium photography. ${baseStyle}`;
          const baseImg = await generateImage(LOVABLE_API_KEY, basePrompt);
          const composedPrompt = `Take the supplied product/lifestyle photo and naturally apply the supplied brand logo onto the ${s.logo_subject_kind || "shirt"} of the subject. The logo should look like it's printed/embroidered on the surface — follow the contour, lighting, and folds of the fabric/material realistically. Keep the rest of the photo unchanged. Premium, photorealistic, no extra text or watermark. 16:9.`;
          const composed = await generateImage(LOVABLE_API_KEY, composedPrompt, [baseImg, logoUrl]);
          const finalUrl = await uploadDataUrl(serviceClient, composed, `${basePath}/scene-${i + 1}.png`);
          return { image_url: finalUrl, featured_image_url: null, featured_image_label: null, featured_image_treatment: null, scene_type: "logo_subject" };
        } catch (e) {
          console.warn(`Logo composite failed for scene ${i + 1}, falling back to base:`, e);
        }
      }

      const url = await generateImage(LOVABLE_API_KEY, s.visual_prompt + baseStyle);
      const stored = await uploadDataUrl(serviceClient, url, `${basePath}/scene-${i + 1}.png`);
      return { image_url: stored, featured_image_url: null, featured_image_label: null, featured_image_treatment: null, scene_type: s.scene_type };
    });

    const sceneAssets = await Promise.all(sceneAssetPromises);

    // ---------- Voiceover ----------
    let audioBuf: ArrayBuffer;
    let words: any[];
    let turnTimings: any[] = [];
    let actualDuration = duration_seconds;

    if (isPodcast) {
      console.log(`Generating podcast audio (${dialog.length} turns)...`);
      const r = await generatePodcastAudio(
        dialog,
        { id: host_a_voice_id, name: host_a_voice_name || "Host A" },
        { id: host_b_voice_id, name: host_b_voice_name || "Host B" },
      );
      audioBuf = r.audio;
      words = r.words;
      turnTimings = r.turnTimings;
      if (turnTimings.length) actualDuration = Math.max(turnTimings[turnTimings.length - 1].end, duration_seconds);
    } else {
      console.log("Generating voiceover with alignment...");
      const r = await generateVoiceWithAlignment(fullScript, voice_id);
      audioBuf = r.audio;
      words = r.words;
      if (r.duration) actualDuration = Math.max(r.duration, duration_seconds);
    }

    const { error: audioErr } = await serviceClient.storage
      .from("media")
      .upload(`${basePath}/voiceover.mp3`, audioBuf, { contentType: "audio/mpeg", upsert: true });
    if (audioErr) throw new Error(`Audio upload: ${audioErr.message}`);
    const audio_url = serviceClient.storage.from("media").getPublicUrl(`${basePath}/voiceover.mp3`).data.publicUrl;

    // ---------- Scene timings ----------
    let scenes: any[];
    if (isPodcast && turnTimings.length) {
      // Each scene runs from the first turn that targets it to just before the next scene's first turn.
      const firstStart: Record<number, number> = {};
      for (const t of turnTimings) {
        if (firstStart[t.scene_index] === undefined) firstStart[t.scene_index] = t.start;
      }
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

    const { data: inserted, error: insErr } = await serviceClient
      .from("marketing_videos")
      .insert({
        id: videoId,
        project_id,
        user_id: userId,
        title,
        duration_seconds: Math.round(actualDuration),
        voice_id: isPodcast ? host_a_voice_id : voice_id,
        voice_name: isPodcast ? `${host_a_voice_name} & ${host_b_voice_name}` : voice_name,
        prompt,
        script: fullScript,
        scenes,
        audio_url,
        thumbnail_url: scenes[0]?.image_url,
        status: "rendering",
        country,
        currency,
        language,
        subtitles: words,
        burn_subtitles,
        format,
        host_a_voice_id: isPodcast ? host_a_voice_id : null,
        host_a_voice_name: isPodcast ? host_a_voice_name : null,
        host_b_voice_id: isPodcast ? host_b_voice_id : null,
        host_b_voice_name: isPodcast ? host_b_voice_name : null,
        dialog: isPodcast ? turnTimings.map((t, i) => ({ ...t, text: dialog[i]?.text || "" })) : [],
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
