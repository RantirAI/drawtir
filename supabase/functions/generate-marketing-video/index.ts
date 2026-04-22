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
  for (const url of refUrls) {
    content.push({ type: "image_url", image_url: { url } });
  }
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
}

// Use ElevenLabs alignment endpoint to get word-level timing for burned-in subtitles.
async function generateVoiceWithAlignment(text: string, voiceId: string): Promise<VoiceResult> {
  const KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!KEY) throw new Error("ELEVENLABS_API_KEY not configured");

  const tryModel = async (model: string) => {
    return fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", "xi-api-key": KEY },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: { stability: 0.55, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true },
        }),
      },
    );
  };

  let r = await tryModel("eleven_multilingual_v2");
  if (!r.ok) r = await tryModel("eleven_turbo_v2_5");
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${await r.text()}`);

  const json = await r.json();
  const audioBase64: string = json.audio_base64;
  const align = json.alignment || json.normalized_alignment;
  const audio = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0)).buffer;

  // Convert character-level alignment to word-level
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
    } = body;

    if (!project_id || !voice_id) {
      return new Response(JSON.stringify({ error: "project_id and voice_id are required" }), {
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

    // 1. Generate locale-aware, brand-grounded plan
    const scriptSystem = `You are a senior marketing video director writing voiceover scripts and shot lists for a brand marketing video. Be specific, accurate, and never invent facts. Total spoken length: ~${duration_seconds}s (~${targetWords} words). Tone: ${tone}.

LOCALE: This brand operates in ${country}. The audience speaks ${language}. ANY currency figure MUST be in ${currency} with the correct symbol/code (never default to USD). Use units, spelling, idioms, and references appropriate for ${country}.

${brandVoice ? `BRAND VOICE GUIDELINES (must follow strictly):\n${brandVoice}\n` : ""}
${forbidden.length ? `FORBIDDEN WORDS/CLAIMS — never use these or close synonyms: ${forbidden.join(", ")}\n` : ""}`;

    const userMsg = `BRAND: ${project.name}
BRAND COLOR: ${brandColor}
DURATION: ${duration_seconds}s (~${targetWords} words)
SCENES: ${sceneCount}

BRAND KNOWLEDGE:
${kb || "(no extra context — keep it generic but on-brand)"}

USER DIRECTION (optional): ${prompt || "(none — write a strong general brand promo)"}

LABELED PRODUCT SCREENSHOTS AVAILABLE:
${featuredCatalog}

For each scene choose ONE scene_type:
- "cinematic" — generic premium brand photography. Provide visual_prompt. Use for emotional/lifestyle moments.
- "featured" — show a real product screenshot from the catalog above. Set featured_image_label to the EXACT label string. Set featured_image_treatment to "fullscreen" (clean UI showcase) or "device_mockup" (screenshot inside a laptop/phone in a cinematic environment). Use to demonstrate actual product features.
- "logo_subject" — a person or product visibly wearing/displaying the brand. Set logo_subject_kind (shirt, hat, mug, laptop, tote, phone_case). Provide visual_prompt describing the subject and setting. The brand logo will be composited onto the subject in post — do NOT describe the logo's visual.

Each scene also needs:
- caption: 2-6 word on-screen overlay
- voiceover: spoken line for that scene (combined = full script, ~${targetWords} words total)
- visual_prompt: vivid cinematic description (16:9, premium, leave room for overlay text, accent color ${brandColor}). NO text/letters/logos/signage in image — they're added in post.

RULES:
- Use scene_type="featured" for at least ${Math.min(featuredList.length, Math.max(1, Math.floor(sceneCount / 2)))} scenes if screenshots are available.
- Include 1 logo_subject scene if a logo exists, ideally near the start.
- Final scene must have a clear CTA caption.
- Keep voiceover lines locale-correct (${currency} for prices, ${country} references).`;

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

    const videoId = crypto.randomUUID();
    const basePath = `marketing-videos/${project_id}/${videoId}`;

    // 2. Resolve images per scene type, in parallel.
    console.log(`Generating ${planScenes.length} scene assets...`);
    const baseStyle = `\n\nStyle: cinematic, premium brand marketing photography, high production value, soft natural lighting, shallow depth of field. 16:9 widescreen. Leave room for overlay text. Use ${brandColor} as a subtle accent color. Absolutely no text, letters, logos, or signage in the image.`;

    const sceneAssetPromises = planScenes.map(async (s, i): Promise<{
      image_url: string;
      featured_image_url: string | null;
      featured_image_label: string | null;
      featured_image_treatment: string | null;
      scene_type: string;
    }> => {
      // FEATURED scene: use the actual screenshot
      if (s.scene_type === "featured" && s.featured_image_label) {
        const match = featuredList.find(
          (f) => f.label.toLowerCase().trim() === s.featured_image_label!.toLowerCase().trim(),
        ) || featuredList[0];
        if (match) {
          if (s.featured_image_treatment === "device_mockup") {
            // Composite the screenshot into a cinematic device mockup using AI image edit.
            try {
              const composed = await generateImage(
                LOVABLE_API_KEY,
                `Place this exact UI screenshot, unmodified and pixel-perfect, displayed on the screen of a sleek modern laptop sitting on a beautiful desk in a premium environment. Cinematic lighting with ${brandColor} as a subtle accent in the room. The screenshot must remain readable and undistorted. 16:9.`,
                [match.image_url],
              );
              const bg = await uploadDataUrl(serviceClient, composed, `${basePath}/scene-${i + 1}.png`);
              return {
                image_url: bg,
                featured_image_url: match.image_url,
                featured_image_label: match.label,
                featured_image_treatment: "device_mockup",
                scene_type: "featured",
              };
            } catch (e) {
              console.warn(`Mockup compose failed for scene ${i + 1}, falling back to fullscreen:`, e);
            }
          }
          // Fullscreen treatment — renderer will display the screenshot directly with a brand backdrop.
          return {
            image_url: match.image_url,
            featured_image_url: match.image_url,
            featured_image_label: match.label,
            featured_image_treatment: "fullscreen",
            scene_type: "featured",
          };
        }
      }

      // LOGO_SUBJECT: generate base scene then composite the logo onto the subject
      if (s.scene_type === "logo_subject" && logoUrl) {
        try {
          const basePrompt = `${s.visual_prompt}. The subject's ${s.logo_subject_kind || "shirt"} is plain, with a clean blank surface area where a logo could be applied later. Premium photography. ${baseStyle}`;
          const baseImg = await generateImage(LOVABLE_API_KEY, basePrompt);
          const composedPrompt = `Take the supplied product/lifestyle photo and naturally apply the supplied brand logo onto the ${s.logo_subject_kind || "shirt"} of the subject. The logo should look like it's printed/embroidered on the surface — follow the contour, lighting, and folds of the fabric/material realistically. Keep the rest of the photo unchanged. Premium, photorealistic, no extra text or watermark. 16:9.`;
          const composed = await generateImage(LOVABLE_API_KEY, composedPrompt, [baseImg, logoUrl]);
          const finalUrl = await uploadDataUrl(serviceClient, composed, `${basePath}/scene-${i + 1}.png`);
          return {
            image_url: finalUrl,
            featured_image_url: null,
            featured_image_label: null,
            featured_image_treatment: null,
            scene_type: "logo_subject",
          };
        } catch (e) {
          console.warn(`Logo composite failed for scene ${i + 1}, falling back to base:`, e);
        }
      }

      // CINEMATIC (or fallback) — pure generation
      const url = await generateImage(LOVABLE_API_KEY, s.visual_prompt + baseStyle);
      const stored = await uploadDataUrl(serviceClient, url, `${basePath}/scene-${i + 1}.png`);
      return {
        image_url: stored,
        featured_image_url: null,
        featured_image_label: null,
        featured_image_treatment: null,
        scene_type: s.scene_type,
      };
    });

    const sceneAssets = await Promise.all(sceneAssetPromises);

    // 3. Voiceover with word-level alignment (for burned-in subtitles)
    console.log("Generating voiceover with alignment...");
    const { audio: audioBuf, words } = await generateVoiceWithAlignment(fullScript, voice_id);

    // 4. Upload audio
    const { error: audioErr } = await serviceClient.storage
      .from("media")
      .upload(`${basePath}/voiceover.mp3`, audioBuf, { contentType: "audio/mpeg", upsert: true });
    if (audioErr) throw new Error(`Audio upload: ${audioErr.message}`);
    const audio_url = serviceClient.storage.from("media").getPublicUrl(`${basePath}/voiceover.mp3`).data.publicUrl;

    // 5. Build final scenes array with timings
    const perScene = duration_seconds / planScenes.length;
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

    // 6. Insert row
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
        thumbnail_url: scenes[0]?.image_url,
        status: "rendering",
        country,
        currency,
        language,
        subtitles: words,
        burn_subtitles,
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
