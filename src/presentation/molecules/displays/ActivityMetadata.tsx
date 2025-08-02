/**
 * ActivityMetadata Molecule Component
 * Displays activity metadata: priority, status, badges, confidence, business impact
 * Handles all the various badges and indicators in a consistent way
 */

import React from 'react';
import { Badge } from '../../../../components/ui/badge';
import { StatusBadge } from '../../atoms/badges/StatusBadge';
import { ConfidenceIndicator } from '../../atoms/indicators/ProgressIndicator';
import { EnterpriseActivity } from '../../../../lib/types/activity';
import { getBusinessImpactColor } from '../../../../lib/utils/status';
import { ExternalDataDisplay } from '../../../../components/ExternalDataDisplay';

export interface ActivityMetadataProps {
  activity: EnterpriseActivity;
  variant?: 'full' | 'compact' | 'minimal' | 'inline';
  showPriority?: boolean;
  showStatus?: boolean;
  showConfidence?: boolean;
  showBusinessImpact?: boolean;
  showSpecialBadges?: boolean;
  showExternalData?: boolean;
  showEscalation?: boolean;
  className?: string;
}

export const ActivityMetadata: React.FC<ActivityMetadataProps> = ({
  activity,
  variant = 'full',
  showPriority = true,
  showStatus = true,
  showConfidence = true,
  showBusinessImpact = true,
  showSpecialBadges = true,
  showExternalData = true,
  showEscalation = true,
  className = ''
}) => {
  const getBadgeSize = () => {
    switch (variant) {
      case 'minimal':
      case 'compact':
        return 'sm';
      default:
        return 'md';
    }
  };

  const getSpacing = () => {
    switch (variant) {
      case 'minimal':
        return 'gap-0.5';
      case 'compact':
        return 'gap-1';
      default:
        return 'gap-2';
    }
  };

  const getTextSize = () => {
    switch (variant) {
      case 'minimal':
        return 'text-xs';
      case 'compact':
        return 'text-xs';
      default:
        return 'text-sm';
    }
  };

  const badgeSize = getBadgeSize();
  const spacing = getSpacing();
  const textSize = getTextSize();

  return (
    <div className={`${className}`}>
      {/* Primary Metadata Row */}
      <div className={`flex items-center justify-between ${spacing}`}>
        {/* Left side: Priority, Status, Escalation */}
        <div className={`flex items-center ${spacing}`}>
          {showPriority && (
            <StatusBadge
              priority={activity.priority}
              status={activity.status}
              size={badgeSize}
              pulse={activity.priority === 'critical'}
            />
          )}

          {showEscalation && activity.escalationLevel && activity.escalationLevel > 0 && (
            <Badge className={`bg-purple-100 text-purple-800 ${textSize}`}>
              ESC {activity.escalationLevel}
            </Badge>
          )}
        </div>

        {/* Right side: Business Impact, Confidence */}
        <div className={`flex items-center ${spacing}`}>
          {showBusinessImpact && activity.businessImpact && activity.businessImpact !== 'none' && (
            <div className="flex items-center gap-1">
              <div 
                className={`w-2 h-2 rounded-full ${getBusinessImpactColor(activity.businessImpact)}`}
                title={`Business Impact: ${activity.businessImpact}`}
              />
              {variant === 'full' && (
                <span className={`${textSize} text-gray-600 capitalize`}>
                  {activity.businessImpact}
                </span>
              )}
            </div>
          )}

          {showConfidence && activity.confidence && variant !== 'minimal' && (
            <div className="min-w-[60px]">
              <ConfidenceIndicator
                value={activity.confidence}
                showValue={variant === 'full'}
                size={variant === 'compact' ? 'sm' : 'md'}
              />
            </div>
          )}

          {showConfidence && activity.confidence && variant === 'minimal' && (
            <Badge variant="outline" className={textSize}>
              {activity.confidence}%
            </Badge>
          )}
        </div>
      </div>

      {/* Special Status Badges Row */}
      {showSpecialBadges && variant !== 'minimal' && (
        <div className={`flex items-center flex-wrap ${spacing} mt-1`}>
          {activity.isNewActivity && (
            <Badge className={`bg-red-100 text-red-800 ${textSize} animate-pulse`}>
              NEW
            </Badge>
          )}
          
          {activity.isBoloActive && (
            <Badge className={`bg-orange-100 text-orange-800 ${textSize}`}>
              BOLO
            </Badge>
          )}
          
          {activity.isMassCasualty && (
            <Badge className={`bg-red-100 text-red-800 ${textSize} animate-pulse`}>
              MASS CASUALTY
            </Badge>
          )}
          
          {activity.isSecurityThreat && (
            <Badge className={`bg-orange-100 text-orange-800 ${textSize}`}>
              SECURITY THREAT
            </Badge>
          )}
        </div>
      )}

      {/* External Data Display */}
      {showExternalData && activity.externalData && (
        <div className="mt-2">
          <ExternalDataDisplay 
            externalData={activity.externalData}
            variant={variant === 'full' ? 'compact' : 'inline'}
            className={textSize}
          />
        </div>
      )}

      {/* Minimal Special Indicators */}
      {showSpecialBadges && variant === 'minimal' && (
        <div className="flex items-center gap-0.5 mt-0.5">
          {activity.isNewActivity && (
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" title="New Activity" />
          )}
          {activity.isBoloActive && (
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" title="BOLO Active" />
          )}
          {activity.isMassCasualty && (
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" title="Mass Casualty" />
          )}
          {activity.isSecurityThreat && (
            <div className="w-1.5 h-1.5 bg-orange-600 rounded-full" title="Security Threat" />
          )}
        </div>
      )}
    </div>
  );
};

// Specialized variants for convenience
export const ActivityMetadataCompact: React.FC<Omit<ActivityMetadataProps, 'variant'>> = (props) => (
  <ActivityMetadata {...props} variant="compact" />
);

export const ActivityMetadataMinimal: React.FC<Omit<ActivityMetadataProps, 'variant'>> = (props) => (
  <ActivityMetadata {...props} variant="minimal" />
);

export const ActivityMetadataInline: React.FC<Omit<ActivityMetadataProps, 'variant'>> = (props) => (
  <ActivityMetadata {...props} variant="inline" />
);