/**
 * Design tokens for spacing, sizing, and layout used throughout the application
 */

// Card padding variants
export const cardPadding = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
  xl: 'p-6'
} as const;

// Card spacing (gap between elements)
export const cardSpacing = {
  none: 'space-y-0',
  xs: 'space-y-0.5',
  sm: 'space-y-1',
  md: 'space-y-2',
  lg: 'space-y-3',
  xl: 'space-y-4'
} as const;

// Component sizes
export const componentSizes = {
  xs: {
    height: 'h-6',
    text: 'text-xs',
    padding: 'px-2 py-0.5',
    gap: 'gap-1'
  },
  sm: {
    height: 'h-8',
    text: 'text-sm',
    padding: 'px-3 py-1',
    gap: 'gap-1.5'
  },
  md: {
    height: 'h-10',
    text: 'text-base',
    padding: 'px-4 py-2',
    gap: 'gap-2'
  },
  lg: {
    height: 'h-12',
    text: 'text-lg',
    padding: 'px-6 py-3',
    gap: 'gap-3'
  },
  xl: {
    height: 'h-14',
    text: 'text-xl',
    padding: 'px-8 py-4',
    gap: 'gap-4'
  }
} as const;

// Icon sizes
export const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
} as const;

// Badge sizes
export const badgeSizes = {
  xs: {
    padding: 'px-1.5 py-0.5',
    text: 'text-xs',
    gap: 'gap-0.5'
  },
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    gap: 'gap-1'
  },
  md: {
    padding: 'px-2.5 py-1',
    text: 'text-sm',
    gap: 'gap-1'
  },
  lg: {
    padding: 'px-3 py-1.5',
    text: 'text-base',
    gap: 'gap-1.5'
  }
} as const;

// Border radius
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full'
} as const;

// Shadow variants
export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  inner: 'shadow-inner'
} as const;

// Layout spacing
export const layoutSpacing = {
  page: {
    padding: 'p-4 md:p-6 lg:p-8',
    gap: 'gap-4 md:gap-6 lg:gap-8'
  },
  section: {
    padding: 'p-3 md:p-4 lg:p-6',
    gap: 'gap-3 md:gap-4 lg:gap-6'
  },
  container: {
    maxWidth: 'max-w-7xl',
    center: 'mx-auto'
  }
} as const;

// Grid layouts
export const gridLayouts = {
  cols1: 'grid-cols-1',
  cols2: 'grid-cols-1 md:grid-cols-2',
  cols3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  cols4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  responsive: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
} as const;

// Flex layouts
export const flexLayouts = {
  center: 'flex items-center justify-center',
  between: 'flex items-center justify-between',
  start: 'flex items-start justify-start',
  end: 'flex items-center justify-end',
  col: 'flex flex-col',
  wrap: 'flex flex-wrap'
} as const;

// Transition durations
export const transitions = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  verySlow: 'transition-all duration-500'
} as const;

// Z-index layers
export const zIndex = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  overlay: 'z-30',
  modal: 'z-40',
  popover: 'z-50',
  tooltip: 'z-60'
} as const;

// Responsive breakpoints (matching Tailwind defaults)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// Mobile-specific spacing
export const mobileSpacing = {
  padding: 'p-2 sm:p-3 md:p-4',
  gap: 'gap-2 sm:gap-3 md:gap-4',
  margin: 'm-2 sm:m-3 md:m-4'
} as const;