import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import type { Element } from "@/types/elements";

interface ShadcnShaderSettingsPanelProps {
  element: Element;
  onUpdate: (updates: Partial<Element>) => void;
}

export const ShadcnShaderSettingsPanel: React.FC<ShadcnShaderSettingsPanelProps> = ({ element, onUpdate }) => {
  const shader = element.shader || {
    type: "kaleidoscope",
    speed: 1.0,
    glowIntensity: 1.5,
    colorTint: [1.0, 2.0, 9.0]
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Shader Type</Label>
        <Select
          value={shader.type}
          onValueChange={(value) => onUpdate({
            shader: { 
              ...shader, 
              type: value as any
            }
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kaleidoscope">Kaleidoscope</SelectItem>
            <SelectItem value="ripple">Ripple</SelectItem>
            <SelectItem value="plasma">Plasma</SelectItem>
            <SelectItem value="nebula">Nebula</SelectItem>
            <SelectItem value="matrix">Matrix Rain</SelectItem>
            <SelectItem value="aurora">Aurora</SelectItem>
            <SelectItem value="cosmic-waves">Cosmic Waves</SelectItem>
            <SelectItem value="digital-tunnel">Digital Tunnel</SelectItem>
            <SelectItem value="glitch">Glitch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Speed: {shader.speed?.toFixed(2)}</Label>
        <Slider
          value={[shader.speed || 1.0]}
          onValueChange={([value]) => onUpdate({
            shader: { ...shader, speed: value }
          })}
          min={0.1}
          max={3.0}
          step={0.1}
        />
      </div>

      <div>
        <Label>Glow Intensity: {shader.glowIntensity?.toFixed(2)}</Label>
        <Slider
          value={[shader.glowIntensity || 1.0]}
          onValueChange={([value]) => onUpdate({
            shader: { ...shader, glowIntensity: value }
          })}
          min={0.1}
          max={3.0}
          step={0.1}
        />
      </div>

      <div>
        <Label>Color Tint</Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">R</Label>
            <Input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={shader.colorTint?.[0] || 1.0}
              onChange={(e) => {
                const newTint = [...(shader.colorTint || [1.0, 2.0, 9.0])];
                newTint[0] = parseFloat(e.target.value) || 0;
                onUpdate({ shader: { ...shader, colorTint: newTint as [number, number, number] } });
              }}
            />
          </div>
          <div>
            <Label className="text-xs">G</Label>
            <Input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={shader.colorTint?.[1] || 2.0}
              onChange={(e) => {
                const newTint = [...(shader.colorTint || [1.0, 2.0, 9.0])];
                newTint[1] = parseFloat(e.target.value) || 0;
                onUpdate({ shader: { ...shader, colorTint: newTint as [number, number, number] } });
              }}
            />
          </div>
          <div>
            <Label className="text-xs">B</Label>
            <Input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={shader.colorTint?.[2] || 9.0}
              onChange={(e) => {
                const newTint = [...(shader.colorTint || [1.0, 2.0, 9.0])];
                newTint[2] = parseFloat(e.target.value) || 0;
                onUpdate({ shader: { ...shader, colorTint: newTint as [number, number, number] } });
              }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          RGB values from 0-10 for shader color calculations
        </p>
      </div>
    </div>
  );
};
