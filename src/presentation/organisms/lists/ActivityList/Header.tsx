/**
 * ActivityList.Header - Header section with search, filters, and controls
 */

import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { BarChart3, Grid3X3, ArrowRight, Maximize2, Minimize2, Layers } from 'lucide-react';
import { useActivityListContext } from './ActivityListContext';
import { ActivityListHeaderProps } from './types';

export function Header({ children, className = '' }: ActivityListHeaderProps) {
  const {
    performanceMetrics,
    priorityMetrics,
    realTimeMode,
    showPerformanceMetrics,
    layoutMode,
    compactMode,
    useVirtualScrolling,
    setShowPerformanceMetrics,
    setLayoutMode,
    setCompactMode,
    setUseVirtualScrolling
  } = useActivityListContext();

  return (
    <div className={`flex-shrink-0 p-3 border-b bg-gradient-to-r from-slate-50 to-white ${className}`}>
      {/* Title and Status Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Enterprise Activity Center</h2>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {performanceMetrics.filteredCount.toLocaleString()} / {performanceMetrics.totalActivities.toLocaleString()}
          </Badge>
          
          {/* Priority-based badges */}
          {priorityMetrics.critical > 0 && (
            <Badge className="bg-red-500 text-white">
              {priorityMetrics.critical} Critical
            </Badge>
          )}
          {priorityMetrics.high > 0 && (
            <Badge className="bg-orange-500 text-white">
              {priorityMetrics.high} High
            </Badge>
          )}
          {priorityMetrics.medium > 0 && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {priorityMetrics.medium} Medium
            </Badge>
          )}
          {priorityMetrics.low > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {priorityMetrics.low} Low
            </Badge>
          )}
          
          {realTimeMode && (
            <Badge className="bg-green-100 text-green-800 animate-pulse">
              LIVE
            </Badge>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
            className="text-xs"
            title="Toggle performance metrics"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLayoutMode(layoutMode === 'grid' ? 'horizontal' : 'grid')}
            className="text-xs"
            title="Toggle layout mode"
          >
            {layoutMode === 'grid' ? (
              <>
                <Grid3X3 className="h-3 w-3 mr-1" />
                Grid
              </>
            ) : (
              <>
                <ArrowRight className="h-3 w-3 mr-1" />
                Scroll
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompactMode(!compactMode)}
            className="text-xs"
            title="Toggle compact mode"
          >
            {compactMode ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          <Button
            variant={useVirtualScrolling ? "default" : "outline"}
            size="sm"
            onClick={() => setUseVirtualScrolling(!useVirtualScrolling)}
            className="text-xs"
            title="Toggle virtual scrolling for 5000+ items"
          >
            <Layers className="h-3 w-3 mr-1" />
            Virtual
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      {showPerformanceMetrics && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Performance Metrics</span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-xs text-blue-700">
            <div>
              <div className="font-medium">Avg Confidence</div>
              <div>{performanceMetrics.averageConfidence.toFixed(1)}%</div>
            </div>
            <div>
              <div className="font-medium">Processing Rate</div>
              <div>{performanceMetrics.processingRate.toFixed(1)}/min</div>
            </div>
            <div>
              <div className="font-medium">Render Time</div>
              <div>{performanceMetrics.renderTime}ms</div>
            </div>
            <div>
              <div className="font-medium">Memory Usage</div>
              <div>
                {(performance as any).memory?.usedJSHeapSize ? 
                  `${Math.round((performance as any).memory.usedJSHeapSize / 1048576)}MB` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom children (search, filters, etc.) */}
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}