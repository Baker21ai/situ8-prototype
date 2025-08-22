import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { 
  Search, 
  Clock, 
  Construction, 
  CheckCircle, 
  MapPin, 
  User,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Phone,
  FileText,
  Shield,
  Timer,
  Users,
  Camera,
  Zap,
  Activity
} from 'lucide-react';
import { useAlertStore, Alert, AlertPriority, AlertStatus, getPriorityColor, getStatusColor, getAlertTypeIcon } from '../stores/alertStore';
import { cn } from '../lib/utils';
import { GuardAssignmentDialog } from './dialogs/GuardAssignmentDialog';
import { SOPExecutionPanel } from './dialogs/SOPExecutionPanel';

interface KanbanColumnProps {
  title: string;
  status: AlertStatus;
  icon: React.ElementType;
  color: string;
  alerts: Alert[];
}

interface AlertCardProps {
  alert: Alert;
  onDragStart: (e: React.DragEvent, alert: Alert) => void;
}

interface PrioritySectionProps {
  priority: AlertPriority;
  alerts: Alert[];
  columnStatus: AlertStatus;
  collapsed: boolean;
  onToggle: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onDragStart }) => {
  const { setSelectedAlert, assignGuard, setAlertStatus, initiateSOP, activeSOPExecutions, setSelectedSOPExecution } = useAlertStore();
  const [showGuardDialog, setShowGuardDialog] = useState(false);
  const [showSOPPanel, setShowSOPPanel] = useState(false);
  
  const sopExecution = activeSOPExecutions.get(alert.id);
  
  const priorityColors = {
    critical: 'border-red-500 bg-red-50 text-red-900',
    high: 'border-yellow-500 bg-yellow-50 text-yellow-900',
    medium: 'border-blue-500 bg-blue-50 text-blue-900',
    low: 'border-gray-500 bg-gray-50 text-gray-900'
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleAssignGuard = () => {
    setShowGuardDialog(true);
  };

  const handleGuardAssignment = (guardId: string) => {
    assignGuard(alert.id, guardId);
    setShowGuardDialog(false);
  };

  const handleInitiateSOP = () => {
    const execution = initiateSOP(alert.id);
    if (execution) {
      setSelectedSOPExecution(execution);
      setShowSOPPanel(true);
    }
  };

  const handleViewSOP = () => {
    if (sopExecution) {
      setSelectedSOPExecution(sopExecution);
      setShowSOPPanel(true);
    }
  };

  const handleApprove = () => {
    if (alert.situ8.status === 'pending_approval') {
      setAlertStatus(alert.id, 'in_progress');
    }
  };

  const handleReject = () => {
    if (alert.situ8.status === 'pending_approval') {
      setAlertStatus(alert.id, 'detected');
    }
  };

  return (
    <Card 
      className={cn(
        "mb-3 cursor-pointer transition-all duration-200 hover:shadow-md border-2",
        priorityColors[alert.priority],
        alert.priority === 'critical' && "shadow-lg"
      )}
      draggable
      onDragStart={(e) => onDragStart(e, alert)}
      onClick={() => setSelectedAlert(alert)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getAlertTypeIcon(alert.alertType)}</span>
            <h4 className="font-semibold text-sm">
              {alert.alertType.replace('_', ' ').toUpperCase()}
            </h4>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Timer className="h-3 w-3" />
            <span>{getTimeAgo(alert.timestamp)}</span>
          </div>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{alert.location.zoneName}</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {Math.round(alert.detection.confidence * 100)}%
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className={alert.situ8.assignedGuard ? "text-green-600 font-medium" : "text-red-600"}>
              {alert.situ8.assignedGuard ? 'ASSIGNED' : 'UNASSIGNED'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          {alert.situ8.status === 'detected' && (
            <>
              <Button 
                size="sm" 
                variant="destructive" 
                className="text-xs h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssignGuard();
                }}
              >
                🚨 ASSIGN
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                className="text-xs h-7 px-2"
                onClick={(e) => e.stopPropagation()}
              >
                📋 SOP
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                className="text-xs h-7 px-2"
                onClick={(e) => e.stopPropagation()}
              >
                📱 CALL
              </Button>
            </>
          )}
          
          {alert.situ8.status === 'pending_approval' && (
            <>
              <Button 
                size="sm" 
                variant="default" 
                className="text-xs h-7 px-2 bg-green-600 hover:bg-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove();
                }}
              >
                ✅ APPROVE
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                className="text-xs h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject();
                }}
              >
                ❌ REJECT
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                className="text-xs h-7 px-2"
                onClick={(e) => e.stopPropagation()}
              >
                📞
              </Button>
            </>
          )}
          
          {alert.situ8.status === 'in_progress' && (
            <>
              <Button 
                size="sm" 
                variant="secondary" 
                className="text-xs h-7 px-2"
                onClick={(e) => e.stopPropagation()}
              >
                📞 CONTACT
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                className="text-xs h-7 px-2"
                onClick={(e) => e.stopPropagation()}
              >
                🚨 ESCALATE
              </Button>
            </>
          )}
          
          {alert.situ8.status === 'resolved' && (
            <>
              <Button 
                size="sm" 
                variant="secondary" 
                className="text-xs h-7 px-2"
                onClick={(e) => e.stopPropagation()}
              >
                📊 REPORT
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7 px-2"
                onClick={(e) => e.stopPropagation()}
              >
                🔄 REOPEN
              </Button>
            </>
          )}
        </div>
      </CardContent>
      
      <GuardAssignmentDialog
        open={showGuardDialog}
        onOpenChange={setShowGuardDialog}
        alert={alert}
        onAssignGuard={handleGuardAssignment}
      />
    </Card>
  );
};

const PrioritySection: React.FC<PrioritySectionProps> = ({ 
  priority, 
  alerts, 
  columnStatus, 
  collapsed, 
  onToggle 
}) => {
  const priorityConfig = {
    critical: { emoji: '🚨', label: 'CRITICAL ALERTS', color: 'text-red-600' },
    high: { emoji: '⚠️', label: 'HIGH PRIORITY', color: 'text-yellow-600' },
    medium: { emoji: '📋', label: 'MEDIUM PRIORITY', color: 'text-blue-600' },
    low: { emoji: '📝', label: 'LOW PRIORITY', color: 'text-gray-600' }
  };

  const config = priorityConfig[priority];
  const alertCount = alerts.length;

  if (alertCount === 0 && priority !== 'critical') {
    return null;
  }

  return (
    <div className="mb-4">
      <div 
        className={cn(
          "flex items-center justify-between p-2 rounded cursor-pointer transition-colors",
          collapsed ? "bg-gray-100 border border-dashed border-gray-300 hover:bg-gray-200" : "hover:bg-gray-50"
        )}
        onClick={onToggle}
      >
        <h3 className={cn("font-semibold text-sm flex items-center gap-2", config.color)}>
          <span>{config.emoji}</span>
          <span>{config.label} [{alertCount}]</span>
          {collapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform" />
          ) : (
            <ChevronDown className="h-4 w-4 transition-transform" />
          )}
        </h3>
        {collapsed && alertCount > 0 && (
          <span className="text-xs text-gray-500">COLLAPSED - Click to expand</span>
        )}
      </div>
      
      {!collapsed && (
        <div className="mt-2">
          {alertCount === 0 ? (
            <div className="bg-gray-100 p-4 rounded text-center text-gray-500 text-sm">
              {priority === 'critical' ? 'NO CRITICAL ALERTS ACTIVE' : `No ${priority} priority alerts`}
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onDragStart={(e, alert) => {
                    e.dataTransfer.setData('text/plain', alert.id);
                  }}
                />
              ))}
              {alertCount > 2 && priority !== 'critical' && (
                <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded text-center">
                  ▼ + {alertCount - 2} more {priority.toUpperCase()} alerts
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, icon: Icon, color, alerts }) => {
  const { collapsedPriorities, togglePriorityCollapse, setAlertStatus } = useAlertStore();
  
  const priorityOrder: AlertPriority[] = ['critical', 'high', 'medium', 'low'];
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const alertId = e.dataTransfer.getData('text/plain');
    setAlertStatus(alertId, status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card 
      className="h-full min-h-[600px] flex flex-col"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <CardHeader className={cn("rounded-t-lg text-white p-4", color)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <span className="font-bold text-sm">{title}</span>
          </div>
          <Badge className="bg-black/20 text-white font-bold">
            {alerts.length} alerts
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 overflow-y-auto">
        {priorityOrder.map((priority) => {
          const priorityAlerts = alerts.filter(alert => alert.priority === priority);
          const isCollapsed = collapsedPriorities[`${status}_${priority}`] || false;
          
          return (
            <PrioritySection
              key={priority}
              priority={priority}
              alerts={priorityAlerts}
              columnStatus={status}
              collapsed={isCollapsed}
              onToggle={() => togglePriorityCollapse(status, priority)}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};

export const AmbientAlertDashboard: React.FC = () => {
  const { 
    alerts, 
    getAlertsByStatus, 
    getCriticalAlerts,
    subscribeToAlerts, 
    unsubscribeFromAlerts 
  } = useAlertStore();
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    subscribeToAlerts();

    return () => {
      clearInterval(timer);
      unsubscribeFromAlerts();
    };
  }, [subscribeToAlerts, unsubscribeFromAlerts]);

  const detectedAlerts = getAlertsByStatus('detected');
  const pendingAlerts = getAlertsByStatus('pending_approval');
  const progressAlerts = getAlertsByStatus('in_progress');
  const resolvedAlerts = getAlertsByStatus('resolved');
  const criticalCount = getCriticalAlerts().length;
  const highCount = alerts.filter(a => a.priority === 'high').length;

  const columns = [
    {
      title: 'NEW ALERTS DETECTED',
      status: 'detected' as AlertStatus,
      icon: Search,
      color: 'bg-blue-600',
      alerts: detectedAlerts
    },
    {
      title: 'PENDING APPROVAL',
      status: 'pending_approval' as AlertStatus,
      icon: Clock,
      color: 'bg-yellow-600',
      alerts: pendingAlerts
    },
    {
      title: 'IN PROGRESS',
      status: 'in_progress' as AlertStatus,
      icon: Construction,
      color: 'bg-orange-600',
      alerts: progressAlerts
    },
    {
      title: 'RESOLVED',
      status: 'resolved' as AlertStatus,
      icon: CheckCircle,
      color: 'bg-green-600',
      alerts: resolvedAlerts
    }
  ];

  // Mock guard data - in real implementation, this would come from guardStore
  const guardStatus = [
    { name: 'Martinez', zone: 'Zone A', status: 'active', activity: '🚧' },
    { name: 'Johnson', zone: 'Zone B', status: 'active', activity: '✅' },
    { name: 'Davis', zone: 'Zone C', status: 'active', activity: '✅' },
    { name: 'Wilson', status: 'break', activity: '☕' },
    { name: 'Thompson', status: 'break', activity: '☕' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <h1 className="text-xl font-bold">SITU8 SECURITY OPERATIONS CENTER</h1>
            </div>
            <div className="text-sm text-gray-300">
              {currentTime.toLocaleTimeString('en-US', { 
                timeZone: 'America/New_York', 
                hour12: false 
              })} EST
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>DISPATCHER_01</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-red-600 text-white font-bold">🚨 CRIT: {criticalCount}</Badge>
              <Badge className="bg-yellow-600 text-white font-bold">⚠️ HIGH: {highCount}</Badge>
              <Badge className="bg-blue-600 text-white font-bold">📊 TOTAL: {alerts.length}</Badge>
              <Badge className="bg-green-600 text-white font-bold">📞 GUARDS: 5/7 ACTIVE</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Kanban Board */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              title={column.title}
              status={column.status}
              icon={column.icon}
              color={column.color}
              alerts={column.alerts}
            />
          ))}
        </div>
      </div>

      {/* Operational Status Footer */}
      <div className="bg-slate-800 text-white p-4 border-t">
        <div className="space-y-2">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            OPERATIONAL STATUS
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">👮 GUARDS:</span>
              {guardStatus.map((guard, index) => (
                <React.Fragment key={guard.name}>
                  <span className={cn(
                    "inline-block w-2 h-2 rounded-full ml-2 mr-1",
                    guard.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                  )}></span>
                  <span>{guard.name}({guard.zone ? `${guard.zone}-` : ''}{guard.activity})</span>
                  {index < guardStatus.length - 1 && ' | '}
                </React.Fragment>
              ))}
              <span className="ml-2">| [+2 OFF-DUTY]</span>
            </div>
            <div>
              <span className="font-semibold">📞 COMMS:</span> All Radio Channels Clear |{' '}
              <span className="font-semibold">🎥 CAMERAS:</span> 98% Online (2 maintenance) |{' '}
              <span className="font-semibold">⚡ SYSTEMS:</span> All Normal |{' '}
              <span className="font-semibold">🚨 AVG RESPONSE:</span> 3.2min |{' '}
              <span className="font-semibold">📊 RESOLUTION RATE:</span> 94% (Today)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};