import { useRef, useState, useEffect } from "react";

interface DrawingLayerProps {
  isActive: boolean;
  color: string;
  strokeWidth: number;
  onPathComplete?: (path: string) => void;
}

export default function DrawingLayer({ isActive, color, strokeWidth, onPathComplete }: DrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all paths
    paths.forEach(path => {
      const pathObj = new Path2D(path);
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(pathObj);
    });

    // Draw current path
    if (currentPath) {
      const pathObj = new Path2D(currentPath);
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(pathObj);
    }
  }, [paths, currentPath, color, strokeWidth]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath(`M ${x} ${y}`);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath(prev => `${prev} L ${x} ${y}`);
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath) {
      setPaths(prev => [...prev, currentPath]);
      onPathComplete?.(currentPath);
      setCurrentPath("");
    }
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className={`absolute inset-0 pointer-events-${isActive ? 'auto' : 'none'} z-20`}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      style={{ cursor: isActive ? 'crosshair' : 'default' }}
    />
  );
}
