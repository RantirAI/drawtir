import { motion } from "framer-motion";

interface FloatingDotsProps {
  className?: string;
}

export default function FloatingDots({ className = "" }: FloatingDotsProps) {
  // Create a grid of dots
  const cols = 30;
  const rows = 20;
  
  const dots = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      dots.push({
        id: `${row}-${col}`,
        x: (col / (cols - 1)) * 100,
        y: (row / (rows - 1)) * 100,
        delay: (row + col) * 0.02,
      });
    }
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Edge fade overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 20%, hsl(var(--background)) 70%),
            linear-gradient(to top, hsl(var(--background)) 0%, transparent 20%),
            linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 20%),
            linear-gradient(to left, hsl(var(--background)) 0%, transparent 15%),
            linear-gradient(to right, hsl(var(--background)) 0%, transparent 15%)
          `
        }}
      />
      
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full bg-white/30"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: 2,
            height: 2,
          }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
