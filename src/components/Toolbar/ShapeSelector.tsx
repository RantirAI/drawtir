import { Square, Minus, ArrowRight, Circle, Hexagon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ShapeSelectorProps {
  children: React.ReactNode;
  onShapeSelect: (shapeType: string) => void;
}

export default function ShapeSelector({ children, onShapeSelect }: ShapeSelectorProps) {
  const shapes = [
    { type: "rectangle", icon: Square, label: "Rectangle", shortcut: "R" },
    { type: "line", icon: Minus, label: "Line", shortcut: "L" },
    { type: "arrow", icon: ArrowRight, label: "Arrow", shortcut: "Shift+L" },
    { type: "ellipse", icon: Circle, label: "Ellipse", shortcut: "O" },
    { type: "polygon", icon: Hexagon, label: "Polygon", shortcut: "" },
    { type: "star", icon: Star, label: "Star", shortcut: "" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="center" 
        className="w-auto p-2 bg-popover/95 backdrop-blur-xl border shadow-lg"
      >
        <div className="flex flex-col gap-1">
          {shapes.map((shape) => (
            <Button
              key={shape.type}
              variant="ghost"
              size="sm"
              className="justify-start gap-3 h-8 px-3 text-sm"
              onClick={() => {
                onShapeSelect(shape.type);
              }}
            >
              <shape.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{shape.label}</span>
              {shape.shortcut && (
                <span className="text-xs text-muted-foreground">{shape.shortcut}</span>
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
