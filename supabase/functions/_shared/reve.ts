// Shared Reve API helpers
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const REVE_BASE = "https://api.reve.com";

export async function reveCreateImage(params: {
  prompt: string;
  aspect_ratio?: "16:9" | "3:2" | "4:3" | "1:1" | "3:4" | "2:3" | "9:16" | "auto";
  quality?: number;
}): Promise<Uint8Array> {
  const key = Deno.env.get("REVE_API_KEY");
  if (!key) throw new Error("REVE_API_KEY not configured");

  const res = await fetch(`${REVE_BASE}/v1/image/create/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: params.prompt,
      aspect_ratio: params.aspect_ratio ?? "16:9",
      test_time_scaling: params.quality ?? 3,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Reve create failed ${res.status}: ${text.slice(0, 500)}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

export async function reveEditImage(params: {
  edit_instruction: string;
  reference_image_base64: string;
  quality?: number;
}): Promise<Uint8Array> {
  const key = Deno.env.get("REVE_API_KEY");
  if (!key) throw new Error("REVE_API_KEY not configured");

  const res = await fetch(`${REVE_BASE}/v1/image/edit/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      edit_instruction: params.edit_instruction,
      reference_image: params.reference_image_base64,
      test_time_scaling: params.quality ?? 3,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Reve edit failed ${res.status}: ${text.slice(0, 500)}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

export async function uploadPngToMedia(
  authHeader: string | null,
  bytes: Uint8Array,
  prefix: string,
): Promise<{ publicUrl: string; userId: string | null }> {
  // Use service role for the storage write so RLS on the media bucket doesn't block it.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceKey);

  let userId: string | null = null;
  if (authHeader) {
    try {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data } = await userClient.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      try {
        const payload = JSON.parse(atob(authHeader.replace("Bearer ", "").split(".")[1]));
        userId = payload?.sub ?? null;
      } catch {}
    }
  }

  const folder = userId ?? "anon";
  const fileName = `${prefix}-${Date.now()}.png`;
  const path = `${folder}/${fileName}`;

  const { error } = await admin.storage.from("media").upload(path, bytes, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: pub } = admin.storage.from("media").getPublicUrl(path);

  // Best-effort media library entry
  if (userId) {
    try {
      await supabase.from("media_library").insert({
        user_id: userId,
        file_name: fileName,
        file_url: pub.publicUrl,
        file_type: "image/png",
        file_size: bytes.byteLength,
        source: "ai-reve",
      });
    } catch {}
  }

  return { publicUrl: pub.publicUrl, userId };
}

export async function fetchImageAsBase64(url: string): Promise<string> {
  if (url.startsWith("data:")) {
    return url.split(",")[1];
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch source image: ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  // btoa on large binaries: chunk
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
