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
    <div className="space-y-2">
      <div>
        <Label className="text-[11px]">Shader Type</Label>
        <Select
          value={shader.type}
          onValueChange={(value) => onUpdate({
            shader: { 
              ...shader, 
              type: value as any
            }
          })}
        >
          <SelectTrigger className="h-7 text-[11px]">
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
            <SelectItem value="singularity">Singularity</SelectItem>
            <SelectItem value="mobius-spiral">Mobius Spiral</SelectItem>
            <SelectItem value="fire-3d">Fire 3D</SelectItem>
            <SelectItem value="pyramid-pattern">Pyramid Pattern</SelectItem>
            <SelectItem value="vortex">Vortex</SelectItem>
            <SelectItem value="background-beams">Background Beams</SelectItem>
            <SelectItem value="background-lines">Background Lines</SelectItem>
            <SelectItem value="globe">3D Globe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-[11px]">Speed: {shader.speed?.toFixed(2)}</Label>
        <Slider
          value={[shader.speed || 1.0]}
          onValueChange={([value]) => onUpdate({
            shader: { ...shader, speed: value }
          })}
          min={0.1}
          max={3.0}
          step={0.1}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-[11px]">Glow Intensity: {shader.glowIntensity?.toFixed(2)}</Label>
        <Slider
          value={[shader.glowIntensity || 1.0]}
          onValueChange={([value]) => onUpdate({
            shader: { ...shader, glowIntensity: value }
          })}
          min={0.1}
          max={3.0}
          step={0.1}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-[11px]">Color Tint</Label>
        <div className="grid grid-cols-3 gap-1.5 mt-1">
          <div>
            <Label className="text-[10px]">R</Label>
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
              className="h-6 text-[10px] px-1.5"
            />
          </div>
          <div>
            <Label className="text-[10px]">G</Label>
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
              className="h-6 text-[10px] px-1.5"
            />
          </div>
          <div>
            <Label className="text-[10px]">B</Label>
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
              className="h-6 text-[10px] px-1.5"
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          RGB values from 0-10 for shader color calculations
        </p>
      </div>

      {shader.type === "aurora" && (
        <>
          <div>
            <Label className="text-[11px]">Intensity: {shader.intensity?.toFixed(2) || "1.20"}</Label>
            <Slider
              value={[shader.intensity || 1.2]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, intensity: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Vibrancy: {shader.vibrancy?.toFixed(2) || "1.10"}</Label>
            <Slider
              value={[shader.vibrancy || 1.1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, vibrancy: value }
              })}
              min={0.0}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Frequency: {shader.frequency?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.frequency || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, frequency: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Stretch: {shader.stretch?.toFixed(2) || "1.50"}</Label>
            <Slider
              value={[shader.stretch || 1.5]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, stretch: value }
              })}
              min={0.5}
              max={3.0}
              step={0.1}
              className="mt-1"
            />
          </div>
        </>
      )}

      {(shader.type === "cosmic-waves" || shader.type === "cosmic-flow") && (
        <>
          <div>
            <Label className="text-[11px]">Amplitude: {shader.amplitude?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.amplitude || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, amplitude: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Frequency: {shader.frequency?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.frequency || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, frequency: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Star Density: {shader.starDensity?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.starDensity || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, starDensity: value }
              })}
              min={0.0}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Color Shift: {shader.colorShift?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.colorShift || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, colorShift: value }
              })}
              min={0.1}
              max={3.0}
              step={0.1}
              className="mt-1"
            />
          </div>
        </>
      )}

      {shader.type === "singularity" && (
        <>
          <div>
            <Label className="text-[11px]">Intensity: {shader.intensity?.toFixed(2) || "1.20"}</Label>
            <Slider
              value={[shader.intensity || 1.2]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, intensity: value }
              })}
              min={0.5}
              max={3.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Size: {shader.size?.toFixed(2) || "1.10"}</Label>
            <Slider
              value={[shader.size || 1.1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, size: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Wave Strength: {shader.waveStrength?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.waveStrength || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, waveStrength: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Color Shift: {shader.colorShift?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.colorShift || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, colorShift: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>
        </>
      )}

      {shader.type === "mobius-spiral" && (
        <>
          <div>
            <Label className="text-[11px]">Shape: {shader.shape || 2} (0=Square, 1=Circle, 2=Hexagon)</Label>
            <Slider
              value={[shader.shape || 2]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, shape: value }
              })}
              min={0}
              max={2}
              step={1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Double Spiral: {shader.doubleSpiral || 1}</Label>
            <Slider
              value={[shader.doubleSpiral || 1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, doubleSpiral: value }
              })}
              min={0}
              max={1}
              step={1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Face Decoration: {shader.faceDecoration || 1}</Label>
            <Slider
              value={[shader.faceDecoration || 1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, faceDecoration: value }
              })}
              min={0}
              max={1}
              step={1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Holes: {shader.holes || 0}</Label>
            <Slider
              value={[shader.holes || 0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, holes: value }
              })}
              min={0}
              max={1}
              step={1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Raised: {shader.raised || 0}</Label>
            <Slider
              value={[shader.raised || 0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, raised: value }
              })}
              min={0}
              max={1}
              step={1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Ridges: {shader.ridges || 0}</Label>
            <Slider
              value={[shader.ridges || 0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, ridges: value }
              })}
              min={0}
              max={1}
              step={1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Vertical Lines: {shader.vertLines || 0}</Label>
            <Slider
              value={[shader.vertLines || 0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, vertLines: value }
              })}
              min={0}
              max={1}
              step={1}
              className="mt-1"
            />
          </div>
        </>
      )}

      {shader.type === "fire-3d" && (
        <>
          <div>
            <Label className="text-[11px]">Intensity: {shader.intensity?.toFixed(2) || "1.20"}</Label>
            <Slider
              value={[shader.intensity || 1.2]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, intensity: value }
              })}
              min={0.5}
              max={3.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Height: {shader.height?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.height || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, height: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Turbulence: {shader.turbulence?.toFixed(2) || "1.10"}</Label>
            <Slider
              value={[shader.turbulence || 1.1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, turbulence: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Color Shift: {shader.colorShift?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.colorShift || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, colorShift: value }
              })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>
        </>
      )}

      {shader.type === "pyramid-pattern" && (
        <>
          <div>
            <Label className="text-[11px]">Scale: {shader.scale?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.scale || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, scale: value }
              })}
              min={0.5}
              max={3.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Offset Rows: {shader.offsetRows || 1}</Label>
            <Slider
              value={[shader.offsetRows || 1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, offsetRows: value }
              })}
              min={0}
              max={1}
              step={1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Bump Strength: {shader.bumpStrength?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.bumpStrength || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, bumpStrength: value }
              })}
              min={0.0}
              max={3.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Hatch Intensity: {shader.hatchIntensity?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.hatchIntensity || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, hatchIntensity: value }
              })}
              min={0.0}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Light Movement: {shader.lightMovement?.toFixed(2) || "1.00"}</Label>
            <Slider
              value={[shader.lightMovement || 1.0]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, lightMovement: value }
              })}
              min={0.0}
              max={3.0}
              step={0.1}
              className="mt-1"
            />
          </div>
        </>
      )}

      {shader.type === "vortex" && (
        <>
          <div>
            <Label className="text-[11px]">Particle Count: {shader.particleCount || 700}</Label>
            <Slider
              value={[shader.particleCount || 700]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, particleCount: Math.round(value) }
              })}
              min={100}
              max={2000}
              step={50}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Vertical Range: {shader.rangeY || 100}</Label>
            <Slider
              value={[shader.rangeY || 100]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, rangeY: value }
              })}
              min={50}
              max={300}
              step={10}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Base Hue: {shader.baseHue || 220}</Label>
            <Slider
              value={[shader.baseHue || 220]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, baseHue: value }
              })}
              min={0}
              max={360}
              step={1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Speed Range: {shader.rangeSpeed?.toFixed(2) || "1.50"}</Label>
            <Slider
              value={[shader.rangeSpeed || 1.5]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, rangeSpeed: value }
              })}
              min={0.1}
              max={5.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Base Radius: {shader.baseRadius?.toFixed(1) || "1.0"}</Label>
            <Slider
              value={[shader.baseRadius || 1]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, baseRadius: value }
              })}
              min={0.5}
              max={5.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Radius Range: {shader.rangeRadius?.toFixed(1) || "2.0"}</Label>
            <Slider
              value={[shader.rangeRadius || 2]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, rangeRadius: value }
              })}
              min={0.5}
              max={10.0}
              step={0.1}
              className="mt-1"
            />
          </div>
        </>
      )}

      {shader.type === "background-lines" && (
        <>
          <div>
            <Label className="text-[11px]">Animation Duration: {shader.lineDuration?.toFixed(1) || "10.0"}s</Label>
            <Slider
              value={[shader.lineDuration || 10]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, lineDuration: value }
              })}
              min={3}
              max={30}
              step={0.5}
              className="mt-1"
            />
          </div>
        </>
      )}

      {shader.type === "globe" && (
        <>
          <div>
            <Label className="text-[11px]">Globe Color</Label>
            <Input
              type="color"
              value={shader.globeColor || "#062056"}
              onChange={(e) => onUpdate({
                shader: { ...shader, globeColor: e.target.value }
              })}
              className="h-7 mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Atmosphere Color</Label>
            <Input
              type="color"
              value={shader.atmosphereColor || "#FFFFFF"}
              onChange={(e) => onUpdate({
                shader: { ...shader, atmosphereColor: e.target.value }
              })}
              className="h-7 mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Rotation Speed: {shader.autoRotateSpeed?.toFixed(2) || "0.50"}</Label>
            <Slider
              value={[shader.autoRotateSpeed || 0.5]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, autoRotateSpeed: value }
              })}
              min={0.1}
              max={2.0}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Arc Animation Time: {shader.arcTime || 1000}ms</Label>
            <Slider
              value={[shader.arcTime || 1000]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, arcTime: Math.round(value) }
              })}
              min={500}
              max={3000}
              step={100}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-[11px]">Point Size: {shader.pointSize || 4}</Label>
            <Slider
              value={[shader.pointSize || 4]}
              onValueChange={([value]) => onUpdate({
                shader: { ...shader, pointSize: Math.round(value) }
              })}
              min={1}
              max={10}
              step={1}
              className="mt-1"
            />
          </div>
        </>
      )}
    </div>
  );
};
