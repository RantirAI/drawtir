import type { Frame } from "@/types/elements";
import type { CanvasSnapshot } from "@/types/snapshot";

export const SNAPSHOT_VERSION = "1.0.0";

export function createSnapshot(
  frames: Frame[],
  title: string,
  zoom: number = 1,
  panOffset: { x: number; y: number } = { x: 0, y: 0 },
  backgroundColor: string = "#ffffff"
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
  };
}

export function validateSnapshot(snapshot: any): snapshot is CanvasSnapshot {
  return (
    snapshot &&
    typeof snapshot === "object" &&
    "version" in snapshot &&
    "metadata" in snapshot &&
    "canvas" in snapshot &&
    "frames" in snapshot &&
    Array.isArray(snapshot.frames)
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

    // Draw frames with elements
    frames.forEach((frame) => {
      const x = frame.x * scale + offsetX;
      const y = frame.y * scale + offsetY;
      const w = frame.width * scale;
      const h = frame.height * scale;

      // Draw frame background
      ctx.fillStyle = frame.backgroundColor || "#f0f0f0";
      ctx.fillRect(x, y, w, h);

      // Draw frame border
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

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
            // Draw shapes
            ctx.save();
            ctx.fillStyle = element.fill || "#3b82f6";
            
            if (element.shapeType === "rectangle" || !element.shapeType) {
              ctx.fillRect(elemX, elemY, elemW, elemH);
            } else if (element.shapeType === "ellipse") {
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
          }
        });
      }
    });

    resolve(canvas.toDataURL("image/png"));
  });
}
