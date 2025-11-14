import type { Frame } from "./elements";

export interface VoiceAudio {
  id: string;
  url: string;
  text: string;
  delay: number;
  duration: number;
  voiceId: string;
  voiceName: string;
  track?: number; // Track/row index for timeline layering
  waveformData?: number[]; // Audio waveform peaks for visualization
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color?: string;
}

export interface BackgroundMusic {
  id: string;
  url: string;
  fileName: string;
  duration: number;
  volume: number;
  startTime: number;
  waveformData?: number[];
}

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
  voiceAudios?: VoiceAudio[];
  timelineMarkers?: TimelineMarker[];
  backgroundMusic?: BackgroundMusic[];
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
