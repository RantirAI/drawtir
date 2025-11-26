import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, X, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Frame } from "@/types/elements";
import { PresentationControls } from "./PresentationControls";
import { ExportPresentationDialog } from "./ExportPresentationDialog";
import ResizableElement from "@/components/Canvas/ResizableElement";

interface PresentationModeProps {
  frames: Frame[];
  onClose: () => void;
}

type TransitionType = "none" | "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "zoom";

export function PresentationMode({ frames, onClose }: PresentationModeProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameDuration, setFrameDuration] = useState(3); // seconds
  const [transition, setTransition] = useState<TransitionType>("fade");
  const [showControls, setShowControls] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentFrame = frames[currentFrameIndex];

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Handle mouse movement to show controls
  useEffect(() => {
    const handleMouseMove = () => resetControlsTimeout();
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // Navigate to next frame
  const goToNextFrame = useCallback(() => {
    if (currentFrameIndex < frames.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentFrameIndex((prev) => prev + 1);
        setProgress(0);
        setIsTransitioning(false);
      }, 300);
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  }, [currentFrameIndex, frames.length]);

  // Navigate to previous frame
  const goToPreviousFrame = useCallback(() => {
    if (currentFrameIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentFrameIndex((prev) => prev - 1);
        setProgress(0);
        setIsTransitioning(false);
      }, 300);
    }
  }, [currentFrameIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (isPlaying) {
          setIsPlaying(false);
        } else {
          goToNextFrame();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPreviousFrame();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToNextFrame, goToPreviousFrame, isPlaying, onClose]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying && !isTransitioning) {
      const interval = 50; // Update progress every 50ms
      const steps = (frameDuration * 1000) / interval;
      let currentStep = 0;

      timerRef.current = setInterval(() => {
        currentStep++;
        setProgress((currentStep / steps) * 100);

        if (currentStep >= steps) {
          goToNextFrame();
        }
      }, interval);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [isPlaying, frameDuration, goToNextFrame, isTransitioning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setProgress(0);
    }
  };

  const getTransitionClass = () => {
    if (!isTransitioning) return "";
    
    switch (transition) {
      case "fade":
        return "animate-fade-in";
      case "slide-left":
        return "animate-slide-in-right";
      case "slide-right":
        return "animate-[slide-in-left_0.3s_ease-out]";
      case "slide-up":
        return "animate-[slide-in-down_0.3s_ease-out]";
      case "slide-down":
        return "animate-[slide-in-up_0.3s_ease-out]";
      case "zoom":
        return "animate-scale-in";
      default:
        return "";
    }
  };

  if (!currentFrame) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className={`absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-opacity ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Frame display */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
        <div
          className={`relative ${getTransitionClass()}`}
          style={{
            width: currentFrame.width,
            height: currentFrame.height,
            maxWidth: "90vw",
            maxHeight: "80vh",
            backgroundColor: currentFrame.backgroundColor || "#ffffff",
          }}
        >
          {/* Render frame elements */}
          {currentFrame.elements?.map((element) => {
            // Skip drawing elements (complex to render in presentation mode)
            if (element.type === "drawing") return null;
            
            // Cast to ResizableElement type and exclude children
            const { children, ...elementProps } = element;
            
            // Skip icon type as ResizableElement doesn't support it
            if (elementProps.type === "icon") return null;
            
            const elementType = elementProps.type as "image" | "video" | "shape" | "text" | "shader" | "richtext" | "qrcode";
            
            return (
              <ResizableElement
                key={elementProps.id}
                {...elementProps}
                type={elementType}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={() => {}}
                onDelete={() => {}}
                onDuplicate={() => {}}
                zoom={1}
                readOnly={true}
              />
            );
          })}
        </div>
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-20 pb-6 px-8 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress bar */}
        <div className="w-full h-1 bg-white/20 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <PresentationControls
          currentFrameIndex={currentFrameIndex}
          totalFrames={frames.length}
          isPlaying={isPlaying}
          frameDuration={frameDuration}
          transition={transition}
          onPlayPause={togglePlayPause}
          onPrevious={goToPreviousFrame}
          onNext={goToNextFrame}
          onDurationChange={setFrameDuration}
          onTransitionChange={(t) => setTransition(t as TransitionType)}
          onExport={() => setShowExportDialog(true)}
        />
      </div>

      {/* Export dialog */}
      {showExportDialog && (
        <ExportPresentationDialog
          frames={frames}
          frameDuration={frameDuration}
          transition={transition}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}
