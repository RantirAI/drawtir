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
  onPathComplete 
}: DrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [pathPoints, setPathPoints] = useState<{x: number, y: number}[]>([]);

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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath(`M ${x} ${y}`);
    setPathPoints([{x, y}]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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

  return (
    <canvas
      ref={canvasRef}
      width={frameWidth}
      height={frameHeight}
      className={`absolute pointer-events-${isActive ? 'auto' : 'none'} z-20`}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      style={{ 
        left: frameX,
        top: frameY,
        cursor: isActive ? 'crosshair' : 'default'
      }}
    />
  );
}
