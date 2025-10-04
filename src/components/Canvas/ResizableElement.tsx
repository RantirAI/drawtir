import { useState, useEffect } from "react";

interface ResizableElementProps {
  id: string;
  type: "image" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string;
  shapeType?: "rectangle" | "circle" | "line" | "arrow";
  fill?: string;
  stroke?: string;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<{ x: number; y: number; width: number; height: number }>) => void;
  onSelect: () => void;
}

export default function ResizableElement({
  id,
  type,
  x,
  y,
  width,
  height,
  src,
  shapeType = "rectangle",
  fill = "#000000",
  stroke = "#000000",
  isSelected,
  onUpdate,
  onSelect,
}: ResizableElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: x, elementY: y });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width, height, corner: "" });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        onUpdate(id, {
          x: dragStart.elementX + dx,
          y: dragStart.elementY + dy,
        });
      } else if (isResizing) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = x;
        let newY = y;

        if (resizeStart.corner.includes("e")) newWidth = Math.max(20, resizeStart.width + dx);
        if (resizeStart.corner.includes("w")) {
          newWidth = Math.max(20, resizeStart.width - dx);
          newX = x + dx;
        }
        if (resizeStart.corner.includes("s")) newHeight = Math.max(20, resizeStart.height + dy);
        if (resizeStart.corner.includes("n")) {
          newHeight = Math.max(20, resizeStart.height - dy);
          newY = y + dy;
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
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      onSelect();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, elementX: x, elementY: y });
    }
  };

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, width, height, corner });
  };

  const renderShape = () => {
    switch (shapeType) {
      case "circle":
        return (
          <div
            className="w-full h-full rounded-full"
            style={{ backgroundColor: fill, border: `2px solid ${stroke}` }}
          />
        );
      case "line":
        return (
          <svg width={width} height={height} className="w-full h-full">
            <line x1="0" y1="0" x2={width} y2={height} stroke={stroke} strokeWidth="2" />
          </svg>
        );
      case "arrow":
        return (
          <svg width={width} height={height} className="w-full h-full">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
              </marker>
            </defs>
            <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={stroke} strokeWidth="2" markerEnd="url(#arrowhead)" />
          </svg>
        );
      default:
        return (
          <div
            className="w-full h-full rounded"
            style={{ backgroundColor: fill, border: `2px solid ${stroke}` }}
          />
        );
    }
  };

  return (
    <div
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-primary' : ''}`}
      style={{ left: x, top: y, width, height }}
      onMouseDown={handleMouseDown}
    >
      {type === "image" && src ? (
        <img src={src} alt="Element" className="w-full h-full object-cover rounded" />
      ) : (
        renderShape()
      )}

      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full cursor-nw-resize" onMouseDown={(e) => handleResizeStart(e, "nw")} />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full cursor-ne-resize" onMouseDown={(e) => handleResizeStart(e, "ne")} />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full cursor-sw-resize" onMouseDown={(e) => handleResizeStart(e, "sw")} />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full cursor-se-resize" onMouseDown={(e) => handleResizeStart(e, "se")} />
        </>
      )}
    </div>
  );
}
