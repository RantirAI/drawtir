import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, X } from 'lucide-react';
import { CommentInput } from './CommentInput';
import { CommentThread } from './CommentThread';
import { useComments } from '@/hooks/useComments';

interface CommentsPanelProps {
  posterId: string;
  workspaceId?: string | null;
  currentUserId: string | null;
  canEdit: boolean;
  onClose: () => void;
}

export const CommentsPanel = ({
  posterId,
  workspaceId,
  currentUserId,
  canEdit,
  onClose,
}: CommentsPanelProps) => {
  const {
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    getUnresolvedCount,
  } = useComments(posterId);

  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const handleAddComment = async (content: string) => {
    await addComment({ content });
  };

  const handleReply = async (parentId: string, content: string) => {
    await addComment({ content, parent_id: parentId });
  };

  const handleUpdate = async (commentId: string, content: string) => {
    await updateComment(commentId, content);
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
  };

  const handleResolve = async (commentId: string, resolved: boolean) => {
    await resolveComment(commentId, resolved);
  };

  const filteredComments = comments.filter((c) => {
    if (filter === 'open') return !c.resolved;
    if (filter === 'resolved') return c.resolved;
    return true;
  });

  const unresolvedCount = getUnresolvedCount();

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="font-semibold">Comments</h3>
          {unresolvedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unresolvedCount} open
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="px-4 pt-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 text-xs">
              All ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="open" className="flex-1 text-xs">
              Open ({unresolvedCount})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex-1 text-xs">
              Resolved ({comments.length - unresolvedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Comments list */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-12 w-full bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {filter === 'all'
                  ? 'No comments yet'
                  : filter === 'open'
                  ? 'No open comments'
                  : 'No resolved comments'}
              </p>
              {filter === 'all' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Be the first to add a comment
                </p>
              )}
            </div>
          ) : (
            filteredComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                canEdit={canEdit}
                workspaceId={workspaceId}
                onReply={handleReply}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onResolve={handleResolve}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* New comment input */}
      <div className="p-4 border-t border-border">
        <CommentInput
          onSubmit={handleAddComment}
          placeholder="Add a comment..."
          workspaceId={workspaceId}
        />
      </div>
    </div>
  );
};
