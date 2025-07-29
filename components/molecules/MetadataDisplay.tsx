import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';
import { ActivityData, EnterpriseActivity } from '@/lib/types/activity';
import { CommunicationEntry } from '@/lib/types/communications';
import { 
  Camera, 
  FileImage, 
  Users, 
  Zap, 
  Shield, 
  AlertTriangle,
  Building,
  MapPin,
  Clock,
  Hash,
  Layers,
  Activity,
  Radio,
  MessageCircle,
  Bot
} from 'lucide-react';

interface MetadataDisplayProps {
  data: ActivityData | EnterpriseActivity | CommunicationEntry;
  variant?: 'compact' | 'detailed' | 'minimal';
  features?: {
    showConfidence?: boolean;
    showEvidence?: boolean;
    showLocation?: boolean;
    showResponseUnits?: boolean;
    showThreatLevel?: boolean;
    showCluster?: boolean;
    showChannel?: boolean;
    showTranscription?: boolean;
    showBusinessImpact?: boolean;
    showCorrelations?: boolean;
  };
  orientation?: 'horizontal' | 'vertical' | 'grid';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

/**
 * MetadataDisplay - Molecule component for displaying activity/communication metadata
 * 
 * Presents supplementary information like confidence scores, evidence counts,
 * locations, and other metadata in a consistent format.
 * 
 * @example
 * <MetadataDisplay 
 *   data={activity}
 *   variant="compact"
 *   features={{
 *     showConfidence: true,
 *     showEvidence: true,
 *     showLocation: true
 *   }}
 *   orientation="horizontal"
 *   size="sm"
 * />
 */
export const MetadataDisplay: React.FC<MetadataDisplayProps> = ({
  data,
  variant = 'compact',
  features = {},
  orientation = 'horizontal',
  size = 'sm',
  className
}) => {
  // Type guards
  const isActivity = 'type' in data && 'priority' in data;
  const isEnterprise = isActivity && 'metadata' in data;
  const isCommunication = 'channel' in data && 'content' in data;
  
  const activity = data as ActivityData;
  const enterprise = data as EnterpriseActivity;
  const communication = data as CommunicationEntry;
  
  // Size configurations
  const sizeConfig = {
    xs: {
      text: 'text-xs',
      icon: 'h-3 w-3',
      badge: 'text-xs px-1.5 py-0.5',
      gap: 'gap-1'
    },
    sm: {
      text: 'text-sm',
      icon: 'h-4 w-4',
      badge: 'text-xs',
      gap: 'gap-1.5'
    },
    md: {
      text: 'text-base',
      icon: 'h-5 w-5',
      badge: 'text-sm',
      gap: 'gap-2'
    }
  };
  
  const config = sizeConfig[size];
  
  // Orientation styles
  const orientationStyles = {
    horizontal: cn('flex items-center flex-wrap', config.gap),
    vertical: cn('flex flex-col', config.gap),
    grid: 'grid grid-cols-2 gap-2'
  };
  
  // Metadata items collection
  const metadataItems: JSX.Element[] = [];
  
  // Confidence score
  if (features.showConfidence && activity.confidence) {
    metadataItems.push(
      <div key="confidence" className={cn('flex items-center', config.gap)}>
        <Zap className={cn(config.icon, 'text-yellow-600')} />
        <span className={cn(config.text, 'text-muted-foreground')}>
          {activity.confidence}% confidence
        </span>
      </div>
    );
  }
  
  // Evidence count
  if (features.showEvidence && activity.evidence) {
    const evidenceCount = activity.evidence.length;
    if (evidenceCount > 0) {
      metadataItems.push(
        <div key="evidence" className={cn('flex items-center', config.gap)}>
          <FileImage className={cn(config.icon, 'text-blue-600')} />
          <span className={cn(config.text, 'text-muted-foreground')}>
            {evidenceCount} evidence
          </span>
        </div>
      );
    }
  }
  
  // Camera info
  if (isActivity && activity.camera) {
    metadataItems.push(
      <div key="camera" className={cn('flex items-center', config.gap)}>
        <Camera className={cn(config.icon, 'text-gray-600')} />
        <span className={cn(config.text, 'text-muted-foreground')}>
          {activity.camera}
        </span>
      </div>
    );
  }
  
  // Response units
  if (features.showResponseUnits && activity.respondingUnits && activity.respondingUnits.length > 0) {
    metadataItems.push(
      <div key="units" className={cn('flex items-center', config.gap)}>
        <Users className={cn(config.icon, 'text-green-600')} />
        <span className={cn(config.text, 'text-muted-foreground')}>
          {activity.respondingUnits.length} units
        </span>
      </div>
    );
  }
  
  // Location details (building/zone)
  if (features.showLocation && isEnterprise && enterprise.metadata) {
    if (enterprise.metadata.building || enterprise.metadata.zone) {
      metadataItems.push(
        <div key="location" className={cn('flex items-center', config.gap)}>
          <Building className={cn(config.icon, 'text-purple-600')} />
          <span className={cn(config.text, 'text-muted-foreground')}>
            {[enterprise.metadata.building, enterprise.metadata.zone].filter(Boolean).join(' - ')}
          </span>
        </div>
      );
    }
  }
  
  // Threat level
  if (features.showThreatLevel && isEnterprise && enterprise.threatLevel) {
    const threatColors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    metadataItems.push(
      <Badge 
        key="threat" 
        className={cn(config.badge, threatColors[enterprise.threatLevel as keyof typeof threatColors] || threatColors.low)}
      >
        <Shield className={cn(size === 'xs' ? 'h-3 w-3' : 'h-4 w-4', 'mr-1')} />
        {enterprise.threatLevel.toUpperCase()}
      </Badge>
    );
  }
  
  // Cluster information
  if (features.showCluster && isEnterprise && enterprise.clusterInfo) {
    metadataItems.push(
      <Badge 
        key="cluster" 
        className={cn(config.badge, 'bg-blue-100 text-blue-800')}
      >
        <Layers className={cn(size === 'xs' ? 'h-3 w-3' : 'h-4 w-4', 'mr-1')} />
        Cluster ({enterprise.clusterInfo.count})
      </Badge>
    );
  }
  
  // Business impact
  if (features.showBusinessImpact && isEnterprise && enterprise.businessImpact) {
    metadataItems.push(
      <Badge 
        key="impact" 
        variant="destructive"
        className={config.badge}
      >
        <AlertTriangle className={cn(size === 'xs' ? 'h-3 w-3' : 'h-4 w-4', 'mr-1')} />
        Business Impact
      </Badge>
    );
  }
  
  // Correlations
  if (features.showCorrelations && isEnterprise && enterprise.correlatedActivities && enterprise.correlatedActivities.length > 0) {
    metadataItems.push(
      <div key="correlations" className={cn('flex items-center', config.gap)}>
        <Activity className={cn(config.icon, 'text-purple-600')} />
        <span className={cn(config.text, 'text-muted-foreground')}>
          {enterprise.correlatedActivities.length} related
        </span>
      </div>
    );
  }
  
  // Communication-specific metadata
  if (isCommunication) {
    // Channel info
    if (features.showChannel) {
      const channelIcons = {
        main: <Radio className={cn(config.icon, 'text-green-600')} />,
        emergency: <AlertTriangle className={cn(config.icon, 'text-red-600')} />,
        telegram: <MessageCircle className={cn(config.icon, 'text-blue-600')} />
      };
      
      metadataItems.push(
        <div key="channel" className={cn('flex items-center', config.gap)}>
          {channelIcons[communication.channel as keyof typeof channelIcons] || channelIcons.main}
          <span className={cn(config.text, 'text-muted-foreground')}>
            {communication.channel}
          </span>
        </div>
      );
    }
    
    // Transcription confidence
    if (features.showTranscription && communication.transcriptionConfidence) {
      metadataItems.push(
        <div key="transcription" className={cn('flex items-center', config.gap)}>
          <Bot className={cn(config.icon, 'text-purple-600')} />
          <span className={cn(config.text, 'text-muted-foreground')}>
            {Math.round(communication.transcriptionConfidence * 100)}% accuracy
          </span>
        </div>
      );
    }
  }
  
  // Return null if no metadata to display
  if (metadataItems.length === 0) {
    return null;
  }
  
  // Minimal variant - single line
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
        {metadataItems.slice(0, 3)}
      </div>
    );
  }
  
  return (
    <div className={cn(
      orientationStyles[orientation],
      className
    )}>
      {metadataItems}
    </div>
  );
};

// Preset configurations for common use cases
export const ActivityMetadata: React.FC<{
  activity: ActivityData | EnterpriseActivity;
  className?: string;
}> = ({ activity, className }) => (
  <MetadataDisplay
    data={activity}
    variant="compact"
    features={{
      showConfidence: true,
      showEvidence: true,
      showResponseUnits: true,
      showThreatLevel: true
    }}
    orientation="horizontal"
    size="sm"
    className={className}
  />
);

export const CommunicationMetadata: React.FC<{
  communication: CommunicationEntry;
  className?: string;
}> = ({ communication, className }) => (
  <MetadataDisplay
    data={communication}
    variant="compact"
    features={{
      showChannel: true,
      showTranscription: true
    }}
    orientation="horizontal"
    size="sm"
    className={className}
  />
);

export const DetailedActivityMetadata: React.FC<{
  activity: EnterpriseActivity;
  className?: string;
}> = ({ activity, className }) => (
  <MetadataDisplay
    data={activity}
    variant="detailed"
    features={{
      showConfidence: true,
      showEvidence: true,
      showLocation: true,
      showResponseUnits: true,
      showThreatLevel: true,
      showCluster: true,
      showBusinessImpact: true,
      showCorrelations: true
    }}
    orientation="grid"
    size="sm"
    className={className}
  />
);