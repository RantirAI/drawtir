import { motion } from "framer-motion";
import { MousePointer2, Pointer, Hand } from "lucide-react";

const cursors = [
  { Icon: MousePointer2, x: 15, y: 25, delay: 0 },
  { Icon: Pointer, x: 85, y: 35, delay: 1.5 },
  { Icon: Hand, x: 10, y: 70, delay: 3 },
  { Icon: MousePointer2, x: 90, y: 65, delay: 2 },
  { Icon: Pointer, x: 75, y: 20, delay: 4 },
];

export default function FloatingCursors() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {cursors.map((cursor, index) => (
        <motion.div
          key={index}
          className="absolute text-foreground/15"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
          }}
          animate={{
            x: [0, 15, -10, 5, 0],
            y: [0, -10, 15, -5, 0],
            rotate: [0, 5, -5, 3, 0],
          }}
          transition={{
            duration: 25,
            delay: cursor.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <cursor.Icon size={24} />
        </motion.div>
      ))}
    </div>
  );
}
