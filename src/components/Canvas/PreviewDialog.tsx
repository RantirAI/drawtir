import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Frame } from "@/types/elements";
import { generateGradientCSS, getFitStyle } from "@/lib/utils";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frame: Frame | null;
}

export default function PreviewDialog({
  open,
  onOpenChange,
  frame,
}: PreviewDialogProps) {
  const [animationKey, setAnimationKey] = useState(0);

  if (!frame) return null;

  const handleReplay = () => {
    setAnimationKey(prev => prev + 1);
  };

  const getBackgroundStyle = () => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <div className="relative w-full h-full">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Replay button */}
          <Button
            variant="default"
            size="sm"
            className="absolute top-2 left-2 z-50"
            onClick={handleReplay}
          >
            Replay Animations
          </Button>

          {/* Frame preview */}
          <div
            className="w-full h-[90vh] relative overflow-hidden"
            style={{
              ...getBackgroundStyle(),
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
                      element.animation && element.animation !== "none"
                        ? `animate-${element.animation}`
                        : ""
                    }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      opacity: (element.opacity || 100) / 100,
                      transform: `rotate(${element.rotation || 0}deg)`,
                      transformOrigin: "center center",
                      animationDuration: element.animationDuration,
                    }}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
