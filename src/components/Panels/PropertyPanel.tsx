import DraggablePanel from "./DraggablePanel";
import { Label } from "@/components/ui/label";
import SliderControl from "@/components/Canvas/SliderControl";
import { Button } from "@/components/ui/button";

interface PropertyPanelProps {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  imageFit?: "fill" | "contain" | "cover" | "crop";
  onBrightnessChange?: (value: number) => void;
  onContrastChange?: (value: number) => void;
  onSaturationChange?: (value: number) => void;
  onBlurChange?: (value: number) => void;
  onImageFitChange?: (value: "fill" | "contain" | "cover" | "crop") => void;
  onClose?: () => void;
}

export default function PropertyPanel({ 
  brightness = 100, 
  contrast = 100, 
  saturation = 100, 
  blur = 0,
  imageFit = "cover",
  onBrightnessChange,
  onContrastChange,
  onSaturationChange,
  onBlurChange,
  onImageFitChange,
  onClose
}: PropertyPanelProps) {
  const fitModes: Array<"fill" | "contain" | "cover" | "crop"> = ["fill", "contain", "cover", "crop"];

  return (
    <DraggablePanel
      title="Image Properties"
      defaultPosition={{ x: 50, y: 300 }}
      onClose={onClose}
      className="w-56"
    >
      <div className="space-y-3">
        {onImageFitChange && (
          <div>
            <Label className="text-xs mb-2 block">Image Fit</Label>
            <div className="grid grid-cols-2 gap-1">
              {fitModes.map((mode) => (
                <Button
                  key={mode}
                  variant={imageFit === mode ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-[10px] capitalize"
                  onClick={() => onImageFitChange(mode)}
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>
        )}

        <SliderControl label="Brightness" value={brightness} onChange={onBrightnessChange || (() => {})} min={0} max={200} />
        <SliderControl label="Contrast" value={contrast} onChange={onContrastChange || (() => {})} min={0} max={200} />
        <SliderControl label="Saturation" value={saturation} onChange={onSaturationChange || (() => {})} min={0} max={200} />
        <SliderControl label="Blur" value={blur} onChange={onBlurChange || (() => {})} min={0} max={20} />
      </div>
    </DraggablePanel>
  );
}
