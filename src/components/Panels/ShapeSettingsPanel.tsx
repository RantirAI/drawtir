import DraggablePanel from "./DraggablePanel";
import ColorPicker from "./ColorPicker";
import FillControl from "./FillControl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InputWithUnit } from "@/components/ui/input-with-unit";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useBrandKit } from "@/hooks/useBrandKit";
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
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround, Columns, Rows, Smile, Sparkles, Heading1, Palette, Check
} from "lucide-react";
import IconLibraryModal from "../Canvas/IconLibraryModal";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Utility functions for ShapeSettingsPanel

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
  elementType?: "frame" | "shape" | "text" | "richtext" | "image" | "drawing" | "icon" | "shader" | "qrcode" | null;
  elementName?: string;
  shapeType?: "rectangle" | "line" | "arrow" | "ellipse" | "polygon" | "star" | "custom";
  iconName?: string;
  iconFamily?: string;
  backgroundColor?: string;
  backgroundType?: "solid" | "image" | "gradient" | "pattern" | "video";
  fillType?: "solid" | "image" | "gradient" | "pattern" | "video";
  // QR code properties
  qrValue?: string;
  qrFgColor?: string;
  qrBgColor?: string;
  qrLevel?: "L" | "M" | "Q" | "H";
  onQrValueChange?: (value: string) => void;
  onQrFgColorChange?: (color: string) => void;
  onQrBgColorChange?: (color: string) => void;
  onQrLevelChange?: (level: "L" | "M" | "Q" | "H") => void;
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
  strokeWidthUnit?: "px" | "rem" | "%" | "em";
  strokeOpacity?: number;
  strokePosition?: "center" | "inside" | "outside";
  fillOpacity?: number;
  // Line-specific properties
  lineStyle?: "solid" | "dashed" | "dotted" | "dashdot";
  lineCap?: "butt" | "round" | "square";
  lineJoin?: "miter" | "round" | "bevel";
  dashArray?: string;
  controlPoints?: Array<{x: number, y: number}>;
  lineArrowStart?: "none" | "round" | "square" | "line" | "triangle" | "reversed-triangle" | "circle" | "diamond";
  lineArrowEnd?: "none" | "round" | "square" | "line" | "triangle" | "reversed-triangle" | "circle" | "diamond";
  width?: number;
  height?: number;
  sizeUnit?: "px" | "rem" | "%" | "em";
  x?: number;
  y?: number;
  rotation?: number;
  opacity?: number;
  cornerRadius?: number;
  cornerRadiusUnit?: "px" | "rem" | "%" | "em";
  blendMode?: string;
  imageFit?: "fill" | "contain" | "cover" | "crop";
  imageUrl?: string;
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
  onStrokePositionChange?: (position: "center" | "inside" | "outside") => void;
  onFillOpacityChange?: (opacity: number) => void;
  // Line-specific handlers
  onLineStyleChange?: (style: "solid" | "dashed" | "dotted" | "dashdot") => void;
  onLineCapChange?: (cap: "butt" | "round" | "square") => void;
  onLineJoinChange?: (join: "miter" | "round" | "bevel") => void;
  onDashArrayChange?: (dashArray: string) => void;
  onControlPointsChange?: (points: Array<{x: number, y: number}>) => void;
  onLineArrowStartChange?: (arrow: "none" | "round" | "square" | "line" | "triangle" | "reversed-triangle" | "circle" | "diamond") => void;
  onLineArrowEndChange?: (arrow: "none" | "round" | "square" | "line" | "triangle" | "reversed-triangle" | "circle" | "diamond") => void;
  onWidthChange?: (width: number) => void;
  onHeightChange?: (height: number) => void;
  onXChange?: (x: number) => void;
  onYChange?: (y: number) => void;
  onRotationChange?: (rotation: number) => void;
  onOpacityChange?: (opacity: number) => void;
  onCornerRadiusChange?: (radius: number) => void;
  onBlendModeChange?: (mode: string) => void;
  onImageFitChange?: (fit: "fill" | "contain" | "cover" | "crop") => void;
  onImageUrlChange?: (url: string) => void;
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
  onIconChange?: (iconName: string, iconFamily: string) => void;
  onClose?: () => void;
  onOpenBrandKit?: () => void;
}

const getElementIcon = (type?: "frame" | "shape" | "text" | "richtext" | "image" | "drawing" | "icon" | "shader" | "qrcode" | null) => {
  switch (type) {
    case "frame": return Box;
    case "shape": return Square;
    case "text": return Type;
    case "richtext": return Heading1;
    case "image": return Image;
    case "drawing": return Pen;
    case "icon": return Smile;
    case "shader": return Sparkles;
    case "qrcode": return Square; // Using Square for QR code icon
    default: return Square;
  }
};

export default function ShapeSettingsPanel({
  elementType,
  elementName = "Nothing selected",
  shapeType,
  iconName,
  iconFamily,
  backgroundColor = "#ffffff",
  backgroundType = "solid",
  fillType = "solid",
  fill = "#000000",
  // QR code props
  qrValue = "https://example.com",
  qrFgColor = "#000000",
  qrBgColor = "#ffffff",
  qrLevel = "M",
  onQrValueChange,
  onQrFgColorChange,
  onQrBgColorChange,
  onQrLevelChange,
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
  strokeWidthUnit = "px",
  strokeOpacity = 100,
  strokePosition = "center",
  fillOpacity = 100,
  // Line-specific defaults
  lineStyle = "solid",
  lineCap = "round",
  lineJoin = "round",
  dashArray = "",
  controlPoints,
  lineArrowStart = "none",
  lineArrowEnd = "none",
  width = 100,
  height = 100,
  sizeUnit = "px",
  x = 0,
  y = 0,
  rotation = 0,
  opacity = 100,
  cornerRadius = 0,
  cornerRadiusUnit = "px",
  blendMode = "normal",
  imageFit = "cover",
  imageUrl,
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
  onStrokePositionChange,
  onFillOpacityChange,
  // Line-specific handlers
  onLineStyleChange,
  onLineCapChange,
  onLineJoinChange,
  onDashArrayChange,
  onControlPointsChange,
  onLineArrowStartChange,
  onLineArrowEndChange,
  onWidthChange,
  onHeightChange,
  onXChange,
  onYChange,
  onRotationChange,
  onOpacityChange,
  onCornerRadiusChange,
  onBlendModeChange,
  onImageFitChange,
  onImageUrlChange,
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
  onIconChange,
  onClose,
  onOpenBrandKit,
}: ShapeSettingsPanelProps) {
  const ElementIcon = getElementIcon(elementType);
  const [fillModalOpen, setFillModalOpen] = useState(false);
  const [strokeModalOpen, setStrokeModalOpen] = useState(false);
  const [iconLibraryOpen, setIconLibraryOpen] = useState(false);
  const { brandKits, activeBrandKit } = useBrandKit();
  const [expandedBrandKit, setExpandedBrandKit] = useState<string | null>(null);
  
  return (
    <DraggablePanel
      title="Style"
      defaultPosition={{ x: 120, y: 150 }}
      onClose={onClose}
      className="w-64"
    >
      <div onKeyDown={(e) => {
        // Prevent Delete and Backspace from bubbling up to canvas when typing in inputs
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.stopPropagation();
        }
      }}>
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

      <Accordion type="multiple" defaultValue={["position", "layout", "appearance", "fill", "stroke", "type", "image-fit", "image-filters", "icon", "qrcode", "brand-kit"]} className="w-full space-y-0 [&>div]:space-y-0">
        {/* Brand Kit Quick Access */}
        <AccordionItem value="brand-kit" className="border-b-0">
          <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">
            <div className="flex items-center gap-1.5">
              <Palette className="h-3 w-3" />
              <span>Brand Kit</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 pb-2">
            {brandKits.length === 0 ? (
              <div className="text-center py-3 space-y-2">
                <Palette className="h-6 w-6 mx-auto text-muted-foreground opacity-50" />
                <p className="text-[10px] text-muted-foreground">
                  No brand kits available
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-[10px]"
                  onClick={onOpenBrandKit}
                >
                  Create Brand Kit
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* List all brand kits */}
                {brandKits.map((brandKit) => (
                  <div key={brandKit.id} className="rounded-lg overflow-hidden">
                    {/* Brand Kit Header - Clickable to expand */}
                    <button
                      className="w-full flex items-center justify-between px-2 py-1.5 bg-card hover:bg-accent transition-colors"
                      onClick={() => setExpandedBrandKit(expandedBrandKit === brandKit.id ? null : brandKit.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <p className="text-[10px] font-medium">{brandKit.name}</p>
                        <span className="text-[9px] text-muted-foreground">{brandKit.colors.length}c • {brandKit.fonts.length}f</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-5 px-1.5 text-[9px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBrandKit?.();
                        }}
                      >
                        Edit
                      </Button>
                    </button>
                    
                    {/* Expandable content */}
                    {expandedBrandKit === brandKit.id && (
                      <div className="p-1.5 space-y-2 border-t bg-background/50">
                        {/* Colors */}
                        {(onFillChange || onColorChange) && brandKit.colors.length > 0 && (
                          <div>
                            <Label className="text-[9px] mb-1 block text-muted-foreground">
                              Colors
                            </Label>
                            <div className="space-y-1">
                              {brandKit.colors.map((color, index) => (
                                <div key={index} className="flex items-center gap-1.5">
                                  <div
                                    className="w-6 h-6 rounded border border-border flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                  />
                                  <code className="text-[9px] font-mono text-muted-foreground flex-1 truncate">
                                    {color}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 px-1.5 text-[9px]"
                                    onClick={() => {
                                      if (elementType === "text" || elementType === "richtext") {
                                        onColorChange?.(color);
                                      } else {
                                        onFillChange?.(color);
                                      }
                                    }}
                                  >
                                    Apply
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Fonts */}
                        {onFontFamilyChange && brandKit.fonts.length > 0 && (
                          <div>
                            <Label className="text-[9px] mb-1 block text-muted-foreground">
                              Fonts
                            </Label>
                            <div className="space-y-1">
                              {brandKit.fonts.map((font, index) => (
                                <div key={index} className="flex items-center gap-1.5">
                                  <span
                                    className="text-[10px] flex-1 truncate"
                                    style={{ fontFamily: font }}
                                  >
                                    {font}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 px-1.5 text-[9px] flex-shrink-0"
                                    onClick={() => onFontFamilyChange(font)}
                                  >
                                    Apply
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
        
        {/* QR Code Section - Only for QR codes */}
        {elementType === "qrcode" && (
          <AccordionItem value="qrcode" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">QR Code</AccordionTrigger>
            <AccordionContent className="space-y-1.5 pb-1.5">
              {/* QR Value */}
              {onQrValueChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Content (URL or Text)</Label>
                  <Input
                    type="text"
                    value={qrValue}
                    onChange={(e) => onQrValueChange(e.target.value)}
                    className="h-7 text-[11px] px-1.5 rounded"
                    placeholder="https://example.com"
                  />
                </div>
              )}

              {/* QR Colors */}
              <div className="grid grid-cols-2 gap-2">
                {onQrFgColorChange && (
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">Foreground</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="h-7 w-full rounded border border-border hover:border-primary transition-colors flex items-center justify-center"
                          style={{ backgroundColor: qrFgColor }}
                        >
                          <span className="sr-only">QR Foreground Color</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="right" className="w-80 p-3">
                        <ColorPicker
                          color={qrFgColor}
                          onChange={onQrFgColorChange}
                          showOpacity={false}
                          brandColors={activeBrandKit?.colors || []}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {onQrBgColorChange && (
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">Background</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="h-7 w-full rounded border border-border hover:border-primary transition-colors flex items-center justify-center"
                          style={{ backgroundColor: qrBgColor }}
                        >
                          <span className="sr-only">QR Background Color</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="right" className="w-80 p-3">
                        <ColorPicker
                          color={qrBgColor}
                          onChange={onQrBgColorChange}
                          showOpacity={false}
                          brandColors={activeBrandKit?.colors || []}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Error Correction Level */}
              {onQrLevelChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Error Correction</Label>
                  <Select value={qrLevel} onValueChange={onQrLevelChange}>
                    <SelectTrigger className="h-7 text-[11px] rounded">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L" className="text-[11px]">Low (7%)</SelectItem>
                      <SelectItem value="M" className="text-[11px]">Medium (15%)</SelectItem>
                      <SelectItem value="Q" className="text-[11px]">Quartile (25%)</SelectItem>
                      <SelectItem value="H" className="text-[11px]">High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Auto Layout Section - Only for Frames */}
        {elementType === "frame" && (
          <AccordionItem value="layout" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Auto layout</AccordionTrigger>
            <AccordionContent className="space-y-1 pb-1.5">
              {/* Direction buttons */}
              <div className="grid grid-cols-4 gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-7 w-full p-1 rounded",
                    flexDirection === "row" && "border-primary text-primary"
                  )}
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
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-7 w-full p-1 rounded",
                    flexDirection === "column" && "border-primary text-primary"
                  )}
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


              {/* Alignment icons */}
              <div>
                <Label className="text-[10px] mb-0.5 block text-muted-foreground">Align content</Label>
                <div className="grid grid-cols-6 gap-0.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-7 w-full p-1 rounded",
                      justifyContent === "start" && "border-primary text-primary"
                    )}
                    onClick={() => onJustifyContentChange?.("start")}
                    title="Align Start"
                  >
                    <AlignStartHorizontal className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-7 w-full p-1 rounded",
                      justifyContent === "center" && "border-primary text-primary"
                    )}
                    onClick={() => onJustifyContentChange?.("center")}
                    title="Align Center"
                  >
                    <AlignCenterHorizontal className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-7 w-full p-1 rounded",
                      justifyContent === "end" && "border-primary text-primary"
                    )}
                    onClick={() => onJustifyContentChange?.("end")}
                    title="Align End"
                  >
                    <AlignEndHorizontal className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-7 w-full p-1 rounded",
                      alignItems === "start" && "border-primary text-primary"
                    )}
                    onClick={() => onAlignItemsChange?.("start")}
                    title="Align Top"
                  >
                    <AlignStartVertical className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-7 w-full p-1 rounded",
                      alignItems === "center" && "border-primary text-primary"
                    )}
                    onClick={() => onAlignItemsChange?.("center")}
                    title="Align Middle"
                  >
                    <AlignCenterVertical className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-7 w-full p-1 rounded",
                      alignItems === "end" && "border-primary text-primary"
                    )}
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

        {/* Type Section - For Text and Rich Text Elements */}
        {(elementType === "text" || elementType === "richtext") && (
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
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-7 w-full p-1 rounded",
                        textAlign === "left" && "border-primary text-primary"
                      )}
                      onClick={() => onTextAlignChange("left")}
                    >
                      <AlignLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-7 w-full p-1 rounded",
                        textAlign === "center" && "border-primary text-primary"
                      )}
                      onClick={() => onTextAlignChange("center")}
                    >
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-7 w-full p-1 rounded",
                        textAlign === "right" && "border-primary text-primary"
                      )}
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
                          brandColors={activeBrandKit?.colors || []}
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
          <AccordionItem value="layout" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Layout</AccordionTrigger>
            <AccordionContent className="space-y-1.5 pb-1.5">
              <div className="grid grid-cols-2 gap-2">
                {onWidthChange && (
                  <div>
                    <Label className="text-xs mb-1 block">W</Label>
                    <InputWithUnit
                      value={Math.round(width)}
                      onChange={onWidthChange}
                      unit={sizeUnit || "px"}
                      showUnitSelector={true}
                    />
                  </div>
                )}
                {onHeightChange && (
                  <div>
                    <Label className="text-xs mb-1 block">H</Label>
                    <InputWithUnit
                      value={Math.round(height)}
                      onChange={onHeightChange}
                      unit={sizeUnit || "px"}
                      showUnitSelector={true}
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
                <div className="flex items-center justify-between mb-0.5">
                  <Label className="text-[10px] text-muted-foreground">Corner</Label>
                  <InputWithUnit
                    value={cornerRadius}
                    onChange={onCornerRadiusChange}
                    unit={cornerRadiusUnit || "px"}
                    showUnitSelector={true}
                    className="w-24"
                  />
                </div>
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

        {/* Icon Selector Section - for icon elements */}
        {elementType === "icon" && onIconChange && (
          <AccordionItem value="icon" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Icon</AccordionTrigger>
            <AccordionContent className="space-y-1.5 pb-2">
              <div className="space-y-2">
                <Label className="text-[10px] mb-0.5 block text-muted-foreground">
                  Selected: {iconName || "None"} ({iconFamily || "N/A"})
                </Label>
                <Button 
                  onClick={() => setIconLibraryOpen(true)}
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-[11px] rounded"
                >
                  <Smile className="h-3 w-3 mr-2" />
                  Change Icon
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

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
                  <div className="flex items-center gap-2">
                    <PopoverTrigger asChild>
                      <button
                        className="h-6 w-6 rounded border border-border hover:border-primary transition-colors flex items-center justify-center shrink-0"
                        style={{ backgroundColor: stroke }}
                      >
                        <span className="sr-only">Stroke Color</span>
                      </button>
                    </PopoverTrigger>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {stroke}
                    </span>
                  </div>
                  <PopoverContent side="right" className="w-80 p-3">
                    <ColorPicker
                      color={stroke}
                      onChange={(color) => onStrokeChange?.(color)}
                      opacity={strokeOpacity}
                      onOpacityChange={onStrokeOpacityChange}
                      showOpacity={true}
                      brandColors={activeBrandKit?.colors || []}
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Stroke Position */}
                {onStrokePositionChange && (
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">Position</Label>
                    <div className="grid grid-cols-3 gap-0.5">
                      {(["center", "inside", "outside"] as const).map((pos) => (
                        <Button
                          key={pos}
                          variant={strokePosition === pos ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-[10px] capitalize rounded"
                          onClick={() => onStrokePositionChange(pos)}
                        >
                          {pos}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                 {onStrokeWidthChange && (
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <Label className="text-[10px] text-muted-foreground">Weight</Label>
                      <InputWithUnit
                        value={strokeWidth}
                        onChange={onStrokeWidthChange}
                        unit={strokeWidthUnit || "px"}
                        showUnitSelector={true}
                        className="w-24"
                      />
                    </div>
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

                {/* Line-specific settings */}
                {shapeType === "line" && onLineStyleChange && (
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <Label className="text-[10px] text-muted-foreground">Line Style</Label>
                      <div className="flex gap-0.5">
                        <Button
                          variant={lineStyle === "solid" ? "default" : "outline"}
                          size="sm"
                          className="h-6 w-6 p-0 rounded flex items-center justify-center"
                          onClick={() => onLineStyleChange("solid")}
                          title="Solid"
                        >
                          <svg width="16" height="2" viewBox="0 0 16 2">
                            <line x1="0" y1="1" x2="16" y2="1" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </Button>
                        <Button
                          variant={lineStyle === "dashed" ? "default" : "outline"}
                          size="sm"
                          className="h-6 w-6 p-0 rounded flex items-center justify-center"
                          onClick={() => onLineStyleChange("dashed")}
                          title="Dashed"
                        >
                          <svg width="16" height="2" viewBox="0 0 16 2">
                            <line x1="0" y1="1" x2="16" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
                          </svg>
                        </Button>
                        <Button
                          variant={lineStyle === "dotted" ? "default" : "outline"}
                          size="sm"
                          className="h-6 w-6 p-0 rounded flex items-center justify-center"
                          onClick={() => onLineStyleChange("dotted")}
                          title="Dotted"
                        >
                          <svg width="16" height="2" viewBox="0 0 16 2">
                            <line x1="0" y1="1" x2="16" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="1 2" strokeLinecap="round" />
                          </svg>
                        </Button>
                        <Button
                          variant={lineStyle === "dashdot" ? "default" : "outline"}
                          size="sm"
                          className="h-6 w-6 p-0 rounded flex items-center justify-center"
                          onClick={() => onLineStyleChange("dashdot")}
                          title="Dash-Dot"
                        >
                          <svg width="16" height="2" viewBox="0 0 16 2">
                            <line x1="0" y1="1" x2="16" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2 1 2" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {shapeType === "line" && (
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">Line Caps</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Select
                        value={lineArrowStart}
                        onValueChange={(value) => onLineArrowStartChange?.(value as any)}
                      >
                        <SelectTrigger className="h-7 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="round">Round</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="line">→ Line</SelectItem>
                          <SelectItem value="triangle">→ Triangle</SelectItem>
                          <SelectItem value="reversed-triangle">▷ Reversed</SelectItem>
                          <SelectItem value="circle">○ Circle</SelectItem>
                          <SelectItem value="diamond">◇ Diamond</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={lineArrowEnd}
                        onValueChange={(value) => onLineArrowEndChange?.(value as any)}
                      >
                        <SelectTrigger className="h-7 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="round">Round</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="line">→ Line</SelectItem>
                          <SelectItem value="triangle">→ Triangle</SelectItem>
                          <SelectItem value="reversed-triangle">▷ Reversed</SelectItem>
                          <SelectItem value="circle">○ Circle</SelectItem>
                          <SelectItem value="diamond">◇ Diamond</SelectItem>
                        </SelectContent>
                       </Select>
                    </div>
                  </div>
                )}

                {shapeType === "line" && onLineJoinChange && (
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">Line Join</Label>
                    <div className="grid grid-cols-3 gap-0.5">
                      {(["miter", "round", "bevel"] as const).map((join) => (
                        <Button
                          key={join}
                          variant={lineJoin === join ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-[10px] capitalize rounded"
                          onClick={() => onLineJoinChange(join)}
                        >
                          {join}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {shapeType === "line" && onDashArrayChange && lineStyle !== "solid" && (
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">
                      Custom Pattern (e.g., "10,5,2,5")
                    </Label>
                    <Input
                      value={dashArray || ""}
                      onChange={(e) => onDashArrayChange(e.target.value)}
                      placeholder="10,5,2,5"
                      className="h-7 text-xs"
                    />
                  </div>
                )}

                {shapeType === "line" && onControlPointsChange && controlPoints && (
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">Control Points</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] flex-1"
                        onClick={() => {
                          const mid = controlPoints.length > 0 ? controlPoints.length / 2 : 0;
                          const newPoints = [...controlPoints];
                          newPoints.splice(Math.floor(mid), 0, { 
                            x: width / 2, 
                            y: height / 2 
                          });
                          onControlPointsChange(newPoints);
                        }}
                        disabled={controlPoints.length >= 6}
                      >
                        Add Point
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] flex-1"
                        onClick={() => {
                          if (controlPoints.length > 2) {
                            const newPoints = [...controlPoints];
                            newPoints.splice(Math.floor(controlPoints.length / 2), 1);
                            onControlPointsChange(newPoints);
                          }
                        }}
                        disabled={controlPoints.length <= 2}
                      >
                        Remove Point
                      </Button>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      Drag points on canvas to bend the line
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Image Fit (for image elements) */}
        {elementType === "image" && onImageFitChange && (
          <AccordionItem value="image-fit" className="border-b-0">
            <AccordionTrigger className="text-[11px] font-medium py-1.5 h-7">Image</AccordionTrigger>
            <AccordionContent className="space-y-1.5 pb-2">
              {/* Image URL Input */}
              {onImageUrlChange && (
                <div>
                  <Label className="text-[10px] mb-0.5 block text-muted-foreground">Image URL</Label>
                  <Input
                    value={imageUrl || ""}
                    onChange={(e) => onImageUrlChange(e.target.value)}
                    placeholder="https://... or paste base64"
                    className="h-7 text-xs"
                  />
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    Paste URL or base64 data URL
                  </p>
                </div>
              )}
              
              {/* Image Fit Buttons */}
              <div>
                <Label className="text-[10px] mb-0.5 block text-muted-foreground">Fit</Label>
                <div className="grid grid-cols-4 gap-0.5">
                  {(["fill", "contain", "cover", "crop"] as const).map((fit) => (
                    <Button
                      key={fit}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-6 text-[9px] capitalize px-0.5 rounded",
                        imageFit === fit && "border-primary text-primary"
                      )}
                      onClick={() => onImageFitChange(fit)}
                    >
                      {fit}
                    </Button>
                  ))}
                </div>
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
      </div>

      {/* Icon Library Modal */}
      {onIconChange && (
        <IconLibraryModal
          open={iconLibraryOpen}
          onOpenChange={setIconLibraryOpen}
          onSelectIcon={(iconName, library) => {
            onIconChange(iconName, library);
          }}
        />
      )}
    </DraggablePanel>
  );
}
