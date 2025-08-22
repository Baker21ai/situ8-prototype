/**
 * KanbanLayout - Status-based Kanban board for Activities
 * Shows Ambient.AI alerts and activities in status columns
 */

import React from 'react';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { Badge } from '../../../../../components/ui/badge';
import { EnterpriseActivityCard } from '../../../../../components/EnterpriseActivityCard';
import { 
  Search, 
  UserCheck, 
  Siren, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Pause,
  TrendingUp
} from 'lucide-react';
import { Status } from '../../../../../lib/utils/status';

// Status configuration for Kanban columns - ordered by incident flow
const STATUS_CONFIGS = {
  detecting: {
    label: 'Detecting',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: <Search className="h-4 w-4" />,
    description: 'New alerts being processed'
  },
  pending: {
    label: 'Pending',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    icon: <Pause className="h-4 w-4" />,
    description: 'Awaiting review/approval'
  },
  escalated: {
    label: 'Escalated',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Requires immediate attention'
  },
  'in-progress': {
    label: 'In Progress',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-800',
    icon: <Siren className="h-4 w-4" />,
    description: 'Work in progress'
  },
  review: {
    label: 'Review',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: <Clock className="h-4 w-4" />,
    description: 'Under review'
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'Completed successfully'
  },
  deferred: {
    label: 'Deferred',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-800',
    icon: <Clock className="h-4 w-4" />,
    description: 'Postponed for later'
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-800',
    icon: <Clock className="h-4 w-4" />,
    description: 'No longer active'
  }
};

interface KanbanLayoutProps {
  items: any[];
  onSelect: (item: any) => void;
  onAction: (action: string, item: any) => void;
  selectedItems: Set<string>;
  variant: 'stream' | 'timeline' | 'list' | 'evidence' | 'mobile' | 'cluster' | 'summary' | 'minimal';
  compactMode: boolean;
}

export const KanbanLayout = React.memo(({ 
  items, 
  onSelect, 
  onAction, 
  selectedItems, 
  variant, 
  compactMode 
}: KanbanLayoutProps) => {
  
  // Debug logging
  console.log('🎨 KanbanLayout received items:', items.length, items);
  
  // Group items by status
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    // Initialize all possible statuses
    Object.keys(STATUS_CONFIGS).forEach(status => {
      groups[status] = [];
    });

    items.forEach((item: any) => {
      const status = item.status as Status;
      if (groups[status]) {
        groups[status].push(item);
      } else {
        // Default to detecting for unknown statuses
        if (groups.detecting) {
          groups.detecting.push(item);
        }
      }
    });

    return groups;
  }, [items]);

  const renderKanbanColumn = (status: string, items: any[], config: any) => {
    if (items.length === 0) {
      return null; // Don't render empty columns
    }

    return (
      <div key={status} className="kanban-column">
        <div className={`${config.bg} border ${config.border} rounded-lg h-full flex flex-col shadow-sm`}>
          {/* Column Header */}
          <div className={`p-3 border-b ${config.border} ${config.text}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {config.icon}
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide">
                    {config.label}
                  </h3>
                  <p className="text-xs opacity-75 mt-1">
                    {config.description}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={`${config.text} border-current`}>
                {items.length}
              </Badge>
            </div>
            
            {/* Critical alerts indicator */}
            {status !== 'resolved' && items.some(item => item.priority === 'critical') && (
              <div className="flex items-center gap-1 text-red-600 mt-2">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {items.filter(item => item.priority === 'critical').length} Critical
                </span>
              </div>
            )}
          </div>

          {/* Column Content */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {items.map((item: any, index: number) => (
                <div key={item.id} className="kanban-card">
                  <EnterpriseActivityCard
                    activity={item}
                    variant={variant}
                    onSelect={onSelect}
                    onAction={onAction}
                    isSelected={selectedItems.has(item.id)}
                    index={index}
                    isVisible={true}
                    compactMode={compactMode}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  // Calculate total counts for overview
  const totalCount = items.length;
  const criticalCount = items.filter(item => item.priority === 'critical').length;
  const inProgressCount = groupedItems.pending.length + groupedItems.escalated.length + groupedItems['in-progress'].length;

  // Get only columns that have items
  const activeColumns = Object.entries(groupedItems).filter(([status, items]) => items.length > 0);

  return (
    <div className="h-full flex flex-col">
      {/* Kanban Overview Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Activity Pipeline</h2>
            <p className="text-sm text-gray-600">Real-time security activity management</p>
          </div>
          
          <div className="flex items-center gap-4">
            {criticalCount > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">{criticalCount} Critical</span>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">{totalCount}</span> Total • 
              <span className="font-medium ml-1">{inProgressCount}</span> In Progress
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="kanban-board">
          {activeColumns.map(([status, items]) => 
            renderKanbanColumn(status, items, STATUS_CONFIGS[status as keyof typeof STATUS_CONFIGS])
          )}
        </div>
      </div>
    </div>
  );
});

KanbanLayout.displayName = 'KanbanLayout';
