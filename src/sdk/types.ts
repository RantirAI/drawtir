import type { CanvasSnapshot } from "@/types/snapshot";

export interface DrawtirSDKOptions {
  container: string | HTMLElement;
  snapshot?: CanvasSnapshot;
  onSave?: (snapshot: CanvasSnapshot) => void | Promise<void>;
  onChange?: (snapshot: CanvasSnapshot) => void;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface DrawtirSDKInstance {
  getSnapshot: () => CanvasSnapshot;
  loadSnapshot: (snapshot: CanvasSnapshot) => void;
  exportPNG: () => Promise<Blob>;
  exportSVG: () => Promise<string>;
  clear: () => void;
  destroy: () => void;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
}

export type DrawtirEventType = "change" | "save" | "load" | "clear" | "elementAdd" | "elementRemove";
