/**
 * Module Navigation Hook
 * Handles navigation between different modules with context passing
 */

import React, { useCallback } from 'react';

export type ModuleName = 'activities' | 'incidents' | 'cases' | 'passdowns' | 'command-center';

export interface NavigationContext {
  sourceModule?: ModuleName;
  sourceEntityId?: string;
  sourceEntityType?: 'activity' | 'incident' | 'case' | 'passdown';
  action?: 'create' | 'view' | 'edit' | 'link';
  data?: any;
}

export interface ModuleNavigationOptions {
  onModuleChange?: (module: ModuleName, context?: NavigationContext) => void;
}

export function useModuleNavigation({ onModuleChange }: ModuleNavigationOptions = {}) {
  
  // Navigate to a specific module with context
  const navigateToModule = useCallback((
    targetModule: ModuleName, 
    context?: NavigationContext
  ) => {
    if (onModuleChange) {
      onModuleChange(targetModule, context);
    } else {
      // Fallback: emit custom event for App component to handle
      window.dispatchEvent(new CustomEvent('module-navigation', {
        detail: { targetModule, context }
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

  return {
    navigateToModule,
    createPassdownFrom,
    createIncidentFrom,
    createCaseFrom,
    viewRelatedEntities,
    linkEntities
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