import DraggablePanel from "../Panels/DraggablePanel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const presetColors = [
  "#000000", "#ffffff", "#ef4444", "#f59e0b",
  "#10b981", "#3b82f6", "#8b5cf6", "#ec4899",
];

interface FrameBackgroundPanelProps {
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onClose?: () => void;
}

export default function FrameBackgroundPanel({
  backgroundColor,
  onBackgroundColorChange,
  onClose,
}: FrameBackgroundPanelProps) {
  return (
    <DraggablePanel
      title="Frame Background"
      defaultPosition={{ x: 50, y: 500 }}
      onClose={onClose}
      className="w-56"
    >
      <div className="space-y-3">
        <div>
          <Label className="text-xs mb-2 block">Color</Label>
          <Input
            type="color"
            value={backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
            className="h-10 w-full"
          />
        </div>
        
        <div>
          <Label className="text-xs mb-2 block">Presets</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => onBackgroundColorChange(color)}
                className={`w-10 h-10 rounded-md border-2 transition-all ${
                  backgroundColor === color ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
}
