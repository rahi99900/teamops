import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'destructive';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

const iconColorClasses = {
  primary: 'bg-primary-light text-primary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  destructive: 'bg-destructive-light text-destructive',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'primary',
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6 shadow-soft',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn('rounded-lg p-1.5', iconColorClasses[iconColor])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-3xl font-bold">
        {value}
        {subtitle && (
          <span className="text-lg font-medium text-muted-foreground ml-1">
            {subtitle}
          </span>
        )}
      </p>
      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 mt-2 text-xs font-medium',
            trend.isPositive ? 'text-success' : 'text-destructive'
          )}
        >
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}
