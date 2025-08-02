/**
 * Integration Status Indicator Component
 * Shows integration links and related items for entities
 */

import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../ui/tooltip';
import { 
  ClipboardList,
  AlertTriangle,
  Briefcase,
  Activity,
  ArrowRight,
  Link
} from 'lucide-react';
import { RelatedEntity } from '../../lib/types/passdown';

interface IntegrationStatusIndicatorProps {
  relatedEntities?: RelatedEntity[];
  onNavigateToEntity?: (entityType: string, entityId: string) => void;
  compact?: boolean;
}

const entityConfig = {
  activity: {
    icon: Activity,
    label: 'Activity',
    color: 'bg-blue-100 text-blue-800'
  },
  incident: {
    icon: AlertTriangle,
    label: 'Incident',
    color: 'bg-orange-100 text-orange-800'
  },
  case: {
    icon: Briefcase,
    label: 'Case',
    color: 'bg-purple-100 text-purple-800'
  },
  passdown: {
    icon: ClipboardList,
    label: 'Passdown',
    color: 'bg-green-100 text-green-800'
  }
};

const relationshipLabels = {
  created_from: 'Created from',
  related_to: 'Related to',
  follow_up: 'Follow-up for',
  reference: 'References',
  monitoring: 'Monitoring'
};

export function IntegrationStatusIndicator({
  relatedEntities = [],
  onNavigateToEntity,
  compact = false
}: IntegrationStatusIndicatorProps) {
  if (relatedEntities.length === 0) {
    return null;
  }

  // Group entities by type
  const entitiesByType = relatedEntities.reduce((acc, entity) => {
    const type = entity.entityType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(entity);
    return acc;
  }, {} as Record<string, RelatedEntity[]>);

  if (compact) {
    // Compact view - just show count badges
    return (
      <div className="flex items-center gap-2">
        <Link className="w-4 h-4 text-gray-400" />
        {Object.entries(entitiesByType).map(([type, entities]) => {
          const config = entityConfig[type as keyof typeof entityConfig];
          if (!config) return null;
          
          const Icon = config.icon;
          
          return (
            <TooltipProvider key={type}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {entities.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{config.label}s</p>
                    {entities.slice(0, 3).map((entity, index) => (
                      <p key={index} className="text-xs">
                        {relationshipLabels[entity.relationshipType] || entity.relationshipType}
                      </p>
                    ))}
                    {entities.length > 3 && (
                      <p className="text-xs text-gray-500">+{entities.length - 3} more</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  // Full view - show detailed list
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Related Items</span>
      </div>
      
      <div className="space-y-2">
        {Object.entries(entitiesByType).map(([type, entities]) => {
          const config = entityConfig[type as keyof typeof entityConfig];
          if (!config) return null;
          
          const Icon = config.icon;
          
          return (
            <div key={type} className="space-y-1">
              {entities.map((entity, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{config.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {relationshipLabels[entity.relationshipType] || entity.relationshipType}
                        </Badge>
                      </div>
                      {entity.notes && (
                        <span className="text-xs text-gray-500">{entity.notes}</span>
                      )}
                    </div>
                  </div>
                  
                  {onNavigateToEntity && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigateToEntity(entity.entityType, entity.entityId)}
                      className="flex items-center gap-1"
                    >
                      <span className="text-xs">View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}