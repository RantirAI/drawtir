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
    <div className="fixed right-4 top-16 z-40 w-48">
      <div className="bg-card/90 backdrop-blur-xl border rounded-2xl shadow-2xl p-3 space-y-3">
        <div>
          <Label className="text-[10px] font-semibold mb-2 block">Colors</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {colors.map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded-md border border-border hover:border-primary transition-colors"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <Label className="text-[10px] font-semibold mb-1.5 block">Stroke</Label>
          <Slider
            value={[strokeWidth]}
            onValueChange={(v) => onStrokeWidthChange?.(v[0])}
            min={1}
            max={20}
            step={1}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-[10px] font-semibold mb-2 block">Style</Label>
          <div className="grid grid-cols-4 gap-1.5">
            <button className="w-8 h-8 rounded-md border border-border hover:border-primary transition-colors flex items-center justify-center">
              <div className="w-4 h-4 bg-foreground rounded" />
            </button>
            <button className="w-8 h-8 rounded-md border border-border hover:border-primary transition-colors flex items-center justify-center">
              <div className="w-4 h-4 border border-foreground rounded" />
            </button>
            <button className="w-8 h-8 rounded-md border border-border hover:border-primary transition-colors flex items-center justify-center">
              <div className="w-4 h-4 border border-dashed border-foreground rounded" />
            </button>
            <button className="w-8 h-8 rounded-md border border-border hover:border-primary transition-colors flex items-center justify-center">
              <div className="w-4 h-4 bg-transparent border border-foreground rounded" />
            </button>
          </div>
        </div>

        <div>
          <Label className="text-[10px] font-semibold mb-2 block">Size</Label>
          <div className="flex gap-1.5">
            {["S", "M", "L", "XL"].map((size) => (
              <button
                key={size}
                className="flex-1 h-7 rounded-md border border-border hover:border-primary transition-colors text-[10px] font-semibold"
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
