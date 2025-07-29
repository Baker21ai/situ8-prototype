import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/components/ui/utils';
import { 
  Radio, 
  MessageCircle, 
  Phone, 
  Play, 
  MapPin, 
  Mic,
  Bot,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

// Import atomic components
import { TimeDisplay, PriorityIndicator, LocationBadge } from '@/components/atoms';

// Import types and utilities
import { CommunicationEntry, CommunicationType, ChannelType } from '@/lib/types/communications';
import { Priority } from '@/lib/types';
import { channelColors, specialColors } from '@/lib/tokens/colors';
import { cardPadding, cardSpacing } from '@/lib/tokens/spacing';

// Communication Card Variants
export type CommunicationCardVariant = 'compact' | 'detailed' | 'minimal';
export type CommunicationCardLayout = 'timeline' | 'chat' | 'radio' | 'thread';

// Feature flags for card functionality
export interface CommunicationCardFeatures {
  showAvatar?: boolean;
  showChannel?: boolean;
  showLocation?: boolean;
  showConfidence?: boolean;
  showAudio?: boolean;
  showThread?: boolean;
  showStatus?: boolean;
  showActions?: boolean;
  showRelatedActivity?: boolean;
}

// Main CommunicationCard Props
export interface CommunicationCardProps {
  communication: CommunicationEntry;
  variant?: CommunicationCardVariant;
  layout?: CommunicationCardLayout;
  features?: CommunicationCardFeatures;
  isSelected?: boolean;
  onClick?: (communication: CommunicationEntry) => void;
  onAction?: (action: string, communication: CommunicationEntry) => void;
  className?: string;
}

/**
 * Unified CommunicationCard Component
 * 
 * A single, configurable component for all communication displays.
 * Replaces various communication card implementations across the app.
 * 
 * @example
 * // Timeline communication
 * <CommunicationCard 
 *   communication={comm} 
 *   variant="compact" 
 *   layout="timeline"
 *   features={{ showAvatar: true, showAudio: true }}
 * />
 * 
 * // Radio communication
 * <CommunicationCard 
 *   communication={radioMsg} 
 *   variant="detailed" 
 *   layout="radio"
 *   features={{ showChannel: true, showConfidence: true }}
 * />
 */
export const CommunicationCard = memo<CommunicationCardProps>(({
  communication,
  variant = 'compact',
  layout = 'timeline',
  features = {},
  isSelected = false,
  onClick,
  onAction,
  className
}) => {
  // Determine if AI communication
  const isAI = communication.type === 'ai_response' || communication.from === 'AI Assistant';
  
  // Layout-specific styles
  const layoutStyles = {
    timeline: 'border-l-4 hover:bg-gray-50',
    chat: 'hover:shadow-md',
    radio: 'hover:shadow-md border-l-2',
    thread: 'ml-8 border-l-2 border-gray-200'
  };
  
  // Variant-specific padding
  const variantPadding = {
    compact: cardPadding.sm,
    detailed: cardPadding.md,
    minimal: cardPadding.xs
  };
  
  // Get channel colors
  const getChannelColor = (channel: ChannelType) => {
    return channelColors[channel] || channelColors.main;
  };
  
  // Priority-based border color
  const borderColor = {
    critical: 'border-red-500',
    high: 'border-orange-500',
    medium: 'border-yellow-500',
    low: 'border-green-500'
  };
  
  // Handle click
  const handleClick = (e: React.MouseEvent) => {
    if (!onClick) return;
    if ((e.target as HTMLElement).closest('button')) return;
    onClick(communication);
  };
  
  // Minimal variant for high-density
  if (variant === 'minimal') {
    return <MinimalCommunicationCard communication={communication} onClick={onClick} />;
  }
  
  return (
    <Card
      className={cn(
        layoutStyles[layout],
        borderColor[communication.priority],
        isSelected && 'bg-blue-50',
        isAI && 'bg-blue-50/50',
        'cursor-pointer transition-all duration-200',
        className
      )}
      onClick={handleClick}
    >
      <CardContent className={cn(variantPadding[variant], cardSpacing.sm)}>
        {/* Header Section */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            {features.showAvatar && (
              <Avatar className={cn(
                variant === 'compact' ? 'h-8 w-8' : 'h-10 w-10',
                isAI && 'bg-blue-100'
              )}>
                <AvatarFallback className="text-sm font-medium">
                  {isAI ? '🤖' : communication.from.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}
            
            {/* Header Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  'font-semibold',
                  variant === 'compact' ? 'text-sm' : 'text-base'
                )}>
                  {communication.from}
                </span>
                {communication.to && (
                  <>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground text-sm">{communication.to}</span>
                  </>
                )}
                {isAI && (
                  <Badge className="text-xs bg-blue-500 text-white">AI</Badge>
                )}
              </div>
              
              {/* Metadata Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <TimeDisplay
                  date={communication.timestamp}
                  format="relative-short"
                  size="xs"
                  className="text-muted-foreground"
                />
                
                {features.showChannel && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs',
                      getChannelColor(communication.channel).background,
                      getChannelColor(communication.channel).text
                    )}
                  >
                    {communication.channel.toUpperCase()}
                  </Badge>
                )}
                
                {features.showLocation && communication.location && (
                  <LocationBadge
                    location={communication.location}
                    type="building"
                    size="xs"
                    variant="minimal"
                  />
                )}
                
                <CommunicationTypeIcon type={communication.type} size="sm" />
              </div>
            </div>
          </div>
          
          {/* Right Side Actions/Status */}
          <div className="flex items-center gap-2">
            {features.showAudio && communication.hasAudio && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.('play_audio', communication);
                }}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            
            {features.showStatus && (
              <CommunicationStatus status={communication.status} size="sm" />
            )}
          </div>
        </div>
        
        {/* Message Content */}
        <div className={cn(
          'rounded-lg p-3',
          isAI ? 'bg-blue-50 border-l-2 border-blue-200' : 'bg-gray-50 border-l-2 border-gray-200'
        )}>
          <p className={cn(
            'leading-relaxed',
            variant === 'compact' ? 'text-sm' : 'text-base'
          )}>
            {communication.content}
          </p>
        </div>
        
        {/* Footer Section */}
        {(features.showConfidence || features.showRelatedActivity || features.showActions) && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              {features.showConfidence && communication.transcriptionConfidence && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(communication.transcriptionConfidence * 100)}% confidence
                </Badge>
              )}
              
              {features.showRelatedActivity && communication.activityId && (
                <Badge variant="outline" className="text-xs">
                  → {communication.activityId}
                </Badge>
              )}
              
              {features.showThread && communication.threadId && (
                <Badge variant="outline" className="text-xs">
                  Thread
                </Badge>
              )}
            </div>
            
            {features.showActions && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.('reply', communication);
                  }}
                >
                  Reply
                </Button>
                {communication.activityId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction?.('view_activity', communication);
                    }}
                  >
                    View Activity
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Minimal communication card for high-density views
const MinimalCommunicationCard: React.FC<{
  communication: CommunicationEntry;
  onClick?: (communication: CommunicationEntry) => void;
}> = ({ communication, onClick }) => {
  const isAI = communication.type === 'ai_response';
  
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100',
        'border-l-2',
        communication.priority === 'critical' ? 'border-red-500' :
        communication.priority === 'high' ? 'border-orange-500' :
        communication.priority === 'medium' ? 'border-yellow-500' : 'border-gray-300'
      )}
      onClick={() => onClick?.(communication)}
    >
      <CommunicationTypeIcon type={communication.type} size="xs" />
      <span className="text-xs font-medium truncate flex-1">{communication.from}</span>
      <TimeDisplay date={communication.timestamp} format="relative-short" size="xs" />
    </div>
  );
};

// Communication type icon component
const CommunicationTypeIcon: React.FC<{
  type: CommunicationType;
  size?: 'xs' | 'sm' | 'md';
}> = ({ type, size = 'sm' }) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };
  
  const icons = {
    voice: <Radio className={cn(sizeClasses[size], 'text-green-600')} />,
    text: <MessageCircle className={cn(sizeClasses[size], 'text-blue-600')} />,
    ai_response: <Bot className={cn(sizeClasses[size], 'text-purple-600')} />,
    system: <AlertCircle className={cn(sizeClasses[size], 'text-gray-600')} />
  };
  
  return icons[type] || icons.system;
};

// Communication status component
const CommunicationStatus: React.FC<{
  status: 'active' | 'resolved' | 'archived' | 'pending';
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const statusConfig = {
    active: {
      icon: <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />,
      text: 'Active',
      color: 'text-green-700'
    },
    resolved: {
      icon: <CheckCircle className="h-3 w-3 text-blue-600" />,
      text: 'Resolved',
      color: 'text-blue-700'
    },
    archived: {
      icon: <Clock className="h-3 w-3 text-gray-600" />,
      text: 'Archived',
      color: 'text-gray-700'
    },
    pending: {
      icon: <Clock className="h-3 w-3 text-yellow-600" />,
      text: 'Pending',
      color: 'text-yellow-700'
    }
  };
  
  const config = statusConfig[status];
  
  return (
    <div className={cn('flex items-center gap-1', size === 'sm' ? 'text-xs' : 'text-sm')}>
      {config.icon}
      <span className={cn('font-medium', config.color)}>{config.text}</span>
    </div>
  );
};

CommunicationCard.displayName = 'CommunicationCard';