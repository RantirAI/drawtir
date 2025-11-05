import type { DrawtirSDKOptions, DrawtirSDKInstance } from "./types";
import type { CanvasSnapshot } from "@/types/snapshot";
import { createRoot, Root } from 'react-dom/client';
import { createElement } from 'react';
import { DrawtirEmbed } from './DrawtirEmbed';
import type { DrawtirEmbedRef } from './DrawtirEmbed';

export class DrawtirSDK implements DrawtirSDKInstance {
  private container: HTMLElement;
  private options: DrawtirSDKOptions;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private currentSnapshot: CanvasSnapshot | null = null;
  private root: Root | null = null;
  private embedRef: DrawtirEmbedRef | null = null;

  constructor(options: DrawtirSDKOptions) {
    this.options = {
      readOnly: false,
      autoSave: false,
      autoSaveDelay: 2000,
      hideToolbar: false,
      ...options
    };
    
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
    // Mount React component
    const rootElement = document.createElement('div');
    rootElement.style.width = '100%';
    rootElement.style.height = '100%';
    this.container.appendChild(rootElement);
    
    this.root = createRoot(rootElement);
    
    const embedElement = createElement(DrawtirEmbed, {
      ref: (ref: DrawtirEmbedRef) => {
        this.embedRef = ref;
      },
      snapshot: this.options.snapshot,
      onSave: this.options.onSave,
      onChange: (snapshot: CanvasSnapshot) => {
        this.currentSnapshot = snapshot;
        this.emit('change', snapshot);
        if (this.options.onChange) {
          this.options.onChange(snapshot);
        }
      },
      readOnly: this.options.readOnly,
      hideCloudFeatures: true,
      hideToolbar: this.options.hideToolbar,
      className: "w-full h-full"
    });
    
    this.root.render(embedElement);
    
    if (this.options.snapshot) {
      this.currentSnapshot = this.options.snapshot;
    }
  }

  getSnapshot(): CanvasSnapshot {
    if (this.embedRef) {
      return this.embedRef.getSnapshot();
    }
    
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
    if (this.embedRef) {
      this.embedRef.loadSnapshot(snapshot);
    }
    this.emit("load", snapshot);
  }

  async exportPNG(frameId?: string): Promise<Blob> {
    if (!this.embedRef) {
      throw new Error("Canvas not initialized");
    }
    return this.embedRef.exportPNG(frameId);
  }

  async exportSVG(frameId?: string): Promise<string> {
    if (!this.embedRef) {
      throw new Error("Canvas not initialized");
    }
    return this.embedRef.exportSVG(frameId);
  }

  async exportJSON(): Promise<CanvasSnapshot> {
    return this.getSnapshot();
  }

  addFrame(config?: { width: number; height: number; name?: string }): void {
    if (this.embedRef) {
      this.embedRef.addFrame(config);
    }
  }

  clear(): void {
    if (this.embedRef) {
      this.embedRef.clear();
    }
    this.currentSnapshot = null;
    this.emit("clear");
  }

  destroy(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.container.innerHTML = "";
    this.eventListeners.clear();
    this.embedRef = null;
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
