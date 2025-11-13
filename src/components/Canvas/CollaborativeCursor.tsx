import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserPresence } from '@/hooks/useCollaborativePresence';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface CollaborativeCursorProps {
  user: UserPresence;
  zoom: number;
  panOffset: { x: number; y: number };
}

export const CollaborativeCursor = memo(({ user, zoom, panOffset }: CollaborativeCursorProps) => {
  // Transform cursor position based on canvas pan and zoom
  const x = user.cursorX * zoom + panOffset.x;
  const y = user.cursorY * zoom + panOffset.y;

  // Don't render if cursor is off-screen (initial state)
  if (user.cursorX < 0 || user.cursorY < 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="pointer-events-none fixed z-[9999]"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          x: 0,
          y: 0,
        }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.5,
        }}
      >
        {/* Cursor SVG */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="-translate-x-[12px] -translate-y-[10px] -rotate-[70deg] transform drop-shadow-lg"
        >
          <path
            d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"
            fill={user.color}
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>

        {/* User info badge */}
        <motion.div
          className="ml-6 -mt-1 flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm"
          style={{
            backgroundColor: user.color,
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          {user.avatarUrl && (
            <Avatar className="h-4 w-4 border border-white/50">
              <AvatarImage src={user.avatarUrl} alt={user.displayName} />
              <AvatarFallback className="text-[8px]">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="whitespace-nowrap">{user.displayName}</span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

CollaborativeCursor.displayName = 'CollaborativeCursor';
