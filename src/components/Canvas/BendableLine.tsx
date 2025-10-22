import { useState, useEffect, useRef } from "react";
import type { Element } from "@/types/elements";

interface BendableLineProps {
  element: Element;
  isSelected: boolean;
  onUpdate: (updates: Partial<Element>) => void;
}

export const BendableLine: React.FC<BendableLineProps> = ({ element, isSelected, onUpdate }) => {
  const [isDraggingPoint, setIsDraggingPoint] = useState<number | null>(null);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCreatingPoint, setIsCreatingPoint] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartMouseRef = useRef<{ x: number; y: number } | null>(null);
  const [tempControlPoints, setTempControlPoints] = useState<Array<{ x: number; y: number }> | null>(null);
  const lastUpdatedPointsRef = useRef<Array<{ x: number; y: number }> | null>(null);

  const getMouseInSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * element.width,
      y: ((clientY - rect.top) / rect.height) * element.height,
    };
  };

  const controlPoints = (tempControlPoints ?? element.controlPoints) || [
    { x: 0, y: element.height / 2 },
    { x: element.width, y: element.height / 2 }
  ];

  const lineStyle = element.lineStyle || "solid";
  const lineCap = element.lineCap || "round";
  const lineJoin = element.lineJoin || "round";
  
  // Track shift key
  useEffect(() => {
    if (!isSelected) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftHeld(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSelected]);
  
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

  // Get closest point on line to cursor
  const getClosestPointOnLine = (mouseX: number, mouseY: number) => {
    let closestPoint = { x: mouseX, y: mouseY };
    let minDistance = Infinity;
    
    // Sample points along the path
    for (let t = 0; t <= 1; t += 0.01) {
      let point;
      if (controlPoints.length === 2) {
        // Linear interpolation
        point = {
          x: controlPoints[0].x + t * (controlPoints[1].x - controlPoints[0].x),
          y: controlPoints[0].y + t * (controlPoints[1].y - controlPoints[0].y)
        };
      } else if (controlPoints.length === 3) {
        // Quadratic bezier
        const t1 = 1 - t;
        point = {
          x: t1 * t1 * controlPoints[0].x + 2 * t1 * t * controlPoints[1].x + t * t * controlPoints[2].x,
          y: t1 * t1 * controlPoints[0].y + 2 * t1 * t * controlPoints[1].y + t * t * controlPoints[2].y
        };
      } else {
        // Simple linear for now
        const segmentIndex = Math.floor(t * (controlPoints.length - 1));
        const nextIndex = Math.min(segmentIndex + 1, controlPoints.length - 1);
        const localT = (t * (controlPoints.length - 1)) - segmentIndex;
        point = {
          x: controlPoints[segmentIndex].x + localT * (controlPoints[nextIndex].x - controlPoints[segmentIndex].x),
          y: controlPoints[segmentIndex].y + localT * (controlPoints[nextIndex].y - controlPoints[segmentIndex].y)
        };
      }
      
      const distance = Math.sqrt(Math.pow(point.x - mouseX, 2) + Math.pow(point.y - mouseY, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    
    return closestPoint;
  };


  const handleLineMouseMove = (e: React.MouseEvent<SVGPathElement>) => {
    if (!isShiftHeld || !isSelected) {
      setHoverPosition(null);
      return;
    }
    
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * element.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * element.height;
    
    const closestPoint = getClosestPointOnLine(mouseX, mouseY);
    setHoverPosition(closestPoint);
  };

  const handleLineMouseDown = (e: React.MouseEvent<SVGPathElement> | React.PointerEvent<SVGPathElement>) => {
    if (isSelected && isShiftHeld) {
      e.stopPropagation();
      e.preventDefault();
      
      // Calculate position in SVG coords and add new point
      const { x: mouseX, y: mouseY } = getMouseInSvg(e.clientX, e.clientY);
      const closestPoint = getClosestPointOnLine(mouseX, mouseY);
      
      // Find where to insert the new point - use base control points from element
      const basePoints = element.controlPoints || [
        { x: 0, y: element.height / 2 },
        { x: element.width, y: element.height / 2 }
      ];
      let insertIndex = 1;
      let minDist = Infinity;
      for (let i = 0; i < basePoints.length - 1; i++) {
        const midX = (basePoints[i].x + basePoints[i + 1].x) / 2;
        const midY = (basePoints[i].y + basePoints[i + 1].y) / 2;
        const dist = Math.hypot(midX - closestPoint.x, midY - closestPoint.y);
        if (dist < minDist) {
          minDist = dist;
          insertIndex = i + 1;
        }
      }
      const newPoints = [...basePoints];
      newPoints.splice(insertIndex, 0, closestPoint);
      console.log('🔵 LineMouseDown - inserting point at index', insertIndex, 'new points:', newPoints);
      setTempControlPoints(newPoints);
      
      // Immediately start dragging the new point using absolute mouse coords
      setIsDraggingPoint(insertIndex);
      setIsCreatingPoint(true);
      dragStartPointRef.current = { x: closestPoint.x, y: closestPoint.y };
      dragStartMouseRef.current = { x: mouseX, y: mouseY };
    }
  };

  const handleControlPointMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTempControlPoints(controlPoints);
    setIsDraggingPoint(index);
    dragStartPointRef.current = { x: controlPoints[index].x, y: controlPoints[index].y };
    const pos = getMouseInSvg(e.clientX, e.clientY);
    dragStartMouseRef.current = pos;
  };

  const handleControlPointDoubleClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Remove control point on double click (keep at least 2 points)
    if (controlPoints.length > 2) {
      const newPoints = controlPoints.filter((_, i) => i !== index);
      onUpdate({ controlPoints: newPoints });
    }
  };

  useEffect(() => {
    if (isDraggingPoint === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPoint === null || !dragStartPointRef.current || !dragStartMouseRef.current) return;
      const current = getMouseInSvg(e.clientX, e.clientY);
      const dx = current.x - dragStartMouseRef.current.x;
      const dy = current.y - dragStartMouseRef.current.y;

      const base = dragStartPointRef.current;
      const updated = [...controlPoints];
      updated[isDraggingPoint] = {
        x: Math.max(0, Math.min(element.width, base.x + dx)),
        y: Math.max(0, Math.min(element.height, base.y + dy)),
      };
      lastUpdatedPointsRef.current = updated;
      setTempControlPoints(updated);
    };

    const handleMouseUp = () => {
      const finalPoints = lastUpdatedPointsRef.current || tempControlPoints || controlPoints;
      console.log('🟢 MouseUp - finalPoints:', finalPoints);
      console.log('🟢 MouseUp - calling onUpdate with:', { controlPoints: finalPoints });
      onUpdate({ controlPoints: finalPoints });
      lastUpdatedPointsRef.current = null;
      setTempControlPoints(null);
      setIsDraggingPoint(null);
      setIsCreatingPoint(false);
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
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${element.width} ${element.height}`}
      preserveAspectRatio="none"
      style={{ overflow: 'visible', pointerEvents: 'auto' }}
    >
      {/* The line - with wider invisible hit area */}
      <path
        d={generatePath()}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max((element.strokeWidth || 2) + 10, 15)}
        style={{ cursor: isSelected && isShiftHeld ? 'crosshair' : 'default', pointerEvents: 'stroke' }}
        onPointerDown={handleLineMouseDown}
        onMouseDown={handleLineMouseDown}
        onMouseMove={handleLineMouseMove}
        onMouseLeave={() => setHoverPosition(null)}
      />
      
      {/* The visible line */}
      <path
        d={generatePath()}
        fill="none"
        stroke={element.stroke || "#000000"}
        strokeWidth={element.strokeWidth || 2}
        strokeOpacity={(element.strokeOpacity || 100) / 100}
        strokeDasharray={getDashArray()}
        strokeLinecap={lineCap}
        strokeLinejoin={lineJoin}
        pointerEvents="none"
      />
      
      {/* Hover indicator when shift is held */}
      {isSelected && isShiftHeld && hoverPosition && (
        <circle
          cx={hoverPosition.x}
          cy={hoverPosition.y}
          r="5"
          fill="#3b82f6"
          stroke="white"
          strokeWidth="2"
          opacity="0.8"
          pointerEvents="none"
        />
      )}
      
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
              pointerEvents="none"
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
            onDoubleClick={(e) => handleControlPointDoubleClick(index, e)}
            style={{ cursor: 'move', pointerEvents: 'auto' }}
          />
        </g>
      ))}
    </svg>
  );
};
