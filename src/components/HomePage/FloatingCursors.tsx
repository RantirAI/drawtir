import { motion } from "framer-motion";
import cursorBlue from "@/assets/cursor-blue.svg";
import cursorPurple from "@/assets/cursor-purple.svg";
import cursorLightBlue from "@/assets/cursor-light-blue.svg";

const cursors = [
  { src: cursorBlue, x: 12, y: 20, delay: 0, scale: 0.7 },
  { src: cursorPurple, x: 88, y: 30, delay: 1.5, scale: 0.6 },
  { src: cursorLightBlue, x: 8, y: 65, delay: 3, scale: 0.65 },
  { src: cursorBlue, x: 92, y: 60, delay: 2, scale: 0.55 },
  { src: cursorPurple, x: 78, y: 15, delay: 4, scale: 0.7 },
  { src: cursorLightBlue, x: 20, y: 80, delay: 2.5, scale: 0.5 },
];

export default function FloatingCursors() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {cursors.map((cursor, index) => (
        <motion.img
          key={index}
          src={cursor.src}
          alt=""
          className="absolute"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            width: `${cursor.scale * 67}px`,
            height: "auto",
          }}
          animate={{
            x: [0, 15, -10, 5, 0],
            y: [0, -10, 15, -5, 0],
            rotate: [0, 3, -3, 2, 0],
          }}
          transition={{
            duration: 25,
            delay: cursor.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
