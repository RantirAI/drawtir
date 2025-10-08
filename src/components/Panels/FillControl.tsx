import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ColorPicker from "./ColorPicker";
import { 
  Palette, 
  Image as ImageIcon, 
  GripHorizontal, 
  Grid3x3, 
  Video,
  Plus,
  Trash2,
  RotateCw
} from "lucide-react";
import { generateGradientCSS, getFitStyle } from "@/lib/utils";

type FillType = "solid" | "image" | "gradient" | "pattern" | "video";

interface GradientStop {
  color: string;
  position: number;
}

interface FillControlProps {
  fillType?: FillType;
  fill?: string;
  fillImage?: string;
  fillImageFit?: "fill" | "contain" | "cover" | "crop";
  gradientType?: "linear" | "radial";
  gradientAngle?: number;
  gradientStops?: GradientStop[];
  patternFrameId?: string;
  videoUrl?: string;
  opacity?: number;
  onFillTypeChange?: (type: FillType) => void;
  onFillChange?: (color: string) => void;
  onFillImageChange?: (url: string) => void;
  onFillImageFitChange?: (fit: "fill" | "contain" | "cover" | "crop") => void;
  onGradientTypeChange?: (type: "linear" | "radial") => void;
  onGradientAngleChange?: (angle: number) => void;
  onGradientStopsChange?: (stops: GradientStop[]) => void;
  onPatternFrameIdChange?: (frameId: string) => void;
  onVideoUrlChange?: (url: string) => void;
  onOpacityChange?: (opacity: number) => void;
  availableFrames?: Array<{id: string, name: string}>;
}

export default function FillControl({
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
  opacity = 100,
  onFillTypeChange,
  onFillChange,
  onFillImageChange,
  onFillImageFitChange,
  onGradientTypeChange,
  onGradientAngleChange,
  onGradientStopsChange,
  onPatternFrameIdChange,
  onVideoUrlChange,
  onOpacityChange,
  availableFrames = [],
}: FillControlProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedStopIndex, setSelectedStopIndex] = useState(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        onFillImageChange?.(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGradientStop = () => {
    const newStops = [...gradientStops, { color: "#808080", position: 50 }];
    onGradientStopsChange?.(newStops.sort((a, b) => a.position - b.position));
  };

  const handleRemoveGradientStop = (index: number) => {
    if (gradientStops.length > 2) {
      const newStops = gradientStops.filter((_, i) => i !== index);
      onGradientStopsChange?.(newStops);
      setSelectedStopIndex(0);
    }
  };

  const handleUpdateGradientStop = (index: number, updates: Partial<GradientStop>) => {
    const newStops = [...gradientStops];
    newStops[index] = { ...newStops[index], ...updates };
    onGradientStopsChange?.(newStops.sort((a, b) => a.position - b.position));
  };

  // Generate preview style
  const getPreviewStyle = (): React.CSSProperties => {
    if (fillType === "solid") {
      return { backgroundColor: fill };
    } else if (fillType === "image" && fillImage) {
      const fitStyles = getFitStyle(fillImageFit);
      return {
        backgroundImage: `url(${fillImage})`,
        backgroundSize: fitStyles.backgroundSize,
        backgroundPosition: fitStyles.backgroundPosition,
        backgroundRepeat: fitStyles.backgroundRepeat,
      };
    } else if (fillType === "gradient") {
      return { background: generateGradientCSS(gradientType, gradientAngle, gradientStops) };
    } else if (fillType === "pattern") {
      return { backgroundColor: fill, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,.1) 10px, rgba(0,0,0,.1) 20px)' };
    } else if (fillType === "video") {
      return { backgroundColor: "#000", backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' };
    }
    return { backgroundColor: fill };
  };

  return (
    <div className="space-y-2">
      {/* Preview and Label */}
      <div className="flex items-center gap-2 mb-1">
        <div 
          className="h-8 w-8 rounded border-2 border-border shrink-0 shadow-sm"
          style={getPreviewStyle()}
        />
        <Label className="text-[10px] text-muted-foreground font-medium">Fill Style</Label>
      </div>

      {/* Fill Type Tabs */}
      <Tabs value={fillType} onValueChange={(v) => onFillTypeChange?.(v as FillType)}>
        <TabsList className="grid grid-cols-5 w-full h-8 bg-muted/50">
          <TabsTrigger value="solid" className="h-6 px-1">
            <Palette className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="image" className="h-6 px-1">
            <ImageIcon className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="gradient" className="h-6 px-1">
            <GripHorizontal className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="pattern" className="h-6 px-1">
            <Grid3x3 className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="video" className="h-6 px-1">
            <Video className="h-3 w-3" />
          </TabsTrigger>
        </TabsList>

        {/* Solid Color */}
        <TabsContent value="solid" className="space-y-2 mt-2">
          <div className="flex items-center gap-1.5">
            <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  className="h-6 w-6 rounded border border-border hover:border-primary transition-colors flex items-center justify-center shrink-0"
                  style={{ backgroundColor: fill }}
                >
                  <span className="sr-only">Fill Color</span>
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" className="w-80 p-3">
                <ColorPicker
                  color={fill}
                  onChange={onFillChange || (() => {})}
                  opacity={opacity}
                  onOpacityChange={onOpacityChange}
                  showOpacity={!!onOpacityChange}
                />
              </PopoverContent>
            </Popover>
            <span className="text-[10px] text-muted-foreground font-mono">
              {fill}
            </span>
          </div>
        </TabsContent>

        {/* Image Fill */}
        <TabsContent value="image" className="space-y-2 mt-2">
          {fillImage ? (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-0.5">
                {(["fill", "contain", "cover", "crop"] as const).map((fit) => (
                  <Button
                    key={fit}
                    variant={fillImageFit === fit ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[9px] capitalize px-0.5 rounded"
                    onClick={() => onFillImageFitChange?.(fit)}
                  >
                    {fit}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-[10px] rounded"
                onClick={() => document.getElementById('fill-image-upload')?.click()}
              >
                Change Image
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[10px] rounded"
              onClick={() => document.getElementById('fill-image-upload')?.click()}
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              Upload Image
            </Button>
          )}
          <input
            id="fill-image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </TabsContent>

        {/* Gradient Fill */}
        <TabsContent value="gradient" className="space-y-2 mt-2">
          {/* Gradient Type */}
          <div>
            <Label className="text-[10px] mb-0.5 block text-muted-foreground">Type</Label>
            <div className="grid grid-cols-2 gap-0.5">
              <Button
                variant={gradientType === "linear" ? "default" : "outline"}
                size="sm"
                className="h-7 text-[10px] rounded"
                onClick={() => onGradientTypeChange?.("linear")}
              >
                Linear
              </Button>
              <Button
                variant={gradientType === "radial" ? "default" : "outline"}
                size="sm"
                className="h-7 text-[10px] rounded"
                onClick={() => onGradientTypeChange?.("radial")}
              >
                Radial
              </Button>
            </div>
          </div>

          {/* Gradient Angle (for linear) */}
          {gradientType === "linear" && (
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <Label className="text-[10px] text-muted-foreground">Angle: {gradientAngle}°</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onGradientAngleChange?.((gradientAngle + 45) % 360)}
                >
                  <RotateCw className="h-3 w-3" />
                </Button>
              </div>
              <Slider
                value={[gradientAngle]}
                onValueChange={([v]) => onGradientAngleChange?.(v)}
                min={0}
                max={360}
                step={1}
                className="mt-1"
              />
            </div>
          )}

          {/* Gradient Stops */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-[10px] text-muted-foreground">Color Stops</Label>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={handleAddGradientStop}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {gradientStops.map((stop, index) => (
                <div key={index} className="flex items-center gap-1">
                  <button
                    className="h-5 w-5 rounded border border-border hover:border-primary transition-colors shrink-0"
                    style={{ backgroundColor: stop.color }}
                    onClick={() => setSelectedStopIndex(index)}
                  />
                  <Slider
                    value={[stop.position]}
                    onValueChange={([v]) => handleUpdateGradientStop(index, { position: v })}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-muted-foreground w-8 text-right">{stop.position}%</span>
                  {gradientStops.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => handleRemoveGradientStop(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {/* Color picker for selected stop */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full h-7 text-[10px] mt-2 rounded">
                  Edit Stop {selectedStopIndex + 1} Color
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" className="w-80 p-3">
                <ColorPicker
                  color={gradientStops[selectedStopIndex]?.color || "#000000"}
                  onChange={(color) => handleUpdateGradientStop(selectedStopIndex, { color })}
                  showOpacity={false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </TabsContent>

        {/* Pattern Fill */}
        <TabsContent value="pattern" className="space-y-2 mt-2">
          <div>
            <Label className="text-[10px] mb-0.5 block text-muted-foreground">Select Frame to Tile</Label>
            <Select value={patternFrameId} onValueChange={onPatternFrameIdChange}>
              <SelectTrigger className="h-7 text-[11px] rounded">
                <SelectValue placeholder="Choose a frame..." />
              </SelectTrigger>
              <SelectContent>
                {availableFrames.map((frame) => (
                  <SelectItem key={frame.id} value={frame.id} className="text-[11px]">
                    {frame.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[9px] text-muted-foreground italic">
            The selected frame will be tiled as a repeating pattern
          </p>
        </TabsContent>

        {/* Video Fill */}
        <TabsContent value="video" className="space-y-2 mt-2">
          <div>
            <Label className="text-[10px] mb-0.5 block text-muted-foreground">Video URL</Label>
            <Input
              type="url"
              value={videoUrl || ""}
              onChange={(e) => onVideoUrlChange?.(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="h-7 text-[11px] rounded"
            />
          </div>
          <p className="text-[9px] text-muted-foreground italic">
            Supports MP4, WebM. Video will loop automatically.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
