/**
 * Error handling components and utilities
 */

export { 
  ActivityErrorBoundary, 
  ActivityErrorBoundaryWrapper,
  withActivityErrorBoundary 
} from './ActivityErrorBoundary';

export { ErrorFallback } from './ErrorFallback';

export { 
  VirtualScrollErrorBoundary,
  VirtualScrollErrorWrapper
} from './VirtualScrollErrorBoundary';

export {
  SearchErrorBoundary,
  SearchErrorWrapper
} from './SearchErrorBoundary';

// Error utilities
export const clearErrorHistory = () => {
  try {
    localStorage.removeItem('situ8_activity_errors');
    localStorage.removeItem('situ8_recovery_history');
    localStorage.removeItem('situ8_virtual_scroll_errors');
    localStorage.removeItem('situ8_search_errors');
    console.log('Error history cleared');
  } catch (error) {
    console.error('Failed to clear error history:', error);
  }
};

export const getErrorHistory = () => {
  try {
    return {
      activity: JSON.parse(localStorage.getItem('situ8_activity_errors') || '[]'),
      virtualScroll: JSON.parse(localStorage.getItem('situ8_virtual_scroll_errors') || '[]'),
      search: JSON.parse(localStorage.getItem('situ8_search_errors') || '[]'),
      recovery: JSON.parse(localStorage.getItem('situ8_recovery_history') || '[]')
    };
  } catch (error) {
    console.error('Failed to get error history:', error);
    return { activity: [], virtualScroll: [], search: [], recovery: [] };
  }
};

export const addRecoveryAttempt = (context: string) => {
  try {
    const history = JSON.parse(localStorage.getItem('situ8_recovery_history') || '[]');
    const attempt = `${new Date().toLocaleTimeString()} - ${context}`;
    const updatedHistory = [attempt, ...history.slice(0, 4)]; // Keep last 5
    localStorage.setItem('situ8_recovery_history', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to add recovery attempt:', error);
  }
};

export const getErrorStats = () => {
  try {
    const history = getErrorHistory();
    return {
      totalErrors: history.activity.length + history.virtualScroll.length + history.search.length,
      byType: {
        activity: history.activity.length,
        virtualScroll: history.virtualScroll.length,
        search: history.search.length
      },
      recoveryAttempts: history.recovery.length,
      lastError: [...history.activity, ...history.virtualScroll, ...history.search]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null
    };
  } catch (error) {
    console.error('Failed to get error stats:', error);
    return {
      totalErrors: 0,
      byType: { activity: 0, virtualScroll: 0, search: 0 },
      recoveryAttempts: 0,
      lastError: null
    };
  }
};