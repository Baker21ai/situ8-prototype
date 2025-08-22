/**
 * ActivityActions Molecule Component
 * Handles all activity-related actions: view, edit, escalate, assign, etc.
 * Provides consistent action patterns across all activity card variants
 */

import React from 'react';
import { Button } from '../../../../components/ui/button';
import { ActionButton } from '../../atoms/buttons/ActionButton';
import { 
  Eye, 
  MoreVertical, 
  AlertTriangle, 
  User, 
  Clock, 
  FileText,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import { EnterpriseActivity, ActivityCluster } from '../../../../lib/types/activity';

export interface ActivityActionsProps {
  activity: EnterpriseActivity | ActivityCluster;
  variant?: 'full' | 'compact' | 'minimal' | 'tooltip';
  onAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  showExpandCollapse?: boolean;
  isExpanded?: boolean;
  showQuickActions?: boolean;
  showMainActions?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ActivityActions: React.FC<ActivityActionsProps> = ({
  activity,
  variant = 'full',
  onAction,
  showExpandCollapse = false,
  isExpanded = false,
  showQuickActions = true,
  showMainActions = true,
  disabled = false,
  className = ''
}) => {
  const handleAction = (action: string) => {
    if (!disabled && onAction) {
      onAction(action, activity);
    }
  };

  const getButtonSize = () => {
    switch (variant) {
      case 'minimal':
        return 'sm';
      case 'compact':
        return 'sm';
      default:
        return 'default';
    }
  };

  const buttonSize = getButtonSize();
  const isCluster = 'clusterType' in activity;

  // Minimal variant: just a toggle button and lightning bolt
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {/* Lightning Bolt - Command Center */}
        <Button
          size="sm"
          variant="ghost"
          className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700"
          onClick={(e) => {
            e.stopPropagation();
            handleAction('command-center');
          }}
          disabled={disabled}
          title="Open Command Center"
        >
          <Zap className="h-2 w-2" />
        </Button>
        
        {showExpandCollapse && (
          <Button
            size="sm"
            variant="ghost"
            className="h-3 w-3 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(isExpanded ? 'collapse' : 'expand');
            }}
            disabled={disabled}
          >
            {isExpanded ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
          </Button>
        )}
      </div>
    );
  }

  // Tooltip variant: just a more options button
  if (variant === 'tooltip') {
    return (
      <div className={className}>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            handleAction('more_options');
          }}
          disabled={disabled}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Quick Actions */}
      {showQuickActions && !isCluster && (
        <div className="flex items-center gap-1">
          {/* Lightning Bolt - Command Center */}
          <Button
            size={buttonSize}
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleAction('command-center');
            }}
            disabled={disabled}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Open Modular Command Center"
          >
            <Zap className="h-4 w-4" />
          </Button>

          <Button
            size={buttonSize}
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleAction('view');
            }}
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {/* Show escalation if activity can be escalated */}
          {(activity as EnterpriseActivity).priority !== 'critical' && (
            <ActionButton
              variant="warning"
              icon={<AlertTriangle className="h-4 w-4" />}
              size={buttonSize}
              onClick={() => handleAction('escalate')}
              disabled={disabled}
            >
              {variant === 'full' ? 'Escalate' : ''}
            </ActionButton>
          )}

          {/* Show assignment if not assigned */}
          {!(activity as EnterpriseActivity).assignedTo && (
            <ActionButton
              variant="secondary"
              icon={<User className="h-4 w-4" />}
              size={buttonSize}
              onClick={() => handleAction('assign')}
              disabled={disabled}
            >
              {variant === 'full' ? 'Assign' : ''}
            </ActionButton>
          )}
        </div>
      )}

      {/* Cluster-specific actions */}
      {showQuickActions && isCluster && (
        <div className="flex items-center gap-1">
          <Button
            size={buttonSize}
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleAction('view_all');
            }}
            disabled={disabled}
            className="text-xs"
          >
            View All {(activity as ActivityCluster).count}
          </Button>
        </div>
      )}

      {/* Main Actions */}
      {showMainActions && (
        <div className="flex items-center gap-1">
          {showExpandCollapse && (
            <Button
              size={buttonSize}
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(isExpanded ? 'collapse' : 'expand');
              }}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}

          {!isCluster && (
            <>
              {/* Create incident from activity */}
              <ActionButton
                variant="critical"
                icon={<AlertTriangle className="h-4 w-4" />}
                size={buttonSize}
                onClick={() => handleAction('create_incident')}
                disabled={disabled}
              >
                {variant === 'full' ? 'Create Incident' : ''}
              </ActionButton>

              {/* Add to case */}
              <ActionButton
                variant="secondary"
                icon={<FileText className="h-4 w-4" />}
                size={buttonSize}
                onClick={() => handleAction('add_to_case')}
                disabled={disabled}
              >
                {variant === 'full' ? 'Add to Case' : ''}
              </ActionButton>
            </>
          )}

          {/* More options */}
          <Button
            size={buttonSize}
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleAction('more_options');
            }}
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Specialized variants for convenience
export const ActivityActionsCompact: React.FC<Omit<ActivityActionsProps, 'variant'>> = (props) => (
  <ActivityActions {...props} variant="compact" />
);

export const ActivityActionsMinimal: React.FC<Omit<ActivityActionsProps, 'variant'>> = (props) => (
  <ActivityActions {...props} variant="minimal" />
);

export const ActivityActionsTooltip: React.FC<Omit<ActivityActionsProps, 'variant'>> = (props) => (
  <ActivityActions {...props} variant="tooltip" />
);