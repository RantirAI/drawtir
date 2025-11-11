import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Grid3x3, Square, ChevronLeft, ChevronRight } from "lucide-react";
import type { Frame, Element } from "@/types/elements";
import { generateGradientCSS, getFitStyle } from "@/lib/utils";
import { InfoModal } from "./InfoModal";

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

  if (!frames || frames.length === 0) return null;

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

  const renderFrame = (frame: Frame, isInteractive: boolean = true) => {
    return (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{
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

        {/* Elements */}
        <div className="relative w-full h-full">
          {(frame.elements || []).map((element) => {
            const fillWithOpacity = element.fillType === "solid" && element.fill
              ? hexToRgba(element.fill, element.fillOpacity || 100)
              : element.fill;

            return (
              <div
                key={`${element.id}-${animationKey}`}
                className={`absolute ${
                  element.animations && element.animations.length > 0 && element.animations.some(a => {
                    const delay = parseFloat(a.delay) || 0;
                    const duration = parseFloat(a.duration) || 0;
                    return animationKey >= delay && animationKey < (delay + duration);
                  })
                    ? element.animations.map(a => `animate-${a.type}`).join(' ')
                    : ""
                } ${isInteractive && element.interactivity?.enabled ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  opacity: (element.opacity || 100) / 100,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  transformOrigin: "center center",
                  animationDuration: element.animations?.[0]?.duration,
                }}
                onClick={isInteractive ? () => handleElementInteraction(element) : undefined}
              >
                {element.type === "text" ? (
                  <div
                    className="w-full h-full flex items-center px-2"
                    style={{
                      fontSize: `${element.fontSize}px`,
                      fontFamily: element.fontFamily,
                      fontWeight: element.fontWeight,
                      textAlign: element.textAlign,
                      color: element.color || element.fill,
                      justifyContent:
                        element.textAlign === "left"
                          ? "flex-start"
                          : element.textAlign === "right"
                          ? "flex-end"
                          : "center",
                    }}
                  >
                    {element.text}
                  </div>
                ) : element.type === "image" && element.imageUrl ? (
                  <img
                    src={element.imageUrl}
                    alt=""
                    className="w-full h-full"
                    style={{
                      objectFit: (element.imageFit === "crop" ? "cover" : element.imageFit || "cover") as any,
                      borderRadius: element.cornerRadius
                        ? `${element.cornerRadius}px`
                        : "0",
                    }}
                  />
                ) : element.type === "shape" ? (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: fillWithOpacity,
                      borderRadius:
                        element.shapeType === "ellipse"
                          ? "50%"
                          : element.cornerRadius
                          ? `${element.cornerRadius}px`
                          : "0",
                    }}
                  />
                ) : null}
              </div>
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
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/80 hover:bg-background"
                onClick={() => setViewMode(viewMode === "single" ? "grid" : "single")}
              >
                {viewMode === "single" ? <Grid3x3 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </Button>
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
            <div className="w-full h-full flex items-center justify-center">
              {renderFrame(currentFrame)}
              
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {frames.map((frame, index) => (
                  <div
                    key={frame.id}
                    className="relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors"
                    onClick={() => {
                      setCurrentFrameIndex(index);
                      setViewMode("single");
                    }}
                  >
                    {renderFrame(frame, false)}
                    <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                      Frame {index + 1}
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
