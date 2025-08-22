/**
 * Error Tracking Hook
 * Tracks user actions and system events for error context
 */

import { useEffect, useRef } from 'react';
import { debug } from '../utils/debug';

export interface Breadcrumb {
  timestamp: number;
  type: 'navigation' | 'action' | 'state' | 'api' | 'error' | 'custom';
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
  metadata?: {
    component?: string;
    userId?: string;
    sessionId?: string;
    url?: string;
  };
}

class BreadcrumbTracker {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalHandlers();
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private setupGlobalHandlers() {
    // Track navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = (...args) => {
      this.addBreadcrumb({
        type: 'navigation',
        category: 'history',
        message: `Navigate to ${args[2]}`,
        level: 'info',
        data: { state: args[0], title: args[1], url: args[2] }
      });
      return originalPushState.apply(history, args);
    };
    
    history.replaceState = (...args) => {
      this.addBreadcrumb({
        type: 'navigation',
        category: 'history',
        message: `Replace state ${args[2]}`,
        level: 'info',
        data: { state: args[0], title: args[1], url: args[2] }
      });
      return originalReplaceState.apply(history, args);
    };
    
    // Track popstate (back/forward)
    window.addEventListener('popstate', (event) => {
      this.addBreadcrumb({
        type: 'navigation',
        category: 'history',
        message: 'Navigation via browser buttons',
        level: 'info',
        data: { state: event.state }
      });
    });
    
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const selector = this.getElementSelector(target);
      
      this.addBreadcrumb({
        type: 'action',
        category: 'click',
        message: `Clicked ${selector}`,
        level: 'info',
        data: {
          selector,
          text: target.textContent?.trim().substring(0, 50),
          tagName: target.tagName,
          className: target.className
        }
      });
    }, true);
    
    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formName = form.name || form.id || 'unnamed-form';
      
      this.addBreadcrumb({
        type: 'action',
        category: 'form',
        message: `Submitted form: ${formName}`,
        level: 'info',
        data: {
          action: form.action,
          method: form.method,
          id: form.id
        }
      });
    }, true);
    
    // Track console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.addBreadcrumb({
        type: 'error',
        category: 'console',
        message: args[0]?.toString() || 'Console error',
        level: 'error',
        data: { args }
      });
      return originalConsoleError.apply(console, args);
    };
  }
  
  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }
  
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp' | 'metadata'>) {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
      metadata: {
        sessionId: this.sessionId,
        url: window.location.href,
        ...breadcrumb.data?.metadata
      }
    };
    
    this.breadcrumbs.push(fullBreadcrumb);
    
    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
    
    // Log to debug utility
    if (breadcrumb.type === 'action') {
      debug.action(breadcrumb.category, breadcrumb.message, breadcrumb.data);
    }
  }
  
  getBreadcrumbs(count?: number): Breadcrumb[] {
    if (count) {
      return this.breadcrumbs.slice(-count);
    }
    return [...this.breadcrumbs];
  }
  
  getLastBreadcrumb(): Breadcrumb | undefined {
    return this.breadcrumbs[this.breadcrumbs.length - 1];
  }
  
  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }
  
  exportBreadcrumbs(): string {
    return JSON.stringify(this.breadcrumbs, null, 2);
  }
  
  getErrorContext(error: Error): {
    error: Error;
    breadcrumbs: Breadcrumb[];
    lastAction: Breadcrumb | undefined;
    session: {
      id: string;
      duration: number;
      breadcrumbCount: number;
    };
    browser: {
      userAgent: string;
      language: string;
      platform: string;
    };
  } {
    const firstBreadcrumb = this.breadcrumbs[0];
    const sessionDuration = firstBreadcrumb 
      ? Date.now() - firstBreadcrumb.timestamp 
      : 0;
    
    return {
      error,
      breadcrumbs: this.getBreadcrumbs(20), // Last 20 breadcrumbs
      lastAction: this.breadcrumbs
        .filter(b => b.type === 'action')
        .pop(),
      session: {
        id: this.sessionId,
        duration: sessionDuration,
        breadcrumbCount: this.breadcrumbs.length
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform
      }
    };
  }
}

// Singleton instance
let tracker: BreadcrumbTracker | null = null;

export const getBreadcrumbTracker = (): BreadcrumbTracker => {
  if (!tracker) {
    tracker = new BreadcrumbTracker();
  }
  return tracker;
};

/**
 * Hook to track actions in a component
 */
export const useErrorTracking = (componentName: string) => {
  const tracker = getBreadcrumbTracker();
  const isMounted = useRef(true);
  
  useEffect(() => {
    tracker.addBreadcrumb({
      type: 'navigation',
      category: 'component',
      message: `${componentName} mounted`,
      level: 'info'
    });
    
    return () => {
      isMounted.current = false;
      tracker.addBreadcrumb({
        type: 'navigation',
        category: 'component',
        message: `${componentName} unmounted`,
        level: 'info'
      });
    };
  }, [componentName, tracker]);
  
  const trackAction = (action: string, data?: Record<string, any>) => {
    if (!isMounted.current) return;
    
    tracker.addBreadcrumb({
      type: 'action',
      category: componentName,
      message: action,
      level: 'info',
      data: {
        component: componentName,
        ...data
      }
    });
  };
  
  const trackState = (state: string, data?: Record<string, any>) => {
    if (!isMounted.current) return;
    
    tracker.addBreadcrumb({
      type: 'state',
      category: componentName,
      message: state,
      level: 'info',
      data: {
        component: componentName,
        ...data
      }
    });
  };
  
  const trackError = (error: Error | string, data?: Record<string, any>) => {
    if (!isMounted.current) return;
    
    const errorMessage = error instanceof Error ? error.message : error;
    
    tracker.addBreadcrumb({
      type: 'error',
      category: componentName,
      message: errorMessage,
      level: 'error',
      data: {
        component: componentName,
        error: error instanceof Error ? {
          name: error.name,
          stack: error.stack
        } : error,
        ...data
      }
    });
  };
  
  const trackApi = (endpoint: string, method: string, status?: number, data?: Record<string, any>) => {
    if (!isMounted.current) return;
    
    tracker.addBreadcrumb({
      type: 'api',
      category: 'request',
      message: `${method} ${endpoint} ${status ? `→ ${status}` : ''}`,
      level: status && status >= 400 ? 'error' : 'info',
      data: {
        component: componentName,
        endpoint,
        method,
        status,
        ...data
      }
    });
  };
  
  return {
    trackAction,
    trackState,
    trackError,
    trackApi,
    getBreadcrumbs: () => tracker.getBreadcrumbs(),
    clearBreadcrumbs: () => tracker.clearBreadcrumbs()
  };
};

// Make tracker available globally in development
if (import.meta.env.DEV) {
  (window as any).__BREADCRUMBS__ = getBreadcrumbTracker();
}