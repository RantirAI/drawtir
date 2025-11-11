import React from "react";
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
import type { Element } from "@/types/elements";

// Sample globe connection data
const SAMPLE_GLOBE_ARCS = [
  { order: 1, startLat: -19.885592, startLng: -43.951191, endLat: -22.9068, endLng: -43.1729, arcAlt: 0.1, color: "#06b6d4" },
  { order: 1, startLat: 28.6139, startLng: 77.209, endLat: 3.139, endLng: 101.6869, arcAlt: 0.2, color: "#3b82f6" },
  { order: 2, startLat: 1.3521, startLng: 103.8198, endLat: 35.6762, endLng: 139.6503, arcAlt: 0.2, color: "#06b6d4" },
  { order: 2, startLat: 51.5072, startLng: -0.1276, endLat: 3.139, endLng: 101.6869, arcAlt: 0.3, color: "#3b82f6" },
  { order: 3, startLat: -33.8688, startLng: 151.2093, endLat: 22.3193, endLng: 114.1694, arcAlt: 0.3, color: "#06b6d4" },
  { order: 3, startLat: 21.3099, startLng: -157.8581, endLat: 40.7128, endLng: -74.006, arcAlt: 0.3, color: "#3b82f6" },
  { order: 4, startLat: 11.986597, startLng: 8.571831, endLat: -15.595412, endLng: -56.05918, arcAlt: 0.5, color: "#06b6d4" },
  { order: 4, startLat: -34.6037, startLng: -58.3816, endLat: 22.3193, endLng: 114.1694, arcAlt: 0.7, color: "#3b82f6" },
  { order: 5, startLat: 14.5995, startLng: 120.9842, endLat: 51.5072, endLng: -0.1276, arcAlt: 0.3, color: "#06b6d4" },
  { order: 5, startLat: 1.3521, startLng: 103.8198, endLat: -33.8688, endLng: 151.2093, arcAlt: 0.2, color: "#3b82f6" },
];

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
    waveStrength = 1.0,
    shape = 2,
    rowOffset = 1,
    faceDecoration = 1,
    doubleSpiral = 1,
    holes = 0,
    raised = 0,
    ridges = 0,
    vertLines = 0,
    height = 1.0,
    turbulence = 1.1,
    scale = 1.0,
    offsetRows = 1,
    bumpStrength = 1.0,
    hatchIntensity = 1.0,
    lightMovement = 1.0,
    particleCount = 700,
    rangeY = 100,
    baseHue = 220,
    rangeSpeed = 1.5,
    baseRadius = 1,
    rangeRadius = 2,
    lineDuration = 10,
    globeColor = "#062056",
    atmosphereColor = "#FFFFFF",
    autoRotateSpeed = 0.5,
    arcTime = 1000,
    pointSize = 4
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

  const mobiusSpiralProps = {
    speed,
    shape,
    rowOffset,
    faceDecoration,
    doubleSpiral,
    holes,
    raised,
    ridges,
    vertLines,
    className: "h-full w-full"
  };

  const fire3DProps = {
    speed,
    intensity,
    height,
    turbulence,
    colorShift,
    className: "h-full w-full"
  };

  const pyramidPatternProps = {
    speed,
    scale,
    offsetRows,
    bumpStrength,
    hatchIntensity,
    lightMovement,
    className: "h-full w-full"
  };

  const vortexProps = {
    particleCount,
    rangeY,
    baseHue,
    baseSpeed: speed,
    rangeSpeed,
    baseRadius,
    rangeRadius,
    backgroundColor: "transparent",
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
    case "cosmic-flow":
      return <CosmicFlowShaders {...cosmicWavesProps} />;
    case "digital-tunnel":
      return <DigitalTunnel {...shaderProps} />;
    case "singularity":
      return <SingularityShaders {...singularityProps} />;
    case "mobius-spiral":
      return <ExtrudedMobiusSpiralShaders {...mobiusSpiralProps} />;
    case "fire-3d":
      return <Fire3DShaders {...fire3DProps} />;
    case "pyramid-pattern":
      return <PyramidPatternShaders {...pyramidPatternProps} />;
    case "vortex":
      return <Vortex {...vortexProps} />;
    case "background-beams":
      return <BackgroundBeams className="h-full w-full" />;
    case "background-lines":
      return <BackgroundLines className="h-full w-full" svgOptions={{ duration: lineDuration }} />;
    case "globe":
      return (
        <World 
          data={SAMPLE_GLOBE_ARCS}
          globeConfig={{
            pointSize,
            globeColor,
            showAtmosphere: true,
            atmosphereColor,
            atmosphereAltitude: 0.1,
            emissive: globeColor,
            emissiveIntensity: 0.1,
            shininess: 0.9,
            polygonColor: "rgba(255,255,255,0.7)",
            ambientLight: "#38bdf8",
            directionalLeftLight: "#ffffff",
            directionalTopLight: "#ffffff",
            pointLight: "#ffffff",
            arcTime,
            arcLength: 0.9,
            rings: 1,
            maxRings: 3,
            autoRotate: true,
            autoRotateSpeed
          }}
        />
      );
    default:
      return null;
  }
};
