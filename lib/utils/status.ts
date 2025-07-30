/**
 * Status and priority utility functions for consistent styling across the application
 */

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Status = 'detecting' | 'assigned' | 'responding' | 'resolved';
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
    resolved: {
      border: 'border-green-500',
      background: 'bg-green-50',
      text: 'text-green-800',
      icon: 'text-green-600'
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
    assigned: {
      label: 'ASSIGNED',
      description: 'Assigned to personnel'
    },
    responding: {
      label: 'RESPONDING',
      description: 'Personnel responding to incident'
    },
    resolved: {
      label: 'RESOLVED',
      description: 'Issue resolved'
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
  const isActive = status === 'detecting' || status === 'responding';
  
  return {
    container: `${priorityColors.border} ${priorityColors.background} ${isActive ? 'animate-pulse' : ''}`,
    badge: `${priorityColors.background} ${priorityColors.text} ${priorityColors.border}`,
    icon: priorityColors.icon || '',
    text: priorityColors.text
  };
}