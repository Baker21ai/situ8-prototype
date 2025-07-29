/**
 * Design tokens for colors used throughout the application
 * These provide a single source of truth for all color values
 */

// Priority color tokens
export const priorityColors = {
  critical: {
    border: 'border-red-500',
    background: 'bg-red-50',
    backgroundDark: 'bg-red-100',
    text: 'text-red-800',
    textLight: 'text-red-600',
    icon: 'text-red-600',
    ring: 'ring-red-500',
    hover: 'hover:bg-red-100',
    solid: 'bg-red-500',
    solidText: 'text-white'
  },
  high: {
    border: 'border-orange-500',
    background: 'bg-orange-50',
    backgroundDark: 'bg-orange-100',
    text: 'text-orange-800',
    textLight: 'text-orange-600',
    icon: 'text-orange-600',
    ring: 'ring-orange-500',
    hover: 'hover:bg-orange-100',
    solid: 'bg-orange-500',
    solidText: 'text-white'
  },
  medium: {
    border: 'border-yellow-500',
    background: 'bg-yellow-50',
    backgroundDark: 'bg-yellow-100',
    text: 'text-yellow-800',
    textLight: 'text-yellow-600',
    icon: 'text-yellow-600',
    ring: 'ring-yellow-500',
    hover: 'hover:bg-yellow-100',
    solid: 'bg-yellow-500',
    solidText: 'text-white'
  },
  low: {
    border: 'border-green-500',
    background: 'bg-green-50',
    backgroundDark: 'bg-green-100',
    text: 'text-green-800',
    textLight: 'text-green-600',
    icon: 'text-green-600',
    ring: 'ring-green-500',
    hover: 'hover:bg-green-100',
    solid: 'bg-green-500',
    solidText: 'text-white'
  }
} as const;

// Status color tokens
export const statusColors = {
  new: {
    border: 'border-blue-500',
    background: 'bg-blue-50',
    backgroundDark: 'bg-blue-100',
    text: 'text-blue-800',
    textLight: 'text-blue-600',
    icon: 'text-blue-600',
    ring: 'ring-blue-500'
  },
  active: {
    border: 'border-red-500',
    background: 'bg-red-50',
    backgroundDark: 'bg-red-100',
    text: 'text-red-800',
    textLight: 'text-red-600',
    icon: 'text-red-600',
    ring: 'ring-red-500'
  },
  assigned: {
    border: 'border-orange-500',
    background: 'bg-orange-50',
    backgroundDark: 'bg-orange-100',
    text: 'text-orange-800',
    textLight: 'text-orange-600',
    icon: 'text-orange-600',
    ring: 'ring-orange-500'
  },
  investigating: {
    border: 'border-yellow-500',
    background: 'bg-yellow-50',
    backgroundDark: 'bg-yellow-100',
    text: 'text-yellow-800',
    textLight: 'text-yellow-600',
    icon: 'text-yellow-600',
    ring: 'ring-yellow-500'
  },
  resolved: {
    border: 'border-green-500',
    background: 'bg-green-50',
    backgroundDark: 'bg-green-100',
    text: 'text-green-800',
    textLight: 'text-green-600',
    icon: 'text-green-600',
    ring: 'ring-green-500'
  },
  archived: {
    border: 'border-gray-500',
    background: 'bg-gray-50',
    backgroundDark: 'bg-gray-100',
    text: 'text-gray-800',
    textLight: 'text-gray-600',
    icon: 'text-gray-600',
    ring: 'ring-gray-500'
  }
} as const;

// Site/location color tokens (purple theme as per design requirement)
export const siteColors = {
  badge: {
    background: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    icon: 'text-purple-600'
  },
  marker: {
    background: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-900'
  }
} as const;

// Special status colors
export const specialColors = {
  bolo: {
    background: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    animate: 'animate-pulse'
  },
  massCasualty: {
    background: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    animate: 'animate-pulse'
  },
  securityThreat: {
    background: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    ring: 'ring-2 ring-orange-500'
  },
  aiDetection: {
    background: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: 'text-blue-600'
  }
} as const;

// Communication channel colors
export const channelColors = {
  main: {
    background: 'bg-gray-50',
    text: 'text-gray-800',
    border: 'border-gray-200'
  },
  emergency: {
    background: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  dispatch: {
    background: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200'
  }
} as const;

// Guard status colors
export const guardStatusColors = {
  available: {
    icon: '🟢',
    color: 'text-green-600',
    background: 'bg-green-100'
  },
  responding: {
    icon: '🟠',
    color: 'text-orange-600',
    background: 'bg-orange-100'
  },
  patrolling: {
    icon: '🔵',
    color: 'text-blue-600',
    background: 'bg-blue-100'
  },
  investigating: {
    icon: '🟡',
    color: 'text-yellow-600',
    background: 'bg-yellow-100'
  },
  break: {
    icon: '⚪',
    color: 'text-gray-600',
    background: 'bg-gray-100'
  },
  off_duty: {
    icon: '⚫',
    color: 'text-gray-800',
    background: 'bg-gray-200'
  }
} as const;

// Semantic colors for different contexts
export const semanticColors = {
  danger: priorityColors.critical,
  warning: priorityColors.high,
  caution: priorityColors.medium,
  success: priorityColors.low,
  info: statusColors.new,
  neutral: statusColors.archived
} as const;

// Animation classes
export const animations = {
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out'
} as const;