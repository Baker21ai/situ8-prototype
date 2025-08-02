/**
 * StatusBadge Atomic Component
 * Displays activity status with priority-based styling
 */

import React from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Priority, Status } from '../../../../lib/utils/status';

export interface StatusBadgeProps {
  priority: Priority;
  status: Status;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  priority,
  status,
  pulse = false,
  size = 'md',
  className = ''
}) => {
  const getStatusStyles = () => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 border-red-500 text-red-300 shadow-red-500/30';
      case 'high':
        return 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-300 shadow-yellow-500/30';
      default:
        return 'bg-green-500/20 border-green-500 text-green-300 shadow-green-500/30';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-1.5 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1';
      default:
        return 'text-xs px-2 py-0.5';
    }
  };

  return (
    <Badge 
      className={`
        ${getStatusStyles()}
        ${getSizeStyles()}
        border shadow-lg font-medium uppercase tracking-wider
        ${pulse ? 'animate-pulse' : ''}
        transition-all duration-200 hover:scale-105
        ${className}
      `}
    >
      {status}
    </Badge>
  );
};