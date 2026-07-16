// Ideogram v3 API helpers
const IDEOGRAM_BASE = "https://api.ideogram.ai";

// Ideogram uses "16x9" not "16:9"
export function toIdeogramAspect(ar: string): string {
  const map: Record<string, string> = {
    "16:9": "16x9",
    "9:16": "9x16",
    "1:1": "1x1",
    "4:3": "4x3",
    "3:4": "3x4",
    "3:2": "3x2",
    "2:3": "2x3",
  };
  return map[ar] ?? "16x9";
}

async function urlToPngBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download Ideogram image: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function ideogramCreateImage(params: {
  prompt: string;
  aspect_ratio?: string;
  rendering_speed?: "TURBO" | "DEFAULT" | "QUALITY";
}): Promise<Uint8Array> {
  const key = Deno.env.get("IDEOGRAM_API_KEY");
  if (!key) throw new Error("IDEOGRAM_API_KEY not configured");

  const form = new FormData();
  form.append("prompt", params.prompt);
  form.append("aspect_ratio", toIdeogramAspect(params.aspect_ratio ?? "16:9"));
  form.append("rendering_speed", params.rendering_speed ?? "QUALITY");

  const res = await fetch(`${IDEOGRAM_BASE}/v1/ideogram-v3/generate`, {
    method: "POST",
    headers: { "Api-Key": key },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ideogram create failed ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = await res.json();
  const url = json?.data?.[0]?.url;
  if (!url) throw new Error("Ideogram returned no image URL");
  return urlToPngBytes(url);
}

export async function ideogramRemixImage(params: {
  prompt: string;
  reference_image_bytes: Uint8Array;
  aspect_ratio?: string;
  image_weight?: number; // 1-100
  rendering_speed?: "TURBO" | "DEFAULT" | "QUALITY";
}): Promise<Uint8Array> {
  const key = Deno.env.get("IDEOGRAM_API_KEY");
  if (!key) throw new Error("IDEOGRAM_API_KEY not configured");

  const form = new FormData();
  form.append("prompt", params.prompt);
  form.append(
    "image",
    new Blob([params.reference_image_bytes], { type: "image/png" }),
    "reference.png",
  );
  form.append("image_weight", String(params.image_weight ?? 50));
  form.append("aspect_ratio", toIdeogramAspect(params.aspect_ratio ?? "16:9"));
  form.append("rendering_speed", params.rendering_speed ?? "QUALITY");

  const res = await fetch(`${IDEOGRAM_BASE}/v1/ideogram-v3/remix`, {
    method: "POST",
    headers: { "Api-Key": key },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ideogram remix failed ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = await res.json();
  const url = json?.data?.[0]?.url;
  if (!url) throw new Error("Ideogram remix returned no image URL");
  return urlToPngBytes(url);
}

export async function fetchImageBytes(url: string): Promise<Uint8Array> {
  if (url.startsWith("data:")) {
    const base64 = url.split(",")[1];
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch source image: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}
