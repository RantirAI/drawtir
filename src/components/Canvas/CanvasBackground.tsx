import { useState } from "react";

type BackgroundPattern = "dots" | "lines";

interface CanvasBackgroundProps {
  pattern?: BackgroundPattern;
}

export default function CanvasBackground({ pattern = "dots" }: CanvasBackgroundProps) {
  return (
    <div className="absolute inset-0 -z-10">
      {pattern === "dots" ? (
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="hsl(var(--border))" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="hsl(var(--background))" />
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      ) : (
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="hsl(var(--background))" />
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      )}
    </div>
  );
}
