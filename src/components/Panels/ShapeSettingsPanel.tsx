import DraggablePanel from "./DraggablePanel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, ArrowUp, ArrowDown
} from "lucide-react";

const presetColors = [
  "#000000", "#ffffff", "#ef4444", "#f59e0b",
  "#10b981", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#f3f4f6", "#fecaca", "#fef3c7",
];

interface ShapeSettingsPanelProps {
  backgroundColor?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  onBackgroundColorChange?: (color: string) => void;
  onFillChange?: (color: string) => void;
  onStrokeChange?: (color: string) => void;
  onStrokeWidthChange?: (width: number) => void;
  onAlign?: (type: string) => void;
  onArrange?: (type: string) => void;
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  onFlexDirectionChange?: (direction: "row" | "column") => void;
  onJustifyContentChange?: (justify: string) => void;
  onAlignItemsChange?: (align: string) => void;
  onGapChange?: (gap: number) => void;
  onClose?: () => void;
}

export default function ShapeSettingsPanel({
  backgroundColor = "#000000",
  fill = "#000000",
  stroke = "#000000",
  strokeWidth = 2,
  onBackgroundColorChange,
  onFillChange,
  onStrokeChange,
  onStrokeWidthChange,
  onAlign,
  onArrange,
  flexDirection = "row",
  justifyContent = "start",
  alignItems = "start",
  gap = 0,
  onFlexDirectionChange,
  onJustifyContentChange,
  onAlignItemsChange,
  onGapChange,
  onClose,
}: ShapeSettingsPanelProps) {
  return (
    <DraggablePanel
      title="Shape Settings"
      defaultPosition={{ x: 50, y: 500 }}
      onClose={onClose}
      className="w-64"
    >
      <div className="space-y-4">
        {/* Background Color */}
        {onBackgroundColorChange && (
          <div>
            <Label className="text-xs mb-2 block">Background</Label>
            <Input
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              className="h-8 w-full"
            />
          </div>
        )}

        {/* Fill Color */}
        {onFillChange && (
          <div>
            <Label className="text-xs mb-2 block">Fill</Label>
            <Input
              type="color"
              value={fill}
              onChange={(e) => onFillChange(e.target.value)}
              className="h-8 w-full"
            />
          </div>
        )}

        {/* Stroke */}
        {onStrokeChange && (
          <div>
            <Label className="text-xs mb-2 block">Stroke</Label>
            <Input
              type="color"
              value={stroke}
              onChange={(e) => onStrokeChange(e.target.value)}
              className="h-8 w-full mb-2"
            />
            {onStrokeWidthChange && (
              <>
                <Label className="text-xs mb-1 block">Width: {strokeWidth}px</Label>
                <Slider
                  value={[strokeWidth]}
                  onValueChange={([v]) => onStrokeWidthChange(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="mb-2"
                />
              </>
            )}
          </div>
        )}

        {/* Presets */}
        <div>
          <Label className="text-xs mb-2 block">Presets</Label>
          <div className="grid grid-cols-6 gap-1">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  if (onFillChange) onFillChange(color);
                  if (onBackgroundColorChange) onBackgroundColorChange(color);
                }}
                className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Custom Color */}
        <div>
          <Label className="text-xs mb-2 block">Custom</Label>
          <Input
            type="text"
            placeholder="#000000"
            className="h-8 text-xs"
            onChange={(e) => {
              if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                if (onFillChange) onFillChange(e.target.value);
                if (onBackgroundColorChange) onBackgroundColorChange(e.target.value);
              }
            }}
          />
        </div>

        {/* Alignment Tools */}
        {onAlign && (
          <div>
            <Label className="text-xs mb-2 block">Align</Label>
            <div className="grid grid-cols-3 gap-1">
              <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign("left")}>
                <AlignLeft className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign("center")}>
                <AlignCenter className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign("right")}>
                <AlignRight className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign("top")}>
                <AlignStartVertical className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign("middle")}>
                <AlignCenterVertical className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-full" onClick={() => onAlign("bottom")}>
                <AlignEndVertical className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Arrange */}
        {onArrange && (
          <div>
            <Label className="text-xs mb-2 block">Arrange</Label>
            <div className="grid grid-cols-2 gap-1">
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => onArrange("forward")}>
                <ArrowUp className="h-3 w-3 mr-1" />
                Forward
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => onArrange("backward")}>
                <ArrowDown className="h-3 w-3 mr-1" />
                Backward
              </Button>
            </div>
          </div>
        )}

        {/* Flex Layout */}
        {onFlexDirectionChange && (
          <div>
            <Label className="text-xs mb-2 block">Layout</Label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1">
                <Button 
                  variant={flexDirection === "row" ? "default" : "outline"} 
                  size="sm" 
                  className="h-7 text-[10px]"
                  onClick={() => onFlexDirectionChange("row")}
                >
                  Row
                </Button>
                <Button 
                  variant={flexDirection === "column" ? "default" : "outline"} 
                  size="sm" 
                  className="h-7 text-[10px]"
                  onClick={() => onFlexDirectionChange("column")}
                >
                  Column
                </Button>
              </div>
              
              {onGapChange && (
                <>
                  <Label className="text-xs">Gap: {gap}px</Label>
                  <Slider
                    value={[gap]}
                    onValueChange={([v]) => onGapChange(v)}
                    min={0}
                    max={50}
                    step={2}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DraggablePanel>
  );
}
