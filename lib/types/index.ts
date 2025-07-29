/**
 * Central export for all type definitions
 */

// Re-export all activity types
export * from './activity';

// Re-export all guard types
export * from './guards';

// Re-export all communication types
export * from './communications';

// Re-export utility types
export type { Priority, Status, BusinessImpact } from '../utils/status';
export type { ActivityType, ThreatLevel, SecurityLevel } from '../utils/security';

// Common UI component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  onClick?: () => void;
  onHover?: () => void;
  disabled?: boolean;
}

// Component size variants
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Component variants
export type ComponentVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'success';

// Layout variants
export type LayoutVariant = 'compact' | 'comfortable' | 'spacious';

// View modes
export type ViewMode = 'grid' | 'list' | 'table' | 'kanban' | 'timeline';

// Sort options
export interface SortOption<T = string> {
  field: T;
  direction: 'asc' | 'desc';
  label: string;
}

// Pagination
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Selection state
export interface SelectionState<T = string> {
  selected: Set<T>;
  lastSelected?: T;
  mode: 'single' | 'multiple';
}

// Filter state
export interface FilterState {
  active: boolean;
  filters: Record<string, any>;
  quickFilters?: string[];
}

// Search state
export interface SearchState {
  query: string;
  isSearching: boolean;
  results?: any[];
  resultCount?: number;
}

// Modal/Dialog props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Form field props
export interface FormFieldProps<T = string> {
  name: string;
  label?: string;
  value: T;
  onChange: (value: T) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// Action handler types
export type ActionHandler<T = void> = (data: T) => void | Promise<void>;
export type SelectHandler<T> = (item: T) => void;
export type MultiSelectHandler<T> = (items: T[]) => void;

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationState;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: Date;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}