import { useState, useRef, useEffect } from "react";
import PosterPreview from "./PosterPreview";

interface ResizableFrameProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
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
  onUpdate: (id: string, updates: Partial<{ x: number; y: number; width: number; height: number; backgroundColor: string }>) => void;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ResizableFrame({
  id,
  x,
  y,
  width,
  height,
  backgroundColor,
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
  onUpdate,
  isSelected,
  onSelect,
}: ResizableFrameProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement>(null);

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
        }
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, x, y, width, height, id, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".resize-handle")) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    onSelect();
    setIsResizing(corner);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      ref={frameRef}
      className={`absolute ${isSelected ? "ring-2 ring-primary" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
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
      
      {isSelected && (
        <>
          <div
            className="resize-handle absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nw-resize"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            className="resize-handle absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-ne-resize"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-sw-resize"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize"
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
        </>
      )}
    </div>
  );
}
