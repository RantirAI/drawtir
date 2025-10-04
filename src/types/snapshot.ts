import type { Frame } from "./elements";

export interface CanvasMetadata {
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasSettings {
  backgroundColor: string;
  zoom: number;
  panOffset: { x: number; y: number };
}

export interface CanvasSnapshot {
  version: string;
  metadata: CanvasMetadata;
  canvas: CanvasSettings;
  frames: Frame[];
}

export interface SavedProject {
  id: string;
  user_id: string;
  project_name: string;
  canvas_data: CanvasSnapshot;
  thumbnail_url?: string;
  created_at: string;
  updated_at?: string;
}
