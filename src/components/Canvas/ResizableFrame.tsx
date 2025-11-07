import { useState, useRef, useEffect, ReactNode } from "react";
import PosterPreview from "./PosterPreview";
import { generateGradientCSS, getFitStyle } from "@/lib/utils";

interface ResizableFrameProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundType?: "solid" | "image" | "gradient" | "pattern" | "video";
  backgroundImage?: string;
  backgroundImageFit?: "fill" | "contain" | "cover" | "crop";
  backgroundPositionX?: number;
  backgroundPositionY?: number;
  gradientType?: "linear" | "radial";
  gradientAngle?: number;
  gradientStops?: Array<{color: string, position: number}>;
  patternFrameId?: string;
  videoUrl?: string;
  image: string | null;
  topCaption: string;
  bottomCaption: string;
  textColor: string;
  textAlign: "left" | "center" | "right";
  textSize: number;
  textOpacity: number;
  imageStyle: string;
  filterStyle: any;
  linkText: string;
  linkPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  gradientIntensity: number;
  cornerRadius?: number;
  fillOpacity?: number;
  opacity?: number;
  blendMode?: string;
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  initialWidth?: number; // For dynamic scaling
  initialHeight?: number; // For dynamic scaling
  enableDynamicScale?: boolean; // Enable/disable dynamic scaling
  onUpdate: (id: string, updates: Partial<{ x: number; y: number; width: number; height: number; backgroundColor: string; cornerRadius: number; flexDirection: "row" | "column"; justifyContent: string; alignItems: string; gap: number; backgroundPositionX: number; backgroundPositionY: number }>) => void;
  isSelected: boolean;
  onSelect: () => void;
  children?: ReactNode;
}

export default function ResizableFrame({
  id,
  x,
  y,
  width,
  height,
  backgroundColor,
  backgroundType = "solid",
  backgroundImage,
  backgroundImageFit = "cover",
  gradientType = "linear",
  gradientAngle = 0,
  gradientStops = [{ color: "#000000", position: 0 }, { color: "#ffffff", position: 100 }],
  patternFrameId,
  videoUrl,
  image,
  topCaption,
  bottomCaption,
  textColor,
  textAlign,
  textSize,
  textOpacity,
  imageStyle,
  filterStyle,
  linkText,
  linkPosition,
  gradientIntensity,
  cornerRadius = 0,
  fillOpacity = 100,
  opacity = 100,
  blendMode = "normal",
  flexDirection = "row",
  justifyContent = "start",
  alignItems = "start",
  gap = 0,
  initialWidth,
  initialHeight,
  enableDynamicScale = true,
  onUpdate,
  isSelected,
  onSelect,
  children,
}: ResizableFrameProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement>(null);

  // Calculate scale for dynamic content
  const scaleX = enableDynamicScale && initialWidth ? width / initialWidth : 1;
  const scaleY = enableDynamicScale && initialHeight ? height / initialHeight : 1;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        onUpdate(id, { x: x + dx, y: y + dy });
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isResizing) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        
        if (isResizing === "se") {
          onUpdate(id, { width: Math.max(200, width + dx), height: Math.max(200, height + dy) });
        } else if (isResizing === "sw") {
          onUpdate(id, { x: x + dx, width: Math.max(200, width - dx), height: Math.max(200, height + dy) });
        } else if (isResizing === "ne") {
          onUpdate(id, { y: y + dy, width: Math.max(200, width + dx), height: Math.max(200, height - dy) });
        } else if (isResizing === "nw") {
          onUpdate(id, { x: x + dx, y: y + dy, width: Math.max(200, width - dx), height: Math.max(200, height - dy) });
        } else if (isResizing === "n") {
          onUpdate(id, { y: y + dy, height: Math.max(200, height - dy) });
        } else if (isResizing === "s") {
          onUpdate(id, { height: Math.max(200, height + dy) });
        } else if (isResizing === "e") {
          onUpdate(id, { width: Math.max(200, width + dx) });
        } else if (isResizing === "w") {
          onUpdate(id, { x: x + dx, width: Math.max(200, width - dx) });
        }
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging && !isResizing) return;
      e.preventDefault();
      const touch = e.touches[0];
      
      if (isDragging) {
        const dx = touch.clientX - dragStart.x;
        const dy = touch.clientY - dragStart.y;
        onUpdate(id, { x: x + dx, y: y + dy });
        setDragStart({ x: touch.clientX, y: touch.clientY });
      } else if (isResizing) {
        const dx = touch.clientX - dragStart.x;
        const dy = touch.clientY - dragStart.y;
        
        if (isResizing === "se") {
          onUpdate(id, { width: Math.max(200, width + dx), height: Math.max(200, height + dy) });
        } else if (isResizing === "sw") {
          onUpdate(id, { x: x + dx, width: Math.max(200, width - dx), height: Math.max(200, height + dy) });
        } else if (isResizing === "ne") {
          onUpdate(id, { y: y + dy, width: Math.max(200, width + dx), height: Math.max(200, height - dy) });
        } else if (isResizing === "nw") {
          onUpdate(id, { x: x + dx, y: y + dy, width: Math.max(200, width - dx), height: Math.max(200, height - dy) });
        } else if (isResizing === "n") {
          onUpdate(id, { y: y + dy, height: Math.max(200, height - dy) });
        } else if (isResizing === "s") {
          onUpdate(id, { height: Math.max(200, height + dy) });
        } else if (isResizing === "e") {
          onUpdate(id, { width: Math.max(200, width + dx) });
        } else if (isResizing === "w") {
          onUpdate(id, { x: x + dx, width: Math.max(200, width - dx) });
        }
        
        setDragStart({ x: touch.clientX, y: touch.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, isResizing, dragStart, x, y, width, height, id, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".resize-handle") || e.button === 2) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".resize-handle")) return;
    e.stopPropagation();
    onSelect();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    onSelect();
    setIsResizing(corner);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleResizeTouchStart = (e: React.TouchEvent, corner: string) => {
    e.stopPropagation();
    onSelect();
    const touch = e.touches[0];
    setIsResizing(corner);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const generateBackgroundStyle = () => {
    const hexToRgba = (hex: string, opacity: number): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const alpha = opacity / 100;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const baseStyle: React.CSSProperties = {};
    
    if (backgroundType === "solid") {
      baseStyle.backgroundColor = hexToRgba(backgroundColor, fillOpacity);
    } else if (backgroundType === "image" && backgroundImage) {
      const fitStyles = getFitStyle(backgroundImageFit);
      baseStyle.backgroundImage = `url(${backgroundImage})`;
      baseStyle.backgroundSize = fitStyles.backgroundSize;
      baseStyle.backgroundPosition = fitStyles.backgroundPosition;
      baseStyle.backgroundRepeat = fitStyles.backgroundRepeat;
    } else if (backgroundType === "gradient") {
      baseStyle.background = generateGradientCSS(gradientType, gradientAngle, gradientStops);
    } else if (backgroundType === "pattern" && patternFrameId) {
      baseStyle.backgroundColor = backgroundColor;
    } else if (backgroundType === "video" && videoUrl) {
      baseStyle.backgroundColor = "#000000";
    } else {
      baseStyle.backgroundColor = backgroundColor;
    }
    
    return baseStyle;
  };

  const backgroundStyle = generateBackgroundStyle();

  return (
    <div
      ref={frameRef}
      className={`absolute ${isSelected ? "outline outline-[0.5px] outline-blue-500" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        cursor: isDragging ? "grabbing" : "grab",
        overflow: "hidden",
        borderRadius: `${cornerRadius}px`,
        opacity: opacity / 100,
        mixBlendMode: (blendMode || 'normal') as any,
        ...backgroundStyle,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Video background for frames */}
      {backgroundType === "video" && videoUrl && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ borderRadius: `${cornerRadius}px` }}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Legacy poster preview (only if image is set) */}
      {image && (
        <PosterPreview
          image={image}
          topCaption={topCaption}
          bottomCaption={bottomCaption}
          backgroundColor={backgroundColor}
          textColor={textColor}
          textAlign={textAlign}
          textSize={textSize}
          textOpacity={textOpacity}
          imageStyle={imageStyle}
          filterStyle={filterStyle}
          linkText={linkText}
          linkPosition={linkPosition}
          gradientIntensity={gradientIntensity}
        />
      )}
      
      {/* Elements inside frame */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="pointer-events-auto flex"
          style={{
            width: enableDynamicScale && initialWidth ? `${initialWidth}px` : '100%',
            height: enableDynamicScale && initialHeight ? `${initialHeight}px` : '100%',
            flexDirection: flexDirection,
            justifyContent: justifyContent,
            alignItems: alignItems,
            gap: `${gap}px`,
            transform: enableDynamicScale && (scaleX !== 1 || scaleY !== 1) 
              ? `scale(${scaleX}, ${scaleY})` 
              : undefined,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
      
      {isSelected && (
        <>
          {/* Dimension label at bottom in blue */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none font-medium z-50">
            {Math.round(width)} × {Math.round(height)}
          </div>
          
          {/* Corner handles */}
          <div
            className="resize-handle absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-sm cursor-nw-resize border border-white"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
            onTouchStart={(e) => handleResizeTouchStart(e, "nw")}
          />
          <div
            className="resize-handle absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-sm cursor-ne-resize border border-white"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
            onTouchStart={(e) => handleResizeTouchStart(e, "ne")}
          />
          <div
            className="resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-sm cursor-sw-resize border border-white"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
            onTouchStart={(e) => handleResizeTouchStart(e, "sw")}
          />
          <div
            className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-sm cursor-se-resize border border-white"
            onMouseDown={(e) => handleResizeStart(e, "se")}
            onTouchStart={(e) => handleResizeTouchStart(e, "se")}
          />
          
          {/* Side handles */}
          <div
            className="resize-handle absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-sm cursor-n-resize border border-white"
            onMouseDown={(e) => handleResizeStart(e, "n")}
            onTouchStart={(e) => handleResizeTouchStart(e, "n")}
          />
          <div
            className="resize-handle absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-sm cursor-s-resize border border-white"
            onMouseDown={(e) => handleResizeStart(e, "s")}
            onTouchStart={(e) => handleResizeTouchStart(e, "s")}
          />
          <div
            className="resize-handle absolute top-1/2 -translate-y-1/2 -right-1 w-3 h-3 bg-blue-500 rounded-sm cursor-e-resize border border-white"
            onMouseDown={(e) => handleResizeStart(e, "e")}
            onTouchStart={(e) => handleResizeTouchStart(e, "e")}
          />
          <div
            className="resize-handle absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-3 bg-blue-500 rounded-sm cursor-w-resize border border-white"
            onMouseDown={(e) => handleResizeStart(e, "w")}
            onTouchStart={(e) => handleResizeTouchStart(e, "w")}
          />
        </>
      )}
    </div>
  );
}
