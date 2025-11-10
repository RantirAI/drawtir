import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Sparkles } from "lucide-react";
import { useState } from "react";
import { ShaderPreviewDialog } from "./ShaderPreviewDialog";

interface ShaderOption {
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
    defaultProps: { speed: 1.0, glowIntensity: 1.8, colorTint: [1.0, 3.0, 5.0] }
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
  }
];

interface ShaderLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (shaderConfig: ShaderOption) => void;
}

export function ShaderLibraryModal({ open, onClose, onSelect }: ShaderLibraryModalProps) {
  const [previewShader, setPreviewShader] = useState<ShaderOption | null>(null);

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
                <CardHeader>
                  <CardTitle className="text-lg">{shader.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {shader.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPreviewShader(shader)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      onSelect(shader);
                      onClose();
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Use Shader
                  </Button>
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
