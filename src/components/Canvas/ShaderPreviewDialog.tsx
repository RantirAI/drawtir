import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import Kaleidoscope from "@/components/ui/kaleidoscope";
import Plasma from "@/components/ui/plasma";
import Nebula from "@/components/ui/nebula";
import AuroraShaders from "@/components/ui/shadcn-io/aurora-shaders";
import { CosmicWavesShaders } from "@/components/ui/shadcn-io/cosmic-waves-shaders";
import { CosmicFlowShaders } from "@/components/ui/shadcn-io/cosmic-flow-shaders";
import DigitalTunnel from "@/components/ui/digital-tunnel";
import Glitch from "@/components/ui/glitch";
import { SingularityShaders } from "@/components/ui/shadcn-io/singularity-shaders";
import { ExtrudedMobiusSpiralShaders } from "@/components/ui/shadcn-io/extruded-mobius-spiral-shaders";
import { Fire3DShaders } from "@/components/ui/shadcn-io/fire-3d-shaders";
import { PyramidPatternShaders } from "@/components/ui/shadcn-io/pyramid-pattern-shaders";
import { Vortex } from "@/components/ui/vortex";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { BackgroundLines } from "@/components/ui/background-lines";
import { World } from "@/components/ui/globe";

interface ShaderConfig {
  type: "kaleidoscope" | "plasma" | "nebula" | "aurora" | "cosmic-waves" | "cosmic-flow" | "digital-tunnel" | "singularity" | "mobius-spiral" | "fire-3d" | "pyramid-pattern" | "vortex" | "background-beams" | "background-lines" | "globe";
  name: string;
  description: string;
  defaultProps: {
    speed: number;
    glowIntensity: number;
    colorTint: [number, number, number];
    amplitude?: number;
    frequency?: number;
    starDensity?: number;
    colorShift?: number;
    intensity?: number;
    vibrancy?: number;
    stretch?: number;
    size?: number;
    waveStrength?: number;
    shape?: number;
    rowOffset?: number;
    faceDecoration?: number;
    doubleSpiral?: number;
    holes?: number;
    raised?: number;
    ridges?: number;
    vertLines?: number;
    height?: number;
    turbulence?: number;
    scale?: number;
    offsetRows?: number;
    bumpStrength?: number;
    hatchIntensity?: number;
    lightMovement?: number;
    particleCount?: number;
    rangeY?: number;
    baseHue?: number;
    rangeSpeed?: number;
    baseRadius?: number;
    rangeRadius?: number;
    lineDuration?: number;
    globeColor?: string;
    atmosphereColor?: string;
    autoRotateSpeed?: number;
    arcTime?: number;
    pointSize?: number;
  };
}

interface ShaderPreviewDialogProps {
  shader: ShaderConfig;
  open: boolean;
  onClose: () => void;
  onUse: (props: any) => void;
}

export function ShaderPreviewDialog({ shader, open, onClose, onUse }: ShaderPreviewDialogProps) {
  const [shaderProps, setShaderProps] = useState(shader.defaultProps);

  const renderShader = () => {
    const props = shaderProps;
    
    switch (shader.type) {
      case "kaleidoscope":
        return <Kaleidoscope {...props} />;
      case "plasma":
        return <Plasma {...props} />;
      case "nebula":
        return <Nebula {...props} />;
      case "aurora":
        return <AuroraShaders 
          speed={props.speed}
          intensity={(props as any).intensity || 1.2}
          vibrancy={(props as any).vibrancy || 1.1}
          frequency={(props as any).frequency || 1.0}
          stretch={(props as any).stretch || 1.5}
          className="h-full w-full"
        />;
      case "cosmic-waves":
        return <CosmicWavesShaders 
          speed={props.speed}
          amplitude={(props as any).amplitude || 1.2}
          frequency={(props as any).frequency || 0.8}
          starDensity={(props as any).starDensity || 1.0}
          colorShift={(props as any).colorShift || 1.0}
          className="h-full w-full"
        />;
      case "cosmic-flow":
        return <CosmicFlowShaders 
          speed={props.speed}
          amplitude={(props as any).amplitude || 1.2}
          frequency={(props as any).frequency || 0.8}
          starDensity={(props as any).starDensity || 1.0}
          colorShift={(props as any).colorShift || 1.0}
          className="h-full w-full"
        />;
      case "digital-tunnel":
        return <DigitalTunnel {...props} />;
      case "singularity":
        return <SingularityShaders
          speed={props.speed}
          intensity={(props as any).intensity || 1.2}
          size={(props as any).size || 1.1}
          waveStrength={(props as any).waveStrength || 1.0}
          colorShift={(props as any).colorShift || 1.0}
          className="h-full w-full"
        />;
      case "mobius-spiral":
        return <ExtrudedMobiusSpiralShaders 
          speed={props.speed}
          shape={(props as any).shape || 2}
          rowOffset={(props as any).rowOffset || 1}
          faceDecoration={(props as any).faceDecoration || 1}
          doubleSpiral={(props as any).doubleSpiral || 1}
          holes={(props as any).holes || 0}
          raised={(props as any).raised || 0}
          ridges={(props as any).ridges || 0}
          vertLines={(props as any).vertLines || 0}
          className="h-full w-full"
        />;
      case "fire-3d":
        return <Fire3DShaders 
          speed={props.speed}
          intensity={(props as any).intensity || 1.2}
          height={(props as any).height || 1.0}
          turbulence={(props as any).turbulence || 1.1}
          colorShift={(props as any).colorShift || 1.0}
          className="h-full w-full"
        />;
      case "pyramid-pattern":
        return <PyramidPatternShaders 
          speed={props.speed}
          scale={(props as any).scale || 1.0}
          offsetRows={(props as any).offsetRows || 1}
          bumpStrength={(props as any).bumpStrength || 1.0}
          hatchIntensity={(props as any).hatchIntensity || 1.0}
          lightMovement={(props as any).lightMovement || 1.0}
          className="h-full w-full"
        />;
      case "vortex":
        return <Vortex 
          particleCount={(props as any).particleCount || 700}
          rangeY={(props as any).rangeY || 100}
          baseHue={(props as any).baseHue || 220}
          baseSpeed={props.speed || 1.0}
          rangeSpeed={(props as any).rangeSpeed || 1.5}
          baseRadius={(props as any).baseRadius || 1}
          rangeRadius={(props as any).rangeRadius || 2}
          backgroundColor="transparent"
          className="h-full w-full"
        />;
      case "background-beams":
        return <BackgroundBeams className="h-full w-full" />;
      case "background-lines":
        return <BackgroundLines className="h-full w-full" svgOptions={{ duration: (props as any).lineDuration || 10 }} />;
      case "globe":
        return (
          <div className="h-full w-full">
            <World 
              data={[
                { order: 1, startLat: 40.7128, startLng: -74.006, endLat: 51.5074, endLng: -0.1278, arcAlt: 0.3, color: "#06b6d4" },
                { order: 1, startLat: 35.6762, startLng: 139.6503, endLat: -33.8688, endLng: 151.2093, arcAlt: 0.4, color: "#3b82f6" },
                { order: 2, startLat: 22.3193, startLng: 114.1694, endLat: 1.3521, endLng: 103.8198, arcAlt: 0.2, color: "#06b6d4" },
                { order: 2, startLat: -22.9068, startLng: -43.1729, endLat: 28.6139, endLng: 77.209, arcAlt: 0.5, color: "#3b82f6" },
              ]}
              globeConfig={{
                pointSize: (props as any).pointSize || 4,
                globeColor: (props as any).globeColor || "#062056",
                showAtmosphere: true,
                atmosphereColor: (props as any).atmosphereColor || "#FFFFFF",
                autoRotate: true,
                autoRotateSpeed: (props as any).autoRotateSpeed || 0.5,
                arcTime: (props as any).arcTime || 1000
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <div className="grid grid-cols-[1fr_320px] gap-0">
          <div className="relative w-full h-[70vh] bg-black rounded-l-lg overflow-hidden">
            {renderShader()}
          </div>
          
          <div className="p-6 overflow-y-auto h-[70vh] bg-muted/30">
            <h3 className="font-semibold mb-4">Shader Settings</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Speed: {shaderProps.speed.toFixed(2)}</Label>
                <Slider
                  value={[shaderProps.speed]}
                  onValueChange={([value]) => setShaderProps({ ...shaderProps, speed: value })}
                  min={0.1}
                  max={3.0}
                  step={0.1}
                />
              </div>

              <div>
                <Label>Glow Intensity: {shaderProps.glowIntensity.toFixed(2)}</Label>
                <Slider
                  value={[shaderProps.glowIntensity]}
                  onValueChange={([value]) => setShaderProps({ ...shaderProps, glowIntensity: value })}
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
                      value={shaderProps.colorTint[0]}
                      onChange={(e) => {
                        const newTint = [...shaderProps.colorTint];
                        newTint[0] = parseFloat(e.target.value) || 0;
                        setShaderProps({ ...shaderProps, colorTint: newTint as [number, number, number] });
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
                      value={shaderProps.colorTint[1]}
                      onChange={(e) => {
                        const newTint = [...shaderProps.colorTint];
                        newTint[1] = parseFloat(e.target.value) || 0;
                        setShaderProps({ ...shaderProps, colorTint: newTint as [number, number, number] });
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
                      value={shaderProps.colorTint[2]}
                      onChange={(e) => {
                        const newTint = [...shaderProps.colorTint];
                        newTint[2] = parseFloat(e.target.value) || 0;
                        setShaderProps({ ...shaderProps, colorTint: newTint as [number, number, number] });
                      }}
                    />
                  </div>
                </div>
              </div>

              {shader.type === "aurora" && (
                <>
                  <div>
                    <Label>Intensity: {(shaderProps as any).intensity?.toFixed(2) || "1.20"}</Label>
                    <Slider
                      value={[(shaderProps as any).intensity || 1.2]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, intensity: value })}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Vibrancy: {(shaderProps as any).vibrancy?.toFixed(2) || "1.10"}</Label>
                    <Slider
                      value={[(shaderProps as any).vibrancy || 1.1]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, vibrancy: value })}
                      min={0.0}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Frequency: {(shaderProps as any).frequency?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).frequency || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, frequency: value })}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Stretch: {(shaderProps as any).stretch?.toFixed(2) || "1.50"}</Label>
                    <Slider
                      value={[(shaderProps as any).stretch || 1.5]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, stretch: value })}
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
                    <Label>Amplitude: {(shaderProps as any).amplitude?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).amplitude || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, amplitude: value })}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Frequency: {(shaderProps as any).frequency?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).frequency || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, frequency: value })}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Star Density: {(shaderProps as any).starDensity?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).starDensity || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, starDensity: value })}
                      min={0.0}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Color Shift: {(shaderProps as any).colorShift?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).colorShift || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, colorShift: value })}
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
                    <Label>Intensity: {(shaderProps as any).intensity?.toFixed(2) || "1.20"}</Label>
                    <Slider
                      value={[(shaderProps as any).intensity || 1.2]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, intensity: value })}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Size: {(shaderProps as any).size?.toFixed(2) || "1.10"}</Label>
                    <Slider
                      value={[(shaderProps as any).size || 1.1]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, size: value })}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Wave Strength: {(shaderProps as any).waveStrength?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).waveStrength || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, waveStrength: value })}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Color Shift: {(shaderProps as any).colorShift?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).colorShift || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, colorShift: value })}
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
                    <Label>Shape: {(shaderProps as any).shape || 2} (0=Square, 1=Circle, 2=Hexagon)</Label>
                    <Slider
                      value={[(shaderProps as any).shape || 2]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, shape: value })}
                      min={0}
                      max={2}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Double Spiral: {(shaderProps as any).doubleSpiral || 1}</Label>
                    <Slider
                      value={[(shaderProps as any).doubleSpiral || 1]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, doubleSpiral: value })}
                      min={0}
                      max={1}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Face Decoration: {(shaderProps as any).faceDecoration || 1}</Label>
                    <Slider
                      value={[(shaderProps as any).faceDecoration || 1]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, faceDecoration: value })}
                      min={0}
                      max={1}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Holes: {(shaderProps as any).holes || 0}</Label>
                    <Slider
                      value={[(shaderProps as any).holes || 0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, holes: value })}
                      min={0}
                      max={1}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Raised: {(shaderProps as any).raised || 0}</Label>
                    <Slider
                      value={[(shaderProps as any).raised || 0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, raised: value })}
                      min={0}
                      max={1}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Ridges: {(shaderProps as any).ridges || 0}</Label>
                    <Slider
                      value={[(shaderProps as any).ridges || 0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, ridges: value })}
                      min={0}
                      max={1}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Vertical Lines: {(shaderProps as any).vertLines || 0}</Label>
                    <Slider
                      value={[(shaderProps as any).vertLines || 0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, vertLines: value })}
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
                    <Label>Intensity: {(shaderProps as any).intensity?.toFixed(2) || "1.20"}</Label>
                    <Slider
                      value={[(shaderProps as any).intensity || 1.2]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, intensity: value })}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Height: {(shaderProps as any).height?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).height || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, height: value } as any)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Turbulence: {(shaderProps as any).turbulence?.toFixed(2) || "1.10"}</Label>
                    <Slider
                      value={[(shaderProps as any).turbulence || 1.1]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, turbulence: value } as any)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Color Shift: {(shaderProps as any).colorShift?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).colorShift || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, colorShift: value })}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                  </div>
                </>
              )}

              {shader.type === "pyramid-pattern" && (
                <>
                  <div>
                    <Label>Scale: {(shaderProps as any).scale?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).scale || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, scale: value })}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Offset Rows: {(shaderProps as any).offsetRows || 1}</Label>
                    <Slider
                      value={[(shaderProps as any).offsetRows || 1]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, offsetRows: value })}
                      min={0}
                      max={1}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Bump Strength: {(shaderProps as any).bumpStrength?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).bumpStrength || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, bumpStrength: value })}
                      min={0.0}
                      max={3.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Hatch Intensity: {(shaderProps as any).hatchIntensity?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).hatchIntensity || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, hatchIntensity: value })}
                      min={0.0}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Light Movement: {(shaderProps as any).lightMovement?.toFixed(2) || "1.00"}</Label>
                    <Slider
                      value={[(shaderProps as any).lightMovement || 1.0]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, lightMovement: value })}
                      min={0.0}
                      max={3.0}
                      step={0.1}
                    />
                  </div>
                </>
              )}

              {shader.type === "vortex" && (
                <>
                  <div>
                    <Label>Particle Count: {(shaderProps as any).particleCount || 700}</Label>
                    <Slider
                      value={[(shaderProps as any).particleCount || 700]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, particleCount: Math.round(value) } as any)}
                      min={100}
                      max={2000}
                      step={50}
                    />
                  </div>

                  <div>
                    <Label>Vertical Range: {(shaderProps as any).rangeY || 100}</Label>
                    <Slider
                      value={[(shaderProps as any).rangeY || 100]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, rangeY: value } as any)}
                      min={50}
                      max={300}
                      step={10}
                    />
                  </div>

                  <div>
                    <Label>Base Hue: {(shaderProps as any).baseHue || 220}</Label>
                    <Slider
                      value={[(shaderProps as any).baseHue || 220]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, baseHue: value } as any)}
                      min={0}
                      max={360}
                      step={1}
                    />
                  </div>

                  <div>
                    <Label>Speed Range: {(shaderProps as any).rangeSpeed?.toFixed(2) || "1.50"}</Label>
                    <Slider
                      value={[(shaderProps as any).rangeSpeed || 1.5]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, rangeSpeed: value } as any)}
                      min={0.1}
                      max={5.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Base Radius: {(shaderProps as any).baseRadius?.toFixed(1) || "1.0"}</Label>
                    <Slider
                      value={[(shaderProps as any).baseRadius || 1]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, baseRadius: value } as any)}
                      min={0.5}
                      max={5.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Radius Range: {(shaderProps as any).rangeRadius?.toFixed(1) || "2.0"}</Label>
                    <Slider
                      value={[(shaderProps as any).rangeRadius || 2]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, rangeRadius: value } as any)}
                      min={0.5}
                      max={10.0}
                      step={0.1}
                    />
                  </div>
                </>
              )}

              {shader.type === "background-lines" && (
                <>
                  <div>
                    <Label>Animation Duration: {(shaderProps as any).lineDuration?.toFixed(1) || "10.0"}s</Label>
                    <Slider
                      value={[(shaderProps as any).lineDuration || 10]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, lineDuration: value } as any)}
                      min={3}
                      max={30}
                      step={0.5}
                    />
                  </div>
                </>
              )}

              {shader.type === "globe" && (
                <>
                  <div>
                    <Label>Globe Color</Label>
                    <Input
                      type="color"
                      value={(shaderProps as any).globeColor || "#062056"}
                      onChange={(e) => setShaderProps({ ...shaderProps, globeColor: e.target.value } as any)}
                    />
                  </div>

                  <div>
                    <Label>Atmosphere Color</Label>
                    <Input
                      type="color"
                      value={(shaderProps as any).atmosphereColor || "#FFFFFF"}
                      onChange={(e) => setShaderProps({ ...shaderProps, atmosphereColor: e.target.value } as any)}
                    />
                  </div>

                  <div>
                    <Label>Rotation Speed: {(shaderProps as any).autoRotateSpeed?.toFixed(2) || "0.50"}</Label>
                    <Slider
                      value={[(shaderProps as any).autoRotateSpeed || 0.5]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, autoRotateSpeed: value } as any)}
                      min={0.1}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <Label>Arc Animation Time: {(shaderProps as any).arcTime || 1000}ms</Label>
                    <Slider
                      value={[(shaderProps as any).arcTime || 1000]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, arcTime: Math.round(value) } as any)}
                      min={500}
                      max={3000}
                      step={100}
                    />
                  </div>

                  <div>
                    <Label>Point Size: {(shaderProps as any).pointSize || 4}</Label>
                    <Slider
                      value={[(shaderProps as any).pointSize || 4]}
                      onValueChange={([value]) => setShaderProps({ ...shaderProps, pointSize: Math.round(value) } as any)}
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t">
          <div className="flex items-center justify-between">
            <DialogTitle>{shader.name}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={() => onUse(shaderProps)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Use This Shader
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
