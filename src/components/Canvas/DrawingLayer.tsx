import { useRef, useState, useEffect } from "react";

interface DrawingLayerProps {
  isActive: boolean;
  color: string;
  strokeWidth: number;
  frameId?: string;
  frameX?: number;
  frameY?: number;
  frameWidth?: number;
  frameHeight?: number;
  zoom?: number;
  panOffsetX?: number;
  panOffsetY?: number;
  guideLines?: Array<{ id: string; x: number; y: number; width: number; height: number; shapeType: string }>;
  snapThreshold?: number;
  onPathComplete?: (pathData: string, color: string, strokeWidth: number, bounds: { x: number; y: number; width: number; height: number }) => void;
}

export default function DrawingLayer({ 
  isActive, 
  color, 
  strokeWidth, 
  frameId,
  frameX = 0,
  frameY = 0,
  frameWidth = 400,
  frameHeight = 600,
  zoom = 1,
  panOffsetX = 0,
  panOffsetY = 0,
  guideLines = [],
  snapThreshold = 10,
  onPathComplete 
}: DrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [pathPoints, setPathPoints] = useState<{x: number, y: number}[]>([]);

  // Snap point to nearby guide lines
  const snapToGuides = (x: number, y: number): { x: number; y: number } => {
    let snappedX = x;
    let snappedY = y;

    for (const guide of guideLines) {
      if (guide.shapeType === "line") {
        // Horizontal guide line (small height, full width)
        if (guide.height <= 5) {
          const guideY = guide.y + guide.height / 2;
          if (Math.abs(y - guideY) < snapThreshold) {
            snappedY = guideY;
          }
        }
        // Vertical guide line (small width, full height)
        else if (guide.width <= 5) {
          const guideX = guide.x + guide.width / 2;
          if (Math.abs(x - guideX) < snapThreshold) {
            snappedX = guideX;
          }
        }
      }
    }

    return { x: snappedX, y: snappedY };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw current path
    if (currentPath) {
      const pathObj = new Path2D(currentPath);
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(pathObj);
    }
  }, [currentPath, color, strokeWidth]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setCurrentPath(`M ${x} ${y}`);
    setPathPoints([{x, y}]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x = (e.clientX - rect.left) / zoom;
    let y = (e.clientY - rect.top) / zoom;
    
    // Apply snapping to guide lines
    const snapped = snapToGuides(x, y);
    x = snapped.x;
    y = snapped.y;
    
    setCurrentPath(prev => `${prev} L ${x} ${y}`);
    setPathPoints(prev => [...prev, {x, y}]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath && pathPoints.length > 0) {
      // Calculate bounds
      const xs = pathPoints.map(p => p.x);
      const ys = pathPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      
      // Translate path to origin
      const translatedPath = pathPoints.map((p, i) => {
        const x = p.x - minX;
        const y = p.y - minY;
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      }).join(' ');
      
      if (onPathComplete) {
        onPathComplete(translatedPath, color, strokeWidth, {
          x: minX,
          y: minY,
          width: Math.max(20, maxX - minX),
          height: Math.max(20, maxY - minY)
        });
      }
      setCurrentPath("");
      setPathPoints([]);
    }
    setIsDrawing(false);
  };

  useEffect(() => {
    // Add global mouse up handler to complete drawing even if mouse leaves canvas
    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        stopDrawing();
      }
    };

    if (isActive && isDrawing) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isActive, isDrawing]);

  return (
    <canvas
      ref={canvasRef}
      width={frameWidth}
      height={frameHeight}
      className={`absolute pointer-events-${isActive ? 'auto' : 'none'} z-50`}
      onMouseDown={(e) => {
        e.stopPropagation();
        startDrawing(e);
      }}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      style={{ 
        left: frameX,
        top: frameY,
        cursor: isActive ? 'crosshair' : 'default'
      }}
    />
  );
}
