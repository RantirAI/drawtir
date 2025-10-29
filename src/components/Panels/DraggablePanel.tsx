import { useState, useRef, useEffect, ReactNode } from "react";
import { GripHorizontal, Minimize2, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DraggablePanelProps {
  title: string;
  children: ReactNode;
  defaultPosition?: { x: number; y: number };
  onClose?: () => void;
  className?: string;
}

export default function DraggablePanel({
  title,
  children,
  defaultPosition = { x: 100, y: 100 },
  onClose,
  className = "",
}: DraggablePanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      setPosition({
        x: t.clientX - dragOffset.x,
        y: t.clientY - dragOffset.y,
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false } as any);
      document.addEventListener("touchend", handleTouchEnd);
      document.addEventListener("touchcancel", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove as any);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      const t = e.touches[0];
      if (!t) return;
      setDragOffset({
        x: t.clientX - rect.left,
        y: t.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  return (
    <Card
      ref={panelRef}
      className={`fixed backdrop-blur-2xl border ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "auto",
        minWidth: "200px",
        background: "var(--glass-bg)",
        borderColor: "hsl(var(--glass-border))",
        boxShadow: "var(--glass-shadow)",
      }}
    >
      <div
        className="flex items-center justify-between p-2 border-b border-border/40 dark:border-border/25 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="flex items-center gap-1.5">
          <GripHorizontal className="h-3 w-3 text-muted-foreground" />
          {title && <span className="text-xs font-semibold">{title}</span>}
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="h-2.5 w-2.5" /> : <Minimize2 className="h-2.5 w-2.5" />}
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onClose}>
              <X className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>
      </div>
      {!isMinimized && <div className="p-2">{children}</div>}
    </Card>
  );
}
