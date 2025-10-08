import DraggablePanel from "./DraggablePanel";
import ColorPicker from "./ColorPicker";
import FillControl from "./FillControl";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  ArrowUp, ArrowDown, Square, Type, Image, Pen, Box, RotateCcw,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround, Columns, Rows
} from "lucide-react";
import { useState } from "react";

const GOOGLE_FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Nunito", label: "Nunito" },
  { value: "Raleway", label: "Raleway" },
  { value: "Oswald", label: "Oswald" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Source Sans 3", label: "Source Sans 3" },
  { value: "PT Sans", label: "PT Sans" },
  { value: "Quicksand", label: "Quicksand" },
  { value: "Crimson Text", label: "Crimson Text" },
  { value: "Ubuntu", label: "Ubuntu" },
  { value: "Bebas Neue", label: "Bebas Neue" },
  { value: "Lobster", label: "Lobster" },
  { value: "Pacifico", label: "Pacifico" },
  { value: "Dancing Script", label: "Dancing Script" },
  { value: "Caveat", label: "Caveat" },
  { value: "Righteous", label: "Righteous" },
  { value: "Archivo Black", label: "Archivo Black" },
  { value: "Anton", label: "Anton" },
  { value: "Abril Fatface", label: "Abril Fatface" },
  { value: "Satisfy", label: "Satisfy" },
  { value: "Great Vibes", label: "Great Vibes" },
  { value: "Sacramento", label: "Sacramento" },
  { value: "Tangerine", label: "Tangerine" },
  { value: "Josefin Sans", label: "Josefin Sans" },
  { value: "Libre Baskerville", label: "Libre Baskerville" },
  { value: "EB Garamond", label: "EB Garamond" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Work Sans", label: "Work Sans" },
  { value: "Bitter", label: "Bitter" },
  { value: "Barlow", label: "Barlow" },
  { value: "DM Sans", label: "DM Sans" },
  { value: "Space Grotesk", label: "Space Grotesk" },
];

interface ShapeSettingsPanelProps {
  elementType?: "frame" | "shape" | "text" | "image" | "drawing" | null;
  elementName?: string;
  shapeType?: "rectangle" | "line" | "arrow" | "ellipse" | "polygon" | "star";
  backgroundColor?: string;
  backgroundType?: "solid" | "image" | "gradient" | "pattern" | "video";
  fillType?: "solid" | "image" | "gradient" | "pattern" | "video";
  fill?: string;
  fillImage?: string;
  fillImageFit?: "fill" | "contain" | "cover" | "crop";
  gradientType?: "linear" | "radial";
  gradientAngle?: number;
  gradientStops?: Array<{color: string, position: number, opacity?: number}>;
  patternFrameId?: string;
  videoUrl?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  fillOpacity?: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  rotation?: number;
  opacity?: number;
  cornerRadius?: number;
  blendMode?: string;
  imageFit?: "fill" | "contain" | "cover" | "crop";
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  fontSize?: number;
  color?: string;
  onBackgroundColorChange?: (color: string) => void;
  onBackgroundTypeChange?: (type: "solid" | "image" | "gradient" | "pattern" | "video") => void;
  onFillTypeChange?: (type: "solid" | "image" | "gradient" | "pattern" | "video") => void;
  onFillChange?: (color: string) => void;
  onFillImageChange?: (url: string) => void;
  onFillImageFitChange?: (fit: "fill" | "contain" | "cover" | "crop") => void;
  onGradientTypeChange?: (type: "linear" | "radial") => void;
  onGradientAngleChange?: (angle: number) => void;
  onGradientStopsChange?: (stops: Array<{color: string, position: number, opacity?: number}>) => void;
  onPatternFrameIdChange?: (frameId: string) => void;
  onVideoUrlChange?: (url: string) => void;
  onStrokeChange?: (color: string) => void;
  onStrokeWidthChange?: (width: number) => void;
  onStrokeOpacityChange?: (opacity: number) => void;
  onFillOpacityChange?: (opacity: number) => void;
  onWidthChange?: (width: number) => void;
  onHeightChange?: (height: number) => void;
  onXChange?: (x: number) => void;
  onYChange?: (y: number) => void;
  onRotationChange?: (rotation: number) => void;
  onOpacityChange?: (opacity: number) => void;
  onCornerRadiusChange?: (radius: number) => void;
  onBlendModeChange?: (mode: string) => void;
  onImageFitChange?: (fit: "fill" | "contain" | "cover" | "crop") => void;
  onBrightnessChange?: (brightness: number) => void;
  onContrastChange?: (contrast: number) => void;
  onSaturationChange?: (saturation: number) => void;
  onBlurChange?: (blur: number) => void;
  onFontFamilyChange?: (font: string) => void;
  onFontWeightChange?: (weight: string) => void;
  onTextAlignChange?: (align: "left" | "center" | "right") => void;
  onFontSizeChange?: (size: number) => void;
  onColorChange?: (color: string) => void;
  onAlign?: (type: string) => void;
  onArrange?: (type: string) => void;
  onDistribute?: (type: string) => void;
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  onFlexDirectionChange?: (direction: "row" | "column") => void;
  onJustifyContentChange?: (justify: string) => void;
  onAlignItemsChange?: (align: string) => void;
  onGapChange?: (gap: number) => void;
  availableFrames?: Array<{id: string, name: string}>;
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
  shapeType,
  backgroundColor = "#ffffff",
  backgroundType = "solid",
  fillType = "solid",
  fill = "#000000",
  fillImage,
  fillImageFit = "cover",
  gradientType = "linear",
  gradientAngle = 0,
  gradientStops = [
    { color: "#000000", position: 0 },
    { color: "#ffffff", position: 100 }
  ],
  patternFrameId,
  videoUrl,
  stroke = "#000000",
  strokeWidth = 2,
  strokeOpacity = 100,
  fillOpacity = 100,
  width = 100,
  height = 100,
  x = 0,
  y = 0,
  rotation = 0,
  opacity = 100,
  cornerRadius = 0,
  blendMode = "normal",
  imageFit = "cover",
  brightness = 100,
  contrast = 100,
  saturation = 100,
  blur = 0,
  fontFamily = "Inter",
  fontWeight = "400",
  textAlign = "left",
  fontSize = 16,
  color,
  onBackgroundColorChange,
  onBackgroundTypeChange,
  onFillTypeChange,
  onFillChange,
  onFillImageChange,
  onFillImageFitChange,
  onGradientTypeChange,
  onGradientAngleChange,
  onGradientStopsChange,
  onPatternFrameIdChange,
  onVideoUrlChange,
  onStrokeChange,
  onStrokeWidthChange,
  onStrokeOpacityChange,
  onFillOpacityChange,
  onWidthChange,
  onHeightChange,
  onXChange,
  onYChange,
  onRotationChange,
  onOpacityChange,
  onCornerRadiusChange,
  onBlendModeChange,
  onImageFitChange,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange,
  onBlurChange,
  onFontFamilyChange,
  onFontWeightChange,
  onTextAlignChange,
  onFontSizeChange,
  onColorChange,
  onAlign,
  onArrange,
  onDistribute,
  flexDirection = "row",
  justifyContent = "start",
  alignItems = "start",
  gap = 0,
  onFlexDirectionChange,
  onJustifyContentChange,
  onAlignItemsChange,
  onGapChange,
  availableFrames = [],
  onClose,
}: ShapeSettingsPanelProps) {
  const ElementIcon = getElementIcon(elementType);
  const [fillModalOpen, setFillModalOpen] = useState(false);
  const [strokeModalOpen, setStrokeModalOpen] = useState(false);
  
  return (
    <DraggablePanel
      title="Style"
      defaultPosition={{ x: 50, y: 150 }}
      onClose={onClose}
      className="w-64"
    >
      {/* Header with element type */}
      <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border">
        <ElementIcon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] font-medium">{elementName}</span>
        {elementType && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
            {elementType}
          </span>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["position", "layout", "appearance", "fill", "stroke", "type", "image-fit", "image-filters"]} className="w-full space-y-0 [&>div]:space-y-0">
        {/* Auto Layout Section - Only for Frames */}
        {elementType === "frame" && (
          <AccordionItem value="layout" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Auto layout</AccordionTrigger>
            <AccordionContent className="space-y-1 pb-1.5">
              {/* Direction buttons */}
              <div className="grid grid-cols-4 gap-1">
                <Button
                  variant={flexDirection === "row" ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-full p-1 rounded"
                  onClick={() => {
                    onFlexDirectionChange?.("row");
                    // Enable auto layout by also setting defaults if not set
                    if (!justifyContent) onJustifyContentChange?.("start");
                    if (!alignItems) onAlignItemsChange?.("start");
                  }}
                  title="Horizontal"
                >
                  <Columns className="h-3 w-3" />
                </Button>
                <Button
                  variant={flexDirection === "column" ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-full p-1 rounded"
                  onClick={() => {
                    onFlexDirectionChange?.("column");
                    // Enable auto layout by also setting defaults if not set
                    if (!justifyContent) onJustifyContentChange?.("start");
                    if (!alignItems) onAlignItemsChange?.("start");
                  }}
                  title="Vertical"
                >
                  <Rows className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-full p-1 rounded"
                  title="Disable auto layout"
                  onClick={() => {
                    onFlexDirectionChange?.(undefined as any);
                    onJustifyContentChange?.(undefined as any);
                    onAlignItemsChange?.(undefined as any);
                  }}
                >
                  <AlignHorizontalSpaceAround className="h-3 w-3 opacity-50" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-full p-1 rounded"
                  title="Coming soon"
                  disabled
                >
                  <AlignVerticalSpaceAround className="h-3 w-3" />
                </Button>
              </div>

              {/* Width and Height */}
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">W</Label>
                    <Input
                      type="number"
                      value={Math.round(width || 0)}
                      onChange={(e) => onWidthChange?.(Number(e.target.value))}
                      className="h-7 text-[11px] px-1.5 rounded"
                    />
                </div>
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">H</Label>
                    <Input
                      type="number"
                      value={Math.round(height || 0)}
                      onChange={(e) => onHeightChange?.(Number(e.target.value))}
                      className="h-7 text-[11px] px-1.5 rounded"
                    />
                </div>
              </div>

              {/* Alignment icons */}
              <div>
                <Label className="text-[10px] mb-0.5 block text-muted-foreground">Align content</Label>
                <div className="grid grid-cols-6 gap-0.5">
                  <Button
                    variant={justifyContent === "start" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full p-1 rounded"
                    onClick={() => onJustifyContentChange?.("start")}
                    title="Align Start"
                  >
                    <AlignStartHorizontal className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={justifyContent === "center" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full p-1 rounded"
                    onClick={() => onJustifyContentChange?.("center")}
                    title="Align Center"
                  >
                    <AlignCenterHorizontal className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={justifyContent === "end" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full p-1 rounded"
                    onClick={() => onJustifyContentChange?.("end")}
                    title="Align End"
                  >
                    <AlignEndHorizontal className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={alignItems === "start" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full p-1 rounded"
                    onClick={() => onAlignItemsChange?.("start")}
                    title="Align Top"
                  >
                    <AlignStartVertical className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={alignItems === "center" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full p-1 rounded"
                    onClick={() => onAlignItemsChange?.("center")}
                    title="Align Middle"
                  >
                    <AlignCenterVertical className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={alignItems === "end" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full p-1 rounded"
                    onClick={() => onAlignItemsChange?.("end")}
                    title="Align Bottom"
                  >
                    <AlignEndVertical className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Gap - Slider with Input */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <Label className="text-[10px] text-muted-foreground">Gap</Label>
                    <Input
                      type="number"
                      value={Math.round(gap || 0)}
                      onChange={(e) => onGapChange?.(Number(e.target.value))}
                      className="h-7 w-14 text-[11px] text-center px-1 rounded"
                      min="0"
                      max="100"
                    />
                </div>
                <Slider
                  value={[gap || 0]}
                  onValueChange={([v]) => onGapChange?.(v)}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-1"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Position Section - For Elements */}
        {elementType !== "frame" && (onXChange || onYChange || onRotationChange) && (
          <AccordionItem value="position" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Position</AccordionTrigger>
            <AccordionContent className="space-y-1.5 pb-1.5">
              <div className="grid grid-cols-3 gap-1.5">
                {onXChange && (
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">X</Label>
                    <Input
                      type="number"
                      value={Math.round(x)}
                      onChange={(e) => onXChange(Number(e.target.value))}
                      className="h-7 text-[11px] px-1.5 rounded"
                    />
                  </div>
                )}
                {onYChange && (
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">Y</Label>
                    <Input
                      type="number"
                      value={Math.round(y)}
                      onChange={(e) => onYChange(Number(e.target.value))}
                      className="h-7 text-[11px] px-1.5 rounded"
                    />
                  </div>
                )}
                {onRotationChange && (
                  <div>
                    <Label className="text-[10px] mb-0.5 flex items-center gap-0.5 text-muted-foreground">
                      <RotateCcw className="h-2.5 w-2.5" />
                      <span>°</span>
                    </Label>
                    <Input
                      type="number"
                      value={Math.round(rotation)}
                      onChange={(e) => onRotationChange(Number(e.target.value))}
                      className="h-7 text-[11px] px-1.5 rounded"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
              
              {/* Alignment tools - 6 buttons in one row */}
              {onAlign && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Align to frame</Label>
                  <div className="grid grid-cols-6 gap-0.5">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full p-1 rounded" 
                      onClick={() => onAlign("left")}
                      title="Align Left"
                    >
                      <AlignStartHorizontal className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full p-1 rounded" 
                      onClick={() => onAlign("center")}
                      title="Align Center Horizontal"
                    >
                      <AlignCenterHorizontal className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full p-1 rounded" 
                      onClick={() => onAlign("right")}
                      title="Align Right"
                    >
                      <AlignEndHorizontal className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full p-1 rounded" 
                      onClick={() => onAlign("top")}
                      title="Align Top"
                    >
                      <AlignStartVertical className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full p-1 rounded" 
                      onClick={() => onAlign("middle")}
                      title="Align Center Vertical"
                    >
                      <AlignCenterVertical className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full p-1 rounded" 
                      onClick={() => onAlign("bottom")}
                      title="Align Bottom"
                    >
                      <AlignEndVertical className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Type Section - For Text Elements */}
        {elementType === "text" && (
          <AccordionItem value="type" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Type</AccordionTrigger>
            <AccordionContent className="space-y-1.5 pb-1.5">
              {/* Font Family */}
              {onFontFamilyChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Font</Label>
                  <Select value={fontFamily} onValueChange={onFontFamilyChange}>
                    <SelectTrigger className="h-7 text-[11px] rounded">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {GOOGLE_FONTS.map((font) => (
                        <SelectItem key={font.value} value={font.value} className="text-[11px]">
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Font Size */}
              {onFontSizeChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Size: {fontSize}px</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([v]) => onFontSizeChange(v)}
                    min={8}
                    max={200}
                    step={1}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Font Weight */}
              {onFontWeightChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Weight</Label>
                  <Select value={fontWeight} onValueChange={onFontWeightChange}>
                    <SelectTrigger className="h-7 text-[11px] rounded">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300" className="text-[11px]">Light</SelectItem>
                      <SelectItem value="400" className="text-[11px]">Regular</SelectItem>
                      <SelectItem value="500" className="text-[11px]">Medium</SelectItem>
                      <SelectItem value="600" className="text-[11px]">Semi Bold</SelectItem>
                      <SelectItem value="700" className="text-[11px]">Bold</SelectItem>
                      <SelectItem value="800" className="text-[11px]">Extra Bold</SelectItem>
                      <SelectItem value="900" className="text-[11px]">Black</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Text Alignment */}
              {onTextAlignChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Align</Label>
                  <div className="grid grid-cols-3 gap-0.5">
                    <Button
                      variant={textAlign === "left" ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-full p-1 rounded"
                      onClick={() => onTextAlignChange("left")}
                    >
                      <AlignLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={textAlign === "center" ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-full p-1 rounded"
                      onClick={() => onTextAlignChange("center")}
                    >
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={textAlign === "right" ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-full p-1 rounded"
                      onClick={() => onTextAlignChange("right")}
                    >
                      <AlignRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Text Color */}
              {onColorChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Text Color</Label>
                  <div className="flex items-center gap-1.5">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="h-6 w-6 rounded border border-border hover:border-primary transition-colors flex items-center justify-center shrink-0"
                          style={{ backgroundColor: color || fill }}
                        >
                          <span className="sr-only">Text Color</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="right" className="w-80 p-3">
                        <ColorPicker
                          color={color || fill}
                          onChange={onColorChange}
                          opacity={opacity}
                          onOpacityChange={onOpacityChange}
                          showOpacity={false}
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {color || fill}
                    </span>
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
            <AccordionContent className="space-y-1.5 pb-1.5">
              <div className="grid grid-cols-2 gap-2">
                {onWidthChange && (
                  <div>
                    <Label className="text-xs mb-1 block">W</Label>
                    <Input
                      type="number"
                      value={Math.round(width)}
                      onChange={(e) => onWidthChange(Number(e.target.value))}
                      className="h-7 text-xs rounded"
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
                      className="h-7 text-xs rounded"
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Appearance Section */}
        <AccordionItem value="appearance" className="border-b-0">
          <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Appearance</AccordionTrigger>
          <AccordionContent className="space-y-1.5 pb-1.5">
            {/* Opacity */}
            {onOpacityChange && (
              <div>
                <Label className="text-[10px] mb-0.5 block text-muted-foreground">Opacity: {opacity}%</Label>
                <Slider
                  value={[opacity]}
                  onValueChange={([v]) => onOpacityChange(v)}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-1"
                />
              </div>
            )}

            {/* Blend Mode */}
            {onBlendModeChange && (
              <div>
                <Label className="text-[10px] mb-0.5 block text-muted-foreground">Blend Mode</Label>
                <Select value={blendMode} onValueChange={onBlendModeChange}>
                  <SelectTrigger className="h-7 text-[11px] rounded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal" className="text-[11px]">Pass Through</SelectItem>
                    <SelectItem value="multiply" className="text-[11px]">Multiply</SelectItem>
                    <SelectItem value="screen" className="text-[11px]">Screen</SelectItem>
                    <SelectItem value="overlay" className="text-[11px]">Overlay</SelectItem>
                    <SelectItem value="darken" className="text-[11px]">Darken</SelectItem>
                    <SelectItem value="lighten" className="text-[11px]">Lighten</SelectItem>
                    <SelectItem value="color-dodge" className="text-[11px]">Color Dodge</SelectItem>
                    <SelectItem value="color-burn" className="text-[11px]">Color Burn</SelectItem>
                    <SelectItem value="hard-light" className="text-[11px]">Hard Light</SelectItem>
                    <SelectItem value="soft-light" className="text-[11px]">Soft Light</SelectItem>
                    <SelectItem value="difference" className="text-[11px]">Difference</SelectItem>
                    <SelectItem value="exclusion" className="text-[11px]">Exclusion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Corner Radius - only for rectangles and frames */}
            {onCornerRadiusChange && (elementType === "frame" || (elementType === "shape" && (shapeType === "rectangle" || !shapeType))) && (
              <div>
                <Label className="text-[10px] mb-0.5 block text-muted-foreground">Corner: {cornerRadius}px</Label>
                <Slider
                  value={[cornerRadius]}
                  onValueChange={([v]) => onCornerRadiusChange(v)}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-1"
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Fill Section */}
        {(onFillChange || onBackgroundColorChange) && (
          <AccordionItem value="fill" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Fill</AccordionTrigger>
            <AccordionContent className="space-y-1.5 pb-2">
              <FillControl
                fillType={elementType === "frame" ? backgroundType : fillType}
                fill={elementType === "frame" ? backgroundColor : fill}
                fillImage={fillImage}
                fillImageFit={fillImageFit}
                gradientType={gradientType}
                gradientAngle={gradientAngle}
                gradientStops={gradientStops}
                patternFrameId={patternFrameId}
                videoUrl={videoUrl}
                opacity={opacity}
                onFillTypeChange={(type) => {
                  if (elementType === "frame") {
                    onBackgroundTypeChange?.(type);
                  } else {
                    onFillTypeChange?.(type);
                  }
                }}
                onFillChange={(color) => {
                  if (onBackgroundColorChange && elementType === "frame") {
                    onBackgroundColorChange(color);
                  }
                  if (onFillChange) {
                    onFillChange(color);
                  }
                }}
                onFillImageChange={onFillImageChange}
                onFillImageFitChange={onFillImageFitChange}
                onGradientTypeChange={onGradientTypeChange}
                onGradientAngleChange={onGradientAngleChange}
                onGradientStopsChange={onGradientStopsChange}
                onPatternFrameIdChange={onPatternFrameIdChange}
                onVideoUrlChange={onVideoUrlChange}
                onOpacityChange={onFillOpacityChange}
                availableFrames={availableFrames}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Stroke Section - for shapes and drawings */}
        {(onStrokeChange && (elementType === "shape" || elementType === "drawing")) && (
          <AccordionItem value="stroke" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Stroke</AccordionTrigger>
            <AccordionContent className="space-y-1.5 pb-2">
              <div className="space-y-2">
                <Popover open={strokeModalOpen} onOpenChange={setStrokeModalOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="h-6 w-6 rounded border border-border hover:border-primary transition-colors flex items-center justify-center shrink-0"
                      style={{ backgroundColor: stroke }}
                    >
                      <span className="sr-only">Stroke Color</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="w-80 p-3">
                    <ColorPicker
                      color={stroke}
                      onChange={(color) => onStrokeChange?.(color)}
                      opacity={strokeOpacity}
                      onOpacityChange={onStrokeOpacityChange}
                      showOpacity={true}
                    />
                  </PopoverContent>
                </Popover>
                
                {onStrokeWidthChange && (
                  <div className="flex-1">
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">Weight: {strokeWidth}px</Label>
                    <Slider
                      value={[strokeWidth]}
                      onValueChange={([v]) => onStrokeWidthChange(v)}
                      min={0}
                      max={20}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Image Fit (for image elements) */}
        {elementType === "image" && onImageFitChange && (
          <AccordionItem value="image-fit" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Image Fit</AccordionTrigger>
            <AccordionContent className="space-y-1.5 pb-2">
              <div className="grid grid-cols-2 gap-0.5">
                {(["fill", "contain", "cover", "crop"] as const).map((fit) => (
                  <Button
                    key={fit}
                    variant={imageFit === fit ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-[10px] capitalize px-1 rounded"
                    onClick={() => onImageFitChange(fit)}
                  >
                    {fit}
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Image Filters (for image elements) */}
        {elementType === "image" && (onBrightnessChange || onContrastChange || onSaturationChange || onBlurChange) && (
          <AccordionItem value="image-filters" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Filters</AccordionTrigger>
            <AccordionContent className="space-y-1.5 pb-1.5">
              {onBrightnessChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Brightness: {brightness}%</Label>
                  <Slider
                    value={[brightness]}
                    onValueChange={([v]) => onBrightnessChange(v)}
                    min={0}
                    max={200}
                    step={1}
                    className="mt-1"
                  />
                </div>
              )}
              {onContrastChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Contrast: {contrast}%</Label>
                  <Slider
                    value={[contrast]}
                    onValueChange={([v]) => onContrastChange(v)}
                    min={0}
                    max={200}
                    step={1}
                    className="mt-1"
                  />
                </div>
              )}
              {onSaturationChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Saturation: {saturation}%</Label>
                  <Slider
                    value={[saturation]}
                    onValueChange={([v]) => onSaturationChange(v)}
                    min={0}
                    max={200}
                    step={1}
                    className="mt-1"
                  />
                </div>
              )}
              {onBlurChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Blur: {blur}px</Label>
                  <Slider
                    value={[blur]}
                    onValueChange={([v]) => onBlurChange(v)}
                    min={0}
                    max={20}
                    step={1}
                    className="mt-1"
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Arrange (Layer Order) */}
        {onArrange && (
          <AccordionItem value="arrange" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Arrange</AccordionTrigger>
            <AccordionContent className="space-y-1.5 pb-2">
              <div className="grid grid-cols-2 gap-0.5">
                <Button variant="outline" size="sm" className="h-7 text-[10px] px-1 rounded" onClick={() => onArrange("forward")}>
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Forward
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] px-1 rounded" onClick={() => onArrange("backward")}>
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
