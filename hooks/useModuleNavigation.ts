/**
 * Module Navigation Hook
 * Handles navigation between different modules with context passing
 */

import React, { useCallback } from 'react';

export type ModuleName = 'activities' | 'incidents' | 'cases' | 'passdowns' | 'command-center' | 'communications' | 'visitors' | 'bol' | 'lost-found' | 'keys' | 'reports' | 'users' | 'settings' | 'performance-test' | 'performance-dashboard';

export interface NavigationContext {
  sourceModule?: ModuleName;
  sourceEntityId?: string;
  sourceEntityType?: 'activity' | 'incident' | 'case' | 'passdown' | 'bol';
  action?: 'create' | 'view' | 'edit' | 'link';
  data?: any;
  returnPath?: string;
  searchTerm?: string;
  filters?: Record<string, any>;
  timestamp?: Date;
}

export interface ModuleNavigationOptions {
  onModuleChange?: (module: ModuleName, context?: NavigationContext) => void;
}

// Global navigation state
let navigationHistory: Array<{ module: ModuleName; context?: NavigationContext; timestamp: Date }> = [];
let currentModule: ModuleName = 'command-center';

export const setCurrentModule = (module: ModuleName) => {
  currentModule = module;
};

export const getCurrentModule = () => currentModule;

// Breadcrumb generation helper
export const generateBreadcrumbs = (module: ModuleName, context?: NavigationContext): Array<{ label: string; module?: ModuleName; action?: () => void }> => {
  const moduleLabels: Record<ModuleName, string> = {
    'command-center': 'Command Center',
    'activities': 'Activities',
    'cases': 'Cases',
    'passdowns': 'Passdowns',
    'communications': 'Communications',
    'visitors': 'Visitor Management',
    'incidents': 'Incidents',
    'bol': 'BOL',
    'lost-found': 'Lost & Found',
    'keys': 'Key Management',
    'reports': 'Reports',
    'users': 'User Management',
    'settings': 'Settings',
    'performance-test': 'Performance Test',
    'performance-dashboard': 'Performance Dashboard'
  };

  const breadcrumbs: Array<{ label: string; module?: ModuleName; action?: () => void }> = [
    { label: 'Command Center', module: 'command-center' }
  ];

  if (module !== 'command-center') {
    breadcrumbs.push({ label: moduleLabels[module], module });
  }

  // Add specific entity if available
  if (context?.sourceEntityId && context?.sourceEntityType) {
    const entityLabels = {
      'activity': 'Activity',
      'incident': 'Incident', 
      'case': 'Case',
      'passdown': 'Passdown',
      'bol': 'BOL'
    };
    
    breadcrumbs.push({ 
      label: `${entityLabels[context.sourceEntityType]} ${context.sourceEntityId}`,
      action: () => {
        console.log('Navigate to entity:', context.sourceEntityType, context.sourceEntityId);
      }
    });
  }

  return breadcrumbs;
};

export function useModuleNavigation({ onModuleChange }: ModuleNavigationOptions = {}) {
  
  // Navigate to a specific module with context
  const navigateToModule = useCallback((
    targetModule: ModuleName, 
    context?: NavigationContext
  ) => {
    // Add current state to navigation history
    if (currentModule !== targetModule) {
      navigationHistory.push({
        module: currentModule,
        context: undefined, // Could store current context state here
        timestamp: new Date()
      });
      
      // Keep history limited to last 10 entries
      if (navigationHistory.length > 10) {
        navigationHistory = navigationHistory.slice(-10);
      }
    }

    // Update current module
    setCurrentModule(targetModule);

    // Store navigation context
    const enhancedContext = {
      ...context,
      timestamp: new Date()
    };

    // Store context in sessionStorage for deep linking
    if (enhancedContext) {
      sessionStorage.setItem(`navigation-context-${targetModule}`, JSON.stringify(enhancedContext));
    }

    if (onModuleChange) {
      onModuleChange(targetModule, enhancedContext);
    } else {
      // Fallback: emit custom event for App component to handle
      window.dispatchEvent(new CustomEvent('module-navigation', {
        detail: { targetModule, context: enhancedContext }
      }));
    }
  }, [onModuleChange]);

  // Navigate to create passdown from source entity
  const createPassdownFrom = useCallback((
    sourceModule: ModuleName,
    sourceEntityId: string,
    sourceEntityType: NavigationContext['sourceEntityType'],
    sourceData?: any
  ) => {
    navigateToModule('passdowns', {
      sourceModule,
      sourceEntityId,
      sourceEntityType,
      action: 'create',
      data: sourceData
    });
  }, [navigateToModule]);

  // Navigate to create incident from source entity
  const createIncidentFrom = useCallback((
    sourceModule: ModuleName,
    sourceEntityId: string,
    sourceEntityType: NavigationContext['sourceEntityType'],
    sourceData?: any
  ) => {
    navigateToModule('incidents', {
      sourceModule,
      sourceEntityId,
      sourceEntityType,
      action: 'create',
      data: sourceData
    });
  }, [navigateToModule]);

  // Navigate to create case from source entity
  const createCaseFrom = useCallback((
    sourceModule: ModuleName,
    sourceEntityId: string,
    sourceEntityType: NavigationContext['sourceEntityType'],
    sourceData?: any
  ) => {
    navigateToModule('cases', {
      sourceModule,
      sourceEntityId,
      sourceEntityType,
      action: 'create',
      data: sourceData
    });
  }, [navigateToModule]);

  // Navigate to view related entities
  const viewRelatedEntities = useCallback((
    targetModule: ModuleName,
    sourceEntityId: string,
    sourceEntityType: NavigationContext['sourceEntityType']
  ) => {
    navigateToModule(targetModule, {
      sourceEntityId,
      sourceEntityType,
      action: 'view'
    });
  }, [navigateToModule]);

  // Navigate to link entities
  const linkEntities = useCallback((
    targetModule: ModuleName,
    sourceModule: ModuleName,
    sourceEntityId: string,
    sourceEntityType: NavigationContext['sourceEntityType']
  ) => {
    navigateToModule(targetModule, {
      sourceModule,
      sourceEntityId,
      sourceEntityType,
      action: 'link'
    });
  }, [navigateToModule]);

  // Navigate back to previous module
  const navigateBack = useCallback(() => {
    if (navigationHistory.length > 0) {
      const lastEntry = navigationHistory.pop();
      if (lastEntry) {
        setCurrentModule(lastEntry.module);
        if (onModuleChange) {
          onModuleChange(lastEntry.module, lastEntry.context);
        } else {
          window.dispatchEvent(new CustomEvent('module-navigation', {
            detail: { targetModule: lastEntry.module, context: lastEntry.context }
          }));
        }
      }
    }
  }, [onModuleChange]);

  // Get stored navigation context for a module
  const getNavigationContext = useCallback((module: ModuleName): NavigationContext | null => {
    try {
      const stored = sessionStorage.getItem(`navigation-context-${module}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  // Clear navigation context for a module
  const clearNavigationContext = useCallback((module: ModuleName) => {
    sessionStorage.removeItem(`navigation-context-${module}`);
  }, []);

  // Get current navigation history
  const getNavigationHistory = useCallback(() => [...navigationHistory], []);

  return {
    navigateToModule,
    createPassdownFrom,
    createIncidentFrom,
    createCaseFrom,
    viewRelatedEntities,
    linkEntities,
    navigateBack,
    getNavigationContext,
    clearNavigationContext,
    getNavigationHistory,
    getCurrentModule: getCurrentModule,
    generateBreadcrumbs: (context?: NavigationContext) => generateBreadcrumbs(currentModule, context)
  };
}

// Event listener hook for components that need to listen to navigation events
export function useModuleNavigationListener(
  onNavigationEvent: (targetModule: ModuleName, context?: NavigationContext) => void
) {
  const handleNavigationEvent = useCallback((event: CustomEvent) => {
    const { targetModule, context } = event.detail;
    onNavigationEvent(targetModule, context);
  }, [onNavigationEvent]);

  // Set up event listener
  React.useEffect(() => {
    window.addEventListener('module-navigation', handleNavigationEvent as EventListener);
    
    return () => {
      window.removeEventListener('module-navigation', handleNavigationEvent as EventListener);
    };
  }, [handleNavigationEvent]);
}