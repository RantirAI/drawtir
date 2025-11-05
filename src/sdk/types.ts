import type { CanvasSnapshot } from "@/types/snapshot";

export interface DrawtirSDKOptions {
  container: string | HTMLElement;
  snapshot?: CanvasSnapshot;
  onSave?: (snapshot: CanvasSnapshot) => void | Promise<void>;
  onChange?: (snapshot: CanvasSnapshot) => void;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  hideToolbar?: boolean;
}

export interface DrawtirSDKInstance {
  getSnapshot: () => CanvasSnapshot;
  loadSnapshot: (snapshot: CanvasSnapshot) => void;
  exportPNG: (frameId?: string) => Promise<Blob>;
  exportSVG: (frameId?: string) => Promise<string>;
  exportJSON: () => Promise<CanvasSnapshot>;
  addFrame: (config?: { width: number; height: number; name?: string }) => void;
  clear: () => void;
  destroy: () => void;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
}

export type DrawtirEventType = "change" | "save" | "load" | "clear" | "frameAdd" | "frameRemove" | "elementAdd" | "elementRemove";
