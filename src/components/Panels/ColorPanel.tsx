import DraggablePanel from "./DraggablePanel";
import { Label } from "@/components/ui/label";

const colors = [
  "#000000", "#ffffff", "#ef4444", "#f59e0b",
  "#10b981", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#f3f4f6", "#fecaca", "#fef3c7",
];

interface ColorPanelProps {
  onColorSelect: (color: string) => void;
  selectedColor?: string;
  onClose?: () => void;
}

export default function ColorPanel({ onColorSelect, selectedColor, onClose }: ColorPanelProps) {
  return (
    <DraggablePanel
      title="Colors"
      defaultPosition={{ x: window.innerWidth - 250, y: 200 }}
      onClose={onClose}
      className="w-48"
    >
      <div className="grid grid-cols-4 gap-1.5">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            className={`w-8 h-8 rounded-md border-2 transition-all ${
              selectedColor === color ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </DraggablePanel>
  );
}
