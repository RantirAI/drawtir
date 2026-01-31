import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  RotateCcw,
  Loader2
} from 'lucide-react';
import { ApprovalStatusBadge } from './ApprovalStatusBadge';
import { useApproval } from '@/hooks/useApproval';
import { toast } from 'sonner';

interface ApprovalPanelProps {
  posterId: string;
  canSubmit: boolean; // editors can submit
  canReview: boolean; // owners can review
}

export const ApprovalPanel = ({
  posterId,
  canSubmit,
  canReview,
}: ApprovalPanelProps) => {
  const {
    approval,
    status,
    loading,
    submitForReview,
    approve,
    requestChanges,
    publish,
    revertToDraft,
  } = useApproval(posterId);

  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (
    action: () => Promise<boolean>,
    successMessage: string
  ) => {
    setIsSubmitting(true);
    try {
      const success = await action();
      if (success) {
        toast.success(successMessage);
        setReviewNotes('');
      } else {
        toast.error('Action failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Approval Status</CardTitle>
          <ApprovalStatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status history */}
        {approval && (
          <div className="space-y-3 text-sm">
            {approval.submitted_by_profile && approval.submitted_at && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={approval.submitted_by_profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(approval.submitted_by_profile.display_name || 
                      approval.submitted_by_profile.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">
                  Submitted by{' '}
                  <span className="text-foreground font-medium">
                    {approval.submitted_by_profile.display_name || 
                     approval.submitted_by_profile.email.split('@')[0]}
                  </span>
                  {' '}
                  {formatDistanceToNow(new Date(approval.submitted_at), { addSuffix: true })}
                </span>
              </div>
            )}

            {approval.reviewed_by_profile && approval.reviewed_at && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={approval.reviewed_by_profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(approval.reviewed_by_profile.display_name || 
                      approval.reviewed_by_profile.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">
                  Reviewed by{' '}
                  <span className="text-foreground font-medium">
                    {approval.reviewed_by_profile.display_name || 
                     approval.reviewed_by_profile.email.split('@')[0]}
                  </span>
                  {' '}
                  {formatDistanceToNow(new Date(approval.reviewed_at), { addSuffix: true })}
                </span>
              </div>
            )}

            {approval.review_notes && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Review Notes:</p>
                <p className="text-sm">{approval.review_notes}</p>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Actions based on status and permissions */}
        <div className="space-y-3">
          {/* Submit for Review - Editors on draft or changes_requested */}
          {canSubmit && (status === 'draft' || status === 'changes_requested') && (
            <Button
              onClick={() => handleAction(submitForReview, 'Submitted for review')}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit for Review
            </Button>
          )}

          {/* Review actions - Owners on pending_review */}
          {canReview && status === 'pending_review' && (
            <>
              <Textarea
                placeholder="Add review notes (optional for approval, required for changes)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAction(() => approve(reviewNotes), 'Approved!')}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!reviewNotes.trim()) {
                      toast.error('Please add notes explaining what changes are needed');
                      return;
                    }
                    handleAction(() => requestChanges(reviewNotes), 'Changes requested');
                  }}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Changes
                </Button>
              </div>
            </>
          )}

          {/* Publish - Owners on approved */}
          {canReview && status === 'approved' && (
            <Button
              onClick={() => handleAction(publish, 'Published!')}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          )}

          {/* Revert to Draft - Owners anytime except draft */}
          {canReview && status !== 'draft' && (
            <Button
              variant="outline"
              onClick={() => handleAction(revertToDraft, 'Reverted to draft')}
              disabled={isSubmitting}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Revert to Draft
            </Button>
          )}

          {/* Status messages */}
          {status === 'pending_review' && !canReview && (
            <p className="text-sm text-muted-foreground text-center">
              Waiting for review from workspace owner
            </p>
          )}

          {status === 'published' && (
            <p className="text-sm text-green-600 text-center font-medium">
              ✓ This project is live
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
