import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const colors = [
  "#000000", "#ffffff", "#ef4444", "#f59e0b",
  "#10b981", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#f3f4f6", "#fecaca", "#fef3c7",
];

interface PropertyPanelProps {
  strokeWidth?: number;
  onStrokeWidthChange?: (value: number) => void;
}

export default function PropertyPanel({ strokeWidth = 2, onStrokeWidthChange }: PropertyPanelProps) {
  return (
    <div className="fixed right-4 top-20 z-40 w-64">
      <div className="bg-card/90 backdrop-blur-xl border rounded-2xl shadow-2xl p-4 space-y-4">
        <div>
          <Label className="text-xs font-semibold mb-3 block">Colors</Label>
          <div className="grid grid-cols-4 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                className="w-12 h-12 rounded-lg border-2 border-border hover:border-primary transition-colors"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold mb-2 block">Stroke</Label>
          <Slider
            value={[strokeWidth]}
            onValueChange={(v) => onStrokeWidthChange?.(v[0])}
            min={1}
            max={20}
            step={1}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-3 block">Style</Label>
          <div className="grid grid-cols-4 gap-2">
            <button className="w-12 h-12 rounded-lg border-2 border-border hover:border-primary transition-colors flex items-center justify-center">
              <div className="w-6 h-6 bg-foreground rounded" />
            </button>
            <button className="w-12 h-12 rounded-lg border-2 border-border hover:border-primary transition-colors flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-foreground rounded" />
            </button>
            <button className="w-12 h-12 rounded-lg border-2 border-border hover:border-primary transition-colors flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-dashed border-foreground rounded" />
            </button>
            <button className="w-12 h-12 rounded-lg border-2 border-border hover:border-primary transition-colors flex items-center justify-center">
              <div className="w-6 h-6 bg-transparent border-2 border-foreground rounded" />
            </button>
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold mb-3 block">Size</Label>
          <div className="flex gap-2">
            {["S", "M", "L", "XL"].map((size) => (
              <button
                key={size}
                className="flex-1 h-10 rounded-lg border-2 border-border hover:border-primary transition-colors text-sm font-semibold"
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
