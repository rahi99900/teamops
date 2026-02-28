import { cn } from '@/lib/utils';

export type StatusType = 'active' | 'working' | 'on-break' | 'offline' | 'late' | 'on-time' | 'leave' | 'absent' | 'overtime' | 'pending' | 'verified' | 'missed';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<StatusType, { label: string; classes: string; dotClasses: string }> = {
  active: {
    label: 'Active',
    classes: 'bg-success-light text-success',
    dotClasses: 'bg-success',
  },
  working: {
    label: 'Working',
    classes: 'bg-success-light text-success',
    dotClasses: 'bg-success',
  },
  'on-break': {
    label: 'On Break',
    classes: 'bg-warning-light text-warning',
    dotClasses: 'bg-warning',
  },
  offline: {
    label: 'Offline',
    classes: 'bg-muted text-muted-foreground',
    dotClasses: 'bg-muted-foreground',
  },
  late: {
    label: 'Late',
    classes: 'bg-warning-light text-warning',
    dotClasses: 'bg-warning',
  },
  'on-time': {
    label: 'On Time',
    classes: 'bg-success-light text-success',
    dotClasses: 'bg-success',
  },
  leave: {
    label: 'Leave',
    classes: 'bg-primary-light text-primary',
    dotClasses: 'bg-primary',
  },
  absent: {
    label: 'Absent',
    classes: 'bg-destructive-light text-destructive',
    dotClasses: 'bg-destructive',
  },
  overtime: {
    label: 'Overtime',
    classes: 'bg-warning-light text-warning',
    dotClasses: 'bg-warning',
  },
  pending: {
    label: 'Pending',
    classes: 'bg-warning-light text-warning',
    dotClasses: 'bg-warning',
  },
  verified: {
    label: 'Verified',
    classes: 'bg-success-light text-success',
    dotClasses: 'bg-success',
  },
  missed: {
    label: 'Missed',
    classes: 'bg-destructive-light text-destructive',
    dotClasses: 'bg-destructive',
  },
};

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        config.classes,
        className
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClasses)} />
      )}
      {config.label}
    </span>
  );
}
