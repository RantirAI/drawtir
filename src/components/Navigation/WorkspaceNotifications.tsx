import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceInvitations } from '@/hooks/useWorkspaceInvitations';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export const WorkspaceNotifications = () => {
  const { invitations, acceptInvitation, declineInvitation } = useWorkspaceInvitations();

  const handleAccept = async (invitationId: string, workspaceId: string, workspaceName: string) => {
    const success = await acceptInvitation(invitationId, workspaceId);
    if (success) {
      toast.success(`Joined workspace: ${workspaceName}`);
    } else {
      toast.error('Failed to accept invitation');
    }
  };

  const handleDecline = async (invitationId: string) => {
    const success = await declineInvitation(invitationId);
    if (success) {
      toast.success('Invitation declined');
    } else {
      toast.error('Failed to decline invitation');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {invitations.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {invitations.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Workspace Invitations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {invitations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No pending invitations
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-3 border-b last:border-0">
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-sm">
                      {invitation.workspaces?.name || 'Workspace'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Invited by {
                        invitation.inviter?.display_name || 
                        (invitation.inviter?.first_name && invitation.inviter?.last_name 
                          ? `${invitation.inviter.first_name} ${invitation.inviter.last_name}`
                          : invitation.inviter?.email || 'Unknown')
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Role: <span className="font-medium">{invitation.role}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAccept(invitation.id, invitation.workspace_id, invitation.workspaces?.name || 'Workspace')}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDecline(invitation.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
