import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useActivityLog } from '@/hooks/useActivityLog';
import { formatDistanceToNow } from 'date-fns';
import { 
  FileText, 
  Trash2, 
  Edit, 
  Plus, 
  Users, 
  Settings,
  Eye,
  Copy,
  Upload
} from 'lucide-react';

interface ActivityLogPanelProps {
  workspaceId: string | null;
}

const getActivityIcon = (actionType: string) => {
  switch (actionType) {
    case 'created':
      return <Plus className="h-4 w-4" />;
    case 'edited':
    case 'updated':
      return <Edit className="h-4 w-4" />;
    case 'deleted':
      return <Trash2 className="h-4 w-4" />;
    case 'viewed':
      return <Eye className="h-4 w-4" />;
    case 'duplicated':
      return <Copy className="h-4 w-4" />;
    case 'uploaded':
      return <Upload className="h-4 w-4" />;
    case 'invited':
      return <Users className="h-4 w-4" />;
    case 'settings':
      return <Settings className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getActivityColor = (actionType: string) => {
  switch (actionType) {
    case 'created':
      return 'bg-green-500/10 text-green-500';
    case 'edited':
    case 'updated':
      return 'bg-blue-500/10 text-blue-500';
    case 'deleted':
      return 'bg-red-500/10 text-red-500';
    case 'viewed':
      return 'bg-gray-500/10 text-gray-500';
    case 'duplicated':
      return 'bg-purple-500/10 text-purple-500';
    case 'invited':
      return 'bg-yellow-500/10 text-yellow-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const ActivityLogPanel = ({ workspaceId }: ActivityLogPanelProps) => {
  const { activities, loading } = useActivityLog(workspaceId);

  if (!workspaceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Select a workspace to view activity</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions in this workspace</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No activity yet
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.profiles.avatar_url || undefined} />
                  <AvatarFallback>
                    {(activity.profiles.display_name || activity.profiles.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {activity.profiles.display_name || activity.profiles.email}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getActivityColor(activity.action_type)}`}
                    >
                      <span className="mr-1">{getActivityIcon(activity.action_type)}</span>
                      {activity.action_type}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {activity.resource_type === 'project' && (
                      <>
                        {activity.action_type} {activity.resource_type}
                        {activity.resource_name && (
                          <span className="font-medium text-foreground ml-1">
                            "{activity.resource_name}"
                          </span>
                        )}
                      </>
                    )}
                    {activity.resource_type === 'member' && (
                      <>invited member to workspace</>
                    )}
                    {activity.resource_type === 'workspace' && (
                      <>updated workspace settings</>
                    )}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
