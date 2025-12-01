import { motion } from "framer-motion";

interface Dot {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

interface FloatingDotsProps {
  count?: number;
  className?: string;
}

export default function FloatingDots({ count = 80, className = "" }: FloatingDotsProps) {
  const dots: Dot[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1.5,
    opacity: Math.random() * 0.5 + 0.2,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Edge fade overlay - creates soft opacity on edges */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 30%, hsl(var(--background)) 70%),
            linear-gradient(to top, hsl(var(--background)) 0%, transparent 15%),
            linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 15%),
            linear-gradient(to left, hsl(var(--background)) 0%, transparent 10%),
            linear-gradient(to right, hsl(var(--background)) 0%, transparent 10%)
          `
        }}
      />
      
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            opacity: dot.opacity,
          }}
          animate={{
            x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
            y: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
          }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
