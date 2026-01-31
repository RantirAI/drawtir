import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageCircle, 
  MoreHorizontal, 
  Check, 
  RotateCcw, 
  Trash2, 
  Edit,
  MapPin
} from 'lucide-react';
import { CommentInput } from './CommentInput';
import type { Comment } from '@/hooks/useComments';

interface CommentThreadProps {
  comment: Comment;
  currentUserId: string | null;
  canEdit: boolean;
  workspaceId?: string | null;
  onReply: (parentId: string, content: string) => Promise<void>;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onResolve: (commentId: string, resolved: boolean) => Promise<void>;
}

export const CommentThread = ({
  comment,
  currentUserId,
  canEdit,
  workspaceId,
  onReply,
  onUpdate,
  onDelete,
  onResolve,
}: CommentThreadProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = currentUserId === comment.user_id;
  const hasPosition = comment.position_x !== null && comment.position_y !== null;

  const handleReply = async (content: string) => {
    await onReply(comment.id, content);
    setShowReplyInput(false);
  };

  const handleUpdate = async () => {
    if (editContent.trim() && editContent !== comment.content) {
      await onUpdate(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  // Parse content to render mentions as styled text
  const renderContent = (content: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      parts.push(
        <span key={match.index} className="text-primary font-medium">
          @{match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className={`group ${comment.resolved ? 'opacity-60' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.profiles.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {(comment.profiles.display_name || comment.profiles.email).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">
              {comment.profiles.display_name || comment.profiles.email.split('@')[0]}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {hasPosition && (
              <Badge variant="outline" className="text-xs gap-1 py-0">
                <MapPin className="h-3 w-3" />
                Canvas
              </Badge>
            )}
            {comment.resolved && (
              <Badge variant="secondary" className="text-xs gap-1 py-0 bg-green-500/10 text-green-600">
                <Check className="h-3 w-3" />
                Resolved
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 text-sm bg-background border border-input rounded-md resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdate}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {renderContent(comment.content)}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Reply
            </Button>

            {canEdit && !comment.resolved && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-green-600 hover:text-green-700"
                onClick={() => onResolve(comment.id, true)}
              >
                <Check className="h-3 w-3 mr-1" />
                Resolve
              </Button>
            )}

            {canEdit && comment.resolved && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onResolve(comment.id, false)}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reopen
              </Button>
            )}

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-3">
              <CommentInput
                onSubmit={handleReply}
                placeholder="Write a reply..."
                autoFocus
                workspaceId={workspaceId}
              />
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-border space-y-3">
              {comment.replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  canEdit={canEdit}
                  workspaceId={workspaceId}
                  onReply={onReply}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onResolve={onResolve}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
