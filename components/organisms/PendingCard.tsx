/**
 * PendingCard Component
 * Displays activities that are pending validation with gentle, non-anxiety-inducing animations
 * Shows visual cues for human-in-the-loop validation requirements
 */

import { EnterpriseActivity } from "../../lib/types/activity";
import { SourceBadge, getActivitySource, PendingSourceBadge } from "../atoms/SourceBadge";
import { StatusBadge } from "../atoms/StatusBadge";
import { formatTimeAgo } from "../../lib/utils/time";
import { 
  Clock, 
  Eye, 
  CheckCircle, 
  XCircle, 
  User, 
  AlertTriangle,
  ChevronRight,
  FileText,
  MapPin
} from "lucide-react";

interface PendingCardProps {
  activity: EnterpriseActivity;
  onValidate?: (activityId: string, action: 'approve' | 'reject') => void;
  onViewDetails?: (activityId: string) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export function PendingCard({
  activity,
  onValidate,
  onViewDetails,
  showActions = true,
  compact = false,
  className = ''
}: PendingCardProps) {
  const source = getActivitySource(activity);
  const isFromAgentic = source === 'agentic-workflow' || source === 'sop-manager';
  const confidenceScore = activity.confidence || 0;

  const handleApprove = () => {
    onValidate?.(activity.id, 'approve');
  };

  const handleReject = () => {
    onValidate?.(activity.id, 'reject');
  };

  const handleViewDetails = () => {
    onViewDetails?.(activity.id);
  };

  const getPriorityColor = () => {
    switch (activity.priority) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getCardClasses = () => {
    const baseClasses = `
      activity-card pending relative border-2 rounded-lg transition-all duration-300
      animate-soft-breathe hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      ${getPriorityColor()}
    `;
    
    if (compact) {
      return `${baseClasses} p-3 ${className}`;
    }
    
    return `${baseClasses} p-4 ${className}`;
  };

  return (
    <div className={getCardClasses()} tabIndex={0} role="article">
      {/* Priority indicator */}
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg bg-current opacity-30" />
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            {isFromAgentic ? (
              <PendingSourceBadge source={source} size="sm" />
            ) : (
              <SourceBadge source={source} size="sm" />
            )}
            {/* Validation required indicator */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          </div>
          <StatusBadge status={activity.status} />
          {activity.priority === 'critical' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              Critical
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          {formatTimeAgo(activity.timestamp)}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
          {activity.title}
        </h3>
        
        {!compact && activity.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Location and metadata */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {activity.location}
          </div>
          
          {activity.created_by && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {activity.created_by}
            </div>
          )}
          
          {isFromAgentic && confidenceScore > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs">Confidence:</span>
              <div className="flex items-center gap-1">
                <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{confidenceScore}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending validation message */}
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Eye className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-700 font-medium">Validation Required</p>
            <p className="text-blue-600">
              {isFromAgentic 
                ? "This activity was generated by an agentic workflow and requires supervisor review."
                : "This activity requires supervisor validation before creating an incident."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleViewDetails}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors interactive-gentle"
          >
            <FileText className="w-4 h-4" />
            View Details
            <ChevronRight className="w-3 h-3" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleReject}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors interactive-gentle"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            
            <button
              onClick={handleApprove}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors interactive-gentle"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
          </div>
        </div>
      )}

      {/* Gentle glow effect for high priority items */}
      {activity.priority === 'critical' && (
        <div className="absolute inset-0 rounded-lg animate-gentle-glow pointer-events-none" />
      )}
    </div>
  );
}

/**
 * Compact version of PendingCard for dense layouts
 */
export function CompactPendingCard(props: Omit<PendingCardProps, 'compact'>) {
  return <PendingCard {...props} compact={true} />;
}

/**
 * List container for multiple pending cards
 */
interface PendingCardListProps {
  activities: EnterpriseActivity[];
  onValidate?: (activityId: string, action: 'approve' | 'reject') => void;
  onViewDetails?: (activityId: string) => void;
  title?: string;
  emptyMessage?: string;
  compact?: boolean;
  className?: string;
}

export function PendingCardList({
  activities,
  onValidate,
  onViewDetails,
  title = "Pending Validation",
  emptyMessage = "No activities pending validation",
  compact = false,
  className = ''
}: PendingCardListProps) {
  if (activities.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
            {activities.length}
          </span>
        </div>
      )}
      
      <div className="space-y-3">
        {activities.map((activity) => (
          <PendingCard
            key={activity.id}
            activity={activity}
            onValidate={onValidate}
            onViewDetails={onViewDetails}
            compact={compact}
            className="animate-soft-fade-in"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Hook for managing pending activity validation
 */
export function usePendingActivityValidation() {
  const handleValidation = async (activityId: string, action: 'approve' | 'reject') => {
    try {
      // This would integrate with the activity service
      console.log(`${action} activity ${activityId}`);
      
      if (action === 'approve') {
        // Create incident from activity
        // Move activity to validated state
        // Notify relevant personnel
      } else {
        // Mark activity as rejected
        // Log rejection reason
        // Update activity status
      }
      
      // Show success notification
      // Remove from pending list
      
    } catch (error) {
      console.error('Failed to validate activity:', error);
      // Show error notification
    }
  };

  return { handleValidation };
}