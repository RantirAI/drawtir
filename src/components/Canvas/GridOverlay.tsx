interface GridOverlayProps {
  zoom: number;
  panOffset: { x: number; y: number };
}

export default function GridOverlay({ zoom, panOffset }: GridOverlayProps) {
  const gridSize = 10;
  const visibleGridSize = gridSize * zoom;

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
        `,
        backgroundSize: `${visibleGridSize}px ${visibleGridSize}px`,
        backgroundPosition: `${panOffset.x % visibleGridSize}px ${panOffset.y % visibleGridSize}px`,
        opacity: 0.3,
      }}
    />
  );
}
