import { useState, useEffect, useRef } from "react";
import { generateGradientCSS, getFitStyle, getObjectFitStyle } from "@/lib/utils";
import DynamicIcon from "./DynamicIcon";
import { ShaderElement } from "./ShaderElement";
import { BendableLine } from "./BendableLine";
import RichTextEditor from "./RichTextEditor";
import { QRCodeSVG } from 'qrcode.react';
import type { Element } from "@/types/elements";

interface ResizableElementProps {
  id: string;
  type: "image" | "shape" | "text" | "shader" | "richtext" | "qrcode";
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string;
  text?: string;
  richTextHtml?: string;
  shapeType?: "rectangle" | "circle" | "line" | "arrow" | "ellipse" | "polygon" | "star" | "icon" | "custom";
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
  // QR Code properties
  qrValue?: string;
  qrFgColor?: string;
  qrBgColor?: string;
  qrLevel?: "L" | "M" | "Q" | "H";
  // Line properties
  lineStyle?: "solid" | "dashed" | "dotted" | "dashdot";
  lineCap?: "butt" | "round" | "square";
  lineJoin?: "miter" | "round" | "bevel";
  dashArray?: string;
  controlPoints?: Array<{ x: number; y: number }>;
  rotation?: number;
  animation?: string;
  animationDuration?: string;
  animationDelay?: string;
  animationTimingFunction?: string;
  animationIterationCount?: string;
  useFlexLayout?: boolean;
  isSelected: boolean;
  zoom?: number;
  isPlaying?: boolean;
  currentTime?: number;
  globalAnimationTrigger?: any;
  isLocked?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  onUpdate: (id: string, updates: Partial<Element>) => void;
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
  lineStyle,
  lineCap,
  lineJoin,
  dashArray,
  controlPoints,
  rotation = 0,
  animation = "none",
  animationDuration,
  animationDelay,
  animationTimingFunction,
  animationIterationCount,
  useFlexLayout = false,
  isLocked: isLockedProp = false,
  isSelected,
  zoom = 1,
  isPlaying = false,
  currentTime,
  snapToGrid = false,
  gridSize = 20,
  onUpdate,
  onSelect,
  onDelete,
  onDuplicate,
  ...rest
}: ResizableElementProps & React.HTMLAttributes<HTMLDivElement>) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLocked, setIsLocked] = useState(!!isLockedProp);
  const [editText, setEditText] = useState(text || "");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: x, elementY: y });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width, height, elementX: x, elementY: y, corner: "" });
  const [rotateStart, setRotateStart] = useState({ angle: rotation, mouseAngle: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationKey, setAnimationKey] = useState(0);

  // Animation timeline playback control
  const prevIsPlayingRef = useRef(isPlaying);
  const frozenDelayRef = useRef<number>(0);

  // Freeze effective delay on play start so animations don't restart every tick
  useEffect(() => {
    const delaySec = parseTimeSec(animationDelay);
    if (!prevIsPlayingRef.current && isPlaying) {
      const base = delaySec - (currentTime ?? 0);
      frozenDelayRef.current = base;
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying, currentTime, animationDelay]);

  const normalizeAnimation = (name?: string) => {
    // Use the exact animation token configured in tailwind
    return name || "none";
  };
  const normalizedAnimation = normalizeAnimation(animation);

  const parseTimeSec = (val?: string) => {
    if (!val) return 0;
    if (val.endsWith("ms")) return parseFloat(val) / 1000;
    if (val.endsWith("s")) return parseFloat(val);
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

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

  useEffect(() => { setIsLocked(!!isLockedProp); }, [isLockedProp]);

  useEffect(() => {
    const snapToGridHelper = (value: number, size: number = 10) => {
      if (!snapToGrid) return value;
      return Math.round(value / size) * size;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isLocked) {
        const dx = (e.clientX - dragStart.x) / zoom;
        const dy = (e.clientY - dragStart.y) / zoom;
        
        // Hold Shift for fine control
        const multiplier = e.shiftKey ? 0.5 : 1;
        
        const newX = snapToGridHelper(dragStart.elementX + (dx * multiplier), gridSize);
        const newY = snapToGridHelper(dragStart.elementY + (dy * multiplier), gridSize);
        onUpdate(id, { x: newX, y: newY });
      } else if (isRotating) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const angleDelta = currentAngle - rotateStart.mouseAngle;
        const newRotation = rotateStart.angle + angleDelta;
        
        onUpdate(id, { rotation: newRotation } as any);
      } else if (isResizing) {
        const dx = (e.clientX - resizeStart.x) / zoom;
        const dy = (e.clientY - resizeStart.y) / zoom;
        
        // Hold Shift for fine control
        const multiplier = e.shiftKey ? 0.5 : 1;
        
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.elementX;
        let newY = resizeStart.elementY;

        if (resizeStart.corner.includes("e")) {
          newWidth = Math.max(1, snapToGridHelper(resizeStart.width + (dx * multiplier), gridSize));
        }
        if (resizeStart.corner.includes("w")) {
          const widthDelta = (dx * multiplier);
          newWidth = Math.max(1, snapToGridHelper(resizeStart.width - widthDelta, gridSize));
          newX = snapToGridHelper(resizeStart.elementX + widthDelta, gridSize);
        }
        if (resizeStart.corner.includes("s")) {
          newHeight = Math.max(1, snapToGridHelper(resizeStart.height + (dy * multiplier), gridSize));
        }
        if (resizeStart.corner.includes("n")) {
          const heightDelta = (dy * multiplier);
          newHeight = Math.max(1, snapToGridHelper(resizeStart.height - heightDelta, gridSize));
          newY = snapToGridHelper(resizeStart.elementY + heightDelta, gridSize);
        }

        onUpdate(id, { x: newX, y: newY, width: newWidth, height: newHeight });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if ((!isDragging && !isResizing && !isRotating) || isLocked) return;
      e.preventDefault();
      const touch = e.touches[0];
      
      if (isDragging) {
        const dx = (touch.clientX - dragStart.x) / zoom;
        const dy = (touch.clientY - dragStart.y) / zoom;
        
        const newX = snapToGridHelper(dragStart.elementX + dx, gridSize);
        const newY = snapToGridHelper(dragStart.elementY + dy, gridSize);
        onUpdate(id, { x: newX, y: newY });
      } else if (isRotating) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const currentAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
        const angleDelta = currentAngle - rotateStart.mouseAngle;
        const newRotation = rotateStart.angle + angleDelta;
        
        onUpdate(id, { rotation: newRotation } as any);
      } else if (isResizing) {
        const dx = (touch.clientX - resizeStart.x) / zoom;
        const dy = (touch.clientY - resizeStart.y) / zoom;
        
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.elementX;
        let newY = resizeStart.elementY;

        if (resizeStart.corner.includes("e")) {
          newWidth = Math.max(1, snapToGridHelper(resizeStart.width + dx, gridSize));
        }
        if (resizeStart.corner.includes("w")) {
          const widthDelta = dx;
          newWidth = Math.max(1, snapToGridHelper(resizeStart.width - widthDelta, gridSize));
          newX = snapToGridHelper(resizeStart.elementX + widthDelta, gridSize);
        }
        if (resizeStart.corner.includes("s")) {
          newHeight = Math.max(1, snapToGridHelper(resizeStart.height + dy, gridSize));
        }
        if (resizeStart.corner.includes("n")) {
          const heightDelta = dy;
          newHeight = Math.max(1, snapToGridHelper(resizeStart.height - heightDelta, gridSize));
          newY = snapToGridHelper(resizeStart.elementY + heightDelta, gridSize);
        }

        onUpdate(id, { x: newX, y: newY, width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    if (isDragging || isResizing || isRotating) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, isResizing, isRotating, dragStart, resizeStart, rotateStart, id, onUpdate, x, y, zoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // For lines, only handle if NOT in bend mode (shift not held)
    if (type === 'shape' && shapeType === 'line' && isSelected && e.shiftKey) {
      return; // Let BendableLine handle the shift-click
    }
    
    // Don't start dragging if clicking on resize handles, right-click, or locked
    if ((e.target as HTMLElement).hasAttribute('data-resize-handle') || 
        (e.target as HTMLElement).hasAttribute('data-rotate-handle') || 
        e.button === 2 || isLocked) {
      return;
    }
    e.stopPropagation();
    onSelect(e);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, elementX: x, elementY: y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // For lines, only handle if NOT in bend mode
    if (type === 'shape' && shapeType === 'line' && isSelected) {
      return;
    }
    
    // Don't start dragging if clicking on resize handles or locked
    if ((e.target as HTMLElement).hasAttribute('data-resize-handle') || 
        (e.target as HTMLElement).hasAttribute('data-rotate-handle') || 
        isLocked) {
      return;
    }
    e.stopPropagation();
    onSelect();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY, elementX: x, elementY: y });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((type === "text" || type === "richtext") && !isLocked) {
      setIsEditing(true);
      setEditText((rest as any).richTextHtml || text || "");
    } else {
      // Toggle lock state
      const next = !isLocked;
      setIsLocked(next);
      onUpdate(id, { isLocked: next });
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
    setResizeStart({ x: e.clientX, y: e.clientY, width, height, elementX: x, elementY: y, corner });
  };

  const handleResizeTouchStart = (e: React.TouchEvent, corner: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setIsResizing(true);
    setResizeStart({ x: touch.clientX, y: touch.clientY, width, height, elementX: x, elementY: y, corner });
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    setIsRotating(true);
    setRotateStart({ angle: rotation, mouseAngle });
  };

  const handleRotateTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const touch = e.touches[0];
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
    
    setIsRotating(true);
    setRotateStart({ angle: rotation, mouseAngle });
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
              lineStyle,
              lineCap,
              lineJoin,
              dashArray,
              controlPoints,
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
      ref={containerRef}
      key={`${id}-${animationKey}-${(rest as any).globalAnimationTrigger ?? ''}`}
      className={`${useFlexLayout ? 'relative' : 'absolute'} ${type === 'shape' && shapeType === 'line' ? '' : 'cursor-move'} ${useFlexLayout ? 'flex-shrink-0' : ''} ${isSelected ? 'ring-1 ring-cyan-400' : ''} ${animation && animation !== 'none' ? `animate-${normalizedAnimation}` : ''}`}
      style={{ 
        left: useFlexLayout ? undefined : x,
        top: useFlexLayout ? undefined : y,
        width, 
        height,
        opacity: opacity / 100,
        mixBlendMode: (blendMode || 'normal') as any,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        animationDuration: animationDuration,
        animationDelay: currentTime !== undefined 
          ? `${(isPlaying ? frozenDelayRef.current : (parseTimeSec(animationDelay) - (currentTime ?? 0)))}s`
          : animationDelay,
        animationTimingFunction: animationTimingFunction,
        animationIterationCount: animationIterationCount,
        animationFillMode: 'both',
        animationPlayState: currentTime !== undefined 
          ? (isPlaying ? 'running' : 'paused')
          : undefined, // Let animations run naturally when timeline is not active
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
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
            <div className="absolute inset-0 border border-dashed border-cyan-400 pointer-events-none" />
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
      ) : type === "richtext" ? (
        <div 
          className="w-full h-full overflow-hidden relative" 
          style={{ 
            borderRadius: cornerRadius ? `${cornerRadius}px` : '0',
            background: fillType === "solid" ? fill : 
                       fillType === "image" && fillImage ? `url(${fillImage})` :
                       fillType === "gradient" ? generateGradientCSS(gradientType, gradientAngle, gradientStops) : 
                       fill,
            ...(fillType === "image" && fillImage ? getFitStyle(fillImageFit) : {})
          }}
        >
          <RichTextEditor
            blocks={(rest as any).richTextBlocks || [
              { id: "1", type: "h2", content: "Heading 2" },
              { id: "2", type: "h3", content: "Heading 3" },
              { id: "3", type: "p", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
              { id: "4", type: "blockquote", content: "Block quote" },
              { id: "5", type: "ul", content: "List item" },
              { id: "6", type: "ol", content: "Numbered item" }
            ]}
            isEditing={isEditing}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            textAlign={textAlign}
            color={color || fill}
            onUpdate={(blocks) => {
              onUpdate(id, { richTextBlocks: blocks } as any);
            }}
            onAddBlock={(type) => {
              const currentBlocks = (rest as any).richTextBlocks || [];
              const newBlock = {
                id: `block-${Date.now()}`,
                type,
                content: ""
              };
              onUpdate(id, { richTextBlocks: [...currentBlocks, newBlock] } as any);
            }}
            onDeleteBlock={(blockId) => {
              const currentBlocks = (rest as any).richTextBlocks || [];
              const filteredBlocks = currentBlocks.filter((b: any) => b.id !== blockId);
              onUpdate(id, { richTextBlocks: filteredBlocks } as any);
            }}
          />
        </div>
      ) : type === "qrcode" ? (
        <div className="w-full h-full flex items-center justify-center">
          <QRCodeSVG
            value={(rest as any).qrValue || "https://example.com"}
            size={Math.min(width, height)}
            bgColor={(rest as any).qrBgColor || "#ffffff"}
            fgColor={(rest as any).qrFgColor || "#000000"}
            level={(rest as any).qrLevel || "M"}
            includeMargin={false}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </div>
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
          
          {/* Dimension label at bottom in cyan */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-cyan-400 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none font-medium">
            {Math.round(width)} × {Math.round(height)}
          </div>
          
          {/* Resize handles in cyan - hidden when locked */}
          {!isLocked && (
            <>
              {/* Corner handles */}
              <div data-resize-handle className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-white cursor-nw-resize border border-cyan-400" onMouseDown={(e) => handleResizeStart(e, "nw")} onTouchStart={(e) => handleResizeTouchStart(e, "nw")} />
              <div data-resize-handle className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-white cursor-ne-resize border border-cyan-400" onMouseDown={(e) => handleResizeStart(e, "ne")} onTouchStart={(e) => handleResizeTouchStart(e, "ne")} />
              <div data-resize-handle className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-white cursor-sw-resize border border-cyan-400" onMouseDown={(e) => handleResizeStart(e, "sw")} onTouchStart={(e) => handleResizeTouchStart(e, "sw")} />
              <div data-resize-handle className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-white cursor-se-resize border border-cyan-400" onMouseDown={(e) => handleResizeStart(e, "se")} onTouchStart={(e) => handleResizeTouchStart(e, "se")} />
              
              {/* Side handles - invisible but functional spanning entire edges */}
              <div data-resize-handle className="absolute left-0 w-full opacity-0 cursor-n-resize" style={{ top: '-4px', height: '8px' }} onMouseDown={(e) => handleResizeStart(e, "n")} onTouchStart={(e) => handleResizeTouchStart(e, "n")} />
              <div data-resize-handle className="absolute left-0 w-full opacity-0 cursor-s-resize" style={{ bottom: '-4px', height: '8px' }} onMouseDown={(e) => handleResizeStart(e, "s")} onTouchStart={(e) => handleResizeTouchStart(e, "s")} />
              <div data-resize-handle className="absolute top-0 h-full opacity-0 cursor-e-resize" style={{ right: '-4px', width: '8px' }} onMouseDown={(e) => handleResizeStart(e, "e")} onTouchStart={(e) => handleResizeTouchStart(e, "e")} />
              <div data-resize-handle className="absolute top-0 h-full opacity-0 cursor-w-resize" style={{ left: '-4px', width: '8px' }} onMouseDown={(e) => handleResizeStart(e, "w")} onTouchStart={(e) => handleResizeTouchStart(e, "w")} />
              
              {/* Rotation handle */}
              <div 
                data-rotate-handle 
                className="absolute left-1/2 bg-accent rounded-full cursor-grab active:cursor-grabbing border-2 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                style={{
                  top: '-32px',
                  width: '24px',
                  height: '24px',
                  transform: 'translateX(-50%)',
                }}
                onMouseDown={handleRotateStart}
                onTouchStart={handleRotateTouchStart}
                title="Rotate"
              >
                <svg className="text-white" style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>

              {/* Play animation button - only show if animation is set */}
              {animation && animation !== "none" && (
                <div 
                  className="absolute -top-8 left-1/2 translate-x-4 w-6 h-6 bg-purple-500 rounded-full cursor-pointer border-2 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnimationKey(prev => prev + 1);
                  }}
                  title="Play Animation"
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
