/**
 * Breadcrumb Navigation Component
 * Provides consistent navigation breadcrumbs across modules
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useModuleNavigation, type ModuleName } from '../../hooks/useModuleNavigation';

interface BreadcrumbItem {
  label: string;
  module?: ModuleName;
  action?: () => void;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNavigation({ items, className = '' }: BreadcrumbNavigationProps) {
  const navigation = useModuleNavigation();
  
  // Use provided items or generate from navigation context
  const breadcrumbs = items || navigation.generateBreadcrumbs();

  // Don't render if only one item (current page)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" aria-hidden="true" />
            )}
            
            {/* Clickable breadcrumb item */}
            {(crumb.module || crumb.action) && index < breadcrumbs.length - 1 ? (
              <button
                onClick={() => {
                  if (crumb.module) {
                    navigation.navigateToModule(crumb.module);
                  } else if (crumb.action) {
                    crumb.action();
                  }
                }}
                className="hover:text-gray-700 transition-colors duration-200 underline-offset-2 hover:underline"
                type="button"
              >
                {crumb.label}
              </button>
            ) : (
              /* Current/non-clickable breadcrumb item */
              <span 
                className={`${
                  index === breadcrumbs.length - 1 
                    ? 'text-gray-900 font-medium' 
                    : 'text-gray-500'
                }`}
                aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
              >
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Hook for generating custom breadcrumbs
export function useBreadcrumbs() {
  const navigation = useModuleNavigation();
  
  const addBreadcrumb = (label: string, module?: ModuleName, action?: () => void) => {
    return { label, module, action };
  };
  
  const generateEntityBreadcrumb = (
    entityType: 'activity' | 'incident' | 'case' | 'passdown' | 'bol',
    entityId: string,
    action?: () => void
  ) => {
    const entityLabels = {
      'activity': 'Activity',
      'incident': 'Incident', 
      'case': 'Case',
      'passdown': 'Passdown',
      'bol': 'BOL'
    };
    
    return addBreadcrumb(`${entityLabels[entityType]} ${entityId}`, undefined, action);
  };
  
  return {
    addBreadcrumb,
    generateEntityBreadcrumb,
    getDefaultBreadcrumbs: () => navigation.generateBreadcrumbs()
  };
}