import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Sparkles } from "lucide-react";
import { useState } from "react";
import { ShaderPreviewDialog } from "./ShaderPreviewDialog";
import { Kaleidoscope } from "@/components/ui/kaleidoscope";
import { Plasma } from "@/components/ui/plasma";
import { Nebula } from "@/components/ui/nebula";
import { Aurora } from "@/components/ui/aurora";
import { CosmicWaves } from "@/components/ui/cosmic-waves";
import { CosmicFlowShaders } from "@/components/ui/shadcn-io/cosmic-flow-shaders";
import { DigitalTunnel } from "@/components/ui/digital-tunnel";
import { Glitch } from "@/components/ui/glitch";
import { SingularityShaders } from "@/components/ui/shadcn-io/singularity-shaders";
import { ExtrudedMobiusSpiralShaders } from "@/components/ui/shadcn-io/extruded-mobius-spiral-shaders";
import { Fire3DShaders } from "@/components/ui/shadcn-io/fire-3d-shaders";
import { PyramidPatternShaders } from "@/components/ui/shadcn-io/pyramid-pattern-shaders";

interface ShaderOption {
  type: "kaleidoscope" | "plasma" | "nebula" | "aurora" | "cosmic-waves" | "cosmic-flow" | "digital-tunnel" | "glitch" | "singularity" | "mobius-spiral" | "fire-3d" | "pyramid-pattern";
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
  };
}

const SHADER_OPTIONS: ShaderOption[] = [
  {
    type: "kaleidoscope",
    name: "Kaleidoscope",
    description: "Dynamic animated kaleidoscope with rotating layers and wave synthesis",
    defaultProps: { speed: 1.0, glowIntensity: 1.5, colorTint: [1.0, 2.0, 9.0] }
  },
  {
    type: "plasma",
    name: "Plasma",
    description: "Organic energy effects with flowing plasma patterns and smooth color cycling",
    defaultProps: { speed: 1.0, glowIntensity: 1.2, colorTint: [3.0, 5.0, 7.0] }
  },
  {
    type: "nebula",
    name: "Nebula",
    description: "Procedural cosmic clouds with fractal structures and animated star fields",
    defaultProps: { speed: 1.0, glowIntensity: 1.3, colorTint: [2.0, 3.0, 6.0] }
  },
  {
    type: "aurora",
    name: "Aurora",
    description: "Flowing northern lights with fractal noise patterns and atmospheric colors",
    defaultProps: { 
      speed: 0.8, 
      glowIntensity: 1.8, 
      colorTint: [1.0, 3.0, 5.0],
      intensity: 1.2,
      vibrancy: 1.1,
      frequency: 1.0,
      stretch: 1.5
    }
  },
  {
    type: "cosmic-waves",
    name: "Cosmic Waves",
    description: "Flowing cosmic ocean patterns with multi-layer waves and starfields",
    defaultProps: { 
      speed: 1.0, 
      glowIntensity: 1.4, 
      colorTint: [2.0, 4.0, 6.0],
      amplitude: 1.2,
      frequency: 0.8,
      starDensity: 1.0,
      colorShift: 1.0
    }
  },
  {
    type: "cosmic-flow",
    name: "Cosmic Flow",
    description: "Flowing cosmic gradients with fractal noise and dynamic color cycling",
    defaultProps: { 
      speed: 1.0, 
      glowIntensity: 1.0, 
      colorTint: [1.0, 1.0, 1.0],
      amplitude: 1.2,
      frequency: 0.8,
      starDensity: 1.0,
      colorShift: 1.0
    }
  },
  {
    type: "digital-tunnel",
    name: "Digital Tunnel",
    description: "Infinite 3D tunnel with neon rings and particle flows using raymarching",
    defaultProps: { speed: 1.0, glowIntensity: 1.6, colorTint: [0.0, 0.5, 1.0] }
  },
  {
    type: "glitch",
    name: "Glitch",
    description: "Digital corruption effects with chromatic aberration and cyberpunk glitch",
    defaultProps: { speed: 1.0, glowIntensity: 1.2, colorTint: [1.0, 0.0, 1.0] }
  },
  {
    type: "singularity",
    name: "Singularity",
    description: "Blackhole gravitational lensing with accretion disk and photon sphere",
    defaultProps: { 
      speed: 1.0, 
      glowIntensity: 1.5, 
      colorTint: [1.0, 0.6, 0.2],
      intensity: 1.2,
      size: 1.1,
      waveStrength: 1.0,
      colorShift: 1.0
    }
  },
  {
    type: "mobius-spiral",
    name: "Mobius Spiral",
    description: "Raymarched 3D extruded Mobius spiral with complex transformations",
    defaultProps: {
      speed: 1.0,
      glowIntensity: 1.0,
      colorTint: [1.0, 1.0, 1.0],
      shape: 2,
      rowOffset: 1,
      faceDecoration: 1,
      doubleSpiral: 1,
      holes: 0,
      raised: 0,
      ridges: 0,
      vertLines: 0
    }
  },
  {
    type: "fire-3d",
    name: "Fire 3D",
    description: "Volumetric raymarched 3D fire with turbulence and realistic flame dynamics",
    defaultProps: {
      speed: 1.0,
      glowIntensity: 1.0,
      colorTint: [1.0, 1.0, 1.0],
      intensity: 1.2,
      height: 1.0,
      turbulence: 1.1,
      colorShift: 1.0
    }
  },
  {
    type: "pyramid-pattern",
    name: "Pyramid Pattern",
    description: "3D pyramid grid with bump mapping, dynamic lighting, and animated patterns",
    defaultProps: {
      speed: 1.0,
      glowIntensity: 1.0,
      colorTint: [1.0, 1.0, 1.0],
      scale: 1.0,
      offsetRows: 1,
      bumpStrength: 1.0,
      hatchIntensity: 1.0,
      lightMovement: 1.0
    }
  }
];

interface ShaderLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (shaderConfig: ShaderOption) => void;
}

export function ShaderLibraryModal({ open, onClose, onSelect }: ShaderLibraryModalProps) {
  const [previewShader, setPreviewShader] = useState<ShaderOption | null>(null);

  const renderShaderPreview = (type: ShaderOption['type']) => {
    const commonProps = { className: "w-full h-24 rounded-md overflow-hidden" };
    
    switch (type) {
      case "kaleidoscope":
        return <Kaleidoscope {...commonProps} />;
      case "plasma":
        return <Plasma {...commonProps} />;
      case "nebula":
        return <Nebula {...commonProps} />;
      case "aurora":
        return <Aurora {...commonProps} />;
      case "cosmic-waves":
        return <CosmicWaves {...commonProps} />;
      case "cosmic-flow":
        return <CosmicFlowShaders {...commonProps} />;
      case "digital-tunnel":
        return <DigitalTunnel {...commonProps} />;
      case "glitch":
        return <Glitch {...commonProps} />;
      case "singularity":
        return <SingularityShaders {...commonProps} />;
      case "mobius-spiral":
        return <ExtrudedMobiusSpiralShaders {...commonProps} />;
      case "fire-3d":
        return <Fire3DShaders {...commonProps} />;
      case "pyramid-pattern":
        return <PyramidPatternShaders {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Shader Library
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {SHADER_OPTIONS.map((shader) => (
              <Card key={shader.type} className="border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{shader.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {shader.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative rounded-md overflow-hidden border border-border/50">
                    {renderShaderPreview(shader.type)}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewShader(shader)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onSelect(shader);
                        onClose();
                      }}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Use Shader
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {previewShader && (
        <ShaderPreviewDialog
          shader={previewShader}
          open={!!previewShader}
          onClose={() => setPreviewShader(null)}
          onUse={(customProps) => {
            const shaderWithCustomProps = { ...previewShader, defaultProps: customProps };
            onSelect(shaderWithCustomProps);
            setPreviewShader(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
