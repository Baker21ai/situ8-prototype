import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ScrollArea } from '../../ui/scroll-area';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Camera,
  Shield,
  MapPin,
  User,
  Activity,
  Radio,
  FileText,
  Zap,
  Eye,
  Play
} from 'lucide-react';
import { ActivityData } from '../../../lib/types/activity';

interface TimelinePanelProps {
  activity: ActivityData;
  isVisible: boolean;
  className?: string;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'incident' | 'guard' | 'camera' | 'system' | 'user' | 'alert';
  severity: 'high' | 'medium' | 'low' | 'info';
  source?: string;
  location?: string;
  guardName?: string;
  cameraId?: string;
  isCurrentEvent?: boolean;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  activity,
  isVisible,
  className = ''
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Generate timeline events based on the activity
  const generateTimelineEvents = (): TimelineEvent[] => {
    const baseTime = new Date(activity.created_at);
    const events: TimelineEvent[] = [];

    // Events before the incident
    events.push({
      id: 'pre-1',
      timestamp: new Date(baseTime.getTime() - 5 * 60000).toISOString(),
      title: 'Motion detected',
      description: 'Unusual motion detected in hallway near Room 205',
      type: 'camera',
      severity: 'low',
      source: 'CAM-205',
      location: activity.location,
      cameraId: 'cam-205'
    });

    events.push({
      id: 'pre-2',
      timestamp: new Date(baseTime.getTime() - 3 * 60000).toISOString(),
      title: 'Door access attempt',
      description: 'Failed card access attempt at Room 205',
      type: 'system',
      severity: 'medium',
      source: 'DOOR-205',
      location: activity.location
    });

    events.push({
      id: 'pre-3',
      timestamp: new Date(baseTime.getTime() - 2 * 60000).toISOString(),
      title: 'Multiple access failures',
      description: 'Three consecutive failed access attempts detected',
      type: 'alert',
      severity: 'high',
      source: 'Access Control',
      location: activity.location
    });

    // Current incident
    events.push({
      id: 'current',
      timestamp: activity.created_at.toISOString(),
      title: activity.title,
      description: activity.description,
      type: 'incident',
      severity: activity.priority as 'high' | 'medium' | 'low',
      source: 'Security System',
      location: activity.location,
      isCurrentEvent: true
    });

    // Events after the incident
    events.push({
      id: 'post-1',
      timestamp: new Date(baseTime.getTime() + 1 * 60000).toISOString(),
      title: 'Guard dispatched',
      description: `Guard ${activity.assignedTo || 'Johnson'} assigned to respond`,
      type: 'guard',
      severity: 'info',
      source: 'Dispatch',
      guardName: activity.assignedTo || 'Johnson'
    });

    events.push({
      id: 'post-2',
      timestamp: new Date(baseTime.getTime() + 2 * 60000).toISOString(),
      title: 'Camera alert triggered',
      description: 'Security camera CAM-205 activated recording mode',
      type: 'camera',
      severity: 'info',
      source: 'CAM-205',
      cameraId: 'cam-205'
    });

    events.push({
      id: 'post-3',
      timestamp: new Date(baseTime.getTime() + 3 * 60000).toISOString(),
      title: 'Guard en route',
      description: 'Guard Johnson confirmed dispatch, ETA 2 minutes',
      type: 'guard',
      severity: 'info',
      source: 'Radio',
      guardName: 'Johnson'
    });

    // Future expected events
    events.push({
      id: 'future-1',
      timestamp: new Date(baseTime.getTime() + 5 * 60000).toISOString(),
      title: 'Expected: Guard arrival',
      description: 'Guard expected to arrive at incident location',
      type: 'guard',
      severity: 'info',
      source: 'Predicted',
      guardName: 'Johnson'
    });

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const [timelineEvents] = useState<TimelineEvent[]>(generateTimelineEvents());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'incident': return AlertTriangle;
      case 'guard': return Shield;
      case 'camera': return Camera;
      case 'system': return Activity;
      case 'user': return User;
      case 'alert': return Zap;
      default: return Clock;
    }
  };

  const getEventColor = (severity: string, type: string) => {
    if (type === 'incident') return 'text-red-600 bg-red-50 border-red-200';
    
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) return `in ${Math.abs(diffMins)}m`;
    if (diffMins === 0) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const handleEventAction = (event: TimelineEvent, action: string) => {
    console.log(`Event action: ${action} for event ${event.id}`);
    
    switch (action) {
      case 'view-camera':
        console.log(`Viewing camera ${event.cameraId}`);
        break;
      case 'contact-guard':
        console.log(`Contacting guard ${event.guardName}`);
        break;
      case 'view-details':
        setSelectedEvent(selectedEvent === event.id ? null : event.id);
        break;
    }
  };

  if (!isVisible) return null;

  const visibleEvents = showAllEvents ? timelineEvents : timelineEvents.slice(-10);

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            Event Timeline
          </CardTitle>
          <Badge variant="outline">
            {timelineEvents.length} events
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Events related to {activity.title}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 h-[calc(100%-100px)] overflow-hidden">
        {/* Timeline Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllEvents(!showAllEvents)}
          >
            {showAllEvents ? 'Show Recent' : 'Show All'}
          </Button>
          <div className="text-xs text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Timeline Events */}
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="space-y-3">
            {visibleEvents.map((event, index) => {
              const EventIcon = getEventIcon(event.type);
              const isExpanded = selectedEvent === event.id;
              const isFuture = new Date(event.timestamp) > new Date();
              
              return (
                <Card
                  key={event.id}
                  className={`transition-all cursor-pointer ${
                    event.isCurrentEvent 
                      ? 'border-2 border-red-500 shadow-lg' 
                      : 'border hover:shadow-md'
                  } ${isFuture ? 'opacity-60' : ''}`}
                  onClick={() => handleEventAction(event, 'view-details')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Timeline Connector */}
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center border-2
                          ${event.isCurrentEvent 
                            ? 'bg-red-500 border-red-500 text-white' 
                            : getEventColor(event.severity, event.type)
                          }
                        `}>
                          <EventIcon className="h-4 w-4" />
                        </div>
                        
                        {index < visibleEvents.length - 1 && (
                          <div className="w-0.5 h-6 bg-gray-200 mt-2" />
                        )}
                      </div>

                      {/* Event Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium">{event.title}</h4>
                              {event.isCurrentEvent && (
                                <Badge variant="destructive" className="text-xs">
                                  CURRENT
                                </Badge>
                              )}
                              {isFuture && (
                                <Badge variant="outline" className="text-xs">
                                  EXPECTED
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-2">
                              {event.description}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{formatTime(event.timestamp)}</span>
                              <span>{getRelativeTime(event.timestamp)}</span>
                              {event.source && <span>• {event.source}</span>}
                              {event.location && <span>• {event.location}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Type:</span> {event.type}
                              </div>
                              <div>
                                <span className="font-medium">Severity:</span> {event.severity}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              {event.cameraId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventAction(event, 'view-camera');
                                  }}
                                >
                                  <Camera className="h-3 w-3 mr-1" />
                                  View Camera
                                </Button>
                              )}
                              
                              {event.guardName && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventAction(event, 'contact-guard');
                                  }}
                                >
                                  <Radio className="h-3 w-3 mr-1" />
                                  Contact
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Timeline Summary */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <div className="font-medium text-gray-900">
                {timelineEvents.filter(e => new Date(e.timestamp) < new Date()).length}
              </div>
              <div className="text-gray-600">Past Events</div>
            </div>
            <div>
              <div className="font-medium text-red-600">1</div>
              <div className="text-gray-600">Current</div>
            </div>
            <div>
              <div className="font-medium text-blue-600">
                {timelineEvents.filter(e => new Date(e.timestamp) > new Date()).length}
              </div>
              <div className="text-gray-600">Expected</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelinePanel;