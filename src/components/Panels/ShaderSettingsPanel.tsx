import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Element } from "@/types/elements";
import ColorPicker from "./ColorPicker";

interface ShaderSettingsPanelProps {
  element: Element;
  onUpdate: (updates: Partial<Element>) => void;
}

export const ShaderSettingsPanel: React.FC<ShaderSettingsPanelProps> = ({ element, onUpdate }) => {
  const shader = element.shader || {
    type: "ripple",
    speed: 1,
    intensity: 1,
    scale: 10,
    color1: "#ff0080",
    color2: "#00ffff",
    color3: "#ffff00"
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <Label>Shader Type</Label>
        <Select
          value={shader.type}
          onValueChange={(value) => onUpdate({
            shader: { ...shader, type: value as any }
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ripple">Ripple</SelectItem>
            <SelectItem value="distortion">Distortion</SelectItem>
            <SelectItem value="particles">Particles</SelectItem>
            <SelectItem value="noise">Noise</SelectItem>
            <SelectItem value="waves">Waves</SelectItem>
            <SelectItem value="tunnel">Tunnel</SelectItem>
            <SelectItem value="plasma">Plasma</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Speed: {shader.speed?.toFixed(2)}</Label>
        <Slider
          value={[shader.speed || 1]}
          onValueChange={([value]) => onUpdate({
            shader: { ...shader, speed: value }
          })}
          min={0}
          max={5}
          step={0.1}
        />
      </div>

      <div>
        <Label>Intensity: {shader.intensity?.toFixed(2)}</Label>
        <Slider
          value={[shader.intensity || 1]}
          onValueChange={([value]) => onUpdate({
            shader: { ...shader, intensity: value }
          })}
          min={0}
          max={2}
          step={0.1}
        />
      </div>

      <div>
        <Label>Scale: {shader.scale?.toFixed(1)}</Label>
        <Slider
          value={[shader.scale || 10]}
          onValueChange={([value]) => onUpdate({
            shader: { ...shader, scale: value }
          })}
          min={1}
          max={50}
          step={0.5}
        />
      </div>

      <div>
        <Label>Color 1</Label>
        <ColorPicker
          color={shader.color1 || "#ff0080"}
          onChange={(color) => onUpdate({
            shader: { ...shader, color1: color }
          })}
        />
      </div>

      <div>
        <Label>Color 2</Label>
        <ColorPicker
          color={shader.color2 || "#00ffff"}
          onChange={(color) => onUpdate({
            shader: { ...shader, color2: color }
          })}
        />
      </div>

      {(shader.type === "waves" || shader.type === "plasma") && (
        <div>
          <Label>Color 3</Label>
          <ColorPicker
            color={shader.color3 || "#ffff00"}
            onChange={(color) => onUpdate({
              shader: { ...shader, color3: color }
            })}
          />
        </div>
      )}
    </div>
  );
};
