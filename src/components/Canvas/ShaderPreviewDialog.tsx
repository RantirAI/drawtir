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
import Aurora from "@/components/ui/aurora";
import CosmicWaves from "@/components/ui/cosmic-waves";
import DigitalTunnel from "@/components/ui/digital-tunnel";
import Glitch from "@/components/ui/glitch";

interface ShaderConfig {
  type: "kaleidoscope" | "plasma" | "nebula" | "aurora" | "cosmic-waves" | "digital-tunnel" | "glitch";
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
        return <Aurora {...props} />;
      case "cosmic-waves":
        return <CosmicWaves {...props} />;
      case "digital-tunnel":
        return <DigitalTunnel {...props} />;
      case "glitch":
        return <Glitch {...props} />;
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
