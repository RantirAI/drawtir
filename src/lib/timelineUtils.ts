import { Frame, Element } from "@/types/elements";

/**
 * Calculate the duration of a single animation (delay + duration)
 */
export function getAnimationEndTime(element: Element): number {
  if (!element.animation || element.animation === "none") {
    return 0;
  }

  const delay = parseFloat(element.animationDelay || "0s");
  const duration = parseFloat(element.animationDuration || "0.5s");
  
  return delay + duration;
}

/**
 * Calculate the end time of all animations for an element (including multiple animations)
 */
export function getElementMaxAnimationTime(element: Element): number {
  let maxTime = 0;

  // Check single animation
  if (element.animation && element.animation !== "none") {
    maxTime = Math.max(maxTime, getAnimationEndTime(element));
  }

  // Check multiple animations array
  if (element.animations && element.animations.length > 0) {
    element.animations.forEach(anim => {
      const delay = parseFloat(anim.delay || "0s");
      const duration = parseFloat(anim.duration || "0.5s");
      maxTime = Math.max(maxTime, delay + duration);
    });
  }

  return maxTime;
}

/**
 * Auto-calculate frame duration based on element animations
 */
export function calculateFrameDuration(frame: Frame, minDuration: number = 3): number {
  if (frame.timelineMode === "manual" && frame.duration) {
    return frame.duration;
  }

  let maxTime = minDuration; // Default minimum duration

  // Check all elements in the frame
  const elements = frame.elements || [];
  elements.forEach(element => {
    const elementTime = getElementMaxAnimationTime(element);
    maxTime = Math.max(maxTime, elementTime);
  });

  // Add a buffer of 0.5s to ensure animations complete
  return maxTime + 0.5;
}

/**
 * Calculate start time and duration for all frames
 */
export function calculateFrameTimings(frames: Frame[]): Frame[] {
  let currentTime = 0;

  return frames.map(frame => {
    const duration = calculateFrameDuration(frame);
    const updatedFrame = {
      ...frame,
      startTime: currentTime,
      duration: duration,
      timelineMode: frame.timelineMode || "auto",
    };

    currentTime += duration + (frame.transitionDuration || 0);
    
    return updatedFrame;
  });
}

/**
 * Find which frame is active at a given global time
 */
export function getFrameAtTime(frames: Frame[], globalTime: number): Frame | null {
  for (const frame of frames) {
    const start = frame.startTime || 0;
    const end = start + (frame.duration || 0);
    
    if (globalTime >= start && globalTime < end) {
      return frame;
    }
  }
  
  return frames[frames.length - 1] || null;
}

/**
 * Convert global timeline time to frame-relative time
 */
export function globalToFrameTime(frame: Frame, globalTime: number): number {
  const frameStart = frame.startTime || 0;
  return Math.max(0, globalTime - frameStart);
}

/**
 * Convert frame-relative time to global timeline time
 */
export function frameToGlobalTime(frame: Frame, frameTime: number): number {
  const frameStart = frame.startTime || 0;
  return frameStart + frameTime;
}

/**
 * Get the total duration of all frames
 */
export function getTotalDuration(frames: Frame[]): number {
  if (frames.length === 0) return 0;
  
  const lastFrame = frames[frames.length - 1];
  return (lastFrame.startTime || 0) + (lastFrame.duration || 0);
}

/**
 * Get frame index by frame ID
 */
export function getFrameIndex(frames: Frame[], frameId: string): number {
  return frames.findIndex(f => f.id === frameId);
}

/**
 * Update a specific frame's timing and recalculate all subsequent frames
 */
export function updateFrameTiming(
  frames: Frame[],
  frameId: string,
  updates: Partial<Pick<Frame, "duration" | "timelineMode" | "transitionDuration">>
): Frame[] {
  const frameIndex = getFrameIndex(frames, frameId);
  if (frameIndex === -1) return frames;

  const updatedFrames = frames.map((frame, index) => {
    if (index === frameIndex) {
      return { ...frame, ...updates };
    }
    return frame;
  });

  return calculateFrameTimings(updatedFrames);
}

/**
 * Parse time string (e.g., "2.5s", "500ms") to seconds
 */
export function parseTimeString(timeStr: string): number {
  if (timeStr.endsWith("ms")) {
    return parseFloat(timeStr) / 1000;
  }
  return parseFloat(timeStr);
}

/**
 * Format seconds to time string
 */
export function formatTimeString(seconds: number, unit: "s" | "ms" = "s"): string {
  if (unit === "ms") {
    return `${Math.round(seconds * 1000)}ms`;
  }
  return `${seconds.toFixed(2)}s`;
}

/**
 * Clamp animation time within frame bounds
 */
export function clampAnimationToFrame(
  frame: Frame,
  animationDelay: number,
  animationDuration: number
): { delay: number; duration: number; isValid: boolean } {
  const frameDuration = frame.duration || 0;
  const animationEnd = animationDelay + animationDuration;

  if (animationDelay < 0) {
    return { delay: 0, duration: animationDuration, isValid: false };
  }

  if (animationEnd > frameDuration) {
    const clampedDuration = Math.max(0, frameDuration - animationDelay);
    return { delay: animationDelay, duration: clampedDuration, isValid: false };
  }

  return { delay: animationDelay, duration: animationDuration, isValid: true };
}
