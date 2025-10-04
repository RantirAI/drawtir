import DraggablePanel from "./DraggablePanel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  ArrowUp, ArrowDown, Palette
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
      className="w-72"
    >
      <Accordion type="multiple" defaultValue={["appearance", "align", "layout"]} className="w-full">
        {/* Appearance Section */}
        <AccordionItem value="appearance">
          <AccordionTrigger className="text-xs font-medium py-2">Appearance</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-3">
            {/* Color Controls - Horizontal Layout */}
            <div className="flex items-center gap-2">
              {onBackgroundColorChange && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="h-7 w-7 rounded border-2 border-border hover:border-primary transition-colors flex-shrink-0"
                      style={{ backgroundColor }}
                    >
                      <span className="sr-only">Background</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="w-64 p-3">
                    <Label className="text-xs mb-2 block">Background</Label>
                    <Input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => onBackgroundColorChange(e.target.value)}
                      className="h-8 w-full mb-2"
                    />
                    <Input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => {
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          onBackgroundColorChange(e.target.value);
                        }
                      }}
                      placeholder="#000000"
                      className="h-7 text-xs"
                    />
                  </PopoverContent>
                </Popover>
              )}

              {onFillChange && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="h-7 w-7 rounded border-2 border-border hover:border-primary transition-colors flex-shrink-0"
                      style={{ backgroundColor: fill }}
                    >
                      <span className="sr-only">Fill</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="w-64 p-3">
                    <Label className="text-xs mb-2 block">Fill</Label>
                    <Input
                      type="color"
                      value={fill}
                      onChange={(e) => onFillChange(e.target.value)}
                      className="h-8 w-full mb-2"
                    />
                    <Input
                      type="text"
                      value={fill}
                      onChange={(e) => {
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          onFillChange(e.target.value);
                        }
                      }}
                      placeholder="#000000"
                      className="h-7 text-xs"
                    />
                  </PopoverContent>
                </Popover>
              )}

              {onStrokeChange && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="h-7 w-7 rounded border-2 border-border hover:border-primary transition-colors flex-shrink-0"
                      style={{ backgroundColor: stroke }}
                    >
                      <span className="sr-only">Stroke</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="w-64 p-3">
                    <Label className="text-xs mb-2 block">Stroke</Label>
                    <Input
                      type="color"
                      value={stroke}
                      onChange={(e) => onStrokeChange(e.target.value)}
                      className="h-8 w-full mb-2"
                    />
                    <Input
                      type="text"
                      value={stroke}
                      onChange={(e) => {
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          onStrokeChange(e.target.value);
                        }
                      }}
                      placeholder="#000000"
                      className="h-7 text-xs mb-2"
                    />
                    {onStrokeWidthChange && (
                      <>
                        <Label className="text-xs mb-1 block">Width: {strokeWidth}px</Label>
                        <Slider
                          value={[strokeWidth]}
                          onValueChange={([v]) => onStrokeWidthChange(v)}
                          min={0}
                          max={10}
                          step={1}
                        />
                      </>
                    )}
                  </PopoverContent>
                </Popover>
              )}

              <span className="text-xs text-muted-foreground flex-1">Colors</span>
            </div>

            {/* Presets */}
            <div>
              <Label className="text-xs mb-2 block">Presets</Label>
              <div className="grid grid-cols-8 gap-1">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      if (onFillChange) onFillChange(color);
                      if (onBackgroundColorChange) onBackgroundColorChange(color);
                    }}
                    className="w-6 h-6 rounded border border-border hover:border-primary transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Alignment Tools */}
        {onAlign && (
          <AccordionItem value="align">
            <AccordionTrigger className="text-xs font-medium py-2">Align</AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
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

              {onArrange && (
                <>
                  <Label className="text-xs mt-2 block">Arrange</Label>
                  <div className="grid grid-cols-2 gap-1">
                    <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => onArrange("forward")}>
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Forward
                    </Button>
                    <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => onArrange("backward")}>
                      <ArrowDown className="h-3 w-3 mr-1" />
                      Backward
                    </Button>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Flex Layout */}
        {onFlexDirectionChange && (
          <AccordionItem value="layout">
            <AccordionTrigger className="text-xs font-medium py-2">Layout</AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
              <div className="grid grid-cols-2 gap-1">
                <Button 
                  variant={flexDirection === "row" ? "default" : "outline"} 
                  size="sm" 
                  className="h-6 text-[10px]"
                  onClick={() => onFlexDirectionChange("row")}
                >
                  Row
                </Button>
                <Button 
                  variant={flexDirection === "column" ? "default" : "outline"} 
                  size="sm" 
                  className="h-6 text-[10px]"
                  onClick={() => onFlexDirectionChange("column")}
                >
                  Column
                </Button>
              </div>
              
              {onGapChange && (
                <div className="mt-2">
                  <Label className="text-xs mb-1 block">Gap: {gap}px</Label>
                  <Slider
                    value={[gap]}
                    onValueChange={([v]) => onGapChange(v)}
                    min={0}
                    max={50}
                    step={2}
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </DraggablePanel>
  );
}
