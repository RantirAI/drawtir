import { Badge } from '@/components/ui/badge';
import { 
  FileEdit, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Globe 
} from 'lucide-react';
import type { ApprovalStatus } from '@/hooks/useApproval';

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
  size?: 'sm' | 'default';
  showIcon?: boolean;
}

const statusConfig: Record<ApprovalStatus, {
  label: string;
  icon: typeof FileEdit;
  className: string;
}> = {
  draft: {
    label: 'Draft',
    icon: FileEdit,
    className: 'bg-muted text-muted-foreground',
  },
  pending_review: {
    label: 'Pending Review',
    icon: Clock,
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500',
  },
  changes_requested: {
    label: 'Changes Requested',
    icon: AlertCircle,
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-500',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-500/10 text-green-600 dark:text-green-500',
  },
  published: {
    label: 'Published',
    icon: Globe,
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-500',
  },
};

export const ApprovalStatusBadge = ({
  status,
  size = 'default',
  showIcon = true,
}: ApprovalStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={`${config.className} ${
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs'
      } gap-1`}
    >
      {showIcon && (
        <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      )}
      {config.label}
    </Badge>
  );
};
