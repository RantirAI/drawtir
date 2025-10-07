import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GradientStop {
  color: string;
  position: number;
}

export function generateGradientCSS(
  type: "linear" | "radial",
  angle: number,
  stops: GradientStop[]
): string {
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const colorStops = sortedStops.map(stop => `${stop.color} ${stop.position}%`).join(", ");
  
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
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      };
    case "contain":
      return {
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      };
    case "cover":
      return {
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      };
    case "crop":
      return {
        backgroundSize: "100%",
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
