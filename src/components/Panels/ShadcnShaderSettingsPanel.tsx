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
    colorTint: [1.0, 2.0, 9.0],
    amplitude: 1.2,
    frequency: 0.8,
    starDensity: 1.0,
    colorShift: 1.0,
    intensity: 1.2,
    vibrancy: 1.1,
    stretch: 1.5,
    size: 1.1,
    waveStrength: 1.0
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
            <SelectItem value="plasma">Plasma</SelectItem>
            <SelectItem value="nebula">Nebula</SelectItem>
            <SelectItem value="aurora">Aurora</SelectItem>
            <SelectItem value="cosmic-waves">Cosmic Waves</SelectItem>
            <SelectItem value="cosmic-flow">Cosmic Flow</SelectItem>
            <SelectItem value="digital-tunnel">Digital Tunnel</SelectItem>
            <SelectItem value="glitch">Glitch</SelectItem>
            <SelectItem value="singularity">Singularity</SelectItem>
            <SelectItem value="mobius-spiral">Mobius Spiral</SelectItem>
            <SelectItem value="fire-3d">Fire 3D</SelectItem>
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

      {shader.type === "aurora" && (
        <>
          <div>
            <Label>Intensity: {shader.intensity?.toFixed(2) || "1.20"}</Label>
            <Slider
              value={[shader.intensity || 1.2]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, intensity: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Vibrancy: {shader.vibrancy?.toFixed(2) || "1.10"}</Label>
            <Slider
              value={[shader.vibrancy || 1.1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, vibrancy: value }
              })}
              min={0.0}
              max={2.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Frequency: {shader.frequency?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.frequency || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, frequency: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Stretch: {shader.stretch?.toFixed(2) || "1.50"}</Label>
            <Slider
              value={[shader.stretch || 1.5]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, stretch: value }
              })}
              min={0.5}
              max={3.0}
              step={0.1}
            />
          </div>
        </>
      )}

      {(shader.type === "cosmic-waves" || shader.type === "cosmic-flow") && (
        <>
          <div>
            <Label>Amplitude: {shader.amplitude?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.amplitude || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, amplitude: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Frequency: {shader.frequency?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.frequency || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, frequency: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Star Density: {shader.starDensity?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.starDensity || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, starDensity: value }
              })}
              min={0.0}
              max={2.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Color Shift: {shader.colorShift?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.colorShift || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, colorShift: value }
              })}
              min={0.1}
              max={3.0}
              step={0.1}
            />
          </div>
        </>
      )}

      {shader.type === "singularity" && (
        <>
          <div>
            <Label>Intensity: {shader.intensity?.toFixed(2) || "1.20"}</Label>
            <Slider
              value={[shader.intensity || 1.2]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, intensity: value }
              })}
              min={0.5}
              max={3.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Size: {shader.size?.toFixed(2) || "1.10"}</Label>
            <Slider
              value={[shader.size || 1.1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, size: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Wave Strength: {shader.waveStrength?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.waveStrength || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, waveStrength: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Color Shift: {shader.colorShift?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.colorShift || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, colorShift: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>
        </>
      )}

      {shader.type === "mobius-spiral" && (
        <>
          <div>
            <Label>Shape: {shader.shape || 2} (0=Square, 1=Circle, 2=Hexagon)</Label>
            <Slider
              value={[shader.shape || 2]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, shape: value }
              })}
              min={0}
              max={2}
              step={1}
            />
          </div>

          <div>
            <Label>Double Spiral: {shader.doubleSpiral || 1}</Label>
            <Slider
              value={[shader.doubleSpiral || 1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, doubleSpiral: value }
              })}
              min={0}
              max={1}
              step={1}
            />
          </div>

          <div>
            <Label>Face Decoration: {shader.faceDecoration || 1}</Label>
            <Slider
              value={[shader.faceDecoration || 1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, faceDecoration: value }
              })}
              min={0}
              max={1}
              step={1}
            />
          </div>

          <div>
            <Label>Holes: {shader.holes || 0}</Label>
            <Slider
              value={[shader.holes || 0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, holes: value }
              })}
              min={0}
              max={1}
              step={1}
            />
          </div>

          <div>
            <Label>Raised: {shader.raised || 0}</Label>
            <Slider
              value={[shader.raised || 0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, raised: value }
              })}
              min={0}
              max={1}
              step={1}
            />
          </div>

          <div>
            <Label>Ridges: {shader.ridges || 0}</Label>
            <Slider
              value={[shader.ridges || 0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, ridges: value }
              })}
              min={0}
              max={1}
              step={1}
            />
          </div>

          <div>
            <Label>Vertical Lines: {shader.vertLines || 0}</Label>
            <Slider
              value={[shader.vertLines || 0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, vertLines: value }
              })}
              min={0}
              max={1}
              step={1}
            />
          </div>
        </>
      )}

      {shader.type === "fire-3d" && (
        <>
          <div>
            <Label>Intensity: {shader.intensity?.toFixed(2) || "1.20"}</Label>
            <Slider
              value={[shader.intensity || 1.2]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, intensity: value }
              })}
              min={0.5}
              max={3.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Height: {shader.height?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.height || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, height: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Turbulence: {shader.turbulence?.toFixed(2) || "1.10"}</Label>
            <Slider
              value={[shader.turbulence || 1.1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, turbulence: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>

          <div>
            <Label>Color Shift: {shader.colorShift?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.colorShift || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, colorShift: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>
        </>
      )}
    </div>
  );
};
