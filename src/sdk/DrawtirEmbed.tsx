import { forwardRef, useImperativeHandle } from "react";
import CanvasContainerNew from "@/components/Canvas/CanvasContainerNew";
import type { CanvasSnapshot } from "@/types/snapshot";

export interface DrawtirEmbedProps {
  snapshot?: CanvasSnapshot;
  onSave?: (snapshot: CanvasSnapshot) => void | Promise<void>;
  onChange?: (snapshot: CanvasSnapshot) => void;
  readOnly?: boolean;
  hideCloudFeatures?: boolean;
  className?: string;
}

export interface DrawtirEmbedRef {
  getSnapshot: () => CanvasSnapshot;
  loadSnapshot: (snapshot: CanvasSnapshot) => void;
  exportPNG: () => Promise<Blob>;
  clear: () => void;
}

export const DrawtirEmbed = forwardRef<DrawtirEmbedRef, DrawtirEmbedProps>(
  ({ snapshot, onSave, onChange, readOnly = false, hideCloudFeatures = true, className }, ref) => {
    useImperativeHandle(ref, () => ({
      getSnapshot: () => {
        // Will be implemented with CanvasContainerNew ref
        return snapshot || { version: "1.0.0", metadata: { title: "", createdAt: "", updatedAt: "" }, canvas: { backgroundColor: "#fff", zoom: 1, panOffset: { x: 0, y: 0 } }, frames: [] };
      },
      loadSnapshot: (newSnapshot: CanvasSnapshot) => {
        // Will be implemented with CanvasContainerNew ref
        console.log("Loading snapshot:", newSnapshot);
      },
      exportPNG: async () => {
        // Will be implemented with CanvasContainerNew ref
        return new Blob();
      },
      clear: () => {
        // Will be implemented with CanvasContainerNew ref
        console.log("Clearing canvas");
      },
    }));

    return (
      <div className={className}>
        <CanvasContainerNew
          isEmbedded={hideCloudFeatures}
          initialSnapshot={snapshot}
          onSnapshotChange={onChange}
          onSaveRequest={onSave}
          readOnly={readOnly}
        />
      </div>
    );
  }
);

DrawtirEmbed.displayName = "DrawtirEmbed";
