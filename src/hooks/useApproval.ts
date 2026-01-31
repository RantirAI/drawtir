import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ApprovalStatus = 'draft' | 'pending_review' | 'changes_requested' | 'approved' | 'published';

export interface Approval {
  id: string;
  poster_id: string;
  status: ApprovalStatus;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  submitted_by_profile?: {
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  reviewed_by_profile?: {
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export const useApproval = (posterId: string | null) => {
  const [approval, setApproval] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApproval = useCallback(async () => {
    if (!posterId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('poster_approvals')
        .select(`
          *,
          submitted_by_profile:profiles!poster_approvals_submitted_by_fkey(
            display_name,
            email,
            avatar_url
          ),
          reviewed_by_profile:profiles!poster_approvals_reviewed_by_fkey(
            display_name,
            email,
            avatar_url
          )
        `)
        .eq('poster_id', posterId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setApproval(data as Approval | null);
    } catch (error) {
      console.error('Error fetching approval:', error);
    } finally {
      setLoading(false);
    }
  }, [posterId]);

  const createOrUpdateApproval = async (
    status: ApprovalStatus,
    reviewNotes?: string
  ): Promise<boolean> => {
    if (!posterId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const now = new Date().toISOString();
      const isReviewAction = ['approved', 'changes_requested', 'published'].includes(status);
      const isSubmission = status === 'pending_review';

      const updateData: any = {
        poster_id: posterId,
        status,
        updated_at: now,
      };

      if (isSubmission) {
        updateData.submitted_by = user.id;
        updateData.submitted_at = now;
        updateData.reviewed_by = null;
        updateData.reviewed_at = null;
        updateData.review_notes = null;
      }

      if (isReviewAction) {
        updateData.reviewed_by = user.id;
        updateData.reviewed_at = now;
        if (reviewNotes !== undefined) {
          updateData.review_notes = reviewNotes;
        }
      }

      if (approval) {
        // Update existing
        const { error } = await supabase
          .from('poster_approvals')
          .update(updateData)
          .eq('id', approval.id);

        if (error) throw error;
      } else {
        // Create new
        updateData.created_at = now;
        const { error } = await supabase
          .from('poster_approvals')
          .insert(updateData);

        if (error) throw error;
      }

      await fetchApproval();
      return true;
    } catch (error) {
      console.error('Error updating approval:', error);
      return false;
    }
  };

  const submitForReview = async (): Promise<boolean> => {
    return createOrUpdateApproval('pending_review');
  };

  const approve = async (notes?: string): Promise<boolean> => {
    return createOrUpdateApproval('approved', notes);
  };

  const requestChanges = async (notes: string): Promise<boolean> => {
    return createOrUpdateApproval('changes_requested', notes);
  };

  const publish = async (): Promise<boolean> => {
    return createOrUpdateApproval('published');
  };

  const revertToDraft = async (): Promise<boolean> => {
    return createOrUpdateApproval('draft');
  };

  useEffect(() => {
    fetchApproval();

    if (!posterId) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`approval-${posterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poster_approvals',
          filter: `poster_id=eq.${posterId}`,
        },
        () => {
          fetchApproval();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [posterId, fetchApproval]);

  return {
    approval,
    status: approval?.status || 'draft',
    loading,
    submitForReview,
    approve,
    requestChanges,
    publish,
    revertToDraft,
    refetch: fetchApproval,
  };
};
