import { useState, useEffect } from "react";

interface ResizableElementProps {
  id: string;
  type: "image" | "shape" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string;
  text?: string;
  shapeType?: "rectangle" | "circle" | "line" | "arrow" | "ellipse" | "polygon" | "star";
  pathData?: string; // For pen drawings
  strokeWidth?: number;
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
  text,
  shapeType = "rectangle",
  fill = "#000000",
  stroke = "#000000",
  pathData,
  strokeWidth = 2,
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
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    // Shapes
    switch (shapeType) {
      case "circle":
      case "ellipse":
        return (
          <div
            className="w-full h-full rounded-full"
            style={{ backgroundColor: fill, border: `2px solid ${stroke}` }}
          />
        );
      case "line":
        return (
          <svg width={width} height={height} className="w-full h-full">
            <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={stroke} strokeWidth="2" />
          </svg>
        );
      case "arrow":
        return (
          <svg width={width} height={height} className="w-full h-full">
            <defs>
              <marker id={`arrowhead-${id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
              </marker>
            </defs>
            <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={stroke} strokeWidth="2" markerEnd={`url(#arrowhead-${id})`} />
          </svg>
        );
      case "polygon":
        const hexPoints = `${width / 2},0 ${width},${height / 4} ${width},${height * 3 / 4} ${width / 2},${height} 0,${height * 3 / 4} 0,${height / 4}`;
        return (
          <svg width={width} height={height} className="w-full h-full">
            <polygon points={hexPoints} fill={fill} stroke={stroke} strokeWidth="2" />
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
            <polygon points={starPoints} fill={fill} stroke={stroke} strokeWidth="2" />
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
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{ left: x, top: y, width, height }}
      onMouseDown={handleMouseDown}
    >
      {type === "image" && src ? (
        <img src={src} alt="Element" className="w-full h-full object-cover rounded" />
      ) : type === "text" ? (
        <div 
          className="w-full h-full flex items-center justify-center text-center px-2"
          style={{ color: fill, fontSize: '16px', fontWeight: 'bold' }}
        >
          {text || "Text"}
        </div>
      ) : (
        renderShape()
      )}

      {isSelected && (
        <>
          {/* Dimension label at bottom in blue */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none font-medium">
            {Math.round(width)} × {Math.round(height)}
          </div>
          
          {/* Resize handles in blue */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-sm cursor-nw-resize border-2 border-white" onMouseDown={(e) => handleResizeStart(e, "nw")} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-sm cursor-ne-resize border-2 border-white" onMouseDown={(e) => handleResizeStart(e, "ne")} />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-sm cursor-sw-resize border-2 border-white" onMouseDown={(e) => handleResizeStart(e, "sw")} />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-sm cursor-se-resize border-2 border-white" onMouseDown={(e) => handleResizeStart(e, "se")} />
        </>
      )}
    </div>
  );
}
