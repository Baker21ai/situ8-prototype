import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';
import { Priority, getPriorityColor, getPriorityDisplay } from '@/lib/utils/status';
import { priorityColors } from '@/lib/tokens/colors';
import { badgeSizes, iconSizes } from '@/lib/tokens/spacing';
import { ComponentSize } from '@/lib/types';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface PriorityIndicatorProps {
  priority: Priority;
  size?: ComponentSize;
  variant?: 'badge' | 'icon' | 'dot' | 'text' | 'combined';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

/**
 * PriorityIndicator - Atomic component for displaying priority levels
 * 
 * @example
 * <PriorityIndicator priority="critical" />
 * <PriorityIndicator priority="high" variant="icon" size="lg" />
 * <PriorityIndicator priority="medium" variant="dot" animated />
 */
export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
  priority,
  size = 'sm',
  variant = 'badge',
  showLabel = true,
  animated = false,
  className
}) => {
  const colors = getPriorityColor(priority);
  const display = getPriorityDisplay(priority);
  const sizeClasses = badgeSizes[size as keyof typeof badgeSizes] || badgeSizes.sm;
  const iconSize = iconSizes[size as keyof typeof iconSizes] || iconSizes.sm;
  
  // Determine if should animate (critical priorities animate by default)
  const shouldAnimate = animated || (priority === 'critical' && display.pulse);
  
  // Get the appropriate Lucide icon
  const Icon = {
    critical: AlertTriangle,
    high: AlertCircle,
    medium: Info,
    low: CheckCircle
  }[priority];

  // Render based on variant
  switch (variant) {
    case 'icon':
      return (
        <div className={cn(
          'inline-flex items-center',
          shouldAnimate && 'animate-pulse',
          className
        )}>
          <Icon className={cn(iconSize, colors.icon)} />
          {showLabel && (
            <span className={cn('ml-1', sizeClasses.text, colors.text, 'font-medium')}>
              {display.label}
            </span>
          )}
        </div>
      );
      
    case 'dot':
      const dotSizes = {
        xs: 'w-2 h-2',
        sm: 'w-2.5 h-2.5',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
        xl: 'w-5 h-5'
      };
      
      return (
        <div className={cn('inline-flex items-center', sizeClasses.gap, className)}>
          <div className={cn(
            'rounded-full',
            dotSizes[size],
            priorityColors[priority].solid,
            shouldAnimate && 'animate-pulse'
          )} />
          {showLabel && (
            <span className={cn(sizeClasses.text, colors.text, 'font-medium')}>
              {display.label}
            </span>
          )}
        </div>
      );
      
    case 'text':
      return (
        <span className={cn(
          sizeClasses.text,
          colors.text,
          'font-medium uppercase',
          shouldAnimate && 'animate-pulse',
          className
        )}>
          {display.label}
        </span>
      );
      
    case 'combined':
      return (
        <Badge
          className={cn(
            sizeClasses.padding,
            sizeClasses.text,
            colors.background,
            colors.text,
            colors.border,
            'border',
            shouldAnimate && 'animate-pulse',
            'font-medium inline-flex items-center',
            sizeClasses.gap,
            className
          )}
        >
          <Icon className={cn(iconSize, colors.icon)} />
          {showLabel && display.label}
        </Badge>
      );
      
    case 'badge':
    default:
      return (
        <Badge
          className={cn(
            sizeClasses.padding,
            sizeClasses.text,
            colors.background,
            colors.text,
            colors.border,
            'border',
            shouldAnimate && 'animate-pulse',
            'font-medium',
            className
          )}
        >
          {display.label}
        </Badge>
      );
  }
};

// Priority strip component for visual-only indication
interface PriorityStripProps {
  priority: Priority;
  position?: 'top' | 'right' | 'bottom' | 'left';
  thickness?: 'thin' | 'medium' | 'thick';
  className?: string;
}

export const PriorityStrip: React.FC<PriorityStripProps> = ({
  priority,
  position = 'left',
  thickness = 'medium',
  className
}) => {
  const colors = priorityColors[priority];
  const display = getPriorityDisplay(priority);
  
  const thicknessClasses = {
    thin: position === 'left' || position === 'right' ? 'w-1' : 'h-1',
    medium: position === 'left' || position === 'right' ? 'w-2' : 'h-2',
    thick: position === 'left' || position === 'right' ? 'w-3' : 'h-3'
  };
  
  const positionClasses = {
    top: 'absolute top-0 left-0 right-0',
    right: 'absolute top-0 right-0 bottom-0',
    bottom: 'absolute bottom-0 left-0 right-0',
    left: 'absolute top-0 left-0 bottom-0'
  };
  
  return (
    <div
      className={cn(
        positionClasses[position],
        thicknessClasses[thickness],
        colors.solid,
        display.pulse && 'animate-pulse',
        className
      )}
      aria-label={`${display.label} priority`}
    />
  );
};