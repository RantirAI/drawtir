import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Comment {
  id: string;
  poster_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  position_x: number | null;
  position_y: number | null;
  frame_id: string | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

export interface CreateCommentData {
  content: string;
  parent_id?: string;
  position_x?: number;
  position_y?: number;
  frame_id?: string;
}

export const useComments = (posterId: string | null) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!posterId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('poster_comments')
        .select(`
          *,
          profiles!poster_comments_user_id_fkey (
            display_name,
            email,
            avatar_url
          )
        `)
        .eq('poster_id', posterId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize into threads (top-level comments with nested replies)
      const commentMap = new Map<string, Comment>();
      const topLevelComments: Comment[] = [];

      (data || []).forEach((comment: any) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      commentMap.forEach((comment) => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          const parent = commentMap.get(comment.parent_id)!;
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        } else if (!comment.parent_id) {
          topLevelComments.push(comment);
        }
      });

      setComments(topLevelComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [posterId]);

  const addComment = async (data: CreateCommentData): Promise<Comment | null> => {
    if (!posterId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newComment, error } = await supabase
        .from('poster_comments')
        .insert({
          poster_id: posterId,
          user_id: user.id,
          content: data.content,
          parent_id: data.parent_id || null,
          position_x: data.position_x || null,
          position_y: data.position_y || null,
          frame_id: data.frame_id || null,
        })
        .select(`
          *,
          profiles!poster_comments_user_id_fkey (
            display_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Extract and insert mentions from content
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const mentions: { comment_id: string; mentioned_user_id: string }[] = [];
      let match;
      while ((match = mentionRegex.exec(data.content)) !== null) {
        mentions.push({
          comment_id: newComment.id,
          mentioned_user_id: match[2],
        });
      }

      if (mentions.length > 0) {
        await supabase.from('comment_mentions').insert(mentions);
      }

      await fetchComments();
      return newComment as Comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  };

  const updateComment = async (commentId: string, content: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('poster_comments')
        .update({ content })
        .eq('id', commentId);

      if (error) throw error;
      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      return false;
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('poster_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  };

  const resolveComment = async (commentId: string, resolved: boolean): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('poster_comments')
        .update({
          resolved,
          resolved_by: resolved ? user.id : null,
          resolved_at: resolved ? new Date().toISOString() : null,
        })
        .eq('id', commentId);

      if (error) throw error;
      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error resolving comment:', error);
      return false;
    }
  };

  const getUnresolvedCount = useCallback(() => {
    return comments.filter(c => !c.resolved).length;
  }, [comments]);

  useEffect(() => {
    fetchComments();

    if (!posterId) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments-${posterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poster_comments',
          filter: `poster_id=eq.${posterId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [posterId, fetchComments]);

  return {
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    getUnresolvedCount,
    refetch: fetchComments,
  };
};
