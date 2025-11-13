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
    <div className="flex items-center gap-2 rounded-lg bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm border border-border">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">
        {allUsers.length} {allUsers.length === 1 ? 'user' : 'users'}
      </span>
      
      <div className="flex -space-x-2">
        <TooltipProvider>
          {allUsers.slice(0, 5).map((user, index) => (
            <Tooltip key={user.userId}>
              <TooltipTrigger asChild>
                <div
                  className="relative"
                  style={{ zIndex: allUsers.length - index }}
                >
                  <Avatar 
                    className="h-8 w-8 border-2 ring-2 ring-background"
                    style={{
                      borderColor: user.color,
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
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
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
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-background">
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
  );
});

CollaborativeUsersBar.displayName = 'CollaborativeUsersBar';
