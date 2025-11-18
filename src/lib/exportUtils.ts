import type { Frame, Element } from "@/types/elements";
import type { ExportConfig } from "@/components/Canvas/ExportDialog";
import jsPDF from "jspdf";
import GIF from "gif.js";
import { createRoot } from "react-dom/client";
import React from "react";
// Vite will bundle this worker and give us a URL
// @ts-ignore
import workerUrl from "gif.js/dist/gif.worker.js?url";

interface RenderOptions {
  scale: number;
}

async function renderFrameToCanvas(frame: Frame, options: RenderOptions): Promise<HTMLCanvasElement> {
  const { scale } = options;
  const padding = 40; // extra space around frame to avoid clipping
  const canvas = document.createElement("canvas");
  canvas.width = (frame.width + padding * 2) * scale;
  canvas.height = (frame.height + padding * 2) * scale;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.scale(scale, scale);
  ctx.translate(padding, padding);

  // Draw frame background
  await drawFrameBackground(ctx, frame);

  // Draw elements
  for (const element of frame.elements) {
    await drawElement(ctx, element, frame);
  }

  // Draw frame name badge
  drawFrameBadge(ctx, frame);

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
  
  // Elements are positioned relative to the frame, not absolute canvas coordinates
  const x = element.x;
  const y = element.y;
  const width = element.width;
  const height = element.height;

  // Apply rotation if present
  if (element.rotation) {
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.translate(-(x + width / 2), -(y + height / 2));
  }

  if (element.type === "text") {
    drawText(ctx, element, x, y);
  } else if (element.type === "image" && (element.imageUrl || (element as any).src)) {
    const imgSrc = element.imageUrl || (element as any).src;
    const img = await loadImage(imgSrc);
    ctx.globalAlpha = (element.opacity ?? 100) / 100;
    drawFittedImage(ctx, img, x, y, width, height, element.imageFit || "cover");
  } else if (element.type === "shape") {
    await drawShape(ctx, element, x, y, width, height);
  } else if (element.type === "icon" && element.iconName) {
    // Draw icon placeholder (icons need to be rendered differently)
    ctx.fillStyle = element.fill || element.iconColor || "#000000";
    ctx.globalAlpha = (element.opacity ?? 100) / 100;
    ctx.font = `${width}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", x + width/2, y + height/2);
  } else if (element.type === "drawing" && element.pathData) {
    drawPenPath(ctx, element);
  } else if (element.type === "shader" && element.shader) {
    // Render actual shader to canvas
    await drawShaderElement(ctx, element, x, y, width, height);
  }

  // Draw interactive indicator on exported images
  if (element.interactivity?.enabled) {
    ctx.globalAlpha = 1;
    const indicatorSize = 22;
    const indicatorX = x + width - indicatorSize / 2;
    const indicatorY = y - indicatorSize / 2;
    
    // Blue solid circle
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, indicatorSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // White icon inside (click/pointer icon)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    // Draw cursor/pointer icon
    ctx.beginPath();
    ctx.moveTo(indicatorX - 3, indicatorY - 2);
    ctx.lineTo(indicatorX - 1, indicatorY + 3);
    ctx.lineTo(indicatorX + 1, indicatorY + 2);
    ctx.lineTo(indicatorX + 3, indicatorY + 4);
    ctx.moveTo(indicatorX + 1, indicatorY + 2);
    ctx.lineTo(indicatorX + 4, indicatorY - 1);
    ctx.lineTo(indicatorX - 1, indicatorY - 4);
    ctx.lineTo(indicatorX - 3, indicatorY - 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, element: Element, x: number, y: number) {
  ctx.font = `${element.fontWeight || "normal"} ${element.fontSize || 16}px ${element.fontFamily || "Arial"}`;
  ctx.fillStyle = element.color || "#000000";
  ctx.textAlign = (element.textAlign as CanvasTextAlign) || "left";
  ctx.textBaseline = "top";
  ctx.globalAlpha = (element.opacity ?? 100) / 100;

  const lines = (element.text || "").split("\n");
  const lineHeight = (element.fontSize || 16) * 1.2;

  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineHeight);
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

function drawFrameBadge(ctx: CanvasRenderingContext2D, frame: Frame) {
  const frameName = frame.name || "Untitled";
  const badgePadding = 8;
  const badgeHeight = 28;
  const fontSize = 13;
  
  // Measure text
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const textWidth = ctx.measureText(frameName).width;
  const badgeWidth = textWidth + badgePadding * 2 + 8; // Extra space for hash icon
  
  // Draw badge background
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.roundRect(frame.x, frame.y - badgeHeight - 8, badgeWidth, badgeHeight, 6);
  ctx.fill();
  
  // Draw hash icon
  ctx.fillStyle = "#ffffff";
  ctx.font = `${fontSize}px monospace`;
  ctx.fillText("#", frame.x + badgePadding, frame.y - badgeHeight / 2 - 2);
  
  // Draw frame name text
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(frameName, frame.x + badgePadding + 16, frame.y - badgeHeight / 2 - 2);
}

async function drawShaderElement(
  ctx: CanvasRenderingContext2D,
  element: Element,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      // Dynamically import ShadcnShaderElement
      const { ShadcnShaderElement } = await import("@/components/Canvas/ShadcnShaderElement");
      
      // Create temporary container
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      container.style.overflow = "hidden";
      document.body.appendChild(container);

      // Render shader component
      const root = createRoot(container);
      root.render(React.createElement(ShadcnShaderElement, { element }));

      // Wait for shader to render
      await new Promise(r => setTimeout(r, 500));

      // Find canvas in the container
      const shaderCanvas = container.querySelector("canvas");
      
      if (shaderCanvas) {
        ctx.globalAlpha = (element.opacity ?? 100) / 100;
        
        // Apply corner radius if present
        if (element.cornerRadius && element.cornerRadius > 0) {
          ctx.save();
          ctx.beginPath();
          roundedRect(ctx, x, y, width, height, element.cornerRadius);
          ctx.clip();
          ctx.drawImage(shaderCanvas, x, y, width, height);
          ctx.restore();
        } else {
          ctx.drawImage(shaderCanvas, x, y, width, height);
        }
      } else {
        // Fallback to gradient if shader canvas not found
        console.warn("Shader canvas not found, using gradient fallback");
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, "#3b82f6");
        gradient.addColorStop(1, "#8b5cf6");
        ctx.globalAlpha = (element.opacity ?? 100) / 100;
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
      }

      // Cleanup
      root.unmount();
      document.body.removeChild(container);
      
      resolve();
    } catch (error) {
      console.error("Error rendering shader:", error);
      // Fallback to gradient on error
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, "#3b82f6");
      gradient.addColorStop(1, "#8b5cf6");
      ctx.globalAlpha = (element.opacity ?? 100) / 100;
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, width, height);
      resolve();
    }
  });
}

export async function exportFrames(frames: Frame[], config: ExportConfig): Promise<void> {
  const selectedFrames = frames.filter(f => config.frameIds.includes(f.id));

  // Handle social media multi-size export
  if (config.socialMediaSizes && config.socialMediaSizes.length > 0) {
    for (const frame of selectedFrames) {
      for (const size of config.socialMediaSizes) {
        await exportFrameForSocialMedia(frame, size, config);
      }
    }
    return;
  }

  if (config.format === "PDF") {
    await exportAsPDF(selectedFrames, config);
  } else if (config.format === "SVG") {
    for (const frame of selectedFrames) {
      await exportFrameAsSVG(frame);
    }
  } else if (config.format === "GIF") {
    for (const frame of selectedFrames) {
      await exportFrameAsGIF(frame, config);
    }
  } else if (config.format === "MP4") {
    for (const frame of selectedFrames) {
      await exportFrameAsMP4(frame, config);
    }
  } else {
    // PNG or JPEG
    for (const frame of selectedFrames) {
      await exportFrameAsImage(frame, config);
    }
  }
}

async function exportFrameForSocialMedia(
  frame: Frame,
  socialSize: { name: string; width: number; height: number; platform: string },
  config: ExportConfig
): Promise<void> {
  // Create a canvas with the social media dimensions
  const canvas = document.createElement("canvas");
  canvas.width = socialSize.width;
  canvas.height = socialSize.height;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) throw new Error("Failed to get canvas context");

  // Calculate scaling to fit the frame into the social media size while maintaining aspect ratio
  const frameAspect = frame.width / frame.height;
  const targetAspect = socialSize.width / socialSize.height;
  
  let scale: number;
  let offsetX = 0;
  let offsetY = 0;
  
  if (frameAspect > targetAspect) {
    // Frame is wider - fit to width
    scale = socialSize.width / frame.width;
    offsetY = (socialSize.height - (frame.height * scale)) / 2;
  } else {
    // Frame is taller - fit to height
    scale = socialSize.height / frame.height;
    offsetX = (socialSize.width - (frame.width * scale)) / 2;
  }

  // Fill background (white or frame background)
  ctx.fillStyle = frame.backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, socialSize.width, socialSize.height);

  // Render the frame at the calculated position and scale
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  
  // Draw frame background
  await drawFrameBackground(ctx, frame);

  // Draw elements
  for (const element of frame.elements) {
    await drawElement(ctx, element, frame);
  }
  
  ctx.restore();

  // Export the canvas
  const mimeType = config.format === "JPEG" ? "image/jpeg" : "image/png";
  const extension = config.format.toLowerCase();
  const frameName = frame.name || "frame";
  const fileName = `${frameName}_${socialSize.name.replace(/\s+/g, '_')}.${extension}`;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, mimeType);
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

async function captureFrameAtTime(
  frame: Frame,
  time: number,
  scale: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = frame.width * scale;
  canvas.height = frame.height * scale;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.scale(scale, scale);

  // Draw frame background
  await drawFrameBackground(ctx, frame);

  // Draw elements with animation state at the given time
  for (const element of frame.elements) {
    await drawAnimatedElement(ctx, element, frame, time);
  }

  return canvas;
}

async function drawAnimatedElement(
  ctx: CanvasRenderingContext2D,
  element: Element,
  frame: Frame,
  time: number
) {
  ctx.save();
  
  // Elements are positioned relative to the frame
  const x = element.x;
  const y = element.y;

  // Apply rotation if present
  if (element.rotation) {
    ctx.translate(x + element.width / 2, y + element.height / 2);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.translate(-(x + element.width / 2), -(y + element.height / 2));
  }

  // Compute animation progress (0..1)
  const hasAnim = element.animation && element.animation !== 'none';
  const progress = hasAnim ? calculateAnimationProgress(element, time) : 1;

  // Compute effective opacity (normalize 0..1), include fade effects
  const normalizeOpacity = (val: number | undefined) => {
    if (val === undefined || val === null) return 1;
    return val > 1 ? Math.max(0, Math.min(1, val / 100)) : Math.max(0, Math.min(1, val));
  };
  const baseOpacity = normalizeOpacity(element.opacity);
  let fadeAlpha = 1;
  switch (element.animation) {
    case 'fade-in':
      fadeAlpha = progress;
      break;
    case 'fade-out':
      fadeAlpha = 1 - progress;
      break;
    default:
      fadeAlpha = 1;
  }
  const effectiveOpacity = Math.max(0, Math.min(1, baseOpacity * fadeAlpha));

  // Apply transform for animations
  if (hasAnim) {
    applyAnimationTransform(ctx, element, x, y, progress);
  }

  // Draw the element with effectiveOpacity
  if (element.type === "text") {
    const el = { ...element, opacity: effectiveOpacity } as Element;
    drawText(ctx, el, x, y);
  } else if (element.type === "image" && (element.imageUrl || (element as any).src)) {
    const imgSrc = element.imageUrl || (element as any).src;
    const img = await loadImage(imgSrc);
    ctx.globalAlpha = effectiveOpacity;
    drawFittedImage(ctx, img, x, y, element.width, element.height, element.imageFit || "cover");
  } else if (element.type === "shape") {
    const el = { ...element, opacity: effectiveOpacity } as Element;
    await drawShape(ctx, el, x, y, element.width, element.height);
  } else if (element.type === "icon" && element.iconName) {
    ctx.fillStyle = element.fill || element.iconColor || "#000000";
    ctx.globalAlpha = effectiveOpacity;
    ctx.font = `${element.width}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", x + element.width/2, y + element.height/2);
  } else if (element.type === "drawing" && element.pathData) {
    const el = { ...element, opacity: effectiveOpacity } as Element;
    drawPenPath(ctx, el);
  } else if (element.type === "shader" && element.shader) {
    // Draw shader as gradient for animated exports
    ctx.globalAlpha = effectiveOpacity;
    const gradient = ctx.createLinearGradient(x, y, x + element.width, y + element.height);
    
    switch (element.shader.type) {
      case "plasma":
        gradient.addColorStop(0, "#6366f1");
        gradient.addColorStop(0.5, "#a855f7");
        gradient.addColorStop(1, "#ec4899");
        break;
      case "nebula":
        gradient.addColorStop(0, "#1e1b4b");
        gradient.addColorStop(0.5, "#1e3a8a");
        gradient.addColorStop(1, "#000000");
        break;
      case "aurora":
        gradient.addColorStop(0, "#34d399");
        gradient.addColorStop(0.5, "#60a5fa");
        gradient.addColorStop(1, "#a78bfa");
        break;
      case "vortex":
        gradient.addColorStop(0, "#2563eb");
        gradient.addColorStop(0.5, "#9333ea");
        gradient.addColorStop(1, "#db2777");
        break;
      default:
        gradient.addColorStop(0, "#3b82f6");
        gradient.addColorStop(0.5, "#8b5cf6");
        gradient.addColorStop(1, "#ec4899");
    }
    
    ctx.fillStyle = gradient;
    const radius = element.cornerRadius || 0;
    if (radius > 0) {
      ctx.beginPath();
      ctx.save();
      roundedRect(ctx, x, y, element.width, element.height, radius);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillRect(x, y, element.width, element.height);
    }
  }

  ctx.restore();
}

function calculateAnimationProgress(element: Element, time: number): number {
  // Parse delay and duration strings (e.g., "0.5s", "500ms")
  const parseTime = (val?: string | number): number => {
    if (typeof val === 'number') return val / 1000;
    if (!val) return 0;
    if (val.endsWith('ms')) return parseFloat(val) / 1000;
    if (val.endsWith('s')) return parseFloat(val);
    return parseFloat(val) / 1000;
  };
  
  const delay = parseTime(element.animationDelay);
  const duration = parseTime(element.animationDuration) || 1;
  
  if (time < delay) return 0;
  if (time >= delay + duration) return 1;
  
  const elapsed = time - delay;
  return elapsed / duration;
}

function applyAnimationTransform(
  ctx: CanvasRenderingContext2D,
  element: Element,
  x: number,
  y: number,
  progress: number
) {
  const anim = element.animation;
  if (!anim || anim === 'none') return;

  // Move origin to element center
  ctx.translate(x + element.width / 2, y + element.height / 2);

  // Opacity is handled separately; this block is only for transforms
  const distance = 120; // px

  // Slides
  if (anim === 'slide-in-from-left') {
    ctx.translate(-(distance * (1 - progress)), 0);
  } else if (anim === 'slide-in-from-right') {
    ctx.translate(distance * (1 - progress), 0);
  } else if (anim === 'slide-in-from-top') {
    ctx.translate(0, -(distance * (1 - progress)));
  } else if (anim === 'slide-in-from-bottom') {
    ctx.translate(0, distance * (1 - progress));
  } else if (anim === 'slide-out-to-left') {
    ctx.translate(-distance * progress, 0);
  } else if (anim === 'slide-out-to-right') {
    ctx.translate(distance * progress, 0);
  } else if (anim === 'slide-out-to-top') {
    ctx.translate(0, -distance * progress);
  } else if (anim === 'slide-out-to-bottom') {
    ctx.translate(0, distance * progress);
  }

  // Zoom
  if (anim === 'zoom-in') {
    const s = 0.6 + 0.4 * progress;
    ctx.scale(s, s);
  } else if (anim === 'zoom-out') {
    const s = 1 - 0.4 * progress;
    ctx.scale(Math.max(0.01, s), Math.max(0.01, s));
  }

  // Spin
  if (anim === 'spin') {
    const angle = progress * 2 * Math.PI; // 1 rotation
    ctx.rotate(angle);
  }

  // Pulse / Ping / Bounce (approximate)
  if (anim === 'pulse' || anim === 'ping' || anim === 'bounce') {
    const pulse = 1 + 0.08 * Math.sin(progress * Math.PI * 2);
    ctx.scale(pulse, pulse);
  }

  // Move origin back
  ctx.translate(-(x + element.width / 2), -(y + element.height / 2));
}

async function exportFrameAsGIF(frame: Frame, config: ExportConfig): Promise<void> {
  const duration = config.duration || 3;
  const fps = config.fps || 30;
  const totalFrames = Math.floor(duration * fps);

  const gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: workerUrl,
    width: frame.width * config.scale,
    height: frame.height * config.scale,
  });

  for (let i = 0; i < totalFrames; i++) {
    const time = (i / totalFrames) * duration;
    const canvas = await captureFrameAtTime(frame, time, config.scale);
    gif.addFrame(canvas, { delay: 1000 / fps, copy: true });
  }

  return new Promise((resolve, reject) => {
    gif.on('finished', (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${frame.name || "frame"}.gif`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      resolve();
    });

    gif.on('error', reject);
    gif.render();
  });
}

async function exportFrameAsMP4(frame: Frame, config: ExportConfig): Promise<void> {
  const duration = config.duration || 3;
  const fps = config.fps || 30;
  const totalFrames = Math.floor(duration * fps);

  // Create a temporary canvas for recording
  const recordCanvas = document.createElement("canvas");
  recordCanvas.width = frame.width * config.scale;
  recordCanvas.height = frame.height * config.scale;
  const recordCtx = recordCanvas.getContext("2d");
  
  if (!recordCtx) throw new Error("Failed to get canvas context");

  // Check for supported mime types
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
  }

  const stream = recordCanvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: mimeType,
    videoBitsPerSecond: 5000000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${frame.name || "frame"}.webm`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      resolve();
    };

    mediaRecorder.onerror = (e) => {
      console.error("MediaRecorder error:", e);
      reject(new Error("Failed to record video"));
    };
    
    mediaRecorder.start();

    let currentFrame = 0;
    const drawFrame = async () => {
      try {
        if (currentFrame >= totalFrames) {
          mediaRecorder.stop();
          return;
        }

        const time = (currentFrame / totalFrames) * duration;
        const frameCanvas = await captureFrameAtTime(frame, time, config.scale);
        recordCtx.clearRect(0, 0, recordCanvas.width, recordCanvas.height);
        recordCtx.drawImage(frameCanvas, 0, 0);

        currentFrame++;
        setTimeout(drawFrame, 1000 / fps);
      } catch (error) {
        console.error("Error drawing frame:", error);
        mediaRecorder.stop();
        reject(error);
      }
    };

    drawFrame();
  });
}
