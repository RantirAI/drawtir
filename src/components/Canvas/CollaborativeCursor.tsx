import { memo } from 'react';
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

  return (
    <div
      className="pointer-events-none fixed z-[9999] transition-all duration-100 ease-out"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}
      >
        <path
          d="M5.65376 12.3673L8.70026 19.8476C8.86576 20.2859 9.39426 20.4423 9.77326 20.1636L12.9753 17.9415L15.3673 23.4674C15.5318 23.8982 16.0596 24.0508 16.4577 23.7915L18.6364 22.4009C19.0346 22.1416 19.1441 21.6133 18.8773 21.2406L16.4853 16.7147L20.2349 16.4282C20.6639 16.3952 20.9359 15.9431 20.7704 15.5448L13.6299 0.999979C13.4644 0.601691 12.9366 0.449369 12.5384 0.708641L0.999979 8.83166C0.601691 9.09094 0.57791 9.67589 0.963669 9.96984L5.65376 12.3673Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* User info badge */}
      <div
        className="ml-6 -mt-1 flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm"
        style={{
          backgroundColor: user.color,
        }}
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
      </div>
    </div>
  );
});

CollaborativeCursor.displayName = 'CollaborativeCursor';
