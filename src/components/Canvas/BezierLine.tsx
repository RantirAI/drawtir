import { useState, useEffect } from "react";

interface BezierLineProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pathData?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  opacity?: number;
  blendMode?: string;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<{ x: number; y: number; width: number; height: number; pathData: string }>) => void;
  onSelect: (e?: React.MouseEvent) => void;
}

export default function BezierLine({
  id,
  x,
  y,
  width,
  height,
  pathData = `M 0,${height / 2} L ${width},${height / 2}`,
  stroke = "#000000",
  strokeWidth = 2,
  strokeOpacity = 100,
  opacity = 100,
  blendMode = "normal",
  isSelected,
  onUpdate,
  onSelect,
}: BezierLineProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: x, elementY: y });
  const [controlPoints, setControlPoints] = useState<Array<{ x: number; y: number; type: 'point' | 'control' }>>([]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  // Parse path data into control points
  useEffect(() => {
    const points: Array<{ x: number; y: number; type: 'point' | 'control' }> = [];
    const commands = pathData.match(/[MLCQZ][^MLCQZ]*/g) || [];
    
    commands.forEach((cmd) => {
      const type = cmd[0];
      const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
      
      if (type === 'M' || type === 'L') {
        points.push({ x: coords[0], y: coords[1], type: 'point' });
      } else if (type === 'C') {
        // Cubic Bezier: cp1x, cp1y, cp2x, cp2y, x, y
        points.push({ x: coords[0], y: coords[1], type: 'control' });
        points.push({ x: coords[2], y: coords[3], type: 'control' });
        points.push({ x: coords[4], y: coords[5], type: 'point' });
      } else if (type === 'Q') {
        // Quadratic Bezier: cpx, cpy, x, y
        points.push({ x: coords[0], y: coords[1], type: 'control' });
        points.push({ x: coords[2], y: coords[3], type: 'point' });
      }
    });
    
    setControlPoints(points);
  }, [pathData]);

  // Convert control points back to path data
  const updatePathFromPoints = (points: Array<{ x: number; y: number; type: 'point' | 'control' }>) => {
    if (points.length === 0) return;
    
    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      if (point.type === 'point') {
        // Check if there are control points before this point
        const prevPoint = points[i - 1];
        if (prevPoint.type === 'control') {
          // This is a quadratic bezier or cubic bezier
          const prevPrevPoint = i >= 2 ? points[i - 2] : null;
          if (prevPrevPoint && prevPrevPoint.type === 'control') {
            // Cubic bezier
            path += ` C ${prevPrevPoint.x},${prevPrevPoint.y} ${prevPoint.x},${prevPoint.y} ${point.x},${point.y}`;
          } else {
            // Quadratic bezier
            path += ` Q ${prevPoint.x},${prevPoint.y} ${point.x},${point.y}`;
          }
        } else {
          // Simple line
          path += ` L ${point.x},${point.y}`;
        }
      }
    }
    
    onUpdate(id, { pathData: path });
  };

  const handlePointDrag = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPoint(index);
    setDragStart({ x: e.clientX, y: e.clientY, elementX: x, elementY: y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (selectedPoint !== null) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        
        const newPoints = [...controlPoints];
        newPoints[selectedPoint] = {
          ...newPoints[selectedPoint],
          x: Math.max(0, Math.min(width, controlPoints[selectedPoint].x + dx)),
          y: Math.max(0, Math.min(height, controlPoints[selectedPoint].y + dy)),
        };
        
        setControlPoints(newPoints);
        setDragStart({ x: e.clientX, y: e.clientY, elementX: x, elementY: y });
        updatePathFromPoints(newPoints);
      } else if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        onUpdate(id, { x: dragStart.elementX + dx, y: dragStart.elementY + dy });
      }
    };

    const handleMouseUp = () => {
      setSelectedPoint(null);
      setIsDragging(false);
      setIsResizing(false);
    };

    if (selectedPoint !== null || isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [selectedPoint, isDragging, isResizing, dragStart, controlPoints, x, y, width, height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, elementX: x, elementY: y });
  };

  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const alpha = opacity / 100;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      className={`absolute cursor-move ${isSelected ? 'ring-1 ring-blue-500' : ''}`}
      style={{
        left: x,
        top: y,
        width,
        height,
        opacity: opacity / 100,
        mixBlendMode: (blendMode || 'normal') as any,
      }}
      onMouseDown={handleMouseDown}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <path
          d={pathData}
          fill="none"
          stroke={hexToRgba(stroke, strokeOpacity)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Show control points when selected */}
        {isSelected && controlPoints.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r={point.type === 'control' ? 4 : 6}
              fill={point.type === 'control' ? '#60a5fa' : '#3b82f6'}
              stroke="white"
              strokeWidth={2}
              className="cursor-pointer"
              onMouseDown={(e) => handlePointDrag(index, e as any)}
            />
          </g>
        ))}
      </svg>
      
      {isSelected && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none font-medium z-50">
          {Math.round(width)} × {Math.round(height)}
        </div>
      )}
    </div>
  );
}
