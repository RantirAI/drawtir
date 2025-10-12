import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GradientStop {
  color: string;
  position: number;
  opacity?: number;
}

// Helper function to convert hex to rgba
function hexToRgba(hex: string, opacity: number = 100): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const alpha = opacity / 100;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateGradientCSS(
  type: "linear" | "radial",
  angle: number,
  stops: GradientStop[]
): string {
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const colorStops = sortedStops.map(stop => {
    const color = stop.opacity !== undefined && stop.opacity < 100
      ? hexToRgba(stop.color, stop.opacity)
      : stop.color;
    return `${color} ${stop.position}%`;
  }).join(", ");
  
  if (type === "linear") {
    return `linear-gradient(${angle}deg, ${colorStops})`;
  } else {
    return `radial-gradient(circle, ${colorStops})`;
  }
}

export function getFitStyle(fit: "fill" | "contain" | "cover" | "crop"): {
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
} {
  switch (fit) {
    case "fill":
      return {
        backgroundSize: "100% 100%", // Stretch to fill
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      };
    case "contain":
      return {
        backgroundSize: "contain", // Fit inside, maintain aspect ratio
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      };
    case "cover":
      return {
        backgroundSize: "cover", // Cover entire area, maintain aspect ratio
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      };
    case "crop":
      return {
        backgroundSize: "auto 100%", // Crop mode: fit height, allow horizontal overflow
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      };
    default:
      return {
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      };
  }
}

export function getObjectFitStyle(fit: "fill" | "contain" | "cover" | "crop"): string {
  switch (fit) {
    case "fill":
      return "fill"; // Stretch to fill
    case "contain":
      return "contain"; // Fit inside, maintain aspect ratio
    case "cover":
      return "cover"; // Cover entire area, maintain aspect ratio
    case "crop":
      return "none"; // Show at original size (will be clipped)
    default:
      return "cover";
  }
}
