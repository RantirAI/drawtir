import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import Kaleidoscope from "@/components/ui/kaleidoscope";
import Ripple from "@/components/ui/ripple";
import Plasma from "@/components/ui/plasma";
import Nebula from "@/components/ui/nebula";
import Matrix from "@/components/ui/matrix";
import Aurora from "@/components/ui/aurora";
import CosmicWaves from "@/components/ui/cosmic-waves";
import DigitalTunnel from "@/components/ui/digital-tunnel";
import Glitch from "@/components/ui/glitch";

interface ShaderConfig {
  type: "kaleidoscope" | "ripple" | "plasma" | "nebula" | "matrix" | "aurora" | "cosmic-waves" | "digital-tunnel" | "glitch";
  name: string;
  description: string;
  defaultProps: {
    speed: number;
    glowIntensity: number;
    colorTint: [number, number, number];
  };
}

interface ShaderPreviewDialogProps {
  shader: ShaderConfig;
  open: boolean;
  onClose: () => void;
  onUse: () => void;
}

export function ShaderPreviewDialog({ shader, open, onClose, onUse }: ShaderPreviewDialogProps) {
  const renderShader = () => {
    const props = shader.defaultProps;
    
    switch (shader.type) {
      case "kaleidoscope":
        return <Kaleidoscope {...props} />;
      case "ripple":
        return <Ripple {...props} />;
      case "plasma":
        return <Plasma {...props} />;
      case "nebula":
        return <Nebula {...props} />;
      case "matrix":
        return <Matrix {...props} />;
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
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <div className="relative w-full h-[70vh] bg-black rounded-lg overflow-hidden">
          {renderShader()}
        </div>
        
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>{shader.name}</DialogTitle>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={onUse}>
              <Sparkles className="w-4 h-4 mr-2" />
              Use This Shader
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
