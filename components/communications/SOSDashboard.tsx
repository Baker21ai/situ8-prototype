import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle,
  Radio,
  MapPin,
  Clock,
  User,
  Shield,
  Phone,
  Navigation,
  Activity,
  CheckCircle,
  XCircle,
  Users,
  Siren,
  Heart,
  Zap,
  Building,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SOSAlert {
  id: string;
  type: 'medical' | 'security' | 'fire' | 'duress' | 'general';
  status: 'active' | 'responding' | 'resolved' | 'cancelled';
  priority: 'critical' | 'high' | 'medium';
  initiator: {
    id: string;
    name: string;
    role: string;
    badgeNumber: string;
    location: {
      building: string;
      floor: string;
      zone: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  timestamp: string;
  responseTime?: number;
  responders: Array<{
    id: string;
    name: string;
    role: string;
    status: 'assigned' | 'enroute' | 'onscene';
    eta?: number;
  }>;
  updates: Array<{
    timestamp: string;
    message: string;
    userId: string;
    userName: string;
  }>;
  relatedIncidentId?: string;
  audioChannelId?: string;
  externalServices?: Array<{
    type: 'police' | 'fire' | 'ems';
    status: 'notified' | 'dispatched' | 'arrived';
    eta?: number;
  }>;
}

interface SOSDashboardProps {
  alerts?: SOSAlert[];
  onRespond?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onCancel?: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
  currentUserId?: string;
}

export function SOSDashboard({
  alerts = [],
  onRespond,
  onResolve,
  onCancel,
  onViewDetails,
  currentUserId
}: SOSDashboardProps) {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  const filteredAlerts = alerts.filter(alert => {
    if (showOnlyActive && (alert.status === 'resolved' || alert.status === 'cancelled')) {
      return false;
    }
    return true;
  });

  const activeAlerts = alerts.filter(a => a.status === 'active').length;
  const respondingAlerts = alerts.filter(a => a.status === 'responding').length;
  const criticalAlerts = alerts.filter(a => a.priority === 'critical' && a.status !== 'resolved').length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'medical': return Heart;
      case 'security': return Shield;
      case 'fire': return Zap;
      case 'duress': return Siren;
      default: return AlertTriangle;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'medical': return 'text-red-600 bg-red-50 border-red-200';
      case 'security': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'fire': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'duress': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'responding': return 'warning';
      case 'resolved': return 'success';
      case 'cancelled': return 'secondary';
      default: return 'default';
    }
  };

  const selectedAlertData = selectedAlert ? alerts.find(a => a.id === selectedAlert) : null;

  return (
    <div className="h-full flex gap-4">
      {/* Main Dashboard */}
      <div className="flex-1 flex flex-col">
        {/* Critical Alert Banner */}
        {criticalAlerts > 0 && (
          <Alert variant="destructive" className="mb-4">
            <Siren className="h-4 w-4" />
            <AlertTitle>Critical Alerts Active</AlertTitle>
            <AlertDescription>
              {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''} requiring immediate attention
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold text-red-600">{activeAlerts}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600 animate-pulse" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Responding</p>
                  <p className="text-2xl font-bold text-orange-600">{respondingAlerts}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold">1:45</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Units</p>
                  <p className="text-2xl font-bold text-green-600">12</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">SOS Alerts</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={showOnlyActive ? 'default' : 'outline'}
                  onClick={() => setShowOnlyActive(!showOnlyActive)}
                >
                  Active Only
                </Button>
                <Button size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="p-4 pt-0 space-y-3">
                {filteredAlerts.map((alert) => {
                  const Icon = getAlertIcon(alert.type);
                  const isSelected = selectedAlert === alert.id;
                  
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all",
                        getAlertColor(alert.type),
                        isSelected && "ring-2 ring-primary",
                        alert.status === 'active' && "animate-pulse"
                      )}
                      onClick={() => setSelectedAlert(alert.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3">
                          <Icon className="h-6 w-6 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
                              </h4>
                              <Badge variant={getStatusColor(alert.status)}>
                                {alert.status}
                              </Badge>
                              <Badge variant="outline">
                                {alert.priority}
                              </Badge>
                            </div>
                            <p className="text-sm mt-1">
                              Initiated by {alert.initiator.name} ({alert.initiator.badgeNumber})
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {alert.initiator.location.building} - 
                            Floor {alert.initiator.location.floor}, 
                            {alert.initiator.location.zone}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      
                      {alert.responders.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span className="text-sm">
                            {alert.responders.length} responder{alert.responders.length > 1 ? 's' : ''} assigned
                          </span>
                          <div className="flex -space-x-1">
                            {alert.responders.slice(0, 3).map((responder) => (
                              <div
                                key={responder.id}
                                className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium border-2 border-background"
                              >
                                {responder.name.charAt(0)}
                              </div>
                            ))}
                            {alert.responders.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium border-2 border-background">
                                +{alert.responders.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {alert.status === 'active' && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRespond?.(alert.id);
                            }}
                          >
                            Respond
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancel?.(alert.id);
                            }}
                          >
                            Cancel Alert
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {filteredAlerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No SOS alerts</p>
                    {showOnlyActive && (
                      <p className="text-xs mt-1">
                        Try showing all alerts
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Alert Details Panel */}
      {selectedAlertData && (
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-lg">Alert Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Initiator Info */}
            <div>
              <h4 className="text-sm font-medium mb-2">Initiator</h4>
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">
                    {selectedAlertData.initiator.name} ({selectedAlertData.initiator.role})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">
                    Badge: {selectedAlertData.initiator.badgeNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    {selectedAlertData.initiator.location.building}, 
                    Floor {selectedAlertData.initiator.location.floor}, 
                    {selectedAlertData.initiator.location.zone}
                  </span>
                </div>
              </div>
            </div>

            {/* Responders */}
            <div>
              <h4 className="text-sm font-medium mb-2">Responders</h4>
              <div className="space-y-2">
                {selectedAlertData.responders.map((responder) => (
                  <div key={responder.id} className="p-2 border rounded flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{responder.name}</p>
                      <p className="text-xs text-muted-foreground">{responder.role}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        responder.status === 'onscene' ? 'success' :
                        responder.status === 'enroute' ? 'warning' : 'secondary'
                      }>
                        {responder.status}
                      </Badge>
                      {responder.eta && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ETA: {responder.eta}min
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* External Services */}
            {selectedAlertData.externalServices && selectedAlertData.externalServices.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">External Services</h4>
                <div className="space-y-2">
                  {selectedAlertData.externalServices.map((service, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm font-medium uppercase">{service.type}</span>
                      <Badge variant={
                        service.status === 'arrived' ? 'success' :
                        service.status === 'dispatched' ? 'warning' : 'secondary'
                      }>
                        {service.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Updates */}
            <div>
              <h4 className="text-sm font-medium mb-2">Updates</h4>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {selectedAlertData.updates.map((update, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(update.timestamp).toLocaleTimeString()}</span>
                        <span>• {update.userName}</span>
                      </div>
                      <p className="mt-1">{update.message}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => onViewDetails?.(selectedAlertData.id)}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Full Details
              </Button>
              {selectedAlertData.audioChannelId && (
                <Button variant="outline">
                  <Radio className="h-4 w-4 mr-1" />
                  Join Audio
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}