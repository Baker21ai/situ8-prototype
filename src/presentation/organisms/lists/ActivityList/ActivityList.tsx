/**
 * ActivityList - Main compound component with keyboard shortcuts and real-time updates
 */

import React, { useEffect, useCallback } from 'react';
import { ActivityListProvider } from './ActivityListContext';
import { Header } from './Header';
import { Content } from './Content';
import { Footer } from './Footer';
import { Filters } from './Filters';
import { Stats } from './Stats';
import { Search } from './Search';
import { ViewToggle } from './ViewToggle';
import { 
  ActivityListProps, 
  ActivityListCompound 
} from './types';

function ActivityListBase({
  activities,
  onActivitySelect,
  onActivityAction,
  onBulkAction,
  realTimeMode = true,
  className = '',
  height = 400,
  children
}: ActivityListProps) {
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey) {
      switch (e.key) {
        case 'f':
          e.preventDefault();
          document.getElementById('activity-search')?.focus();
          break;
        case 'r':
          e.preventDefault();
          // AI filtering toggle will be handled by context
          break;
        case 'm':
          e.preventDefault();
          // View mode toggle will be handled by context
          break;
        case 'v':
          e.preventDefault();
          // Virtual scrolling toggle will be handled by context
          break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <ActivityListProvider
      activities={activities}
      onActivitySelect={onActivitySelect}
      onActivityAction={onActivityAction}
      onBulkAction={onBulkAction}
      realTimeMode={realTimeMode}
      height={height}
      className={className}
    >
      <div className={`h-full flex flex-col bg-white ${className}`}>
        {children}
      </div>
    </ActivityListProvider>
  );
}

// Create compound component with sub-components attached
const ActivityList = ActivityListBase as ActivityListCompound;

// Attach sub-components
ActivityList.Header = Header;
ActivityList.Content = Content;
ActivityList.Footer = Footer;
ActivityList.Filters = Filters;
ActivityList.Stats = Stats;
ActivityList.Search = Search;
ActivityList.ViewToggle = ViewToggle;

export { ActivityList };