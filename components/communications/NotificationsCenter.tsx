import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  BellOff,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Radio,
  MessageSquare,
  Activity,
  Shield,
  Settings,
  Archive,
  Trash2,
  ExternalLink,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'alert' | 'message' | 'system' | 'incident' | 'sos';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  source: {
    type: 'user' | 'system' | 'ai' | 'integration';
    id: string;
    name: string;
  };
  channelId?: string;
  channelName?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'activity' | 'incident' | 'case';
  isRead: boolean;
  isArchived: boolean;
  requiresAction: boolean;
  actions?: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'destructive';
  }>;
  metadata?: Record<string, any>;
}

interface NotificationsCenterProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAction?: (notificationId: string, action: string) => void;
}

export function NotificationsCenter({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onArchive,
  onDelete,
  onAction
}: NotificationsCenterProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [mutedChannels, setMutedChannels] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (notification.isArchived) return false;
    if (showOnlyUnread && notification.isRead) return false;
    if (mutedChannels.has(notification.channelId || '')) return false;
    
    switch (activeTab) {
      case 'alerts':
        return notification.type === 'alert' || notification.type === 'sos';
      case 'messages':
        return notification.type === 'message';
      case 'system':
        return notification.type === 'system';
      case 'incidents':
        return notification.type === 'incident';
      default:
        return true;
    }
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    const date = new Date(notification.timestamp);
    const dateKey = date.toDateString() === new Date().toDateString() 
      ? 'Today' 
      : date.toDateString() === new Date(Date.now() - 86400000).toDateString()
      ? 'Yesterday'
      : date.toLocaleDateString();
    
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return AlertTriangle;
      case 'message': return MessageSquare;
      case 'system': return Info;
      case 'incident': return Shield;
      case 'sos': return Radio;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.isRead && !n.isArchived).length;

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications Center
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount}
                </Badge>
              )}
              {criticalCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {criticalCount} Critical
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">
                All
                <Badge variant="secondary" className="ml-2 text-xs">
                  {notifications.filter(n => !n.isArchived).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex-1">
                Alerts
                <Badge variant="secondary" className="ml-2 text-xs">
                  {notifications.filter(n => (n.type === 'alert' || n.type === 'sos') && !n.isArchived).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex-1">
                Messages
                <Badge variant="secondary" className="ml-2 text-xs">
                  {notifications.filter(n => n.type === 'message' && !n.isArchived).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="incidents" className="flex-1">
                Incidents
                <Badge variant="secondary" className="ml-2 text-xs">
                  {notifications.filter(n => n.type === 'incident' && !n.isArchived).length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="unread-only"
                checked={showOnlyUnread}
                onCheckedChange={setShowOnlyUnread}
              />
              <Label htmlFor="unread-only" className="text-sm">
                Show only unread
              </Label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 pt-0 space-y-4">
              {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                <div key={date}>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {date}
                  </div>
                  <div className="space-y-2">
                    {dateNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-3 rounded-lg border transition-all",
                            getPriorityColor(notification.priority),
                            !notification.isRead && "font-medium",
                            notification.requiresAction && "ring-2 ring-primary"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2 rounded",
                              notification.priority === 'critical' && "animate-pulse"
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {notification.title}
                                    </span>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {notification.description}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => onMarkAsRead?.(notification.id)}
                                  >
                                    {notification.isRead ? (
                                      <BellOff className="h-3 w-3" />
                                    ) : (
                                      <Bell className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => onArchive?.(notification.id)}
                                  >
                                    <Archive className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => onDelete?.(notification.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {notification.source.name}
                                </div>
                                {notification.channelName && (
                                  <div className="flex items-center gap-1">
                                    <Radio className="h-3 w-3" />
                                    {notification.channelName}
                                  </div>
                                )}
                              </div>
                              
                              {notification.requiresAction && notification.actions && (
                                <div className="flex items-center gap-2 mt-2">
                                  {notification.actions.map((action, idx) => (
                                    <Button
                                      key={idx}
                                      size="sm"
                                      variant={action.variant || 'default'}
                                      onClick={() => onAction?.(notification.id, action.action)}
                                      className="text-xs"
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                  {notification.relatedEntityId && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs"
                                    >
                                      View {notification.relatedEntityType}
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {filteredNotifications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                  {showOnlyUnread && (
                    <p className="text-xs mt-1">
                      Try turning off "Show only unread"
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="desktop-notifications" className="text-sm">
              Desktop Notifications
            </Label>
            <Switch id="desktop-notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-alerts" className="text-sm">
              Sound Alerts
            </Label>
            <Switch id="sound-alerts" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="critical-only" className="text-sm">
              Critical Alerts Only
            </Label>
            <Switch id="critical-only" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}