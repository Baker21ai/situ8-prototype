/**
 * PriorityIndicator Atomic Component
 * Displays priority levels with different visual variants
 * Migrated from components/atoms/PriorityIndicator.tsx
 */

import React from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Priority } from '../../../../lib/utils/status';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export interface PriorityIndicatorProps {
  priority: Priority;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'badge' | 'icon' | 'dot' | 'text' | 'combined';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const PRIORITY_COLORS = {
  critical: {
    background: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-300',
    icon: 'text-red-400',
    solid: 'bg-red-500'
  },
  high: {
    background: 'bg-orange-500/20',
    border: 'border-orange-500',
    text: 'text-orange-300',
    icon: 'text-orange-400',
    solid: 'bg-orange-500'
  },
  medium: {
    background: 'bg-yellow-500/20',
    border: 'border-yellow-500',
    text: 'text-yellow-300',
    icon: 'text-yellow-400',
    solid: 'bg-yellow-500'
  },
  low: {
    background: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-300',
    icon: 'text-green-400',
    solid: 'bg-green-500'
  }
};

const SIZE_CLASSES = {
  xs: { text: 'text-xs', padding: 'px-1 py-0.5', icon: 'h-2 w-2', gap: 'gap-0.5' },
  sm: { text: 'text-xs', padding: 'px-1.5 py-0.5', icon: 'h-3 w-3', gap: 'gap-1' },
  md: { text: 'text-sm', padding: 'px-2 py-1', icon: 'h-4 w-4', gap: 'gap-1' },
  lg: { text: 'text-base', padding: 'px-3 py-1.5', icon: 'h-5 w-5', gap: 'gap-1.5' },
  xl: { text: 'text-lg', padding: 'px-4 py-2', icon: 'h-6 w-6', gap: 'gap-2' }
};

const PRIORITY_ICONS = {
  critical: AlertTriangle,
  high: AlertCircle,
  medium: Info,
  low: CheckCircle
};

const PRIORITY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

/**
 * PriorityIndicator - Displays priority levels with customizable variants
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
  className = ''
}) => {
  const colors = PRIORITY_COLORS[priority];
  const sizeClasses = SIZE_CLASSES[size];
  const Icon = PRIORITY_ICONS[priority];
  const label = PRIORITY_LABELS[priority];
  
  // Critical priority animates by default
  const shouldAnimate = animated || priority === 'critical';
  
  const baseClasses = `
    ${shouldAnimate ? 'animate-pulse' : ''}
    ${className}
  `;

  switch (variant) {
    case 'icon':
      return (
        <div className={`inline-flex items-center ${sizeClasses.gap} ${baseClasses}`}>
          <Icon 
            className={`${sizeClasses.icon} ${colors.icon}`}
            aria-label={`${label} priority`}
          />
          {showLabel && (
            <span className={`${sizeClasses.text} ${colors.text} font-medium`}>
              {label}
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
        <div className={`inline-flex items-center ${sizeClasses.gap} ${baseClasses}`}>
          <div 
            className={`rounded-full ${dotSizes[size]} ${colors.solid}`}
            aria-label={`${label} priority`}
          />
          {showLabel && (
            <span className={`${sizeClasses.text} ${colors.text} font-medium`}>
              {label}
            </span>
          )}
        </div>
      );
      
    case 'text':
      return (
        <span 
          className={`${sizeClasses.text} ${colors.text} font-medium uppercase ${baseClasses}`}
          aria-label={`${label} priority`}
        >
          {label}
        </span>
      );
      
    case 'combined':
      return (
        <Badge
          className={`
            ${sizeClasses.padding} ${sizeClasses.text}
            ${colors.background} ${colors.text} ${colors.border}
            border font-medium inline-flex items-center ${sizeClasses.gap}
            ${baseClasses}
          `}
        >
          <Icon className={`${sizeClasses.icon} ${colors.icon}`} />
          {showLabel && label}
        </Badge>
      );
      
    case 'badge':
    default:
      return (
        <Badge
          className={`
            ${sizeClasses.padding} ${sizeClasses.text}
            ${colors.background} ${colors.text} ${colors.border}
            border font-medium ${baseClasses}
          `}
        >
          {label}
        </Badge>
      );
  }
};

// Specialized variants for convenience
export const PriorityIndicatorIcon: React.FC<Omit<PriorityIndicatorProps, 'variant'>> = (props) => (
  <PriorityIndicator {...props} variant="icon" />
);

export const PriorityIndicatorDot: React.FC<Omit<PriorityIndicatorProps, 'variant'>> = (props) => (
  <PriorityIndicator {...props} variant="dot" />
);

export const PriorityIndicatorText: React.FC<Omit<PriorityIndicatorProps, 'variant'>> = (props) => (
  <PriorityIndicator {...props} variant="text" />
);

export const PriorityIndicatorCombined: React.FC<Omit<PriorityIndicatorProps, 'variant'>> = (props) => (
  <PriorityIndicator {...props} variant="combined" />
);
