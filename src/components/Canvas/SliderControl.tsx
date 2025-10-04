import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function SliderControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: SliderControlProps) {
  return (
    <div>
      <Label className="text-[10px] mb-1.5 block">{label}: {value}</Label>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        className="mt-1"
      />
    </div>
  );
}
