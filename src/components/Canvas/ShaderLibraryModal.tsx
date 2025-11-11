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
import { Vortex } from "@/components/ui/vortex";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Meteors } from "@/components/ui/meteors";
import { BackgroundLines } from "@/components/ui/background-lines";
import { World } from "@/components/ui/globe";

interface ShaderOption {
  type: "kaleidoscope" | "plasma" | "nebula" | "aurora" | "cosmic-waves" | "cosmic-flow" | "digital-tunnel" | "glitch" | "singularity" | "mobius-spiral" | "fire-3d" | "pyramid-pattern" | "vortex" | "background-beams" | "meteors" | "background-lines" | "globe";
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
    meteorCount?: number;
    lineDuration?: number;
    globeColor?: string;
    atmosphereColor?: string;
    autoRotateSpeed?: number;
    arcTime?: number;
    pointSize?: number;
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
  },
  {
    type: "vortex",
    name: "Vortex",
    description: "Particle-based vortex effect with noise-driven flow and glowing trails",
    defaultProps: {
      speed: 1.0,
      glowIntensity: 1.0,
      colorTint: [1.0, 1.0, 1.0],
      particleCount: 700,
      rangeY: 100,
      baseHue: 220,
      rangeSpeed: 1.5,
      baseRadius: 1,
      rangeRadius: 2
    }
  },
  {
    type: "background-beams",
    name: "Background Beams",
    description: "Animated gradient beams with flowing light paths and radial patterns",
    defaultProps: {
      speed: 1.0,
      glowIntensity: 1.0,
      colorTint: [1.0, 1.0, 1.0]
    }
  },
  {
    type: "meteors",
    name: "Meteors",
    description: "Falling meteor shower effect with animated streaks and trails",
    defaultProps: {
      speed: 1.0,
      glowIntensity: 1.0,
      colorTint: [1.0, 1.0, 1.0],
      meteorCount: 20
    }
  },
  {
    type: "background-lines",
    name: "Background Lines",
    description: "Animated flowing SVG path lines with colorful gradient strokes",
    defaultProps: {
      speed: 1.0,
      glowIntensity: 1.0,
      colorTint: [1.0, 1.0, 1.0],
      lineDuration: 10
    }
  },
  {
    type: "globe",
    name: "3D Globe",
    description: "Interactive 3D globe with animated connection arcs and atmospheric effects",
    defaultProps: {
      speed: 1.0,
      glowIntensity: 1.0,
      colorTint: [1.0, 1.0, 1.0],
      globeColor: "#062056",
      atmosphereColor: "#FFFFFF",
      autoRotateSpeed: 0.5,
      arcTime: 1000,
      pointSize: 4
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
    // Smaller canvas for better performance in grid view
    const commonProps = { 
      className: "w-full h-full rounded-md overflow-hidden",
      style: { width: '80px', height: '80px' }
    };
    
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
      case "vortex":
        return <Vortex {...commonProps} particleCount={200} />;
      case "background-beams":
        return <BackgroundBeams {...commonProps} />;
      case "meteors":
        return <Meteors {...commonProps} number={10} />;
      case "background-lines":
        return <BackgroundLines {...commonProps} svgOptions={{ duration: 5 }} />;
      case "globe":
        return (
          <div {...commonProps}>
            <World 
              data={[
                { order: 1, startLat: 40.7128, startLng: -74.006, endLat: 51.5074, endLng: -0.1278, arcAlt: 0.3, color: "#06b6d4" },
                { order: 1, startLat: 35.6762, startLng: 139.6503, endLat: -33.8688, endLng: 151.2093, arcAlt: 0.4, color: "#3b82f6" },
                { order: 2, startLat: 22.3193, startLng: 114.1694, endLat: 1.3521, endLng: 103.8198, arcAlt: 0.2, color: "#06b6d4" },
              ]}
              globeConfig={{
                pointSize: 2,
                globeColor: "#062056",
                showAtmosphere: true,
                atmosphereColor: "#FFFFFF",
                autoRotate: true,
                autoRotateSpeed: 0.5
              }}
            />
          </div>
        );
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {SHADER_OPTIONS.map((shader) => (
              <Card key={shader.type} className="group border-border/50 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer">
                <div className="flex gap-3 p-3">
                  {/* Preview on left */}
                  <div className="relative rounded-md overflow-hidden border border-border/50 flex-shrink-0" style={{ width: '80px', height: '80px' }}>
                    {renderShaderPreview(shader.type)}
                  </div>
                  
                  {/* Content on right */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex-1">
                      <CardTitle className="text-sm mb-0.5">{shader.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2 group-hover:text-primary-foreground/90">
                        {shader.description}
                      </CardDescription>
                    </div>
                    
                    <div className="flex gap-1.5 mt-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewShader(shader)}
                        className="h-6 text-xs px-2 group-hover:bg-primary-foreground group-hover:text-primary group-hover:border-primary-foreground"
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          onSelect(shader);
                          onClose();
                        }}
                        className="h-6 text-xs px-2 group-hover:bg-primary-foreground group-hover:text-primary"
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                </div>
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
