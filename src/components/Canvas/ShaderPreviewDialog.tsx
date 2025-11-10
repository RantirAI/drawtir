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
import DigitalTunnel from "@/components/ui/digital-tunnel";
import Glitch from "@/components/ui/glitch";
import { SingularityShaders } from "@/components/ui/shadcn-io/singularity-shaders";
import { ExtrudedMobiusSpiralShaders } from "@/components/ui/shadcn-io/extruded-mobius-spiral-shaders";
import { Fire3DShaders } from "@/components/ui/shadcn-io/fire-3d-shaders";

interface ShaderConfig {
  type: "kaleidoscope" | "plasma" | "nebula" | "aurora" | "cosmic-waves" | "digital-tunnel" | "glitch" | "singularity" | "mobius-spiral" | "fire-3d";
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
      case "digital-tunnel":
        return <DigitalTunnel {...props} />;
      case "glitch":
        return <Glitch {...props} />;
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

              {shader.type === "cosmic-waves" && (
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
