import DraggablePanel from "./DraggablePanel";
import { Label } from "@/components/ui/label";
import SliderControl from "@/components/Canvas/SliderControl";

interface PropertyPanelProps {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  onBrightnessChange?: (value: number) => void;
  onContrastChange?: (value: number) => void;
  onSaturationChange?: (value: number) => void;
  onBlurChange?: (value: number) => void;
  onClose?: () => void;
}

export default function PropertyPanel({ 
  brightness = 100, 
  contrast = 100, 
  saturation = 100, 
  blur = 0,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange,
  onBlurChange,
  onClose
}: PropertyPanelProps) {
  return (
    <DraggablePanel
      title="Image Properties"
      defaultPosition={{ x: 50, y: 300 }}
      onClose={onClose}
      className="w-56"
    >
      <div className="space-y-2">
        <SliderControl label="Brightness" value={brightness} onChange={onBrightnessChange || (() => {})} min={0} max={200} />
        <SliderControl label="Contrast" value={contrast} onChange={onContrastChange || (() => {})} min={0} max={200} />
        <SliderControl label="Saturation" value={saturation} onChange={onSaturationChange || (() => {})} min={0} max={200} />
        <SliderControl label="Blur" value={blur} onChange={onBlurChange || (() => {})} min={0} max={20} />
      </div>
    </DraggablePanel>
  );
}
