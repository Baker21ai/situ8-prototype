import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';
import { Status, getStatusColor, getStatusDisplay } from '@/lib/utils/status';
import { badgeSizes } from '@/lib/tokens/spacing';
import { ComponentSize } from '@/lib/types';

interface StatusBadgeProps {
  status: Status;
  size?: ComponentSize;
  showIcon?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'minimal';
  animated?: boolean;
}

/**
 * StatusBadge - Atomic component for displaying activity status
 * 
 * @example
 * <StatusBadge status="active" />
 * <StatusBadge status="resolved" size="lg" showIcon />
 * <StatusBadge status="new" variant="outline" animated />
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = false,
  className,
  variant = 'default',
  animated = false
}) => {
  const colors = getStatusColor(status);
  const display = getStatusDisplay(status);
  const sizeClasses = badgeSizes[size as keyof typeof badgeSizes] || badgeSizes.sm;
  
  // Determine animation based on status
  const shouldAnimate = animated && (status === 'detecting' || status === 'responding');
  
  const variantClasses = {
    default: `${colors.background} ${colors.text} ${colors.border}`,
    outline: `border ${colors.border} ${colors.text} bg-transparent`,
    minimal: `${colors.text} bg-transparent`
  };

  return (
    <Badge
      className={cn(
        sizeClasses.padding,
        sizeClasses.text,
        variantClasses[variant],
        shouldAnimate && 'animate-pulse',
        'font-medium',
        className
      )}
    >
      {showIcon && (
        <span className={cn('mr-1', sizeClasses.gap)}>
          {status === 'detecting' ? '🔵' : 
           status === 'assigned' ? '🟠' :
           status === 'responding' ? '🟡' :
           status === 'resolved' ? '🟢' : '⚪'}
        </span>
      )}
      {display.label}
    </Badge>
  );
};

// Compound component for status with description
interface StatusBadgeWithDescriptionProps extends StatusBadgeProps {
  showDescription?: boolean;
}

export const StatusBadgeWithDescription: React.FC<StatusBadgeWithDescriptionProps> = ({
  showDescription = true,
  ...props
}) => {
  const display = getStatusDisplay(props.status);
  
  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <StatusBadge {...props} />
      {showDescription && (
        <span className="text-xs text-muted-foreground">
          {display.description}
        </span>
      )}
    </div>
  );
};