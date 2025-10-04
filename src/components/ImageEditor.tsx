import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";

interface ImageEditorProps {
  imageUrl: string;
  caption: string;
  imageStyle: string;
  onImageStyleChange: (style: string) => void;
}

export default function ImageEditor({ imageUrl, caption, imageStyle, onImageStyleChange }: ImageEditorProps) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [textPosition, setTextPosition] = useState<"bottom" | "top" | "center">("bottom");
  const [textSize, setTextSize] = useState(2);

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
  };

  const getFilterStyle = () => {
    return {
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`,
    };
  };

  const getTextPositionClass = () => {
    switch (textPosition) {
      case "top":
        return "items-start pt-8";
      case "center":
        return "items-center";
      case "bottom":
      default:
        return "items-end pb-8";
    }
  };

  const getTextSizeClass = () => {
    const sizes = ["text-lg", "text-xl", "text-2xl", "text-3xl"];
    return sizes[textSize - 1] || "text-2xl";
  };

  return (
    <div className="grid lg:grid-cols-[300px,1fr] gap-6">
      <Card className="p-6 border shadow-sm space-y-6 h-fit">
        <div>
          <h3 className="text-sm font-medium mb-4">Image Controls</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-2">Image Fit</Label>
              <Select value={imageStyle} onValueChange={onImageStyleChange}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                  <SelectItem value="fill">Fill</SelectItem>
                  <SelectItem value="scale-down">Scale Down</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-2">Brightness: {brightness}%</Label>
              <Slider
                value={[brightness]}
                onValueChange={(v) => setBrightness(v[0])}
                min={0}
                max={200}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs mb-2">Contrast: {contrast}%</Label>
              <Slider
                value={[contrast]}
                onValueChange={(v) => setContrast(v[0])}
                min={0}
                max={200}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs mb-2">Saturation: {saturation}%</Label>
              <Slider
                value={[saturation]}
                onValueChange={(v) => setSaturation(v[0])}
                min={0}
                max={200}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs mb-2">Blur: {blur}px</Label>
              <Slider
                value={[blur]}
                onValueChange={(v) => setBlur(v[0])}
                min={0}
                max={10}
                step={0.5}
                className="mt-2"
              />
            </div>

            <Button onClick={resetFilters} variant="outline" size="sm" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium mb-4">Text Controls</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-2">Text Position</Label>
              <Select value={textPosition} onValueChange={(v: any) => setTextPosition(v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-2">Text Size: {textSize}</Label>
              <Slider
                value={[textSize]}
                onValueChange={(v) => setTextSize(v[0])}
                min={1}
                max={4}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border shadow-sm">
        <h3 className="text-sm font-medium text-foreground mb-4">Live Preview</h3>
        <div className="aspect-[3/4] bg-muted rounded border overflow-hidden relative">
          <img
            src={imageUrl}
            alt="Poster"
            className="w-full h-full"
            style={{ 
              objectFit: imageStyle as any,
              ...getFilterStyle()
            }}
          />
          
          {caption && (
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex ${getTextPositionClass()} px-8`}>
              <div className="text-white space-y-1">
                {caption.split('\n').map((line, i) => (
                  <p key={i} className={`${getTextSizeClass()} font-bold drop-shadow-lg`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
