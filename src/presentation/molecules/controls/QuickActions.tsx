/**
 * QuickActions Molecule Component
 * Provides quick action buttons for common activity operations
 * Optimized for speed and efficiency in high-frequency workflows
 */

import React from 'react';
import { ActionButton } from '../../atoms/buttons/ActionButton';
import { Button } from '../../../../components/ui/button';
import { 
  AlertTriangle, 
  User, 
  Eye, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import { EnterpriseActivity, ActivityCluster } from '../../../../lib/types/activity';

export interface QuickActionsProps {
  activity: EnterpriseActivity | ActivityCluster;
  variant?: 'full' | 'compact' | 'minimal' | 'floating';
  onAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  availableActions?: string[];
  disabled?: boolean;
  className?: string;
}

type ActionConfig = {
  key: string;
  label: string;
  icon: React.ReactNode;
  variant: 'critical' | 'warning' | 'success' | 'secondary';
  condition?: (activity: EnterpriseActivity | ActivityCluster) => boolean;
};

const ACTION_CONFIGS: ActionConfig[] = [
  {
    key: 'escalate',
    label: 'Escalate',
    icon: <AlertTriangle className="h-4 w-4" />,
    variant: 'critical',
    condition: (activity) => {
      const priority = 'clusterType' in activity ? activity.highestPriority : activity.priority;
      return priority !== 'critical';
    }
  },
  {
    key: 'assign',
    label: 'Assign',
    icon: <User className="h-4 w-4" />,
    variant: 'secondary',
    condition: (activity) => {
      return !('clusterType' in activity) && !(activity as EnterpriseActivity).assignedTo;
    }
  },
  {
    key: 'view',
    label: 'View',
    icon: <Eye className="h-4 w-4" />,
    variant: 'secondary'
  },
  {
    key: 'create_incident',
    label: 'Create Incident',
    icon: <AlertTriangle className="h-4 w-4" />,
    variant: 'warning',
    condition: (activity) => !('clusterType' in activity)
  },
  {
    key: 'add_to_case',
    label: 'Add to Case',
    icon: <FileText className="h-4 w-4" />,
    variant: 'secondary',
    condition: (activity) => !('clusterType' in activity)
  },
  {
    key: 'mark_resolved',
    label: 'Mark Resolved',
    icon: <CheckCircle className="h-4 w-4" />,
    variant: 'success',
    condition: (activity) => {
      return !('clusterType' in activity) && (activity as EnterpriseActivity).status !== 'resolved';
    }
  },
  {
    key: 'dismiss',
    label: 'Dismiss',
    icon: <XCircle className="h-4 w-4" />,
    variant: 'secondary'
  }
];

/**
 * QuickActions - Provides context-aware quick action buttons
 * 
 * @example
 * <QuickActions activity={activity} onAction={handleAction} />
 * <QuickActions activity={activity} variant="compact" />
 * <QuickActions activity={cluster} availableActions={['view', 'escalate']} />
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  activity,
  variant = 'full',
  onAction,
  availableActions,
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

  const getVisibleActions = () => {
    // Filter actions based on availability and conditions
    let actions = ACTION_CONFIGS.filter(action => {
      // Check if action is in available actions list (if provided)
      if (availableActions && !availableActions.includes(action.key)) {
        return false;
      }
      
      // Check condition if it exists
      if (action.condition && !action.condition(activity)) {
        return false;
      }
      
      return true;
    });

    // Limit actions based on variant
    switch (variant) {
      case 'minimal':
        return actions.slice(0, 2);
      case 'compact':
        return actions.slice(0, 4);
      case 'floating':
        return actions.slice(0, 3);
      default:
        return actions;
    }
  };

  const visibleActions = getVisibleActions();
  const buttonSize = getButtonSize();
  const isCluster = 'clusterType' in activity;

  // Floating variant
  if (variant === 'floating') {
    return (
      <div className={`
        fixed bottom-4 right-4 z-50
        bg-white dark:bg-gray-800
        rounded-lg shadow-lg border
        p-2 flex gap-2
        ${className}
      `}>
        {visibleActions.map((action) => (
          <ActionButton
            key={action.key}
            variant={action.variant}
            size={buttonSize}
            onClick={() => handleAction(action.key)}
            disabled={disabled}
            className="min-w-0"
          >
            {action.icon}
          </ActionButton>
        ))}
        
        {/* More options */}
        <Button
          size={buttonSize}
          variant="ghost"
          onClick={() => handleAction('more_options')}
          disabled={disabled}
          className="min-w-0 h-8 w-8 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {visibleActions.map((action) => (
          <Button
            key={action.key}
            size="sm"
            variant="ghost"
            onClick={() => handleAction(action.key)}
            disabled={disabled}
            className="h-6 w-6 p-0"
            title={action.label}
          >
            {action.icon}
          </Button>
        ))}
      </div>
    );
  }

  // Full or compact variants
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Primary actions */}
      <div className="flex items-center gap-1">
        {visibleActions.slice(0, 3).map((action) => (
          <ActionButton
            key={action.key}
            variant={action.variant}
            icon={action.icon}
            size={buttonSize}
            onClick={() => handleAction(action.key)}
            disabled={disabled}
          >
            {variant === 'full' ? action.label : ''}
          </ActionButton>
        ))}
      </div>

      {/* Cluster-specific actions */}
      {isCluster && (
        <div className="flex items-center gap-1">
          <Button
            size={buttonSize}
            variant="outline"
            onClick={() => handleAction('view_all')}
            disabled={disabled}
            className="text-xs"
          >
            View All {(activity as ActivityCluster).count}
          </Button>
          
          <Button
            size={buttonSize}
            variant="outline"
            onClick={() => handleAction('split_cluster')}
            disabled={disabled}
            className="text-xs"
          >
            Split Cluster
          </Button>
        </div>
      )}

      {/* Secondary actions dropdown */}
      {visibleActions.length > 3 && (
        <Button
          size={buttonSize}
          variant="ghost"
          onClick={() => handleAction('more_options')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

// Specialized variants for convenience
export const QuickActionsCompact: React.FC<Omit<QuickActionsProps, 'variant'>> = (props) => (
  <QuickActions {...props} variant="compact" />
);

export const QuickActionsMinimal: React.FC<Omit<QuickActionsProps, 'variant'>> = (props) => (
  <QuickActions {...props} variant="minimal" />
);

export const QuickActionsFloating: React.FC<Omit<QuickActionsProps, 'variant'>> = (props) => (
  <QuickActions {...props} variant="floating" />
);

// Context-aware quick actions for specific scenarios
export const CriticalQuickActions: React.FC<Omit<QuickActionsProps, 'availableActions'>> = (props) => (
  <QuickActions {...props} availableActions={['create_incident', 'assign', 'escalate']} />
);

export const ReviewQuickActions: React.FC<Omit<QuickActionsProps, 'availableActions'>> = (props) => (
  <QuickActions {...props} availableActions={['view', 'mark_resolved', 'dismiss']} />
);
