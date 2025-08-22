/**
 * Status and priority utility functions for consistent styling across the application
 */

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Status = 'detecting' | 'pending' | 'escalated' | 'in-progress' | 'review' | 'resolved' | 'deferred' | 'cancelled' | 'assigned' | 'responding' | 'active';
export type BusinessImpact = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ColorSet {
  border: string;
  background: string;
  text: string;
  icon?: string;
  ring?: string;
}

/**
 * Get consistent color classes for priority levels
 * @param priority - Priority level
 * @param variant - Style variant ('default' | 'compact' | 'minimal')
 * @returns Object with Tailwind classes for styling
 */
export function getPriorityColor(priority: Priority, variant: 'default' | 'compact' | 'minimal' = 'default'): ColorSet {
  const colors: Record<Priority, ColorSet> = {
    critical: {
      border: 'border-red-500',
      background: 'bg-red-50',
      text: 'text-red-800',
      icon: 'text-red-600',
      ring: 'ring-red-500'
    },
    high: {
      border: 'border-orange-500',
      background: 'bg-orange-50',
      text: 'text-orange-800',
      icon: 'text-orange-600',
      ring: 'ring-orange-500'
    },
    medium: {
      border: 'border-yellow-500',
      background: 'bg-yellow-50',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
      ring: 'ring-yellow-500'
    },
    low: {
      border: 'border-green-500',
      background: 'bg-green-50',
      text: 'text-green-800',
      icon: 'text-green-600',
      ring: 'ring-green-500'
    }
  };

  if (variant === 'minimal') {
    // Return only essential colors for minimal displays
    return {
      border: colors[priority].border,
      background: colors[priority].background,
      text: colors[priority].text
    };
  }

  return colors[priority] || colors.low;
}

/**
 * Get consistent color classes for status values
 * @param status - Status value
 * @returns Object with Tailwind classes for styling
 */
export function getStatusColor(status: Status): ColorSet {
  const colors: Record<Status, ColorSet> = {
    detecting: {
      border: 'border-blue-500',
      background: 'bg-blue-50',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    },
    pending: {
      border: 'border-purple-500',
      background: 'bg-purple-50',
      text: 'text-purple-800',
      icon: 'text-purple-600'
    },
    escalated: {
      border: 'border-red-500',
      background: 'bg-red-50',
      text: 'text-red-800',
      icon: 'text-red-600'
    },
    'in-progress': {
      border: 'border-indigo-500',
      background: 'bg-indigo-50',
      text: 'text-indigo-800',
      icon: 'text-indigo-600'
    },
    review: {
      border: 'border-amber-500',
      background: 'bg-amber-50',
      text: 'text-amber-800',
      icon: 'text-amber-600'
    },
    resolved: {
      border: 'border-green-500',
      background: 'bg-green-50',
      text: 'text-green-800',
      icon: 'text-green-600'
    },
    deferred: {
      border: 'border-gray-500',
      background: 'bg-gray-50',
      text: 'text-gray-800',
      icon: 'text-gray-600'
    },
    cancelled: {
      border: 'border-gray-500',
      background: 'bg-gray-50',
      text: 'text-gray-800',
      icon: 'text-gray-600'
    },
    assigned: {
      border: 'border-orange-500',
      background: 'bg-orange-50',
      text: 'text-orange-800',
      icon: 'text-orange-600'
    },
    responding: {
      border: 'border-yellow-500',
      background: 'bg-yellow-50',
      text: 'text-yellow-800',
      icon: 'text-yellow-600'
    },
    active: {
      border: 'border-blue-500',
      background: 'bg-blue-50',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    }
  };

  return colors[status] || colors.resolved;
}

/**
 * Get color for business impact levels
 * @param impact - Business impact level
 * @returns Tailwind color class
 */
export function getBusinessImpactColor(impact: BusinessImpact): string {
  const colors: Record<BusinessImpact, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
    none: 'bg-gray-400'
  };

  return colors[impact] || colors.none;
}

/**
 * Get priority display properties
 * @param priority - Priority level
 * @returns Object with display properties
 */
export function getPriorityDisplay(priority: Priority) {
  const displays: Record<Priority, { label: string; icon: string; pulse: boolean }> = {
    critical: {
      label: 'CRITICAL',
      icon: '🔴',
      pulse: true
    },
    high: {
      label: 'HIGH',
      icon: '🟠',
      pulse: false
    },
    medium: {
      label: 'MEDIUM',
      icon: '🟡',
      pulse: false
    },
    low: {
      label: 'LOW',
      icon: '🟢',
      pulse: false
    }
  };

  return displays[priority] || displays.low;
}

/**
 * Get status display properties
 * @param status - Status value
 * @returns Object with display properties
 */
export function getStatusDisplay(status: Status) {
  const displays: Record<Status, { label: string; description: string }> = {
    detecting: {
      label: 'DETECTING',
      description: 'Initial detection phase'
    },
    pending: {
      label: 'PENDING',
      description: 'Awaiting review/approval'
    },
    escalated: {
      label: 'ESCALATED',
      description: 'Requires immediate attention'
    },
    'in-progress': {
      label: 'IN PROGRESS',
      description: 'Work in progress'
    },
    review: {
      label: 'REVIEW',
      description: 'Under review'
    },
    resolved: {
      label: 'RESOLVED',
      description: 'Issue resolved'
    },
    deferred: {
      label: 'DEFERRED',
      description: 'Postponed for later'
    },
    cancelled: {
      label: 'CANCELLED',
      description: 'No longer active'
    },
    assigned: {
      label: 'ASSIGNED',
      description: 'Assigned to personnel'
    },
    responding: {
      label: 'RESPONDING',
      description: 'Personnel responding to incident'
    },
    active: {
      label: 'ACTIVE',
      description: 'Currently active'
    }
  };

  return displays[status] || displays.resolved;
}

/**
 * Convert priority to numeric value for sorting
 * @param priority - Priority level
 * @returns Numeric value (higher = more urgent)
 */
export function getPriorityWeight(priority: Priority): number {
  const weights: Record<Priority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  return weights[priority] || 0;
}

/**
 * Sort items by priority (highest first)
 * @param items - Array of items with priority property
 * @returns Sorted array
 */
export function sortByPriority<T extends { priority: Priority }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
  });
}

/**
 * Get combined status and priority classes
 * @param priority - Priority level
 * @param status - Status value
 * @returns Combined Tailwind classes
 */
export function getActivityClasses(priority: Priority, status: Status) {
  const priorityColors = getPriorityColor(priority);
  const isActive = status === 'detecting' || status === 'responding' || status === 'in-progress' || status === 'escalated';
  
  return {
    container: `${priorityColors.border} ${priorityColors.background} ${isActive ? 'animate-pulse' : ''}`,
    badge: `${priorityColors.background} ${priorityColors.text} ${priorityColors.border}`,
    icon: priorityColors.icon || '',
    text: priorityColors.text
  };
}