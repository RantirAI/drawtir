import type { Frame } from "@/types/elements";
import type { CanvasSnapshot, VoiceAudio } from "@/types/snapshot";

export const SNAPSHOT_VERSION = "1.0.0";

export function createSnapshot(
  frames: Frame[],
  title: string,
  zoom: number = 1,
  panOffset: { x: number; y: number } = { x: 0, y: 0 },
  backgroundColor: string = "#ffffff",
  voiceAudios: VoiceAudio[] = []
): CanvasSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    metadata: {
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    canvas: {
      backgroundColor,
      zoom,
      panOffset,
    },
    frames: JSON.parse(JSON.stringify(frames)), // Deep clone
    voiceAudios: JSON.parse(JSON.stringify(voiceAudios)), // Deep clone
  };
}

export function validateSnapshot(snapshot: any): snapshot is CanvasSnapshot {
  // More lenient validation to support older project formats
  return (
    snapshot &&
    typeof snapshot === "object" &&
    "frames" in snapshot &&
    Array.isArray(snapshot.frames) &&
    snapshot.frames.length > 0
  );
}

export function generateThumbnail(
  frames: Frame[],
  width: number = 400,
  height: number = 300
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve("");
      return;
    }

    // Draw white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Calculate bounds of all frames
    if (frames.length === 0) {
      resolve(canvas.toDataURL("image/png"));
      return;
    }

    const bounds = frames.reduce(
      (acc, frame) => ({
        minX: Math.min(acc.minX, frame.x),
        minY: Math.min(acc.minY, frame.y),
        maxX: Math.max(acc.maxX, frame.x + frame.width),
        maxY: Math.max(acc.maxY, frame.y + frame.height),
      }),
      {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      }
    );

    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    const scale = Math.min(width / contentWidth, height / contentHeight, 1) * 0.9;

    const offsetX = (width - contentWidth * scale) / 2 - bounds.minX * scale;
    const offsetY = (height - contentHeight * scale) / 2 - bounds.minY * scale;

    // Helper utilities for gradients, rounded rects and image fitting
    function applyAlphaToHex(color: string, opacity: number): string {
      // Convert hex to rgba with alpha. If not hex, return color as-is
      const alpha = opacity > 1 ? opacity / 100 : opacity;
      if (!color || !color.startsWith('#')) return color;
      let hex = color.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map((c) => c + c).join('');
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
    }

    function normalizeStopPosition(p: number): number {
      return p > 1 ? p / 100 : p;
    }

    function roundedRectPath(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }

    function drawFittedImage(
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      x: number,
      y: number,
      w: number,
      h: number,
      fit: 'fill' | 'contain' | 'cover' | 'crop'
    ) {
      const iw = img.width;
      const ih = img.height;
      if (!iw || !ih) {
        ctx.drawImage(img, x, y, w, h);
        return;
      }
      if (fit === 'fill') {
        ctx.drawImage(img, x, y, w, h);
        return;
      }
      const scaleContain = Math.min(w / iw, h / ih);
      const scaleCover = Math.max(w / iw, h / ih);
      const scale = fit === 'contain' ? scaleContain : scaleCover;
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = x + (w - dw) / 2;
      const dy = y + (h - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    // Track loaded images
    const imagePromises: Promise<void>[] = [];

    // Draw frames with elements
    frames.forEach((frame) => {
      const x = frame.x * scale + offsetX;
      const y = frame.y * scale + offsetY;
      const w = frame.width * scale;
      const h = frame.height * scale;

      // Draw frame background (solid, gradient, or image)
      if (frame.backgroundType === "image" && frame.backgroundImage) {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        const promise = new Promise<void>((resolve) => {
          bgImg.onload = () => {
            ctx.save();
            drawFittedImage(
              ctx,
              bgImg,
              x,
              y,
              w,
              h,
              (frame.backgroundImageFit as any) || "cover"
            );
            ctx.restore();
            resolve();
          };
          bgImg.onerror = () => resolve();
        });
        bgImg.src = frame.backgroundImage;
        imagePromises.push(promise);
      } else if (
        frame.backgroundType === "gradient" &&
        frame.gradientStops &&
        frame.gradientStops.length
      ) {
        ctx.save();
        // Build gradient (linear default)
        const angle = (frame.gradientAngle || 0) * (Math.PI / 180);
        const cx = x + w / 2;
        const cy = y + h / 2;
        let gradient: CanvasGradient;
        if (frame.gradientType === "radial") {
          // Radial from center
          const radius = Math.sqrt((w * w + h * h)) / 2;
          gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        } else {
          // Linear across bounding box following angle
          const halfDiag = Math.sqrt((w * w + h * h)) / 2;
          const x0 = cx - Math.cos(angle) * halfDiag;
          const y0 = cy - Math.sin(angle) * halfDiag;
          const x1 = cx + Math.cos(angle) * halfDiag;
          const y1 = cy + Math.sin(angle) * halfDiag;
          gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        }
        frame.gradientStops.forEach((stop) => {
          const pos = stop.position > 1 ? stop.position / 100 : stop.position;
          gradient.addColorStop(
            Math.max(0, Math.min(1, pos)),
            stop.opacity !== undefined
              ? applyAlphaToHex(stop.color, stop.opacity)
              : stop.color
          );
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
      } else {
        ctx.fillStyle = frame.backgroundColor || "#ffffff";
        ctx.fillRect(x, y, w, h);
      }


      // Draw elements inside frame
      if (frame.elements && frame.elements.length > 0) {
        frame.elements.forEach((element) => {
          const elemX = x + (element.x || 0) * scale;
          const elemY = y + (element.y || 0) * scale;
          const elemW = (element.width || 50) * scale;
          const elemH = (element.height || 50) * scale;

          if (element.type === "text" && element.text) {
            // Draw text
            ctx.save();
            ctx.fillStyle = element.fill || "#ffffff";
            ctx.font = `${Math.max(8, (element.fontSize || 16) * scale)}px Inter`;
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            
            // Wrap text if needed
            const words = element.text.split(" ");
            let line = "";
            let lineY = elemY;
            const lineHeight = (element.fontSize || 16) * scale * 1.2;
            
            words.forEach((word) => {
              const testLine = line + word + " ";
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > elemW && line) {
                ctx.fillText(line, elemX, lineY);
                line = word + " ";
                lineY += lineHeight;
              } else {
                line = testLine;
              }
            });
            ctx.fillText(line, elemX, lineY);
            ctx.restore();
          } else if (element.type === "shape") {
            // Draw shapes with solid, gradient, or image fills and optional strokes
            ctx.save();

            const baseAlpha = element.opacity !== undefined ? element.opacity / 100 : 1;
            const fillAlpha = element.fillOpacity !== undefined ? element.fillOpacity / 100 : 1;
            const combinedAlpha = Math.max(0, Math.min(1, baseAlpha * fillAlpha));
            const radius = (element.cornerRadius || 0) * scale;
            const isEllipse = element.shapeType === "ellipse";
            const isRect = element.shapeType === "rectangle" || !element.shapeType;
            const isLine = element.shapeType === "line" || element.shapeType === "arrow";

            // Clip to shape bounds for non-line shapes
            if (!isLine) {
              ctx.beginPath();
              if (isEllipse) {
                ctx.ellipse(
                  elemX + elemW / 2,
                  elemY + elemH / 2,
                  elemW / 2,
                  elemH / 2,
                  0,
                  0,
                  2 * Math.PI
                );
              } else {
                roundedRectPath(ctx, elemX, elemY, elemW, elemH, radius);
              }
              ctx.clip();
            }

            // Fill
            if (element.fillType === "image" && element.fillImage) {
              const fillImg = new Image();
              fillImg.crossOrigin = "anonymous";
              const p = new Promise<void>((resolve) => {
                fillImg.onload = () => {
                  ctx.save();
                  ctx.globalAlpha = combinedAlpha;
                  drawFittedImage(
                    ctx,
                    fillImg,
                    elemX,
                    elemY,
                    elemW,
                    elemH,
                    element.fillImageFit || "cover"
                  );
                  ctx.restore();
                  resolve();
                };
                fillImg.onerror = () => resolve();
              });
              fillImg.src = element.fillImage;
              imagePromises.push(p);
            } else if (
              element.fillType === "gradient" &&
              element.gradientStops &&
              element.gradientStops.length
            ) {
              const angle = (element.gradientAngle || 0) * (Math.PI / 180);
              const cx2 = elemX + elemW / 2;
              const cy2 = elemY + elemH / 2;
              let grad: CanvasGradient;
              if (element.gradientType === "radial") {
                const r = Math.sqrt(elemW * elemW + elemH * elemH) / 2;
                grad = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r);
              } else {
                const halfDiag = Math.sqrt(elemW * elemW + elemH * elemH) / 2;
                const x0 = cx2 - Math.cos(angle) * halfDiag;
                const y0 = cy2 - Math.sin(angle) * halfDiag;
                const x1 = cx2 + Math.cos(angle) * halfDiag;
                const y1 = cy2 + Math.sin(angle) * halfDiag;
                grad = ctx.createLinearGradient(x0, y0, x1, y1);
              }
              element.gradientStops.forEach((s) => {
                const pos = normalizeStopPosition(s.position);
                const col = s.opacity !== undefined ? applyAlphaToHex(s.color, s.opacity) : s.color;
                grad.addColorStop(Math.max(0, Math.min(1, pos)), col);
              });
              ctx.globalAlpha = combinedAlpha;
              ctx.fillStyle = grad;
              ctx.fillRect(elemX, elemY, elemW, elemH);
            } else if (!isLine) {
              // Solid fill
              ctx.globalAlpha = combinedAlpha;
              ctx.fillStyle = element.fill || "#cccccc";
              if (isEllipse) {
                ctx.beginPath();
                ctx.ellipse(
                  elemX + elemW / 2,
                  elemY + elemH / 2,
                  elemW / 2,
                  elemH / 2,
                  0,
                  0,
                  2 * Math.PI
                );
                ctx.fill();
              } else {
                if (radius > 0) {
                  ctx.beginPath();
                  roundedRectPath(ctx, elemX, elemY, elemW, elemH, radius);
                  ctx.fill();
                } else {
                  ctx.fillRect(elemX, elemY, elemW, elemH);
                }
              }
            }

            // Stroke
            if (element.stroke && element.strokeWidth && element.strokeWidth > 0) {
              ctx.globalAlpha =
                (element.strokeOpacity !== undefined ? element.strokeOpacity / 100 : 1) *
                (element.opacity !== undefined ? element.opacity / 100 : 1);
              ctx.strokeStyle = element.stroke;
              ctx.lineWidth = (element.strokeWidth || 1) * scale;
              if (isLine) {
                ctx.beginPath();
                ctx.moveTo(elemX, elemY);
                ctx.lineTo(elemX + elemW, elemY + elemH);
                ctx.stroke();
              } else if (isEllipse) {
                ctx.beginPath();
                ctx.ellipse(
                  elemX + elemW / 2,
                  elemY + elemH / 2,
                  elemW / 2,
                  elemH / 2,
                  0,
                  0,
                  2 * Math.PI
                );
                ctx.stroke();
              } else {
                if (radius > 0) {
                  ctx.beginPath();
                  roundedRectPath(ctx, elemX, elemY, elemW, elemH, radius);
                  ctx.stroke();
                } else {
                  ctx.strokeRect(elemX, elemY, elemW, elemH);
                }
              }
            }

            ctx.restore();
          } else if (element.type === "drawing" && element.pathData) {
            // Draw simplified version of drawing
            ctx.save();
            ctx.strokeStyle = element.stroke || "#000000";
            ctx.lineWidth = (element.strokeWidth || 2) * scale;
            ctx.beginPath();
            
            const pathCommands = element.pathData.split(/([ML])/);
            pathCommands.forEach((cmd, i) => {
              if (cmd === "M" || cmd === "L") {
                const coords = pathCommands[i + 1]?.trim().split(" ");
                if (coords && coords.length >= 2) {
                  const px = elemX + parseFloat(coords[0]) * scale;
                  const py = elemY + parseFloat(coords[1]) * scale;
                  if (cmd === "M") {
                    ctx.moveTo(px, py);
                  } else {
                    ctx.lineTo(px, py);
                  }
                }
              }
            });
            
            ctx.stroke();
            ctx.restore();
          } else if (element.type === "image" && element.imageUrl) {
            // Draw image elements
            const img = new Image();
            img.crossOrigin = "anonymous";
            const promise = new Promise<void>((resolve) => {
              img.onload = () => {
                ctx.save();
                ctx.globalAlpha = element.opacity !== undefined ? element.opacity / 100 : 1;
                ctx.drawImage(img, elemX, elemY, elemW, elemH);
                ctx.restore();
                resolve();
              };
              img.onerror = () => resolve();
            });
            img.src = element.imageUrl;
            imagePromises.push(promise);
          }
        });
      }
    });

    // Wait for all images to load before resolving
    Promise.all(imagePromises).then(() => {
      resolve(canvas.toDataURL("image/png"));
    });
  });
}
