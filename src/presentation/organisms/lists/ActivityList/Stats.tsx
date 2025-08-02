/**
 * ActivityList.Stats - Performance and activity statistics component
 */

import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Progress } from '../../../../../components/ui/progress';
import { BarChart3, Activity, Clock, Zap, Target, TrendingUp } from 'lucide-react';
import { useActivityListContext } from './ActivityListContext';
import { ActivityListStatsProps } from './types';

export function Stats({ className = '', detailed = false }: ActivityListStatsProps) {
  const {
    activities,
    filteredActivities,
    performanceMetrics,
    priorityMetrics,
    realTimeMode
  } = useActivityListContext();

  // Calculate additional stats for detailed view
  const detailedStats = React.useMemo(() => {
    if (!detailed) return null;

    const totalFiltered = filteredActivities.length;
    const criticalPercentage = totalFiltered > 0 ? (priorityMetrics.critical / totalFiltered) * 100 : 0;
    const highPercentage = totalFiltered > 0 ? (priorityMetrics.high / totalFiltered) * 100 : 0;
    const filterEfficiency = activities.length > 0 ? (totalFiltered / activities.length) * 100 : 0;

    return {
      criticalPercentage,
      highPercentage,
      filterEfficiency,
      totalFiltered
    };
  }, [detailed, filteredActivities, priorityMetrics, activities]);

  if (!detailed) {
    // Compact stats display
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">
            {filteredActivities.length.toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">activities</span>
        </div>
        
        {priorityMetrics.critical > 0 && (
          <Badge variant="destructive" className="text-xs">
            {priorityMetrics.critical} Critical
          </Badge>
        )}
        {priorityMetrics.high > 0 && (
          <Badge className="bg-orange-500 text-white text-xs">
            {priorityMetrics.high} High
          </Badge>
        )}
        
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{performanceMetrics.renderTime}ms</span>
        </div>
        
        {realTimeMode && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs animate-pulse">
            LIVE
          </Badge>
        )}
      </div>
    );
  }

  // Detailed stats view
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4" />
          Activity Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Priority Distribution */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Priority Distribution</span>
            <span className="text-xs text-gray-500">
              {detailedStats?.totalFiltered} total
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Critical
              </span>
              <span>{priorityMetrics.critical} ({detailedStats?.criticalPercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={detailedStats?.criticalPercentage || 0} className="h-1" />
            
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                High
              </span>
              <span>{priorityMetrics.high} ({detailedStats?.highPercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={detailedStats?.highPercentage || 0} className="h-1" />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Confidence</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {performanceMetrics.averageConfidence.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-800">Filter Rate</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {detailedStats?.filterEfficiency.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Processing Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>Processing: {performanceMetrics.processingRate.toFixed(1)}/min</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Render: {performanceMetrics.renderTime}ms</span>
          </div>
        </div>

        {/* Memory Usage (if available) */}
        {(performance as any).memory?.usedJSHeapSize && (
          <div className="text-xs text-gray-500 text-center">
            Memory: {Math.round((performance as any).memory.usedJSHeapSize / 1048576)}MB
          </div>
        )}
      </CardContent>
    </Card>
  );
}