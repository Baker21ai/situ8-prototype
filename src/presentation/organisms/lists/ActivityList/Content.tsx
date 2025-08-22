/**
 * ActivityList.Content - Main content area with virtual scrolling
 */

import React, { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { AlertTriangle, Zap, Clock, Shield } from 'lucide-react';
import { VirtualizedActivityList } from '../VirtualizedActivityList';
import { EnterpriseActivityCard } from '../../../../../components/EnterpriseActivityCard';
import { Badge } from '../../../../../components/ui/badge';
import { useActivityListContext } from './ActivityListContext';
import { ActivityListContentProps, PrioritySegment } from './types';
import { Priority } from '../../../../../lib/utils/status';
import { KanbanLayout } from './KanbanLayout';

// Priority configuration for segments
const PRIORITY_CONFIGS = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: <Zap className="h-4 w-4" />
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: <Clock className="h-4 w-4" />
  },
  low: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: <Shield className="h-4 w-4" />
  }
};

// Priority-based segmented layout component
const PrioritySegmentedList = React.memo(({ items, onSelect, onAction, selectedItems, variant, compactMode, layoutMode }: any) => {
  // Group items by priority
  const groupedItems = React.useMemo(() => {
    const groups = {
      critical: [] as any[],
      high: [] as any[],
      medium: [] as any[],
      low: [] as any[]
    };

    items.forEach((item: any) => {
      const priority = 'clusterType' in item && item.clusterType === 'cluster' ? item.highestPriority : item.priority;
      if (groups[priority as keyof typeof groups]) {
        groups[priority as keyof typeof groups].push(item);
      }
    });

    return groups;
  }, [items]);

  const renderPrioritySection = (priority: string, items: any[], config: any) => {
    if (items.length === 0) return null;

    return (
      <div key={priority} className={`${config.bg} border ${config.border} rounded-lg mb-4`}>
        <div className={`p-3 border-b ${config.border} ${config.text}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.icon}
              <h3 className="font-semibold uppercase text-sm">
                {priority} Priority
              </h3>
              <Badge variant="outline" className={`${config.text} border-current`}>
                {items.length}
              </Badge>
            </div>
            {priority === 'critical' && items.length > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">IMMEDIATE ACTION REQUIRED</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3">
          {layoutMode === 'horizontal' ? (
            <div className="overflow-x-auto max-w-full">
              <div className="flex gap-3" style={{ width: 'max-content' }}>
                {items.map((item: any, index: number) => (
                  <div key={item.id} className="w-72 flex-shrink-0 max-w-full">
                    <EnterpriseActivityCard
                      activity={item}
                      variant={variant}
                      onSelect={onSelect}
                      onAction={onAction}
                      isSelected={selectedItems.has(item.id)}
                      index={index}
                      isVisible={true}
                      compactMode={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 max-w-full">
              {items.map((item: any, index: number) => (
                <div key={item.id} className="w-full max-w-full">
                  <EnterpriseActivityCard
                    activity={item}
                    variant={variant}
                    onSelect={onSelect}
                    onAction={onAction}
                    isSelected={selectedItems.has(item.id)}
                    index={index}
                    isVisible={true}
                    compactMode={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Compute totals for overview visibility
  const totalCount = groupedItems.critical.length + groupedItems.high.length + groupedItems.medium.length + groupedItems.low.length;

  return (
    <div className="p-3 space-y-4">
      {/* Priority Overview - show only when there is at least one item */}
      {totalCount > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-red-600">{groupedItems.critical.length}</div>
            <div className="text-xs text-red-800">Critical</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-orange-600">{groupedItems.high.length}</div>
            <div className="text-xs text-orange-800">High</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-yellow-600">{groupedItems.medium.length}</div>
            <div className="text-xs text-yellow-800">Medium</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-green-600">{groupedItems.low.length}</div>
            <div className="text-xs text-green-800">Low</div>
          </div>
        </div>
      )}

      {/* Priority Sections */}
      {renderPrioritySection('critical', groupedItems.critical, PRIORITY_CONFIGS.critical)}
      {renderPrioritySection('high', groupedItems.high, PRIORITY_CONFIGS.high)}
      {renderPrioritySection('medium', groupedItems.medium, PRIORITY_CONFIGS.medium)}
      {renderPrioritySection('low', groupedItems.low, PRIORITY_CONFIGS.low)}
    </div>
  );
});

PrioritySegmentedList.displayName = 'PrioritySegmentedList';

export function Content({ className = '', height: propHeight }: ActivityListContentProps) {
  const {
    filteredActivities,
    isEmpty,
    viewMode,
    layoutMode,
    compactMode,
    useVirtualScrolling,
    selectedItems,
    onActivitySelect,
    onActivityAction,
    height: contextHeight
  } = useActivityListContext();
  
  // Debug logging for filtering issues
  console.log('📋 Content component - isEmpty:', isEmpty, 'filteredActivities:', filteredActivities.length);

  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(propHeight || contextHeight || 400);

  // Measure container height for virtual scrolling
  useEffect(() => {
    const measureHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const calculatedHeight = Math.max(400, rect.height - 60); // Account for padding
        setListHeight(propHeight || calculatedHeight);
      }
    };

    measureHeight();
    const resizeObserver = new ResizeObserver(measureHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [propHeight]);

  if (isEmpty) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-500 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <div className="text-lg font-medium">No activities found</div>
          <div className="text-sm">Try adjusting your filters or search criteria</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex-1 overflow-hidden ${className}`}>
      {useVirtualScrolling ? (
        <VirtualizedActivityList
          items={filteredActivities}
          variant={viewMode}
          onSelect={onActivitySelect}
          onAction={onActivityAction}
          selectedItems={selectedItems}
          compactMode={compactMode}
          layoutMode={layoutMode}
          height={listHeight}
          // Hide overview by default to prevent top whitespace; pass true to enable
          showPrioritySegments={false}
          enableScrollRestoration={true}
          enableKeyboardNavigation={true}
          className="h-full"
        />
      ) : (
        <KanbanLayout
          items={filteredActivities}
          onSelect={onActivitySelect}
          onAction={onActivityAction}
          selectedItems={selectedItems}
          variant={viewMode}
          compactMode={compactMode}
        />
      )}
    </div>
  );
}