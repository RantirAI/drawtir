import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const gradientPresets = [
  { name: "Sunset", gradient: "linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%)" },
  { name: "Ocean", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Forest", gradient: "linear-gradient(135deg, #134E5E 0%, #71B280 100%)" },
  { name: "Fire", gradient: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)" },
  { name: "Purple Dream", gradient: "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)" },
  { name: "Cool Blues", gradient: "linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)" },
];

interface FillStrokeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: string;
  onChange: (value: string | { type: 'gradient' | 'pattern' | 'image', data: any }) => void;
  mode: "fill" | "stroke";
}

export default function FillStrokeModal({ open, onOpenChange, currentValue, onChange, mode }: FillStrokeModalProps) {
  const [activeTab, setActiveTab] = useState<"solid" | "gradient" | "pattern" | "image">("solid");
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradientColor1, setGradientColor1] = useState("#000000");
  const [gradientColor2, setGradientColor2] = useState("#ffffff");
  const [patternType, setPatternType] = useState<"dots" | "stripes" | "grid">("dots");
  const [patternScale, setPatternScale] = useState(10);
  const [imageFit, setImageFit] = useState<"fill" | "contain" | "cover">("cover");

  const applyGradient = () => {
    const gradient = `linear-gradient(${gradientAngle}deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`;
    onChange({ type: 'gradient', data: { angle: gradientAngle, color1: gradientColor1, color2: gradientColor2, css: gradient } });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "fill" ? "Fill Options" : "Stroke Options"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="solid" className="text-xs">Solid</TabsTrigger>
            <TabsTrigger value="gradient" className="text-xs">Gradient</TabsTrigger>
            <TabsTrigger value="pattern" className="text-xs">Pattern</TabsTrigger>
            <TabsTrigger value="image" className="text-xs">Image</TabsTrigger>
          </TabsList>

          <TabsContent value="solid" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs mb-2 block">Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={currentValue}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={currentValue}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="#000000"
                  className="h-10 flex-1 text-xs"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gradient" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs mb-2 block">Gradient Presets</Label>
              <div className="grid grid-cols-3 gap-2">
                {gradientPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      const match = preset.gradient.match(/linear-gradient\((\d+)deg, (#[0-9A-F]{6}) 0%, (#[0-9A-F]{6}) 100%\)/i);
                      if (match) {
                        setGradientAngle(parseInt(match[1]));
                        setGradientColor1(match[2]);
                        setGradientColor2(match[3]);
                      }
                    }}
                    className="h-12 rounded border-2 border-border hover:border-primary transition-colors"
                    style={{ background: preset.gradient }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Angle: {gradientAngle}°</Label>
              <Slider
                value={[gradientAngle]}
                onValueChange={([v]) => setGradientAngle(v)}
                min={0}
                max={360}
                step={5}
              />
            </div>

            <div>
              <Label className="text-xs mb-2 block">Click on color stops to edit</Label>
              <div className="relative">
                <div 
                  className="h-16 rounded border-2 border-border"
                  style={{ background: `linear-gradient(${gradientAngle}deg, ${gradientColor1} 0%, ${gradientColor2} 100%)` }}
                />
                
                {/* Color Stop 1 */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2">
                  <label className="cursor-pointer group">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-110"
                         style={{ backgroundColor: gradientColor1 }} />
                    <input
                      type="color"
                      value={gradientColor1}
                      onChange={(e) => setGradientColor1(e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>
                
                {/* Color Stop 2 */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <label className="cursor-pointer group">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-110"
                         style={{ backgroundColor: gradientColor2 }} />
                    <input
                      type="color"
                      value={gradientColor2}
                      onChange={(e) => setGradientColor2(e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            </div>

            <Button onClick={applyGradient} className="w-full h-8 text-xs">
              Apply Gradient
            </Button>
          </TabsContent>

          <TabsContent value="pattern" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs mb-2 block">Pattern Type</Label>
              <Select value={patternType} onValueChange={(v) => setPatternType(v as any)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="stripes">Stripes</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Scale: {patternScale}px</Label>
              <Slider
                value={[patternScale]}
                onValueChange={([v]) => setPatternScale(v)}
                min={5}
                max={50}
                step={1}
              />
            </div>

            <Button 
              onClick={() => {
                onChange({ type: 'pattern', data: { patternType, scale: patternScale } });
                onOpenChange(false);
              }}
              className="w-full h-8 text-xs"
            >
              Apply Pattern
            </Button>
          </TabsContent>

          <TabsContent value="image" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs mb-2 block">Image Fit</Label>
              <div className="grid grid-cols-3 gap-1">
                {(["fill", "contain", "cover"] as const).map((fit) => (
                  <Button
                    key={fit}
                    variant={imageFit === fit ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-[10px] capitalize"
                    onClick={() => setImageFit(fit)}
                  >
                    {fit}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Upload Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const imageUrl = event.target?.result as string;
                      onChange({ type: 'image', data: { url: imageUrl, fit: imageFit } });
                      onOpenChange(false);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="h-8 text-xs"
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
