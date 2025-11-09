import { useState, useRef, useEffect, ReactNode } from "react";
import PosterPreview from "./PosterPreview";
import { generateGradientCSS, getFitStyle } from "@/lib/utils";

interface ResizableFrameProps {
  id: string;
  name: string;
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
  showGrid?: boolean; // Show alignment grid
  gridSize?: number; // Grid spacing in pixels
  gridStyle?: "lines" | "dots"; // Grid visual style
  snapToGrid?: boolean; // Snap positioning to grid
  onUpdate: (id: string, updates: Partial<{ x: number; y: number; width: number; height: number; backgroundColor: string; cornerRadius: number; flexDirection: "row" | "column"; justifyContent: string; alignItems: string; gap: number; backgroundPositionX: number; backgroundPositionY: number }>) => void;
  isSelected: boolean;
  onSelect: () => void;
  children?: ReactNode;
}

export default function ResizableFrame({
  id,
  name,
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
  enableDynamicScale = false,
  showGrid = false,
  gridSize = 20,
  gridStyle = "lines",
  snapToGrid = false,
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
          onUpdate(id, { width: Math.max(1, width + dx), height: Math.max(1, height + dy) });
        } else if (isResizing === "sw") {
          onUpdate(id, { x: x + dx, width: Math.max(1, width - dx), height: Math.max(1, height + dy) });
        } else if (isResizing === "ne") {
          onUpdate(id, { y: y + dy, width: Math.max(1, width + dx), height: Math.max(1, height - dy) });
        } else if (isResizing === "nw") {
          onUpdate(id, { x: x + dx, y: y + dy, width: Math.max(1, width - dx), height: Math.max(1, height - dy) });
        } else if (isResizing === "n") {
          onUpdate(id, { y: y + dy, height: Math.max(1, height - dy) });
        } else if (isResizing === "s") {
          onUpdate(id, { height: Math.max(1, height + dy) });
        } else if (isResizing === "e") {
          onUpdate(id, { width: Math.max(1, width + dx) });
        } else if (isResizing === "w") {
          onUpdate(id, { x: x + dx, width: Math.max(1, width - dx) });
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
          onUpdate(id, { width: Math.max(1, width + dx), height: Math.max(1, height + dy) });
        } else if (isResizing === "sw") {
          onUpdate(id, { x: x + dx, width: Math.max(1, width - dx), height: Math.max(1, height + dy) });
        } else if (isResizing === "ne") {
          onUpdate(id, { y: y + dy, width: Math.max(1, width + dx), height: Math.max(1, height - dy) });
        } else if (isResizing === "nw") {
          onUpdate(id, { x: x + dx, y: y + dy, width: Math.max(1, width - dx), height: Math.max(1, height - dy) });
        } else if (isResizing === "n") {
          onUpdate(id, { y: y + dy, height: Math.max(1, height - dy) });
        } else if (isResizing === "s") {
          onUpdate(id, { height: Math.max(1, height + dy) });
        } else if (isResizing === "e") {
          onUpdate(id, { width: Math.max(1, width + dx) });
        } else if (isResizing === "w") {
          onUpdate(id, { x: x + dx, width: Math.max(1, width - dx) });
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
    // Only allow dragging from the header, not the frame body
    if ((e.target as HTMLElement).closest(".resize-handle") || e.button === 2) return;
    if (!(e.target as HTMLElement).closest(".frame-drag-header")) return;
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".resize-handle")) return;
    if (!(e.target as HTMLElement).closest(".frame-drag-header")) return;
    e.stopPropagation();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleFrameClick = (e: React.MouseEvent) => {
    // Only select frame if clicking directly on the frame background or header, not on elements
    const target = e.target as HTMLElement;
    if (target.closest(".resize-handle")) return;
    
    // Check if click is on an element (cursor-move indicates it's a ResizableElement)
    if (target.classList.contains('cursor-move') || target.closest('.cursor-move')) {
      return; // Don't select frame, let element handle it
    }
    
    // Check if click is on frame UI elements (header or background), not children
    const isFrameUI = target.classList.contains('frame-drag-header') || 
                      target.closest('.frame-drag-header') ||
                      e.currentTarget === target;
    
    if (isFrameUI) {
      e.stopPropagation();
      onSelect();
    }
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
    } else if (backgroundType === "video" && videoUrl && videoUrl.trim()) {
      // Only use black background if video URL is actually provided
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
      className={`absolute ${isSelected ? "ring-1 ring-blue-500" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        overflow: "hidden",
        borderRadius: `${cornerRadius}px`,
        opacity: opacity / 100,
        mixBlendMode: (blendMode || 'normal') as any,
        ...backgroundStyle,
      }}
      onClick={handleFrameClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Draggable frame header - only visible when selected */}
      {isSelected && (
        <div 
          className="frame-drag-header absolute bg-blue-500 text-white text-xs px-2 py-0.5 rounded-tl rounded-tr font-medium cursor-move z-50 select-none whitespace-nowrap"
          style={{ 
            top: '-24px',
            left: '0px'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {name}
        </div>
      )}
      {/* Video background for frames */}
      {backgroundType === "video" && videoUrl && videoUrl.trim() && (
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

      {/* Enhanced Grid overlay */}
      {showGrid && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ borderRadius: `${cornerRadius}px` }}
        >
          <defs>
            {gridStyle === "lines" ? (
              <>
                {/* Minor grid pattern */}
                <pattern
                  id={`grid-minor-${id}`}
                  width={gridSize}
                  height={gridSize}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-primary/20 dark:text-primary/15"
                  />
                </pattern>
                {/* Major grid pattern (every 5th line) */}
                <pattern
                  id={`grid-major-${id}`}
                  width={gridSize * 5}
                  height={gridSize * 5}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-primary/40 dark:text-primary/30"
                  />
                </pattern>
              </>
            ) : (
              /* Dot grid pattern */
              <pattern
                id={`grid-dots-${id}`}
                width={gridSize}
                height={gridSize}
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx={gridSize / 2}
                  cy={gridSize / 2}
                  r="1"
                  fill="currentColor"
                  className="text-primary/30 dark:text-primary/25"
                />
              </pattern>
            )}
          </defs>
          {gridStyle === "lines" ? (
            <>
              {/* Draw minor grid first */}
              <rect width="100%" height="100%" fill={`url(#grid-minor-${id})`} />
              {/* Draw major grid on top */}
              <rect width="100%" height="100%" fill={`url(#grid-major-${id})`} />
            </>
          ) : (
            <rect width="100%" height="100%" fill={`url(#grid-dots-${id})`} />
          )}
        </svg>
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
            className="resize-handle absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-white cursor-nw-resize border border-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
            onTouchStart={(e) => handleResizeTouchStart(e, "nw")}
          />
          <div
            className="resize-handle absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-white cursor-ne-resize border border-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
            onTouchStart={(e) => handleResizeTouchStart(e, "ne")}
          />
          <div
            className="resize-handle absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-white cursor-sw-resize border border-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
            onTouchStart={(e) => handleResizeTouchStart(e, "sw")}
          />
          <div
            className="resize-handle absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-white cursor-se-resize border border-blue-500"
            onMouseDown={(e) => handleResizeStart(e, "se")}
            onTouchStart={(e) => handleResizeTouchStart(e, "se")}
          />
          
          {/* Side handles - invisible but functional spanning entire edges */}
          <div
            className="resize-handle absolute left-0 w-full opacity-0 cursor-n-resize"
            style={{ top: '-4px', height: '8px' }}
            onMouseDown={(e) => handleResizeStart(e, "n")}
            onTouchStart={(e) => handleResizeTouchStart(e, "n")}
          />
          <div
            className="resize-handle absolute left-0 w-full opacity-0 cursor-s-resize"
            style={{ bottom: '-4px', height: '8px' }}
            onMouseDown={(e) => handleResizeStart(e, "s")}
            onTouchStart={(e) => handleResizeTouchStart(e, "s")}
          />
          <div
            className="resize-handle absolute top-0 h-full opacity-0 cursor-e-resize"
            style={{ right: '-4px', width: '8px' }}
            onMouseDown={(e) => handleResizeStart(e, "e")}
            onTouchStart={(e) => handleResizeTouchStart(e, "e")}
          />
          <div
            className="resize-handle absolute top-0 h-full opacity-0 cursor-w-resize"
            style={{ left: '-4px', width: '8px' }}
            onMouseDown={(e) => handleResizeStart(e, "w")}
            onTouchStart={(e) => handleResizeTouchStart(e, "w")}
          />
        </>
      )}
    </div>
  );
}
