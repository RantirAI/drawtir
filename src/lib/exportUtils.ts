import type { Frame, Element } from "@/types/elements";
import type { ExportConfig } from "@/components/Canvas/ExportDialog";
import jsPDF from "jspdf";

interface RenderOptions {
  scale: number;
}

async function renderFrameToCanvas(frame: Frame, options: RenderOptions): Promise<HTMLCanvasElement> {
  const { scale } = options;
  const canvas = document.createElement("canvas");
  canvas.width = frame.width * scale;
  canvas.height = frame.height * scale;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.scale(scale, scale);

  // Draw frame background
  await drawFrameBackground(ctx, frame);

  // Draw elements
  for (const element of frame.elements) {
    await drawElement(ctx, element, frame);
  }

  return canvas;
}

async function drawFrameBackground(ctx: CanvasRenderingContext2D, frame: Frame) {
  const { width, height, backgroundColor, backgroundType, backgroundImage, backgroundImageFit } = frame;

  if (backgroundType === "image" && backgroundImage) {
    const img = await loadImage(backgroundImage);
    drawFittedImage(ctx, img, 0, 0, width, height, backgroundImageFit || "cover");
  } else if (backgroundType === "gradient" && frame.gradientStops) {
    const gradient = createGradient(ctx, frame);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
}

async function drawElement(ctx: CanvasRenderingContext2D, element: Element, frame: Frame) {
  ctx.save();
  
  const x = element.x - frame.x;
  const y = element.y - frame.y;
  const width = element.width;
  const height = element.height;

  if (element.type === "text") {
    drawText(ctx, element, x, y);
  } else if (element.type === "image" && element.imageUrl) {
    const img = await loadImage(element.imageUrl);
    ctx.globalAlpha = element.opacity ?? 1;
    ctx.drawImage(img, x, y, width, height);
  } else if (element.type === "shape") {
    await drawShape(ctx, element, x, y, width, height);
  } else if (element.type === "drawing" && element.pathData) {
    ctx.translate(-frame.x, -frame.y);
    drawPenPath(ctx, element);
  }

  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, element: Element, x: number, y: number) {
  ctx.font = `${element.fontWeight || "normal"} ${element.fontSize || 16}px ${element.fontFamily || "Arial"}`;
  ctx.fillStyle = element.color || "#000000";
  ctx.textAlign = (element.textAlign as CanvasTextAlign) || "left";
  ctx.globalAlpha = element.opacity ?? 1;

  const lines = (element.text || "").split("\n");
  const lineHeight = (element.fontSize || 16) * 1.2;

  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineHeight + (element.fontSize || 16));
  });
}

async function drawShape(ctx: CanvasRenderingContext2D, element: Element, x: number, y: number, width: number, height: number) {
  ctx.globalAlpha = element.opacity ?? 1;

  // Create path
  ctx.beginPath();
  
  if (element.shapeType === "rectangle") {
    const radius = element.cornerRadius || 0;
    roundedRect(ctx, x, y, width, height, radius);
  } else if (element.shapeType === "ellipse") {
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI);
  } else if (element.shapeType === "line") {
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y + height);
  }

  // Fill
  if (element.fillType === "image" && element.fillImage) {
    const img = await loadImage(element.fillImage);
    ctx.save();
    ctx.clip();
    drawFittedImage(ctx, img, x, y, width, height, element.fillImageFit || "cover");
    ctx.restore();
  } else if (element.fillType === "gradient" && element.gradientStops) {
    const gradient = createElementGradient(ctx, element, x, y, width, height);
    ctx.fillStyle = gradient;
    ctx.globalAlpha = element.fillOpacity ?? element.opacity ?? 1;
    ctx.fill();
  } else if (element.fill) {
    ctx.fillStyle = element.fill;
    ctx.fill();
  }

  // Stroke
  if (element.stroke && element.strokeWidth) {
    ctx.strokeStyle = element.stroke;
    ctx.lineWidth = element.strokeWidth;
    ctx.stroke();
  }
}

function drawPenPath(ctx: CanvasRenderingContext2D, element: Element) {
  if (!element.pathData) return;

  ctx.beginPath();
  ctx.strokeStyle = element.stroke || "#000000";
  ctx.lineWidth = element.strokeWidth || 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = element.opacity ?? 1;

  // Parse SVG path data
  const path = new Path2D(element.pathData);
  ctx.stroke(path);
}

function createGradient(ctx: CanvasRenderingContext2D, frame: Frame): CanvasGradient {
  const { width, height, gradientType, gradientAngle, gradientStops } = frame;

  let gradient: CanvasGradient;
  
  if (gradientType === "radial") {
    gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
  } else {
    const angle = (gradientAngle || 0) * (Math.PI / 180);
    const x1 = width / 2 - Math.cos(angle) * width / 2;
    const y1 = height / 2 - Math.sin(angle) * height / 2;
    const x2 = width / 2 + Math.cos(angle) * width / 2;
    const y2 = height / 2 + Math.sin(angle) * height / 2;
    gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  }

  (gradientStops || []).forEach(stop => {
    gradient.addColorStop(stop.position / 100, stop.color);
  });

  return gradient;
}

function createElementGradient(ctx: CanvasRenderingContext2D, element: Element, x: number, y: number, width: number, height: number): CanvasGradient {
  let gradient: CanvasGradient;
  
  if (element.gradientType === "radial") {
    gradient = ctx.createRadialGradient(x + width / 2, y + height / 2, 0, x + width / 2, y + height / 2, Math.max(width, height) / 2);
  } else {
    const angle = (element.gradientAngle || 0) * (Math.PI / 180);
    const x1 = x + width / 2 - Math.cos(angle) * width / 2;
    const y1 = y + height / 2 - Math.sin(angle) * height / 2;
    const x2 = x + width / 2 + Math.cos(angle) * width / 2;
    const y2 = y + height / 2 + Math.sin(angle) * height / 2;
    gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  }

  (element.gradientStops || []).forEach(stop => {
    gradient.addColorStop(stop.position / 100, stop.color);
  });

  return gradient;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

function drawFittedImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, width: number, height: number, fit: string = "cover") {
  const imgRatio = img.width / img.height;
  const boxRatio = width / height;

  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  let dx = x, dy = y, dw = width, dh = height;

  if (fit === "cover") {
    if (imgRatio > boxRatio) {
      sw = img.height * boxRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / boxRatio;
      sy = (img.height - sh) / 2;
    }
  } else if (fit === "contain") {
    if (imgRatio > boxRatio) {
      dh = width / imgRatio;
      dy = y + (height - dh) / 2;
    } else {
      dw = height * imgRatio;
      dx = x + (width - dw) / 2;
    }
  } else if (fit === "fill") {
    // Use full image and full box
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function exportFrames(frames: Frame[], config: ExportConfig): Promise<void> {
  const selectedFrames = frames.filter(f => config.frameIds.includes(f.id));

  if (config.format === "PDF") {
    await exportAsPDF(selectedFrames, config);
  } else if (config.format === "SVG") {
    for (const frame of selectedFrames) {
      await exportFrameAsSVG(frame);
    }
  } else {
    // PNG or JPEG
    for (const frame of selectedFrames) {
      await exportFrameAsImage(frame, config);
    }
  }
}

async function exportFrameAsImage(frame: Frame, config: ExportConfig): Promise<void> {
  const canvas = await renderFrameToCanvas(frame, { scale: config.scale });
  const mimeType = config.format === "JPEG" ? "image/jpeg" : "image/png";
  const extension = config.format.toLowerCase();

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${frame.name || "frame"}.${extension}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, mimeType);
}

async function exportAsPDF(frames: Frame[], config: ExportConfig): Promise<void> {
  const pdf = new jsPDF({
    orientation: frames[0].width > frames[0].height ? "landscape" : "portrait",
    unit: "px",
    format: [frames[0].width, frames[0].height],
  });

  for (let i = 0; i < frames.length; i++) {
    if (i > 0) {
      pdf.addPage([frames[i].width, frames[i].height], frames[i].width > frames[i].height ? "landscape" : "portrait");
    }

    const canvas = await renderFrameToCanvas(frames[i], { scale: config.scale });
    const imgData = canvas.toDataURL("image/png");

    // Ensure the image fills the entire page exactly
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
  }

  pdf.save(`export-${Date.now()}.pdf`);
}

async function exportFrameAsSVG(frame: Frame): Promise<void> {
  // Basic SVG export - can be enhanced
  let svg = `<svg width="${frame.width}" height="${frame.height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="100%" height="100%" fill="${frame.backgroundColor || '#ffffff'}"/>`;
  
  // Add elements (simplified)
  frame.elements.forEach(element => {
    if (element.type === "text") {
      svg += `<text x="${element.x}" y="${element.y}" font-size="${element.fontSize || 16}" fill="${element.color || '#000000'}">${element.text || ""}</text>`;
    } else if (element.type === "shape" && element.shapeType === "rectangle") {
      svg += `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="${element.fill || 'transparent'}" stroke="${element.stroke || 'none'}" stroke-width="${element.strokeWidth || 0}"/>`;
    }
  });

  svg += "</svg>";

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${frame.name || "frame"}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
