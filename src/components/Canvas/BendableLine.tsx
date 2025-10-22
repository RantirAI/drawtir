import { useState, useEffect } from "react";
import type { Element } from "@/types/elements";

interface BendableLineProps {
  element: Element;
  isSelected: boolean;
  onUpdate: (updates: Partial<Element>) => void;
}

export const BendableLine: React.FC<BendableLineProps> = ({ element, isSelected, onUpdate }) => {
  const [isDraggingPoint, setIsDraggingPoint] = useState<number | null>(null);

  const controlPoints = element.controlPoints || [
    { x: 0, y: element.height / 2 },
    { x: element.width, y: element.height / 2 }
  ];

  const lineStyle = element.lineStyle || "solid";
  const lineCap = element.lineCap || "round";
  const lineJoin = element.lineJoin || "round";
  
  // Generate dash array based on line style
  const getDashArray = () => {
    if (element.dashArray) return element.dashArray;
    
    const strokeWidth = element.strokeWidth || 2;
    switch (lineStyle) {
      case "dashed":
        return `${strokeWidth * 4} ${strokeWidth * 2}`;
      case "dotted":
        return `${strokeWidth} ${strokeWidth}`;
      case "dashdot":
        return `${strokeWidth * 4} ${strokeWidth} ${strokeWidth} ${strokeWidth}`;
      default:
        return "none";
    }
  };

  // Generate SVG path from control points
  const generatePath = () => {
    if (controlPoints.length < 2) return "";
    
    let path = `M ${controlPoints[0].x} ${controlPoints[0].y}`;
    
    if (controlPoints.length === 2) {
      // Straight line
      path += ` L ${controlPoints[1].x} ${controlPoints[1].y}`;
    } else if (controlPoints.length === 3) {
      // Quadratic bezier curve
      path += ` Q ${controlPoints[1].x} ${controlPoints[1].y}, ${controlPoints[2].x} ${controlPoints[2].y}`;
    } else if (controlPoints.length === 4) {
      // Cubic bezier curve
      path += ` C ${controlPoints[1].x} ${controlPoints[1].y}, ${controlPoints[2].x} ${controlPoints[2].y}, ${controlPoints[3].x} ${controlPoints[3].y}`;
    } else {
      // Multiple points - smooth curve
      for (let i = 1; i < controlPoints.length; i++) {
        path += ` L ${controlPoints[i].x} ${controlPoints[i].y}`;
      }
    }
    
    return path;
  };

  const handleControlPointMouseDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPoint(index);
  };

  useEffect(() => {
    if (isDraggingPoint === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPoints = [...controlPoints];
      newPoints[isDraggingPoint] = {
        x: Math.max(0, Math.min(element.width, newPoints[isDraggingPoint].x + e.movementX)),
        y: Math.max(0, Math.min(element.height, newPoints[isDraggingPoint].y + e.movementY))
      };
      onUpdate({ controlPoints: newPoints });
    };

    const handleMouseUp = () => {
      setIsDraggingPoint(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPoint, controlPoints, element.width, element.height, onUpdate]);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${element.width} ${element.height}`}
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      {/* The line */}
      <path
        d={generatePath()}
        fill="none"
        stroke={element.stroke || "#000000"}
        strokeWidth={element.strokeWidth || 2}
        strokeOpacity={(element.strokeOpacity || 100) / 100}
        strokeDasharray={getDashArray()}
        strokeLinecap={lineCap}
        strokeLinejoin={lineJoin}
      />
      
      {/* Control points (visible when selected) */}
      {isSelected && controlPoints.map((point, index) => (
        <g key={index}>
          {/* Connection lines between points */}
          {index > 0 && (
            <line
              x1={controlPoints[index - 1].x}
              y1={controlPoints[index - 1].y}
              x2={point.x}
              y2={point.y}
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.5"
            />
          )}
          
          {/* Control point handle */}
          <circle
            cx={point.x}
            cy={point.y}
            r="6"
            fill="white"
            stroke="#3b82f6"
            strokeWidth="2"
            cursor="move"
            onMouseDown={(e) => handleControlPointMouseDown(index, e)}
            style={{ cursor: 'move' }}
          />
        </g>
      ))}
    </svg>
  );
};
