/**
 * Atomic Components Index
 * Centralized exports for all atomic components
 */

// Badges
export { StatusBadge } from './badges/StatusBadge';

// Buttons  
export { 
  ActionButton,
  ActionButtonCritical,
  ActionButtonWarning,
  ActionButtonSuccess,
  ActionButtonSecondary
} from './buttons/ActionButton';

// Indicators
export {
  ProgressIndicator,
  ConfidenceIndicator,
  RiskIndicator,
  PerformanceIndicator
} from './indicators/ProgressIndicator';

// Error Boundaries
export {
  ActivityErrorBoundary,
  ActivityErrorBoundaryWrapper,
  withActivityErrorBoundary,
  ErrorFallback,
  VirtualScrollErrorBoundary,
  VirtualScrollErrorWrapper,
  SearchErrorBoundary,
  SearchErrorWrapper,
  clearErrorHistory,
  getErrorHistory,
  addRecoveryAttempt,
  getErrorStats
} from './errors';

// Type exports
export type { StatusBadgeProps } from './badges/StatusBadge';
export type { ActionButtonProps } from './buttons/ActionButton';
export type { ProgressIndicatorProps } from './indicators/ProgressIndicator';