import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Grid3x3, Square, ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { Frame, Element } from "@/types/elements";
import { generateGradientCSS, getFitStyle } from "@/lib/utils";
import { InfoModal } from "./InfoModal";
import { ShadcnShaderElement } from "./ShadcnShaderElement";
import ResizableElement from "./ResizableElement";
import { PresentationMode } from "@/components/Presentation/PresentationMode";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frames: Frame[];
  initialFrameId?: string;
}

export default function PreviewDialog({
  open,
  onOpenChange,
  frames,
  initialFrameId,
}: PreviewDialogProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(
    initialFrameId ? frames.findIndex(f => f.id === initialFrameId) : 0
  );
  const [viewMode, setViewMode] = useState<"single" | "grid">("single");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalContent, setInfoModalContent] = useState("");
  const [showPresentationMode, setShowPresentationMode] = useState(false);

  if (!frames || frames.length === 0) return null;

  // If presentation mode is active, show it instead
  if (showPresentationMode) {
    return (
      <PresentationMode
        frames={frames}
        onClose={() => {
          setShowPresentationMode(false);
          onOpenChange(false);
        }}
      />
    );
  }

  const currentFrame = frames[currentFrameIndex] || frames[0];

  const handleReplay = () => {
    setAnimationKey(prev => prev + 1);
  };

  const handleElementInteraction = (element: Element) => {
    if (!element.interactivity?.enabled) return;

    switch (element.interactivity.actionType) {
      case "link":
        if (element.interactivity.url) {
          window.open(element.interactivity.url, element.interactivity.openInNewTab ? "_blank" : "_self");
        }
        break;
      case "info":
        if (element.interactivity.infoTitle || element.interactivity.infoContent) {
          setInfoModalTitle(element.interactivity.infoTitle || "Information");
          setInfoModalContent(element.interactivity.infoContent || "");
          setShowInfoModal(true);
        }
        break;
      case "animation":
        setAnimationKey(prev => prev + 1);
        break;
    }
  };

  const goToPrevious = () => {
    setCurrentFrameIndex(prev => (prev > 0 ? prev - 1 : frames.length - 1));
  };

  const goToNext = () => {
    setCurrentFrameIndex(prev => (prev < frames.length - 1 ? prev + 1 : 0));
  };

  const getBackgroundStyle = (frame: Frame) => {
    if (frame.backgroundType === "gradient") {
      return {
        background: generateGradientCSS(
          frame.gradientType || "linear",
          frame.gradientAngle || 0,
          frame.gradientStops || []
        ),
      };
    } else if (frame.backgroundType === "image" && frame.backgroundImage) {
      const fitStyles = getFitStyle(frame.backgroundImageFit || "cover");
      return {
        backgroundImage: `url(${frame.backgroundImage})`,
        backgroundSize: fitStyles.backgroundSize,
        backgroundPosition: fitStyles.backgroundPosition,
        backgroundRepeat: fitStyles.backgroundRepeat,
      };
    } else if (frame.backgroundType === "video" && frame.videoUrl) {
      return {};
    } else {
      return {
        backgroundColor: frame.backgroundColor,
      };
    }
  };

  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const alpha = opacity / 100;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const renderFrame = (frame: Frame, isInteractive: boolean = true, isGridView: boolean = false) => {
    const frameStyle = isGridView
      ? {
          width: "100%",
          height: "100%",
          aspectRatio: `${frame.width} / ${frame.height}`,
        }
      : {
          width: `${frame.width}px`,
          height: `${frame.height}px`,
          maxWidth: "90vw",
          maxHeight: "90vh",
        };

    return (
      <div
        className="relative overflow-hidden"
        style={{
          ...frameStyle,
          ...getBackgroundStyle(frame),
          opacity: (frame.opacity || 100) / 100,
        }}
      >
        {/* Video background */}
        {frame.backgroundType === "video" && frame.videoUrl && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={frame.videoUrl} type="video/mp4" />
          </video>
        )}

        {/* Elements rendered via ResizableElement to match canvas view */}
        <div className="relative w-full h-full">
          {(frame.elements || []).map((element) => {
            // Skip drawing elements (complex strokes) in preview for now
            if (element.type === "drawing") return null;

            // Cast to ResizableElement type and exclude children
            const { children, ...elementProps } = element as any;

            // ResizableElement doesn't support icon directly; skip icons
            if (elementProps.type === "icon") return null;

            // For image elements, map imageUrl to src (ResizableElement expects src)
            if (elementProps.type === "image") {
              const imgSrc = elementProps.src || elementProps.imageUrl;
              if (!imgSrc || imgSrc === "user-uploaded-image" || imgSrc === "" || !imgSrc.startsWith("http")) {
                return null;
              }
              elementProps.src = imgSrc;
            }

            const elementType = elementProps.type as
              | "image"
              | "video"
              | "shape"
              | "text"
              | "shader"
              | "richtext"
              | "qrcode";

            return (
              <ResizableElement
                key={`${elementProps.id}-${animationKey}`}
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
 
        {/* Frame captions */}
        {frame.topCaption && (
          <div
            className="absolute top-0 left-0 right-0 p-4"
            style={{
              color: frame.textColor,
              textAlign: frame.textAlign,
              fontSize: `${frame.textSize || 16}px`,
              opacity: (frame.textOpacity || 100) / 100,
            }}
          >
            {frame.topCaption}
          </div>
        )}
        {frame.bottomCaption && (
          <div
            className="absolute bottom-0 left-0 right-0 p-4"
            style={{
              color: frame.textColor,
              textAlign: frame.textAlign,
              fontSize: `${frame.textSize || 16}px`,
              opacity: (frame.textOpacity || 100) / 100,
            }}
          >
            {frame.bottomCaption}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 m-0 border-0 rounded-none">
        <div className="relative w-full h-full bg-background">
          {/* Top controls */}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            {frames.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/80 hover:bg-background"
                  onClick={() => setShowPresentationMode(true)}
                  title="Start Presentation (Autoplay)"
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/80 hover:bg-background"
                  onClick={() => setViewMode(viewMode === "single" ? "grid" : "single")}
                >
                  {viewMode === "single" ? <Grid3x3 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 hover:bg-background"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          {viewMode === "single" ? (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="flex items-center justify-center">
                {renderFrame(currentFrame, true, false)}
              </div>
              
              {/* Navigation arrows for single view */}
              {frames.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-background/80 hover:bg-background"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-background/80 hover:bg-background"
                    onClick={goToNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background/80 px-3 py-1 rounded-full text-sm">
                    {currentFrameIndex + 1} / {frames.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-full overflow-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {frames.map((frame, index) => (
                  <div
                    key={frame.id}
                    className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors shadow-lg"
                    style={{
                      aspectRatio: `${frame.width} / ${frame.height}`,
                    }}
                    onClick={() => {
                      setCurrentFrameIndex(index);
                      setViewMode("single");
                    }}
                  >
                    <div className="w-full h-full">
                      {renderFrame(frame, false, true)}
                    </div>
                    <div className="absolute bottom-2 left-2 bg-background/90 px-3 py-1 rounded-full text-xs font-medium">
                      {frame.name || `Frame ${index + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <InfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          title={infoModalTitle}
          content={infoModalContent}
        />
      </DialogContent>
    </Dialog>
  );
}
