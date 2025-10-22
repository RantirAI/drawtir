import { useState, useEffect } from "react";
import { generateGradientCSS, getFitStyle, getObjectFitStyle } from "@/lib/utils";
import DynamicIcon from "./DynamicIcon";
import { ShaderElement } from "./ShaderElement";
import { BendableLine } from "./BendableLine";
import type { Element } from "@/types/elements";

interface ResizableElementProps {
  id: string;
  type: "image" | "shape" | "text" | "shader";
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string;
  text?: string;
  shapeType?: "rectangle" | "circle" | "line" | "arrow" | "ellipse" | "polygon" | "star" | "icon";
  pathData?: string; // For pen drawings
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
  strokeOpacity?: number;
  strokePosition?: "center" | "inside" | "outside";
  fillOpacity?: number;
  opacity?: number;
  cornerRadius?: number;
  blendMode?: string;
  // Icon properties
  iconName?: string;
  iconFamily?: string;
  // Image properties
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  imageFit?: "fill" | "contain" | "cover" | "crop";
  // Text properties
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  color?: string;
  // Fill properties
  fillType?: "solid" | "image" | "gradient" | "pattern" | "video";
  fillImage?: string;
  fillImageFit?: "fill" | "contain" | "cover" | "crop";
  gradientType?: "linear" | "radial";
  gradientAngle?: number;
  gradientStops?: Array<{color: string, position: number}>;
  patternFrameId?: string;
  videoUrl?: string;
  // Shader properties
  shader?: {
    type: "ripple" | "distortion" | "particles" | "noise" | "waves" | "tunnel" | "plasma";
    speed?: number;
    intensity?: number;
    scale?: number;
    color1?: string;
    color2?: string;
    color3?: string;
  };
  useFlexLayout?: boolean;
  isSelected: boolean;
  zoom?: number;
  onUpdate: (id: string, updates: Partial<{ x: number; y: number; width: number; height: number; text: string }>) => void;
  onSelect: (e?: React.MouseEvent) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export default function ResizableElement({
  id,
  type,
  x,
  y,
  width,
  height,
  src,
  text,
  shapeType = "rectangle",
  fill = "#000000",
  stroke = "#000000",
  pathData,
  strokeWidth = 2,
  strokeOpacity = 100,
  strokePosition = "center",
  fillOpacity = 100,
  opacity = 100,
  cornerRadius = 0,
  blendMode = "normal",
  iconName,
  iconFamily,
  brightness = 100,
  contrast = 100,
  saturation = 100,
  blur = 0,
  imageFit = "cover",
  fontSize = 16,
  fontFamily = "Inter",
  fontWeight = "400",
  textAlign = "center",
  color,
  fillType = "solid",
  fillImage,
  fillImageFit = "cover",
  gradientType = "linear",
  gradientAngle = 0,
  gradientStops = [{ color: "#000000", position: 0 }, { color: "#ffffff", position: 100 }],
  patternFrameId,
  videoUrl,
  shader,
  useFlexLayout = false,
  isSelected,
  zoom = 1,
  onUpdate,
  onSelect,
  onDelete,
  onDuplicate,
  ...rest
}: ResizableElementProps & React.HTMLAttributes<HTMLDivElement>) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [editText, setEditText] = useState(text || "");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: x, elementY: y });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width, height, corner: "" });

  // Helper function to convert hex to rgba with opacity
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const alpha = opacity / 100;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const strokeWithOpacity = hexToRgba(stroke, strokeOpacity);
  const fillWithOpacity = fillType === "solid" ? hexToRgba(fill, fillOpacity) : fill;

  // Calculate adjusted corner radius based on stroke position
  const getAdjustedCornerRadius = (baseRadius: number): { outer: number; inner: number } => {
    if (strokePosition === "inside") {
      return {
        outer: baseRadius,
        inner: Math.max(0, baseRadius - strokeWidth)
      };
    } else if (strokePosition === "outside") {
      return {
        outer: baseRadius + strokeWidth,
        inner: baseRadius
      };
    } else { // center
      return {
        outer: baseRadius + (strokeWidth / 2),
        inner: Math.max(0, baseRadius - (strokeWidth / 2))
      };
    }
  };

  useEffect(() => {
    const snapToGrid = (value: number, gridSize: number = 10) => {
      return Math.round(value / gridSize) * gridSize;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isLocked) {
        const dx = (e.clientX - dragStart.x) / zoom;
        const dy = (e.clientY - dragStart.y) / zoom;
        
        // Hold Shift for fine control
        const multiplier = e.shiftKey ? 0.5 : 1;
        
        const newX = snapToGrid(dragStart.elementX + (dx * multiplier));
        const newY = snapToGrid(dragStart.elementY + (dy * multiplier));
        onUpdate(id, { x: newX, y: newY });
      } else if (isResizing) {
        const dx = (e.clientX - resizeStart.x) / zoom;
        const dy = (e.clientY - resizeStart.y) / zoom;
        
        // Hold Shift for fine control
        const multiplier = e.shiftKey ? 0.5 : 1;
        
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = x;
        let newY = y;

        if (resizeStart.corner.includes("e")) newWidth = Math.max(20, snapToGrid(resizeStart.width + (dx * multiplier)));
        if (resizeStart.corner.includes("w")) {
          newWidth = Math.max(20, snapToGrid(resizeStart.width - (dx * multiplier)));
          newX = snapToGrid(x + (dx * multiplier));
        }
        if (resizeStart.corner.includes("s")) newHeight = Math.max(20, snapToGrid(resizeStart.height + (dy * multiplier)));
        if (resizeStart.corner.includes("n")) {
          newHeight = Math.max(20, snapToGrid(resizeStart.height - (dy * multiplier)));
          newY = snapToGrid(y + (dy * multiplier));
        }

        onUpdate(id, { x: newX, y: newY, width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, id, onUpdate, x, y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if clicking on resize handles, right-click, or locked
    if ((e.target as HTMLElement).hasAttribute('data-resize-handle') || e.button === 2 || isLocked) {
      return;
    }
    e.stopPropagation();
    onSelect(e);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, elementX: x, elementY: y });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === "text" && !isLocked) {
      setIsEditing(true);
      setEditText(text || "");
    } else {
      // Toggle lock state
      setIsLocked(!isLocked);
    }
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    if (editText !== text) {
      onUpdate(id, { text: editText } as any);
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation for all keyboard events while editing to prevent canvas shortcuts
    e.stopPropagation();
    
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextBlur();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(text || "");
    }
  };

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, width, height, corner });
  };

  const generateFillStyle = () => {
    const baseStyle: React.CSSProperties = {};
    
    if (fillType === "solid") {
      baseStyle.backgroundColor = hexToRgba(fill, fillOpacity);
    } else if (fillType === "image" && fillImage) {
      const fitStyles = getFitStyle(fillImageFit);
      baseStyle.backgroundImage = `url(${fillImage})`;
      baseStyle.backgroundSize = fitStyles.backgroundSize;
      baseStyle.backgroundPosition = fitStyles.backgroundPosition;
      baseStyle.backgroundRepeat = fitStyles.backgroundRepeat;
    } else if (fillType === "gradient") {
      baseStyle.background = generateGradientCSS(gradientType, gradientAngle, gradientStops);
    } else if (fillType === "pattern" && patternFrameId) {
      // Pattern will be rendered as a note for now
      baseStyle.backgroundColor = fill;
    } else if (fillType === "video" && videoUrl) {
      // Video background handled separately
      baseStyle.backgroundColor = "#000000";
    } else {
      baseStyle.backgroundColor = fill;
    }
    
    return baseStyle;
  };

  const renderShape = () => {
    console.log("🔷 renderShape called - shapeType:", shapeType, "fillType:", fillType);
    const { outer: outerRadius, inner: innerRadius } = getAdjustedCornerRadius(cornerRadius);
    
    // Drawing (pen tool paths)
    if (pathData) {
      return (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ overflow: 'visible' }}
        >
          <path
            d={pathData}
            fill="none"
            stroke={strokeWithOpacity}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    const borderRadiusStyle = outerRadius ? `${outerRadius}px` : '0';
    const fillBorderRadiusStyle = innerRadius ? `${innerRadius}px` : '0';
    const fillStyle = generateFillStyle();

    // Video background for shapes
    const videoElement = fillType === "video" && videoUrl ? (
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ borderRadius: borderRadiusStyle }}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    ) : null;

    // Shapes
    switch (shapeType) {
      case "circle":
      case "ellipse":
        // For circles/ellipses, use separate containers for stroke positioning
        if (strokePosition === "inside") {
          return (
            <div className="w-full h-full rounded-full relative overflow-hidden" style={fillStyle}>
              {videoElement}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none" 
                style={{ 
                  boxShadow: `inset 0 0 0 ${strokeWidth}px ${strokeWithOpacity}`
                }}
              />
            </div>
          );
        } else if (strokePosition === "outside") {
          return (
            <div className="absolute rounded-full" style={{
              inset: `-${strokeWidth}px`,
              border: `${strokeWidth}px solid ${strokeWithOpacity}`
            }}>
              <div className="w-full h-full rounded-full overflow-hidden" style={fillStyle}>
                {videoElement}
              </div>
            </div>
          );
        } else { // center
          return (
            <div className="w-full h-full rounded-full relative" style={{ border: `${strokeWidth}px solid ${strokeWithOpacity}` }}>
              <div className="w-full h-full rounded-full overflow-hidden" style={fillStyle}>
                {videoElement}
              </div>
            </div>
          );
        }
      case "line":
        return (
          <BendableLine
            element={{
              id,
              type: "shape",
              shapeType: "line",
              x,
              y,
              width,
              height,
              stroke,
              strokeWidth,
              strokeOpacity,
              lineStyle: (rest as any).lineStyle,
              lineCap: (rest as any).lineCap,
              lineJoin: (rest as any).lineJoin,
              dashArray: (rest as any).dashArray,
              controlPoints: (rest as any).controlPoints,
            } as Element}
            isSelected={isSelected}
            onUpdate={(updates) => onUpdate(id, updates as any)}
          />
        );
      case "arrow":
        return (
          <svg width={width} height={height} className="w-full h-full">
            <defs>
              <marker id={`arrowhead-${id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={strokeWithOpacity} />
              </marker>
            </defs>
            <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={strokeWithOpacity} strokeWidth={strokeWidth} markerEnd={`url(#arrowhead-${id})`} />
          </svg>
        );
      case "polygon":
        const hexPoints = `${width / 2},0 ${width},${height / 4} ${width},${height * 3 / 4} ${width / 2},${height} 0,${height * 3 / 4} 0,${height / 4}`;
        return (
          <svg width={width} height={height} className="w-full h-full">
            <defs>
              <pattern id={`fill-pattern-${id}`} width="100%" height="100%">
                {fillType === "image" && fillImage ? (
                  <image href={fillImage} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
                ) : fillType === "gradient" ? (
                  <rect width="100%" height="100%" fill={`url(#gradient-${id})`} />
                ) : null}
              </pattern>
              {fillType === "gradient" && (
                gradientType === "linear" ? (
                  <linearGradient id={`gradient-${id}`} gradientTransform={`rotate(${gradientAngle})`}>
                    {gradientStops.map((stop, i) => (
                      <stop key={i} offset={`${stop.position}%`} stopColor={stop.color} />
                    ))}
                  </linearGradient>
                ) : (
                  <radialGradient id={`gradient-${id}`}>
                    {gradientStops.map((stop, i) => (
                      <stop key={i} offset={`${stop.position}%`} stopColor={stop.color} />
                    ))}
                  </radialGradient>
                )
              )}
            </defs>
            <polygon 
              points={hexPoints} 
              fill={fillType === "solid" ? fillWithOpacity : `url(#fill-pattern-${id})`} 
              stroke={strokeWithOpacity} 
              strokeWidth={strokeWidth} 
            />
          </svg>
        );
      case "star":
        const cx = width / 2;
        const cy = height / 2;
        const outerRadius = Math.min(width, height) / 2;
        const innerRadius = outerRadius * 0.4;
        const starPoints = Array.from({ length: 10 }, (_, i) => {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
        }).join(' ');
        return (
          <svg width={width} height={height} className="w-full h-full">
            <defs>
              <pattern id={`fill-pattern-${id}`} width="100%" height="100%">
                {fillType === "image" && fillImage ? (
                  <image href={fillImage} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
                ) : fillType === "gradient" ? (
                  <rect width="100%" height="100%" fill={`url(#gradient-${id})`} />
                ) : null}
              </pattern>
              {fillType === "gradient" && (
                gradientType === "linear" ? (
                  <linearGradient id={`gradient-${id}`} gradientTransform={`rotate(${gradientAngle})`}>
                    {gradientStops.map((stop, i) => (
                      <stop key={i} offset={`${stop.position}%`} stopColor={stop.color} />
                    ))}
                  </linearGradient>
                ) : (
                  <radialGradient id={`gradient-${id}`}>
                    {gradientStops.map((stop, i) => (
                      <stop key={i} offset={`${stop.position}%`} stopColor={stop.color} />
                    ))}
                  </radialGradient>
                )
              )}
            </defs>
            <polygon 
              points={starPoints} 
              fill={fillType === "solid" ? fillWithOpacity : `url(#fill-pattern-${id})`} 
              stroke={strokeWithOpacity} 
              strokeWidth={strokeWidth} 
            />
          </svg>
        );
      case "icon":
        return (
          <div className="w-full h-full flex items-center justify-center">
            <DynamicIcon 
              iconName={iconName}
              iconFamily={iconFamily}
              color={fill}
              className="w-full h-full"
            />
          </div>
        );
      default:
        // Rectangle with stroke positioning
        if (strokePosition === "inside") {
          return (
            <div 
              className="w-full h-full relative overflow-hidden" 
              style={{ borderRadius: fillBorderRadiusStyle }}
            >
              <div className="w-full h-full overflow-hidden" style={{ ...fillStyle, borderRadius: fillBorderRadiusStyle }}>
                {videoElement}
              </div>
              <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ 
                  borderRadius: fillBorderRadiusStyle,
                  boxShadow: `inset 0 0 0 ${strokeWidth}px ${strokeWithOpacity}`
                }}
              />
            </div>
          );
        } else if (strokePosition === "outside") {
          return (
            <div 
              className="absolute" 
              style={{ 
                inset: `-${strokeWidth}px`,
                border: `${strokeWidth}px solid ${strokeWithOpacity}`, 
                borderRadius: borderRadiusStyle 
              }}
            >
              <div className="w-full h-full overflow-hidden" style={{ ...fillStyle, borderRadius: fillBorderRadiusStyle }}>
                {videoElement}
              </div>
            </div>
          );
        } else { // center
          return (
            <div className="w-full h-full relative" style={{ border: `${strokeWidth}px solid ${strokeWithOpacity}`, borderRadius: borderRadiusStyle }}>
              <div className="w-full h-full overflow-hidden" style={{ ...fillStyle, borderRadius: fillBorderRadiusStyle }}>
                {videoElement}
              </div>
            </div>
          );
        }
    }
  };

  return (
    <div
      {...rest}
      className={`${useFlexLayout ? 'relative' : 'absolute'} cursor-move ${useFlexLayout ? 'flex-shrink-0' : ''} ${isSelected ? 'outline outline-[0.5px] outline-blue-500' : ''}`}
      style={{ 
        left: useFlexLayout ? undefined : x,
        top: useFlexLayout ? undefined : y,
        width, 
        height,
        opacity: opacity / 100,
        mixBlendMode: (blendMode || 'normal') as any
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {type === "shader" && shader ? (
        <ShaderElement element={{ 
          id, 
          type: "shader", 
          x, 
          y, 
          width, 
          height, 
          shader 
        } as Element} />
      ) : type === "image" && src ? (
        <div className="w-full h-full relative overflow-hidden" style={{ borderRadius: cornerRadius ? `${cornerRadius}px` : '0' }}>
          <img 
            src={src} 
            alt="Element" 
            className="w-full h-full"
            style={{ 
              objectFit: getObjectFitStyle(imageFit || "cover") as any,
              objectPosition: "center",
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`,
              opacity: imageFit === "crop" ? 0.7 : 1
            }}
          />
          {imageFit === "crop" && (
            <div className="absolute inset-0 border border-dashed border-blue-500 pointer-events-none" />
          )}
        </div>
      ) : type === "text" ? (
        isEditing ? (
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            className="w-full h-full resize-none bg-transparent border-none outline-none px-2"
            style={{ 
              color: color || fill, 
              fontSize: `${fontSize}px`, 
              fontFamily: fontFamily,
              fontWeight: fontWeight,
              textAlign: textAlign
            }}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center px-2 pointer-events-none relative"
            style={{ 
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              fontWeight: fontWeight,
              textAlign: textAlign,
              justifyContent: textAlign === "left" ? "flex-start" : textAlign === "right" ? "flex-end" : "center",
              ...(fillType && fillType !== "solid" ? {
                background: fillType === "image" && fillImage ? `url(${fillImage})` : 
                           fillType === "gradient" ? generateGradientCSS(gradientType, gradientAngle, gradientStops) : 
                           color || fill,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                ...(fillType === "image" && fillImage ? getFitStyle(fillImageFit) : {})
              } : { color: color || fill })
            }}
          >
            {text || "Double click to edit"}
          </div>
        )
      ) : (
        renderShape()
      )}

      {isSelected && (
        <>
          {/* Lock indicator */}
          {isLocked && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Locked
            </div>
          )}
          
          {/* Dimension label at bottom in blue */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none font-medium">
            {Math.round(width)} × {Math.round(height)}
          </div>
          
          {/* Resize handles in blue - hidden when locked */}
          {!isLocked && (
            <>
              <div data-resize-handle className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-sm cursor-nw-resize border border-white" onMouseDown={(e) => handleResizeStart(e, "nw")} />
              <div data-resize-handle className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-sm cursor-ne-resize border border-white" onMouseDown={(e) => handleResizeStart(e, "ne")} />
              <div data-resize-handle className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-sm cursor-sw-resize border border-white" onMouseDown={(e) => handleResizeStart(e, "sw")} />
              <div data-resize-handle className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-sm cursor-se-resize border border-white" onMouseDown={(e) => handleResizeStart(e, "se")} />
            </>
          )}
        </>
      )}
    </div>
  );
}
