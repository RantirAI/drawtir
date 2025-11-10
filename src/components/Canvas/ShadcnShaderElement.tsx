import React from "react";
import Kaleidoscope from "@/components/ui/kaleidoscope";
import Plasma from "@/components/ui/plasma";
import Nebula from "@/components/ui/nebula";
import Aurora from "@/components/ui/aurora";
import { CosmicWavesShaders } from "@/components/ui/shadcn-io/cosmic-waves-shaders";
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
    amplitude = 1.2,
    frequency = 0.8,
    starDensity = 1.0,
    colorShift = 1.0
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

  switch (type) {
    case "kaleidoscope":
      return <Kaleidoscope {...shaderProps} />;
    case "plasma":
      return <Plasma {...shaderProps} />;
    case "nebula":
      return <Nebula {...shaderProps} />;
    case "aurora":
      return <Aurora {...shaderProps} />;
    case "cosmic-waves":
      return <CosmicWavesShaders {...cosmicWavesProps} />;
    case "digital-tunnel":
      return <DigitalTunnel {...shaderProps} />;
    case "glitch":
      return <Glitch {...shaderProps} />;
    default:
      return null;
  }
};
