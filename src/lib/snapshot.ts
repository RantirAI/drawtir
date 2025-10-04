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

    // Draw simplified frame representations
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
    });

    resolve(canvas.toDataURL("image/png"));
  });
}
