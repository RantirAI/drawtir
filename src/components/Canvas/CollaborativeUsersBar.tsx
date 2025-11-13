import { memo } from 'react';
import type { UserPresence } from '@/hooks/useCollaborativePresence';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users } from 'lucide-react';

interface CollaborativeUsersBarProps {
  activeUsers: UserPresence[];
  currentUser: { id: string; name: string; avatar: string | null } | null;
}

export const CollaborativeUsersBar = memo(({ activeUsers, currentUser }: CollaborativeUsersBarProps) => {
  if (!currentUser) return null;

  const allUsers = [
    {
      userId: currentUser.id,
      displayName: 'You',
      avatarUrl: currentUser.avatar,
      color: 'hsl(var(--primary))',
    },
    ...activeUsers,
  ];

  return (
    <div className="relative">
      {/* Glow effects behind each avatar */}
      <div className="absolute inset-0 -z-10">
        {allUsers.slice(0, 5).map((user, index) => (
          <div
            key={user.userId}
            className="absolute blur-2xl scale-150 opacity-40 w-12 h-12 rounded-full transition-all duration-300"
            style={{
              backgroundColor: user.color,
              left: `${index * 40 + 40}px`,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
        ))}
      </div>
      
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-background/40 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(59,130,246,0.2)]">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {allUsers.length} {allUsers.length === 1 ? 'user' : 'users'}
        </span>
        
        <div className="flex gap-2">
          <TooltipProvider>
            {allUsers.slice(0, 5).map((user, index) => (
              <Tooltip key={user.userId}>
                <TooltipTrigger asChild>
                  <div
                    className="relative transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                    style={{ zIndex: allUsers.length - index }}
                  >
                    <Avatar 
                      className="h-8 w-8 border-2 ring-2 ring-background/50"
                      style={{
                        borderColor: user.color,
                        boxShadow: `0 0 20px ${user.color}40`,
                      }}
                    >
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
                      <AvatarFallback 
                        className="text-xs font-semibold"
                        style={{
                          backgroundColor: user.color,
                          color: 'white',
                        }}
                      >
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.userId === currentUser.id && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background animate-pulse" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs font-medium">{user.displayName}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            
            {allUsers.length > 5 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-background/50 transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                    +{allUsers.length - 5}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs font-medium">
                    {allUsers.slice(5).map(u => u.displayName).join(', ')}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
});

CollaborativeUsersBar.displayName = 'CollaborativeUsersBar';
