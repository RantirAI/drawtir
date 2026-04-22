import type { MarketingVideoScene } from "@/hooks/useMarketingVideos";

export interface RenderOptions {
  width?: number;
  height?: number;
  fps?: number;
  brandColor?: string;
  logoUrl?: string | null;
  brandName?: string;
  onProgress?: (pct: number) => void;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function pickRecorderMime(): { mime: string; ext: string } {
  // Prefer WebM — MediaRecorder MP4 output (Safari/Chrome) often produces files
  // with broken/unseekable metadata. WebM is reliably playable everywhere modern.
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  ];
  for (const m of candidates) {
    if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(m)) {
      return { mime: m, ext: m.startsWith("video/mp4") ? "mp4" : "webm" };
    }
  }
  return { mime: "video/webm", ext: "webm" };
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, zoom: number, panX: number, panY: number) {
  const ir = img.width / img.height;
  const cr = w / h;
  let dw, dh;
  if (ir > cr) {
    dh = h * zoom;
    dw = dh * ir;
  } else {
    dw = w * zoom;
    dh = dw / ir;
  }
  const dx = (w - dw) / 2 + panX;
  const dy = (h - dh) / 2 + panY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export async function renderMarketingVideo(
  scenes: MarketingVideoScene[],
  audioUrl: string,
  durationSeconds: number,
  opts: RenderOptions = {}
): Promise<{ blob: Blob; mimeType: string }> {
  const width = opts.width ?? 1280;
  const height = opts.height ?? 720;
  const fps = opts.fps ?? 30;
  const brandColor = opts.brandColor ?? "#9b87f5";
  const brandName = opts.brandName ?? "";

  // Preload images and logo
  const imgs = await Promise.all(scenes.map((s) => loadImage(s.image_url)));
  const logoImg = opts.logoUrl ? await loadImage(opts.logoUrl).catch(() => null) : null;

  // Setup canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false })!;

  // Setup audio routing into the canvas stream
  const audio = new Audio();
  audio.crossOrigin = "anonymous";
  audio.src = audioUrl;
  await new Promise<void>((res, rej) => {
    audio.onloadedmetadata = () => res();
    audio.onerror = () => rej(new Error("Failed to load audio"));
  });
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audio);
  const dest = audioCtx.createMediaStreamDestination();
  source.connect(dest);
  source.connect(audioCtx.destination); // also play through speakers (optional)

  const canvasStream = canvas.captureStream(fps);
  const tracks = [
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ];
  const combinedStream = new MediaStream(tracks);

  const { mime, ext } = pickRecorderMime();
  const recorder = new MediaRecorder(combinedStream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const finalDuration = Math.max(durationSeconds, audio.duration || durationSeconds);

  // Recompute scene timings to match actual audio duration
  const totalPlanned = scenes.reduce((s, sc) => s + sc.duration, 0) || finalDuration;
  const scaled = scenes.map((s) => ({
    ...s,
    _start: (s.start / totalPlanned) * finalDuration,
    _dur: (s.duration / totalPlanned) * finalDuration,
  }));

  const startedAt = performance.now();
  let stopped = false;
  let stopResolve: () => void;
  const stopPromise = new Promise<void>((res) => (stopResolve = res));
  recorder.onstop = () => stopResolve();

  recorder.start(1000);
  audio.currentTime = 0;
  await audio.play().catch(() => {});

  const draw = () => {
    if (stopped) return;
    const t = (performance.now() - startedAt) / 1000;
    if (t >= finalDuration) {
      stopped = true;
      try { recorder.requestData(); } catch {}
      // Give the encoder a tick to flush the final chunk before stopping
      setTimeout(() => {
        try { recorder.stop(); } catch {}
        try { audio.pause(); } catch {}
      }, 200);
      return;
    }

    // Find current scene
    let idx = 0;
    for (let i = 0; i < scaled.length; i++) {
      if (t >= scaled[i]._start && t < scaled[i]._start + scaled[i]._dur) { idx = i; break; }
      if (t >= scaled[i]._start) idx = i;
    }
    const scene = scaled[idx];
    const localT = (t - scene._start) / Math.max(scene._dur, 0.0001);

    // Background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Ken Burns: alternate zoom in / pan
    const dir = idx % 2 === 0 ? 1 : -1;
    const zoom = 1.08 + localT * 0.06; // 1.08 -> 1.14
    const panX = dir * (width * 0.04) * (localT - 0.5);
    const panY = (idx % 3 === 0 ? -1 : 1) * (height * 0.02) * (localT - 0.5);
    drawCover(ctx, imgs[idx], width, height, zoom, panX, panY);

    // Bottom gradient overlay for caption legibility
    const grad = ctx.createLinearGradient(0, height * 0.55, 0, height);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, height * 0.55, width, height * 0.45);

    // Top brand bar
    ctx.fillStyle = brandColor;
    ctx.fillRect(0, 0, width, 6);

    // Logo (top-left)
    if (logoImg) {
      const lh = 48;
      const lw = (logoImg.width / logoImg.height) * lh;
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(logoImg, 32, 32, Math.min(lw, 220), lh);
      ctx.restore();
    } else if (brandName) {
      ctx.font = "600 28px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "top";
      ctx.fillText(brandName, 32, 32);
    }

    // Caption animation: fade + slide up over 0.4s
    const inT = Math.min(1, localT / (0.4 / Math.max(scene._dur, 0.4)));
    const ease = easeOutCubic(inT);
    const captionAlpha = ease;
    const slideY = (1 - ease) * 30;

    ctx.save();
    ctx.globalAlpha = captionAlpha;

    const captionText = scene.caption || "";
    const isLast = idx === scaled.length - 1;
    const fontSize = isLast ? 88 : 72;
    ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    const maxW = width - 128;
    const lines = wrapText(ctx, captionText.toUpperCase(), maxW);
    const lineH = fontSize * 1.05;
    const blockH = lines.length * lineH;
    const baseY = height - 96 - blockH + lineH + slideY;

    // Caption accent bar
    ctx.fillStyle = brandColor;
    ctx.fillRect(64, baseY - lineH + 12, 8, blockH - 12);

    ctx.fillStyle = "#fff";
    lines.forEach((ln, i) => {
      ctx.fillText(ln, 96, baseY + i * lineH);
    });

    // CTA pill on last scene
    if (isLast) {
      ctx.font = "600 22px Inter, system-ui, sans-serif";
      const label = "LEARN MORE";
      const tw = ctx.measureText(label).width;
      const pillW = tw + 56;
      const pillH = 48;
      const pillX = 96;
      const pillY = baseY + 24;
      ctx.fillStyle = brandColor;
      ctx.beginPath();
      const r = pillH / 2;
      ctx.moveTo(pillX + r, pillY);
      ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillH, r);
      ctx.arcTo(pillX + pillW, pillY + pillH, pillX, pillY + pillH, r);
      ctx.arcTo(pillX, pillY + pillH, pillX, pillY, r);
      ctx.arcTo(pillX, pillY, pillX + pillW, pillY, r);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(label, pillX + 28, pillY + 31);
    }

    ctx.restore();

    // Progress callback
    if (opts.onProgress) opts.onProgress(Math.min(1, t / finalDuration));

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
  await stopPromise;

  // Cleanup
  try { audioCtx.close(); } catch {}
  combinedStream.getTracks().forEach((t) => t.stop());

  return { blob: new Blob(chunks, { type: mime }), mimeType: mime };
}
