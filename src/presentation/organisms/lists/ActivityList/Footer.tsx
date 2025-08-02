/**
 * ActivityList.Footer - Footer with status, pagination and keyboard shortcuts
 */

import React from 'react';
import { Button } from '../../../../../components/ui/button';
import { useActivityListContext } from './ActivityListContext';
import { ActivityListFooterProps } from './types';

export function Footer({ className = '' }: ActivityListFooterProps) {
  const {
    activities,
    filteredActivities,
    realTimeMode,
    hasSelection,
    selectedItems,
    onBulkAction
  } = useActivityListContext();

  const handleBulkAction = (action: string) => {
    if (onBulkAction && selectedItems.size > 0) {
      // Get actual enterprise activities (filter out clusters for bulk actions)
      const selectedActivities = activities.filter(activity => 
        selectedItems.has(activity.id) && !('clusterType' in activity)
      );
      onBulkAction(action, selectedActivities as any);
    }
  };

  return (
    <div className={`flex-shrink-0 ${className}`}>
      {/* Bulk Actions Bar */}
      {hasSelection && (
        <div className="p-2 bg-blue-50 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedItems.size} activities selected
            </span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkAction('escalate')}
                className="text-xs"
              >
                Escalate
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkAction('assign')}
                className="text-xs"
              >
                Assign
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkAction('resolve')}
                className="text-xs"
              >
                Resolve
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleBulkAction('clear')}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="p-2 border-t bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>
              Showing {filteredActivities.length.toLocaleString()} of {activities.length.toLocaleString()}
            </span>
            <span>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            {realTimeMode && (
              <span className="text-green-600 font-medium">
                Real-time updates: ON
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span>Ctrl+F: Search</span>
            <span>Ctrl+M: Toggle view</span>
            <span>Ctrl+R: Toggle AI filter</span>
            <span>Ctrl+V: Toggle virtual scrolling</span>
            <span>↑↓: Navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
}