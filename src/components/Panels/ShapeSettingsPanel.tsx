import DraggablePanel from "./DraggablePanel";
import ColorPicker from "./ColorPicker";
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
  blendMode?: string;
  imageFit?: "fill" | "contain" | "cover" | "crop";
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  fontSize?: number;
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
  onBlendModeChange?: (mode: string) => void;
  onImageFitChange?: (fit: "fill" | "contain" | "cover" | "crop") => void;
  onFontFamilyChange?: (font: string) => void;
  onFontWeightChange?: (weight: string) => void;
  onTextAlignChange?: (align: "left" | "center" | "right") => void;
  onFontSizeChange?: (size: number) => void;
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
  blendMode = "normal",
  imageFit = "cover",
  fontFamily = "Inter",
  fontWeight = "400",
  textAlign = "left",
  fontSize = 16,
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
  onBlendModeChange,
  onImageFitChange,
  onFontFamilyChange,
  onFontWeightChange,
  onTextAlignChange,
  onFontSizeChange,
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
  onClose,
}: ShapeSettingsPanelProps) {
  const ElementIcon = getElementIcon(elementType);
  const [fillModalOpen, setFillModalOpen] = useState(false);
  const [strokeModalOpen, setStrokeModalOpen] = useState(false);
  
  return (
    <DraggablePanel
      title="Style"
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

      <Accordion type="multiple" defaultValue={["position", "layout", "appearance", "fill", "stroke", "type"]} className="w-full">
        {/* Auto Layout Section - Only for Frames */}
        {elementType === "frame" && (
          <AccordionItem value="layout">
            <AccordionTrigger className="text-xs font-medium py-2">Auto layout</AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              {/* Direction buttons */}
              <div className="grid grid-cols-4 gap-1">
                <Button
                  variant={flexDirection === "row" ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-full"
                  onClick={() => {
                    onFlexDirectionChange?.("row");
                    // Enable auto layout by also setting defaults if not set
                    if (!justifyContent) onJustifyContentChange?.("start");
                    if (!alignItems) onAlignItemsChange?.("start");
                  }}
                  title="Horizontal"
                >
                  <Columns className="h-4 w-4" />
                </Button>
                <Button
                  variant={flexDirection === "column" ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-full"
                  onClick={() => {
                    onFlexDirectionChange?.("column");
                    // Enable auto layout by also setting defaults if not set
                    if (!justifyContent) onJustifyContentChange?.("start");
                    if (!alignItems) onAlignItemsChange?.("start");
                  }}
                  title="Vertical"
                >
                  <Rows className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-full"
                  title="Disable auto layout"
                  onClick={() => {
                    onFlexDirectionChange?.(undefined as any);
                    onJustifyContentChange?.(undefined as any);
                    onAlignItemsChange?.(undefined as any);
                  }}
                >
                  <AlignHorizontalSpaceAround className="h-4 w-4 opacity-50" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-full"
                  title="Coming soon"
                  disabled
                >
                  <AlignVerticalSpaceAround className="h-4 w-4" />
                </Button>
              </div>

              {/* Width and Height */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs mb-1 block">W</Label>
                  <Input
                    type="number"
                    value={Math.round(width || 0)}
                    onChange={(e) => onWidthChange?.(Number(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">H</Label>
                  <Input
                    type="number"
                    value={Math.round(height || 0)}
                    onChange={(e) => onHeightChange?.(Number(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              {/* Alignment icons */}
              <div>
                <Label className="text-xs mb-1 block">Align content</Label>
                <div className="grid grid-cols-6 gap-1">
                  <Button
                    variant={justifyContent === "start" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full"
                    onClick={() => onJustifyContentChange?.("start")}
                    title="Align Start"
                  >
                    <AlignStartHorizontal className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={justifyContent === "center" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full"
                    onClick={() => onJustifyContentChange?.("center")}
                    title="Align Center"
                  >
                    <AlignCenterHorizontal className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={justifyContent === "end" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full"
                    onClick={() => onJustifyContentChange?.("end")}
                    title="Align End"
                  >
                    <AlignEndHorizontal className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={alignItems === "start" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full"
                    onClick={() => onAlignItemsChange?.("start")}
                    title="Align Top"
                  >
                    <AlignStartVertical className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={alignItems === "center" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full"
                    onClick={() => onAlignItemsChange?.("center")}
                    title="Align Middle"
                  >
                    <AlignCenterVertical className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={alignItems === "end" ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-full"
                    onClick={() => onAlignItemsChange?.("end")}
                    title="Align Bottom"
                  >
                    <AlignEndVertical className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Gap - Slider with Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Gap</Label>
                  <Input
                    type="number"
                    value={Math.round(gap || 0)}
                    onChange={(e) => onGapChange?.(Number(e.target.value))}
                    className="h-6 w-16 text-xs text-center"
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
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Position Section - For Elements */}
        {elementType !== "frame" && (onXChange || onYChange || onRotationChange) && (
          <AccordionItem value="position">
            <AccordionTrigger className="text-xs font-medium py-2">Position</AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
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
                    <Label className="text-xs mb-1 flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" />
                      <span>Rotate</span>
                    </Label>
                    <Input
                      type="number"
                      value={Math.round(rotation)}
                      onChange={(e) => onRotationChange(Number(e.target.value))}
                      className="h-7 text-xs"
                      placeholder="0°"
                    />
                  </div>
                )}
              </div>
              
              {/* Alignment tools - 6 buttons in one row */}
              {onAlign && (
                <div>
                  <Label className="text-xs mb-1 block">Align to frame</Label>
                  <div className="grid grid-cols-6 gap-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full" 
                      onClick={() => onAlign("left")}
                      title="Align Left"
                    >
                      <AlignStartHorizontal className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full" 
                      onClick={() => onAlign("center")}
                      title="Align Center Horizontal"
                    >
                      <AlignCenterHorizontal className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full" 
                      onClick={() => onAlign("right")}
                      title="Align Right"
                    >
                      <AlignEndHorizontal className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full" 
                      onClick={() => onAlign("top")}
                      title="Align Top"
                    >
                      <AlignStartVertical className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full" 
                      onClick={() => onAlign("middle")}
                      title="Align Center Vertical"
                    >
                      <AlignCenterVertical className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-full" 
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
          <AccordionItem value="type">
            <AccordionTrigger className="text-xs font-medium py-2">Type</AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              {/* Font Family */}
              {onFontFamilyChange && (
                <div>
                  <Label className="text-xs mb-1 block">Font</Label>
                  <Select value={fontFamily} onValueChange={onFontFamilyChange}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {GOOGLE_FONTS.map((font) => (
                        <SelectItem key={font.value} value={font.value} className="text-xs">
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
                  <Label className="text-xs mb-1 block">Size: {fontSize}px</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([v]) => onFontSizeChange(v)}
                    min={8}
                    max={200}
                    step={1}
                  />
                </div>
              )}

              {/* Font Weight */}
              {onFontWeightChange && (
                <div>
                  <Label className="text-xs mb-1 block">Weight</Label>
                  <Select value={fontWeight} onValueChange={onFontWeightChange}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">Light</SelectItem>
                      <SelectItem value="400">Regular</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semi Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                      <SelectItem value="800">Extra Bold</SelectItem>
                      <SelectItem value="900">Black</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Text Alignment */}
              {onTextAlignChange && (
                <div>
                  <Label className="text-xs mb-1 block">Align</Label>
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      variant={textAlign === "left" ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-full"
                      onClick={() => onTextAlignChange("left")}
                    >
                      <AlignLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={textAlign === "center" ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-full"
                      onClick={() => onTextAlignChange("center")}
                    >
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={textAlign === "right" ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-full"
                      onClick={() => onTextAlignChange("right")}
                    >
                      <AlignRight className="h-3 w-3" />
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

            {/* Blend Mode */}
            {onBlendModeChange && (
              <div>
                <Label className="text-xs mb-1 block">Blend Mode</Label>
                <Select value={blendMode} onValueChange={onBlendModeChange}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Pass Through</SelectItem>
                    <SelectItem value="multiply">Multiply</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                    <SelectItem value="darken">Darken</SelectItem>
                    <SelectItem value="lighten">Lighten</SelectItem>
                    <SelectItem value="color-dodge">Color Dodge</SelectItem>
                    <SelectItem value="color-burn">Color Burn</SelectItem>
                    <SelectItem value="hard-light">Hard Light</SelectItem>
                    <SelectItem value="soft-light">Soft Light</SelectItem>
                    <SelectItem value="difference">Difference</SelectItem>
                    <SelectItem value="exclusion">Exclusion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Corner Radius - only for rectangles and frames */}
            {onCornerRadiusChange && (elementType === "frame" || (elementType === "shape" && (shapeType === "rectangle" || !shapeType))) && (
              <div>
                <Label className="text-xs mb-1 block">Corner: {cornerRadius}px</Label>
                <Slider
                  value={[cornerRadius]}
                  onValueChange={([v]) => onCornerRadiusChange(v)}
                  min={0}
                  max={100}
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
                <Popover open={fillModalOpen} onOpenChange={setFillModalOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="h-8 w-8 rounded border-2 border-border hover:border-primary transition-colors flex items-center justify-center shrink-0"
                      style={{ backgroundColor: onBackgroundColorChange ? backgroundColor : fill }}
                    >
                      <span className="sr-only">Fill Color</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="w-80 p-3">
                    <ColorPicker
                      color={onBackgroundColorChange ? backgroundColor : fill}
                      onChange={(color) => {
                        if (onBackgroundColorChange) onBackgroundColorChange(color);
                        if (onFillChange) onFillChange(color);
                      }}
                      opacity={opacity}
                      onOpacityChange={onOpacityChange}
                      showOpacity={!!onOpacityChange}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-xs text-muted-foreground">
                  {onBackgroundColorChange ? backgroundColor : fill}
                </span>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Stroke Section - for shapes and drawings */}
        {(onStrokeChange && (elementType === "shape" || elementType === "drawing")) && (
          <AccordionItem value="stroke">
            <AccordionTrigger className="text-xs font-medium py-2">Stroke</AccordionTrigger>
            <AccordionContent className="space-y-2 pb-3">
              <div className="flex items-start gap-2">
                <Popover open={strokeModalOpen} onOpenChange={setStrokeModalOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="h-8 w-8 rounded border-2 border-border hover:border-primary transition-colors flex items-center justify-center shrink-0"
                      style={{ backgroundColor: stroke }}
                    >
                      <span className="sr-only">Stroke Color</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="w-80 p-3">
                    <ColorPicker
                      color={stroke}
                      onChange={(color) => onStrokeChange?.(color)}
                      showOpacity={false}
                    />
                  </PopoverContent>
                </Popover>
                
                {onStrokeWidthChange && (
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">Weight: {strokeWidth}px</Label>
                    <Slider
                      value={[strokeWidth]}
                      onValueChange={([v]) => onStrokeWidthChange(v)}
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>
                )}
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
