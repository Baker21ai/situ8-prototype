/**
 * ActivityList.ViewToggle - View mode toggle component
 */

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '../../../../../components/ui/tabs';
import { useActivityListContext } from './ActivityListContext';
import { ActivityListViewToggleProps } from './types';

export function ViewToggle({ className = '' }: ActivityListViewToggleProps) {
  const { viewMode, setViewMode } = useActivityListContext();

  return (
    <Tabs 
      value={viewMode} 
      onValueChange={(value) => setViewMode(value as any)} 
      className={`w-auto ${className}`}
    >
      <TabsList className="h-8 p-1">
        <TabsTrigger value="minimal" className="text-xs px-2 py-1">
          Minimal
        </TabsTrigger>
        <TabsTrigger value="summary" className="text-xs px-2 py-1">
          Summary
        </TabsTrigger>
        <TabsTrigger value="stream" className="text-xs px-2 py-1">
          Stream
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}