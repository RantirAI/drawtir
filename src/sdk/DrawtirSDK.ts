import type { DrawtirSDKOptions, DrawtirSDKInstance, DrawtirEventType } from "./types";
import type { CanvasSnapshot } from "@/types/snapshot";

export class DrawtirSDK implements DrawtirSDKInstance {
  private container: HTMLElement;
  private options: DrawtirSDKOptions;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private currentSnapshot: CanvasSnapshot | null = null;

  constructor(options: DrawtirSDKOptions) {
    this.options = options;
    
    if (typeof options.container === "string") {
      const element = document.querySelector(options.container);
      if (!element) {
        throw new Error(`Container not found: ${options.container}`);
      }
      this.container = element as HTMLElement;
    } else {
      this.container = options.container;
    }

    this.initialize();
  }

  private initialize() {
    // Create iframe or mount React component
    this.container.innerHTML = `
      <div id="drawtir-root" style="width: 100%; height: 100%;"></div>
    `;
    
    if (this.options.snapshot) {
      this.loadSnapshot(this.options.snapshot);
    }
  }

  getSnapshot(): CanvasSnapshot {
    // This will be called by the embedded component
    if (!this.currentSnapshot) {
      return {
        version: "1.0.0",
        metadata: {
          title: "Untitled",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        canvas: {
          backgroundColor: "#ffffff",
          zoom: 1,
          panOffset: { x: 0, y: 0 },
        },
        frames: [],
      };
    }
    return this.currentSnapshot;
  }

  loadSnapshot(snapshot: CanvasSnapshot): void {
    this.currentSnapshot = snapshot;
    this.emit("load", snapshot);
  }

  async exportPNG(): Promise<Blob> {
    // Will trigger canvas export
    return new Blob();
  }

  async exportSVG(): Promise<string> {
    // Will trigger SVG export
    return "";
  }

  clear(): void {
    this.currentSnapshot = null;
    this.emit("clear");
  }

  destroy(): void {
    this.container.innerHTML = "";
    this.eventListeners.clear();
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(...args));
    }
  }

  // Update snapshot from embedded component
  updateSnapshot(snapshot: CanvasSnapshot): void {
    this.currentSnapshot = snapshot;
    this.emit("change", snapshot);
    
    if (this.options.onChange) {
      this.options.onChange(snapshot);
    }

    if (this.options.autoSave && this.options.onSave) {
      this.options.onSave(snapshot);
    }
  }
}

// Export for vanilla JS usage
export default DrawtirSDK;
