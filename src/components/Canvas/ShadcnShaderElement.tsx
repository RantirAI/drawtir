import React from "react";
import Kaleidoscope from "@/components/ui/kaleidoscope";
import Plasma from "@/components/ui/plasma";
import Nebula from "@/components/ui/nebula";
import AuroraShaders from "@/components/ui/shadcn-io/aurora-shaders";
import { CosmicWavesShaders } from "@/components/ui/shadcn-io/cosmic-waves-shaders";
import DigitalTunnel from "@/components/ui/digital-tunnel";
import Glitch from "@/components/ui/glitch";
import { SingularityShaders } from "@/components/ui/shadcn-io/singularity-shaders";
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
    amplitude = 1.2,
    frequency = 0.8,
    starDensity = 1.0,
    colorShift = 1.0,
    intensity = 1.2,
    vibrancy = 1.1,
    stretch = 1.5,
    size = 1.1,
    waveStrength = 1.0
  } = element.shader;

  const shaderProps = {
    speed,
    glowIntensity,
    colorTint: colorTint as [number, number, number],
  };

  const cosmicWavesProps = {
    speed,
    amplitude,
    frequency,
    starDensity,
    colorShift,
    className: "h-full w-full"
  };

  const auroraProps = {
    speed,
    intensity,
    vibrancy,
    frequency,
    stretch,
    className: "h-full w-full"
  };

  const singularityProps = {
    speed,
    intensity,
    size,
    waveStrength,
    colorShift,
    className: "h-full w-full"
  };

  switch (type) {
    case "kaleidoscope":
      return <Kaleidoscope {...shaderProps} />;
    case "plasma":
      return <Plasma {...shaderProps} />;
    case "nebula":
      return <Nebula {...shaderProps} />;
    case "aurora":
      return <AuroraShaders {...auroraProps} />;
    case "cosmic-waves":
      return <CosmicWavesShaders {...cosmicWavesProps} />;
    case "digital-tunnel":
      return <DigitalTunnel {...shaderProps} />;
    case "glitch":
      return <Glitch {...shaderProps} />;
    case "singularity":
      return <SingularityShaders {...singularityProps} />;
    default:
      return null;
  }
};
