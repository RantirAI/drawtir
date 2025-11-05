import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import CanvasContainerNew from "@/components/Canvas/CanvasContainerNew";
import type { CanvasSnapshot } from "@/types/snapshot";

// Helper to render frame to canvas and get blob
async function renderFrameToBlob(frame: any, format: 'png' | 'jpeg' = 'png'): Promise<Blob> {
  // This is a simplified version - you'd want to use the full rendering from exportUtils
  const canvas = document.createElement('canvas');
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Failed to get canvas context');
  
  // Draw background
  ctx.fillStyle = frame.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, frame.width, frame.height);
  
  // Draw elements (simplified - real implementation would be more complex)
  for (const element of frame.elements || []) {
    if (element.type === 'text') {
      ctx.font = `${element.fontWeight || 'normal'} ${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
      ctx.fillStyle = element.color || '#000000';
      ctx.textAlign = element.textAlign || 'left';
      ctx.fillText(element.text || '', element.x - frame.x, element.y - frame.y + (element.fontSize || 16));
    }
  }
  
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, format === 'jpeg' ? 'image/jpeg' : 'image/png');
  });
}

export interface DrawtirEmbedProps {
  snapshot?: CanvasSnapshot;
  onSave?: (snapshot: CanvasSnapshot) => void | Promise<void>;
  onChange?: (snapshot: CanvasSnapshot) => void;
  readOnly?: boolean;
  hideCloudFeatures?: boolean;
  hideToolbar?: boolean;
  className?: string;
}

export interface DrawtirEmbedRef {
  getSnapshot: () => CanvasSnapshot;
  loadSnapshot: (snapshot: CanvasSnapshot) => void;
  exportPNG: (frameId?: string) => Promise<Blob>;
  exportSVG: (frameId?: string) => Promise<string>;
  addFrame: (config?: { width: number; height: number; name?: string }) => void;
  clear: () => void;
}

export const DrawtirEmbed = forwardRef<DrawtirEmbedRef, DrawtirEmbedProps>(
  ({ snapshot, onSave, onChange, readOnly = false, hideCloudFeatures = true, hideToolbar = false, className }, ref) => {
    const [currentSnapshot, setCurrentSnapshot] = useState<CanvasSnapshot | undefined>(snapshot);
    const latestSnapshotRef = useRef<CanvasSnapshot | undefined>(snapshot);

    // Sync when external snapshot prop changes (e.g., load from parent)
    useEffect(() => {
      if (snapshot) {
        setCurrentSnapshot(snapshot);
        latestSnapshotRef.current = snapshot;
      }
    }, [snapshot]);

    useImperativeHandle(ref, () => ({
      getSnapshot: () => {
        return latestSnapshotRef.current || {
          version: "1.0.0",
          metadata: {
            title: "Untitled",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          canvas: {
            backgroundColor: "#ffffff",
            zoom: 1,
            panOffset: { x: 0, y: 0 }
          },
          frames: []
        };
      },
      loadSnapshot: (newSnapshot: CanvasSnapshot) => {
        setCurrentSnapshot(newSnapshot);
        latestSnapshotRef.current = newSnapshot;
      },
      exportPNG: async (frameId?: string) => {
        const snap = latestSnapshotRef.current;
        if (!snap?.frames?.length) {
          throw new Error("No frames to export");
        }
        const frame = frameId
          ? snap.frames.find(f => f.id === frameId)
          : snap.frames[0];
        if (!frame) {
          throw new Error("Frame not found");
        }
        return renderFrameToBlob(frame, 'png');
      },
      exportSVG: async (frameId?: string) => {
        const snap = latestSnapshotRef.current;
        if (!snap?.frames?.length) {
          throw new Error("No frames to export");
        }
        const frame = frameId
          ? snap.frames.find(f => f.id === frameId)
          : snap.frames[0];
        if (!frame) {
          throw new Error("Frame not found");
        }
        // Basic SVG export
        let svg = `<svg width="${frame.width}" height="${frame.height}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="100%" height="100%" fill="${frame.backgroundColor || '#ffffff'}"/>`;
        svg += "</svg>";
        return svg;
      },
      addFrame: (config?: { width: number; height: number; name?: string }) => {
        const base = latestSnapshotRef.current;
        const newFrame = {
          id: `frame-${Date.now()}`,
          name: config?.name || `Frame ${(base?.frames?.length || 0) + 1}`,
          x: 100,
          y: 100,
          width: config?.width || 800,
          height: config?.height || 1200,
          rotation: 0,
          backgroundColor: '#ffffff',
          elements: []
        };
        const newSnapshot = {
          ...base,
          frames: [...(base?.frames || []), newFrame]
        } as CanvasSnapshot;
        latestSnapshotRef.current = newSnapshot;
        setCurrentSnapshot(newSnapshot);
        onChange?.(newSnapshot);
      },
      clear: () => {
        const clearedSnapshot: CanvasSnapshot = {
          version: "1.0.0",
          metadata: {
            title: "Untitled",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          canvas: {
            backgroundColor: "#ffffff",
            zoom: 1,
            panOffset: { x: 0, y: 0 }
          },
          frames: []
        };
        setCurrentSnapshot(clearedSnapshot);
        latestSnapshotRef.current = clearedSnapshot;
        onChange?.(clearedSnapshot);
      },
    }));

    const handleSnapshotChange = (newSnapshot: CanvasSnapshot) => {
      latestSnapshotRef.current = newSnapshot;
      onChange?.(newSnapshot);
    };

    return (
      <div className={className}>
        <CanvasContainerNew
          isEmbedded={hideCloudFeatures}
          initialSnapshot={currentSnapshot}
          onSnapshotChange={handleSnapshotChange}
          onSaveRequest={onSave}
          readOnly={readOnly}
        />
      </div>
    );
  }
);

DrawtirEmbed.displayName = "DrawtirEmbed";
