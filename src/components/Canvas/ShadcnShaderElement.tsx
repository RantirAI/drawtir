import React from "react";
import Kaleidoscope from "@/components/ui/kaleidoscope";
import Ripple from "@/components/ui/ripple";
import Plasma from "@/components/ui/plasma";
import Nebula from "@/components/ui/nebula";
import Matrix from "@/components/ui/matrix";
import Aurora from "@/components/ui/aurora";
import CosmicWaves from "@/components/ui/cosmic-waves";
import DigitalTunnel from "@/components/ui/digital-tunnel";
import Glitch from "@/components/ui/glitch";
import type { Element } from "@/types/elements";

interface ShadcnShaderElementProps {
  element: Element;
}

export const ShadcnShaderElement: React.FC<ShadcnShaderElementProps> = ({ element }) => {
  if (!element.shader) return null;

  const { 
    type, 
    speed = 1.0, 
    glowIntensity = 1.0, 
    colorTint = [1.0, 2.0, 9.0],
    amplitude = 1.0,
    frequency = 1.0,
    starDensity = 1.0,
    colorShift = 1.0
  } = element.shader;

  const shaderProps = {
    speed,
    glowIntensity,
    colorTint: colorTint as [number, number, number],
    amplitude,
    frequency,
    starDensity,
    colorShift
  };

  switch (type) {
    case "kaleidoscope":
      return <Kaleidoscope {...shaderProps} />;
    case "ripple":
      return <Ripple {...shaderProps} />;
    case "plasma":
      return <Plasma {...shaderProps} />;
    case "nebula":
      return <Nebula {...shaderProps} />;
    case "matrix":
      return <Matrix {...shaderProps} />;
    case "aurora":
      return <Aurora {...shaderProps} />;
    case "cosmic-waves":
      return <CosmicWaves {...shaderProps} />;
    case "digital-tunnel":
      return <DigitalTunnel {...shaderProps} />;
    case "glitch":
      return <Glitch {...shaderProps} />;
    default:
      return null;
  }
};
