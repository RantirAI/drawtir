import { useEffect, useState } from "react";

interface RulerOverlayProps {
  zoom: number;
  showRulers: boolean;
}

export default function RulerOverlay({ zoom, showRulers }: RulerOverlayProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!showRulers) return null;

  const rulerSize = 20;
  const majorTickInterval = 100;
  const minorTickInterval = 10;

  const generateTicks = (length: number, isVertical: boolean) => {
    const ticks = [];
    const maxTicks = Math.ceil(length / (zoom * minorTickInterval));

    for (let i = 0; i <= maxTicks; i++) {
      const position = i * minorTickInterval * zoom;
      const isMajor = i % (majorTickInterval / minorTickInterval) === 0;

      ticks.push(
        <g key={i}>
          {isVertical ? (
            <>
              <line
                x1={rulerSize - (isMajor ? 8 : 4)}
                y1={position}
                x2={rulerSize}
                y2={position}
                stroke="currentColor"
                strokeWidth="1"
                opacity={isMajor ? 1 : 0.5}
              />
              {isMajor && (
                <text
                  x={rulerSize - 12}
                  y={position + 4}
                  fontSize="10"
                  fill="currentColor"
                  textAnchor="end"
                >
                  {i * minorTickInterval}
                </text>
              )}
            </>
          ) : (
            <>
              <line
                x1={position}
                y1={rulerSize - (isMajor ? 8 : 4)}
                x2={position}
                y2={rulerSize}
                stroke="currentColor"
                strokeWidth="1"
                opacity={isMajor ? 1 : 0.5}
              />
              {isMajor && (
                <text
                  x={position}
                  y={rulerSize - 4}
                  fontSize="10"
                  fill="currentColor"
                  textAnchor="middle"
                >
                  {i * minorTickInterval}
                </text>
              )}
            </>
          )}
        </g>
      );
    }

    return ticks;
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {/* Horizontal Ruler */}
      <svg
        className="absolute top-0 left-0 right-0"
        height={rulerSize}
        style={{ 
          backgroundColor: 'hsl(var(--background))',
          borderBottom: '1px solid hsl(var(--border))'
        }}
      >
        <g className="text-foreground">{generateTicks(dimensions.width, false)}</g>
      </svg>

      {/* Vertical Ruler */}
      <svg
        className="absolute top-0 left-0 bottom-0"
        width={rulerSize}
        style={{ 
          backgroundColor: 'hsl(var(--background))',
          borderRight: '1px solid hsl(var(--border))'
        }}
      >
        <g className="text-foreground">{generateTicks(dimensions.height, true)}</g>
      </svg>

      {/* Corner square */}
      <div
        className="absolute top-0 left-0 bg-background border-r border-b border-border"
        style={{
          width: rulerSize,
          height: rulerSize,
        }}
      />
    </div>
  );
}
