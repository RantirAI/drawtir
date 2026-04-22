export interface MarketingVideoScene {
  caption: string;
  voiceover: string;
  visual_prompt: string;
  image_url: string;
  start: number;
  duration: number;
  scene_type?: "cinematic" | "featured" | "logo_subject" | string | null;
  featured_image_url?: string | null;
  featured_image_label?: string | null;
  featured_image_treatment?: "fullscreen" | "device_mockup" | string | null;
}

export interface SubtitleWord {
  word: string;
  start: number;
  end: number;
  speaker?: "A" | "B" | null;
  speaker_name?: string | null;
}

export interface RenderOptions {
  width?: number;
  height?: number;
  fps?: number;
  brandColor?: string;
  logoUrl?: string | null;
  brandName?: string;
  subtitles?: SubtitleWord[];
  burnSubtitles?: boolean;
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

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  zoom: number,
  panX: number,
  panY: number,
) {
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

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  maxW: number,
  maxH: number,
) {
  const ir = img.width / img.height;
  const cr = maxW / maxH;
  let dw, dh;
  if (ir > cr) {
    dw = maxW;
    dh = dw / ir;
  } else {
    dh = maxH;
    dw = dh * ir;
  }
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  return { dw, dh };
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

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Get the active subtitle window: a sliding 3-7 word phrase around the current time.
function getActiveSubtitle(words: SubtitleWord[], t: number): { text: string; start: number; end: number } | null {
  if (!words.length) return null;
  // Find the active word
  let idx = -1;
  for (let i = 0; i < words.length; i++) {
    if (t >= words[i].start && t <= words[i].end + 0.05) {
      idx = i;
      break;
    }
    if (words[i].start > t) {
      idx = Math.max(0, i - 1);
      break;
    }
  }
  if (idx < 0) idx = words.length - 1;

  // Build a phrase window around it (target ~5 words centered)
  const target = 5;
  const start = Math.max(0, idx - Math.floor(target / 2));
  const end = Math.min(words.length, start + target);
  const adjStart = Math.max(0, end - target);
  const slice = words.slice(adjStart, end);
  return {
    text: slice.map((w) => w.word).join(" "),
    start: slice[0].start,
    end: slice[slice.length - 1].end,
  };
}

export async function renderMarketingVideo(
  scenes: MarketingVideoScene[],
  audioUrl: string,
  durationSeconds: number,
  opts: RenderOptions = {},
): Promise<{ blob: Blob; mimeType: string }> {
  const width = opts.width ?? 1280;
  const height = opts.height ?? 720;
  const fps = opts.fps ?? 30;
  const brandColor = opts.brandColor ?? "#9b87f5";
  const brandName = opts.brandName ?? "";
  const burnSubs = opts.burnSubtitles ?? true;
  const subtitles = opts.subtitles ?? [];

  // Preload all needed images
  const bgImgs = await Promise.all(scenes.map((s) => loadImage(s.image_url).catch(() => null)));
  const featuredImgs = await Promise.all(
    scenes.map((s) =>
      s.featured_image_url && s.featured_image_treatment === "fullscreen"
        ? loadImage(s.featured_image_url).catch(() => null)
        : Promise.resolve(null),
    ),
  );
  const logoImg = opts.logoUrl ? await loadImage(opts.logoUrl).catch(() => null) : null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false })!;

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
  source.connect(audioCtx.destination);

  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const { mime } = pickRecorderMime();
  const recorder = new MediaRecorder(combinedStream, { mimeType: mime, videoBitsPerSecond: 4_500_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const finalDuration = Math.max(durationSeconds, audio.duration || durationSeconds);
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
      setTimeout(() => {
        try { recorder.stop(); } catch {}
        try { audio.pause(); } catch {}
      }, 200);
      return;
    }

    let idx = 0;
    for (let i = 0; i < scaled.length; i++) {
      if (t >= scaled[i]._start && t < scaled[i]._start + scaled[i]._dur) { idx = i; break; }
      if (t >= scaled[i]._start) idx = i;
    }
    const scene = scaled[idx];
    const localT = (t - scene._start) / Math.max(scene._dur, 0.0001);
    const isFeaturedFullscreen = scene.scene_type === "featured" && scene.featured_image_treatment === "fullscreen";

    // Background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    if (isFeaturedFullscreen && featuredImgs[idx]) {
      // Premium product showcase: branded backdrop + screenshot framed in center, subtle zoom
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, brandColor + "33");
      grad.addColorStop(1, "#0a0a0f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // soft brand glow
      const g2 = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.7);
      g2.addColorStop(0, brandColor + "22");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      const zoom = 0.94 + localT * 0.04;
      const maxW = width * 0.72 * zoom;
      const maxH = height * 0.72 * zoom;

      // shadow card
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 18;
      const img = featuredImgs[idx]!;
      const ir = img.width / img.height;
      const cr = maxW / maxH;
      let dw, dh;
      if (ir > cr) { dw = maxW; dh = dw / ir; } else { dh = maxH; dw = dh * ir; }
      const dx = (width - dw) / 2;
      const dy = (height - dh) / 2;
      // rounded corner clip
      ctx.fillStyle = "#fff";
      roundRectPath(ctx, dx - 8, dy - 8, dw + 16, dh + 16, 14);
      ctx.fill();
      ctx.restore();
      ctx.save();
      roundRectPath(ctx, dx, dy, dw, dh, 8);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      // Cinematic / logo_subject — Ken Burns over the AI image
      const bg = bgImgs[idx];
      if (bg) {
        const dir = idx % 2 === 0 ? 1 : -1;
        const zoom = 1.08 + localT * 0.06;
        const panX = dir * (width * 0.04) * (localT - 0.5);
        const panY = (idx % 3 === 0 ? -1 : 1) * (height * 0.02) * (localT - 0.5);
        drawCover(ctx, bg, width, height, zoom, panX, panY);
      }
    }

    // Bottom gradient for caption legibility
    const grad = ctx.createLinearGradient(0, height * 0.45, 0, height);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, height * 0.45, width, height * 0.55);

    // Top brand bar
    ctx.fillStyle = brandColor;
    ctx.fillRect(0, 0, width, 6);

    // Logo watermark (top-left, persistent)
    if (logoImg) {
      const lh = 44;
      const lw = (logoImg.width / logoImg.height) * lh;
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.drawImage(logoImg, 32, 28, Math.min(lw, 200), lh);
      ctx.restore();
    } else if (brandName) {
      ctx.font = "600 26px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "top";
      ctx.fillText(brandName, 32, 32);
    }

    // Featured label badge (top-right)
    if (scene.scene_type === "featured" && scene.featured_image_label) {
      const label = scene.featured_image_label.toUpperCase();
      ctx.font = "700 16px Inter, system-ui, sans-serif";
      const tw = ctx.measureText(label).width;
      const padX = 16;
      const padY = 8;
      const bw = tw + padX * 2;
      const bh = 32;
      const bx = width - bw - 32;
      const by = 28;
      ctx.fillStyle = brandColor;
      roundRectPath(ctx, bx, by, bw, bh, bh / 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(label, bx + padX, by + bh / 2 + 1);
    }

    // Caption
    const inT = Math.min(1, localT / (0.4 / Math.max(scene._dur, 0.4)));
    const ease = easeOutCubic(inT);
    ctx.save();
    ctx.globalAlpha = ease;

    const captionText = scene.caption || "";
    const isLast = idx === scaled.length - 1;
    const fontSize = isLast ? 80 : 64;
    ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    const maxW = width - 128;
    const lines = wrapText(ctx, captionText.toUpperCase(), maxW);
    const lineH = fontSize * 1.05;
    const blockH = lines.length * lineH;
    // Reserve space at bottom for subtitles
    const bottomReserve = burnSubs && subtitles.length ? 110 : 60;
    const baseY = height - bottomReserve - blockH + lineH + (1 - ease) * 30;

    ctx.fillStyle = brandColor;
    ctx.fillRect(64, baseY - lineH + 12, 8, blockH - 12);

    ctx.fillStyle = "#fff";
    lines.forEach((ln, i) => {
      ctx.fillText(ln, 96, baseY + i * lineH);
    });

    if (isLast) {
      ctx.font = "600 22px Inter, system-ui, sans-serif";
      const label = "LEARN MORE";
      const tw = ctx.measureText(label).width;
      const pillW = tw + 56;
      const pillH = 44;
      const pillX = 96;
      const pillY = baseY + 20;
      ctx.fillStyle = brandColor;
      roundRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(label, pillX + 28, pillY + pillH / 2 + 1);
    }
    ctx.restore();

    // Burned-in subtitles + speaker chip (bottom)
    if (burnSubs && subtitles.length) {
      const sub = getActiveSubtitle(subtitles, t);
      if (sub && sub.text) {
        // Find active speaker from word at time t
        let activeSpeaker: string | null = null;
        let activeSpeakerKey: "A" | "B" | null = null;
        for (const w of subtitles) {
          if (t >= w.start && t <= w.end + 0.05) {
            activeSpeaker = w.speaker_name || null;
            activeSpeakerKey = (w.speaker as any) || null;
            break;
          }
        }
        ctx.save();
        ctx.font = "700 28px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const text = sub.text;
        const tw = ctx.measureText(text).width;
        const padX = 24;
        const bw = Math.min(width - 80, tw + padX * 2);
        const bh = 48;
        const bx = (width - bw) / 2;
        const by = height - bh - 32;
        ctx.fillStyle = "rgba(0,0,0,0.78)";
        roundRectPath(ctx, bx, by, bw, bh, 10);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillText(text, width / 2, by + bh / 2 + 1, bw - padX * 2);
        ctx.restore();

        if (activeSpeaker) {
          ctx.save();
          ctx.font = "700 14px Inter, system-ui, sans-serif";
          const label = activeSpeaker.toUpperCase();
          const lw = ctx.measureText(label).width;
          const lpadX = 12;
          const lbw = lw + lpadX * 2;
          const lbh = 26;
          const lbx = (width - lbw) / 2;
          const lby = by - lbh - 8;
          ctx.fillStyle = activeSpeakerKey === "B" ? "#ffffff" : brandColor;
          roundRectPath(ctx, lbx, lby, lbw, lbh, lbh / 2);
          ctx.fill();
          ctx.fillStyle = activeSpeakerKey === "B" ? "#0a0a0f" : "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, width / 2, lby + lbh / 2 + 1);
          ctx.restore();
        }
      }
    }

    // Always-on speaker chip for podcast mode (even when subs off)
    if (!burnSubs && subtitles.length) {
      let activeSpeaker: string | null = null;
      let activeSpeakerKey: "A" | "B" | null = null;
      for (const w of subtitles) {
        if (t >= w.start && t <= w.end + 0.05) {
          activeSpeaker = w.speaker_name || null;
          activeSpeakerKey = (w.speaker as any) || null;
          break;
        }
      }
      if (activeSpeaker) {
        ctx.save();
        ctx.font = "700 14px Inter, system-ui, sans-serif";
        const label = activeSpeaker.toUpperCase();
        const lw = ctx.measureText(label).width;
        const lpadX = 14;
        const lbw = lw + lpadX * 2;
        const lbh = 28;
        const lbx = (width - lbw) / 2;
        const lby = height - lbh - 32;
        ctx.fillStyle = activeSpeakerKey === "B" ? "#ffffff" : brandColor;
        roundRectPath(ctx, lbx, lby, lbw, lbh, lbh / 2);
        ctx.fill();
        ctx.fillStyle = activeSpeakerKey === "B" ? "#0a0a0f" : "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, width / 2, lby + lbh / 2 + 1);
        ctx.restore();
      }
    }

    if (opts.onProgress) opts.onProgress(Math.min(1, t / finalDuration));
    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
  await stopPromise;

  try { audioCtx.close(); } catch {}
  combinedStream.getTracks().forEach((tr) => tr.stop());

  return { blob: new Blob(chunks, { type: mime }), mimeType: mime };
}
