/**
 * ActivityList.Filters - Advanced filtering component
 */

import React from 'react';
import { Button } from '../../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { Zap, Layers } from 'lucide-react';
import { useActivityListContext } from './ActivityListContext';
import { ActivityListFiltersProps } from './types';

export function Filters({ className = '', showAdvanced = true }: ActivityListFiltersProps) {
  const { filters, setFilters } = useActivityListContext();

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Primary Filters Row */}
      <div className="flex items-center gap-2">
        {/* Time Range */}
        <Select 
          value={filters.timeRange} 
          onValueChange={(value) => setFilters({ timeRange: value as any })}
        >
          <SelectTrigger className="w-20 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="15m">15m</SelectItem>
            <SelectItem value="1h">1h</SelectItem>
            <SelectItem value="4h">4h</SelectItem>
            <SelectItem value="24h">24h</SelectItem>
          </SelectContent>
        </Select>

        {/* AI Filtering Toggle */}
        <Button
          variant={filters.aiFiltering ? "default" : "outline"}
          size="sm"
          onClick={() => setFilters({ aiFiltering: !filters.aiFiltering })}
          className="h-8 px-2 text-xs"
          title="Toggle AI-powered filtering"
        >
          <Zap className="h-3 w-3 mr-1" />
          AI Filter
        </Button>

        {/* Clustering Toggle */}
        <Button
          variant={filters.showClusters ? "default" : "outline"}
          size="sm"
          onClick={() => setFilters({ showClusters: !filters.showClusters })}
          className="h-8 px-2 text-xs"
          title="Toggle activity clustering"
        >
          <Layers className="h-3 w-3 mr-1" />
          Cluster
        </Button>
      </div>

      {/* Advanced Filters Row */}
      {showAdvanced && (
        <div className="flex items-center gap-2 text-xs">
          {/* Priority Filter */}
          <div className="flex gap-1">
            <span className="text-xs text-gray-600 mr-1">Priority:</span>
            {['critical', 'high', 'medium', 'low'].map(priority => (
              <Button
                key={priority}
                variant={filters.priorities.includes(priority as any) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newPriorities = filters.priorities.includes(priority as any)
                    ? filters.priorities.filter(p => p !== priority)
                    : [...filters.priorities, priority as any];
                  setFilters({ priorities: newPriorities });
                }}
                className="h-6 px-2 text-xs"
                title={`Toggle ${priority} priority filter`}
              >
                {priority.charAt(0).toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Confidence Threshold */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600">Confidence:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.confidenceThreshold}
              onChange={(e) => setFilters({ confidenceThreshold: parseInt(e.target.value) })}
              className="w-16 h-2"
              title="Set minimum confidence threshold"
            />
            <span className="text-xs w-8">{filters.confidenceThreshold}%</span>
          </div>

          {/* Status Filter */}
          <div className="flex gap-1">
            <span className="text-xs text-gray-600 mr-1">Status:</span>
            {['pending', 'investigating', 'resolved', 'dismissed'].map(status => (
              <Button
                key={status}
                variant={filters.statuses.includes(status) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newStatuses = filters.statuses.includes(status)
                    ? filters.statuses.filter(s => s !== status)
                    : [...filters.statuses, status];
                  setFilters({ statuses: newStatuses });
                }}
                className="h-6 px-2 text-xs"
                title={`Toggle ${status} status filter`}
              >
                {status.charAt(0).toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}