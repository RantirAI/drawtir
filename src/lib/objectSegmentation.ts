import { pipeline, env } from "@huggingface/transformers";

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

export type SegmentedLayer = {
  label: string;
  dataUrl: string; // Cropped PNG with transparent background
  bbox: { x: number; y: number; width: number; height: number };
  sourceWidth: number;
  sourceHeight: number;
  area: number; // number of mask pixels (for ranking)
};

const MAX_IMAGE_DIMENSION = 1024;

async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  // Fetch to avoid CORS taint, then create object URL
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

function drawImageToMaxCanvas(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  return { canvas, ctx };
}

function computeBBoxFromMask(maskData: Float32Array, width: number, height: number) {
  let minX = width, minY = height, maxX = -1, maxY = -1, area = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = maskData[y * width + x];
      if (v > 0.5) {
        area++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (area === 0) return { bbox: null as any, area: 0 };
  return {
    bbox: { x: minX, y: minY, width: Math.max(1, maxX - minX + 1), height: Math.max(1, maxY - minY + 1) },
    area,
  };
}

export async function segmentImageToLayers(imageUrl: string, options?: {
  maxObjects?: number; // limit number of layers
  minAreaRatio?: number; // filter out small components by area relative to full image
  preferredLabels?: string[]; // prioritize these labels if present
}): Promise<SegmentedLayer[]> {
  const maxObjects = options?.maxObjects ?? 4;
  const minAreaRatio = options?.minAreaRatio ?? 0.01; // 1%
  const preferredLabels = options?.preferredLabels ?? ["person", "car", "bus", "bicycle", "motorbike", "truck", "dog", "cat"];

  const img = await loadImageFromUrl(imageUrl);
  const { canvas: srcCanvas } = drawImageToMaxCanvas(img);
  const sourceWidth = srcCanvas.width;
  const sourceHeight = srcCanvas.height;

  const segmenter = await pipeline("image-segmentation", "Xenova/segformer-b0-finetuned-ade-512-512", {
    device: "webgpu",
  });

  const base64 = srcCanvas.toDataURL("image/jpeg", 0.9);
  const result: Array<{ label: string; mask: { data: Float32Array; width: number; height: number } }>
    = (await segmenter(base64)) as any;

  if (!Array.isArray(result) || result.length === 0) return [];

  // Compute bboxes and filter by area
  const layers: SegmentedLayer[] = [];

  for (const r of result) {
    if (!r?.mask?.data) continue;
    const mWidth = (r.mask as any).width ?? sourceWidth;
    const mHeight = (r.mask as any).height ?? sourceHeight;
    const { bbox, area } = computeBBoxFromMask(r.mask.data as Float32Array, mWidth, mHeight);
    if (!bbox || area === 0) continue;

    const areaRatio = area / (mWidth * mHeight);
    if (areaRatio < minAreaRatio) continue; // too small

    // Create cropped PNG with transparency
    const outCanvas = document.createElement("canvas");
    outCanvas.width = bbox.width;
    outCanvas.height = bbox.height;
    const outCtx = outCanvas.getContext("2d");
    const tmpCtx = document.createElement("canvas").getContext("2d");
    if (!outCtx || !tmpCtx) continue;

    // Draw the same source at mask resolution to simplify indexing
    const maskSpaceCanvas = document.createElement("canvas");
    maskSpaceCanvas.width = mWidth;
    maskSpaceCanvas.height = mHeight;
    const maskSpaceCtx = maskSpaceCanvas.getContext("2d");
    if (!maskSpaceCtx) continue;

    // Draw original image scaled to mask resolution
    maskSpaceCtx.drawImage(srcCanvas, 0, 0, mWidth, mHeight);

    const imageData = maskSpaceCtx.getImageData(bbox.x, bbox.y, bbox.width, bbox.height);
    const data = imageData.data; // RGBA

    // Apply alpha from mask (clipped to bbox)
    for (let y = 0; y < bbox.height; y++) {
      for (let x = 0; x < bbox.width; x++) {
        const idx = (y * bbox.width + x) * 4;
        const mVal = (r.mask.data as Float32Array)[(bbox.y + y) * mWidth + (bbox.x + x)];
        const alpha = Math.max(0, Math.min(255, Math.round(mVal * 255)));
        data[idx + 3] = alpha; // set alpha
      }
    }

    outCtx.putImageData(imageData, 0, 0);

    const dataUrl: string = await new Promise((resolve) => {
      outCanvas.toBlob((blob) => {
        if (!blob) return resolve("");
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }, "image/png", 1.0);
    });

    if (!dataUrl) continue;

    layers.push({
      label: r.label,
      dataUrl,
      bbox,
      sourceWidth: mWidth,
      sourceHeight: mHeight,
      area,
    });
  }

  // Sort: preferred labels first, then by area desc
  layers.sort((a, b) => {
    const aPref = preferredLabels.indexOf(a.label);
    const bPref = preferredLabels.indexOf(b.label);
    if (aPref !== -1 || bPref !== -1) {
      if (aPref === -1) return 1;
      if (bPref === -1) return -1;
      if (aPref !== bPref) return aPref - bPref;
    }
    return b.area - a.area;
  });

  return layers.slice(0, maxObjects);
}
