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
  ArrowUp, ArrowDown, Square, Type, Image, Pen, Box
} from "lucide-react";

const presetColors = [
  "#000000", "#ffffff", "#ef4444", "#f59e0b",
  "#10b981", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#f3f4f6", "#fecaca", "#fef3c7",
];

// Element-specific style presets
const elementPresets = {
  frame: [
    { name: "Dark", backgroundColor: "#000000", opacity: 100 },
    { name: "Light", backgroundColor: "#ffffff", opacity: 100 },
    { name: "Red", backgroundColor: "#ef4444", opacity: 100 },
    { name: "Blue", backgroundColor: "#3b82f6", opacity: 100 },
    { name: "Purple", backgroundColor: "#8b5cf6", opacity: 100 },
    { name: "Gradient", backgroundColor: "#1a1a1a", opacity: 100 },
  ],
  shape: [
    { name: "Solid Black", fill: "#000000", stroke: "#000000", opacity: 100 },
    { name: "Outline", fill: "transparent", stroke: "#000000", opacity: 100 },
    { name: "Red Fill", fill: "#ef4444", stroke: "#ef4444", opacity: 100 },
    { name: "Blue Fill", fill: "#3b82f6", stroke: "#3b82f6", opacity: 100 },
    { name: "Transparent", fill: "transparent", stroke: "#6b7280", opacity: 50 },
  ],
  text: [
    { name: "Bold Black", fill: "#000000", opacity: 100 },
    { name: "White", fill: "#ffffff", opacity: 100 },
    { name: "Semi-transparent", fill: "#000000", opacity: 70 },
    { name: "Accent", fill: "#3b82f6", opacity: 100 },
  ],
  image: [
    { name: "Normal", opacity: 100 },
    { name: "Faded", opacity: 70 },
    { name: "Subtle", opacity: 50 },
    { name: "Very Subtle", opacity: 30 },
  ],
  drawing: [
    { name: "Black Line", stroke: "#000000", strokeWidth: 2, opacity: 100 },
    { name: "Thick Black", stroke: "#000000", strokeWidth: 4, opacity: 100 },
    { name: "Blue Sketch", stroke: "#3b82f6", strokeWidth: 2, opacity: 70 },
    { name: "Thin Gray", stroke: "#6b7280", strokeWidth: 1, opacity: 50 },
  ],
};

interface ShapeSettingsPanelProps {
  elementType?: "frame" | "shape" | "text" | "image" | "drawing" | null;
  elementName?: string;
  backgroundColor?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  rotation?: number;
  opacity?: number;
  cornerRadius?: number;
  imageFit?: "fill" | "contain" | "cover" | "crop";
  onBackgroundColorChange?: (color: string) => void;
  onFillChange?: (color: string) => void;
  onStrokeChange?: (color: string) => void;
  onStrokeWidthChange?: (width: number) => void;
  onWidthChange?: (width: number) => void;
  onHeightChange?: (height: number) => void;
  onXChange?: (x: number) => void;
  onYChange?: (y: number) => void;
  onRotationChange?: (rotation: number) => void;
  onOpacityChange?: (opacity: number) => void;
  onCornerRadiusChange?: (radius: number) => void;
  onImageFitChange?: (fit: "fill" | "contain" | "cover" | "crop") => void;
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

const getElementIcon = (type?: "frame" | "shape" | "text" | "image" | "drawing" | null) => {
  switch (type) {
    case "frame": return Box;
    case "shape": return Square;
    case "text": return Type;
    case "image": return Image;
    case "drawing": return Pen;
    default: return Square;
  }
};

export default function ShapeSettingsPanel({
  elementType,
  elementName = "Nothing selected",
  backgroundColor = "#000000",
  fill = "#000000",
  stroke = "#000000",
  strokeWidth = 2,
  width = 100,
  height = 100,
  x = 0,
  y = 0,
  rotation = 0,
  opacity = 100,
  cornerRadius = 0,
  imageFit = "cover",
  onBackgroundColorChange,
  onFillChange,
  onStrokeChange,
  onStrokeWidthChange,
  onWidthChange,
  onHeightChange,
  onXChange,
  onYChange,
  onRotationChange,
  onOpacityChange,
  onCornerRadiusChange,
  onImageFitChange,
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
  const ElementIcon = getElementIcon(elementType);
  
  return (
    <DraggablePanel
      title=""
      defaultPosition={{ x: 50, y: 500 }}
      onClose={onClose}
      className="w-72"
    >
      {/* Header with element type */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
        <ElementIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{elementName}</span>
        {elementType && (
          <span className="ml-auto text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
            {elementType}
          </span>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["position", "layout", "appearance"]} className="w-full">
        {/* Position Section */}
        {(onXChange || onYChange || onRotationChange) && (
          <AccordionItem value="position">
            <AccordionTrigger className="text-xs font-medium py-2">Position</AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
              <div className="grid grid-cols-3 gap-2">
                {onXChange && (
                  <div>
                    <Label className="text-xs mb-1 block">X</Label>
                    <Input
                      type="number"
                      value={Math.round(x)}
                      onChange={(e) => onXChange(Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                )}
                {onYChange && (
                  <div>
                    <Label className="text-xs mb-1 block">Y</Label>
                    <Input
                      type="number"
                      value={Math.round(y)}
                      onChange={(e) => onYChange(Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                )}
                {onRotationChange && (
                  <div>
                    <Label className="text-xs mb-1 block">Rotate</Label>
                    <Input
                      type="number"
                      value={Math.round(rotation)}
                      onChange={(e) => onRotationChange(Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </div>
              
              {/* Alignment tools */}
              {onAlign && (
                <div className="mt-2">
                  <Label className="text-xs mb-1 block">Align</Label>
                  <div className="grid grid-cols-6 gap-1">
                    <Button variant="outline" size="icon" className="h-6 w-full" onClick={() => onAlign("left")}>
                      <AlignLeft className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-6 w-full" onClick={() => onAlign("center")}>
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-6 w-full" onClick={() => onAlign("right")}>
                      <AlignRight className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-6 w-full" onClick={() => onAlign("top")}>
                      <AlignStartVertical className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-6 w-full" onClick={() => onAlign("middle")}>
                      <AlignCenterVertical className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-6 w-full" onClick={() => onAlign("bottom")}>
                      <AlignEndVertical className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Layout/Dimensions Section */}
        {(onWidthChange || onHeightChange) && (
          <AccordionItem value="layout">
            <AccordionTrigger className="text-xs font-medium py-2">Layout</AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
              <div className="grid grid-cols-2 gap-2">
                {onWidthChange && (
                  <div>
                    <Label className="text-xs mb-1 block">W</Label>
                    <Input
                      type="number"
                      value={Math.round(width)}
                      onChange={(e) => onWidthChange(Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                )}
                {onHeightChange && (
                  <div>
                    <Label className="text-xs mb-1 block">H</Label>
                    <Input
                      type="number"
                      value={Math.round(height)}
                      onChange={(e) => onHeightChange(Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </div>
              
              {/* Flex Layout for Frames */}
              {elementType === "frame" && onFlexDirectionChange && (
                <>
                  <div className="grid grid-cols-2 gap-1 mt-2">
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
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Appearance Section */}
        <AccordionItem value="appearance">
          <AccordionTrigger className="text-xs font-medium py-2">Appearance</AccordionTrigger>
          <AccordionContent className="space-y-3 pb-3">
            {/* Opacity */}
            {onOpacityChange && (
              <div>
                <Label className="text-xs mb-1 block">Opacity: {opacity}%</Label>
                <Slider
                  value={[opacity]}
                  onValueChange={([v]) => onOpacityChange(v)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            )}
            
            {/* Corner Radius */}
            {onCornerRadiusChange && (
              <div>
                <Label className="text-xs mb-1 block">Corner: {cornerRadius}px</Label>
                <Slider
                  value={[cornerRadius]}
                  onValueChange={([v]) => onCornerRadiusChange(v)}
                  min={0}
                  max={50}
                  step={1}
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Fill Section */}
        {(onFillChange || onBackgroundColorChange) && (
          <AccordionItem value="fill">
            <AccordionTrigger className="text-xs font-medium py-2">Fill</AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="h-8 w-8 rounded border-2 border-border hover:border-primary transition-colors"
                      style={{ backgroundColor: onBackgroundColorChange ? backgroundColor : fill }}
                    >
                      <span className="sr-only">Color</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="w-64 p-3">
                    <Label className="text-xs mb-2 block">Color</Label>
                    <Input
                      type="color"
                      value={onBackgroundColorChange ? backgroundColor : fill}
                      onChange={(e) => {
                        if (onBackgroundColorChange) onBackgroundColorChange(e.target.value);
                        if (onFillChange) onFillChange(e.target.value);
                      }}
                      className="h-8 w-full mb-2"
                    />
                    <Input
                      type="text"
                      value={onBackgroundColorChange ? backgroundColor : fill}
                      onChange={(e) => {
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          if (onBackgroundColorChange) onBackgroundColorChange(e.target.value);
                          if (onFillChange) onFillChange(e.target.value);
                        }
                      }}
                      placeholder="#000000"
                      className="h-7 text-xs"
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-xs text-muted-foreground flex-1">
                  {onBackgroundColorChange ? backgroundColor : fill}
                </span>
              </div>
              
              {/* Presets */}
              <div>
                <Label className="text-xs mb-2 block">Color Presets</Label>
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
              
              {/* Element-specific style presets */}
              {elementType && elementPresets[elementType] && (
                <div className="mt-3">
                  <Label className="text-xs mb-2 block">Style Presets</Label>
                  <div className="grid grid-cols-2 gap-1">
                    {elementPresets[elementType].map((preset: any) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px]"
                        onClick={() => {
                          if (preset.backgroundColor && onBackgroundColorChange) {
                            onBackgroundColorChange(preset.backgroundColor);
                          }
                          if (preset.fill && onFillChange) {
                            onFillChange(preset.fill);
                          }
                          if (preset.stroke && onStrokeChange) {
                            onStrokeChange(preset.stroke);
                          }
                          if (preset.strokeWidth && onStrokeWidthChange) {
                            onStrokeWidthChange(preset.strokeWidth);
                          }
                          if (preset.opacity && onOpacityChange) {
                            onOpacityChange(preset.opacity);
                          }
                        }}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Stroke Section */}
        {(onStrokeChange || elementType === "drawing") && (
          <AccordionItem value="stroke">
            <AccordionTrigger className="text-xs font-medium py-2">Stroke</AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="h-8 w-8 rounded border-2 border-border hover:border-primary transition-colors"
                      style={{ backgroundColor: stroke }}
                    >
                      <span className="sr-only">Stroke</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="w-64 p-3">
                    <Label className="text-xs mb-2 block">Stroke Color</Label>
                    <Input
                      type="color"
                      value={stroke}
                      onChange={(e) => onStrokeChange?.(e.target.value)}
                      className="h-8 w-full mb-2"
                    />
                    <Input
                      type="text"
                      value={stroke}
                      onChange={(e) => {
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          onStrokeChange?.(e.target.value);
                        }
                      }}
                      placeholder="#000000"
                      className="h-7 text-xs mb-2"
                    />
                    {onStrokeWidthChange && (
                      <>
                        <Label className="text-xs mb-1 block">Weight: {strokeWidth}px</Label>
                        <Slider
                          value={[strokeWidth]}
                          onValueChange={([v]) => onStrokeWidthChange(v)}
                          min={1}
                          max={20}
                          step={1}
                        />
                      </>
                    )}
                  </PopoverContent>
                </Popover>
                <span className="text-xs text-muted-foreground flex-1">{stroke}</span>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Image Fit (for image elements) */}
        {elementType === "image" && onImageFitChange && (
          <AccordionItem value="image-fit">
            <AccordionTrigger className="text-xs font-medium py-2">Image Fit</AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
              <div className="grid grid-cols-2 gap-1">
                {(["fill", "contain", "cover", "crop"] as const).map((fit) => (
                  <Button
                    key={fit}
                    variant={imageFit === fit ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-[10px] capitalize"
                    onClick={() => onImageFitChange(fit)}
                  >
                    {fit}
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Arrange (Layer Order) */}
        {onArrange && (
          <AccordionItem value="arrange">
            <AccordionTrigger className="text-xs font-medium py-2">Arrange</AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
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
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </DraggablePanel>
  );
}
