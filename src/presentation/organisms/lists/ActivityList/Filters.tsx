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
    <div className={`bg-muted/30 border-b p-3 space-y-3 ${className}`}>
      {/* Primary Filters Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Time Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Time:</span>
          <Select 
            value={filters.timeRange} 
            onValueChange={(value) => setFilters({ timeRange: value as any })}
          >
            <SelectTrigger className="w-24 h-9 text-sm">
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
        </div>

        {/* AI Filtering Toggle */}
        <Button
          variant={filters.aiFiltering ? "default" : "outline"}
          size="sm"
          onClick={() => setFilters({ aiFiltering: !filters.aiFiltering })}
          className="h-9 px-3 text-sm"
          title="Toggle AI-powered filtering"
        >
          <Zap className="h-4 w-4 mr-2" />
          AI Filter
        </Button>

        {/* Clustering Toggle */}
        <Button
          variant={filters.showClusters ? "default" : "outline"}
          size="sm"
          onClick={() => setFilters({ showClusters: !filters.showClusters })}
          className="h-9 px-3 text-sm"
          title="Toggle activity clustering"
        >
          <Layers className="h-4 w-4 mr-2" />
          Cluster
        </Button>
      </div>

      {/* Advanced Filters Row */}
      {showAdvanced && (
        <div className="flex items-center gap-4 flex-wrap">
          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Priority:</span>
            <div className="flex gap-1">
              {[
                { key: 'critical', label: 'Critical', color: 'bg-red-500 text-white' },
                { key: 'high', label: 'High', color: 'bg-orange-500 text-white' },
                { key: 'medium', label: 'Medium', color: 'bg-yellow-500 text-white' },
                { key: 'low', label: 'Low', color: 'bg-green-500 text-white' }
              ].map(priority => (
                <Button
                  key={priority.key}
                  variant={filters.priorities.includes(priority.key as any) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newPriorities = filters.priorities.includes(priority.key as any)
                      ? filters.priorities.filter(p => p !== priority.key)
                      : [...filters.priorities, priority.key as any];
                    setFilters({ priorities: newPriorities });
                  }}
                  className={`h-8 px-3 text-sm ${filters.priorities.includes(priority.key as any) ? priority.color : ''}`}
                  title={`Toggle ${priority.label} priority filter`}
                >
                  {priority.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Status:</span>
            <div className="flex gap-1">
              {[
                { key: 'pending', label: 'Pending' },
                { key: 'investigating', label: 'Active' },
                { key: 'resolved', label: 'Resolved' },
                { key: 'dismissed', label: 'Dismissed' }
              ].map(status => (
                <Button
                  key={status.key}
                  variant={filters.statuses.includes(status.key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newStatuses = filters.statuses.includes(status.key)
                      ? filters.statuses.filter(s => s !== status.key)
                      : [...filters.statuses, status.key];
                    setFilters({ statuses: newStatuses });
                  }}
                  className="h-8 px-3 text-sm"
                  title={`Toggle ${status.label} status filter`}
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Confidence Threshold */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Confidence:</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.confidenceThreshold}
                onChange={(e) => setFilters({ confidenceThreshold: parseInt(e.target.value) })}
                className="w-20 h-2 bg-muted rounded-lg"
                title="Set minimum confidence threshold"
              />
              <span className="text-sm font-medium w-10 text-foreground">{filters.confidenceThreshold}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}