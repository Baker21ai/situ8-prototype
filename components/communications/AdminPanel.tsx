import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield,
  Users,
  Settings,
  Database,
  Server,
  Activity,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  HardDrive,
  Cpu,
  Memory,
  BarChart3,
  Bell,
  Eye,
  Key,
  Globe,
  Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  services: Array<{
    name: string;
    status: 'running' | 'stopped' | 'error';
    uptime: string;
    cpu: number;
    memory: number;
  }>;
  infrastructure: {
    apiGateway: 'healthy' | 'degraded' | 'down';
    lambda: 'healthy' | 'degraded' | 'down';
    dynamodb: 'healthy' | 'degraded' | 'down';
    s3: 'healthy' | 'degraded' | 'down';
    cognito: 'healthy' | 'degraded' | 'down';
  };
  metrics: {
    totalRequests: number;
    errorRate: number;
    avgLatency: number;
    activeConnections: number;
  };
}

interface UserManagement {
  id: string;
  username: string;
  email: string;
  role: string;
  clearanceLevel: number;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

interface ComplianceSettings {
  dataRetention: {
    auditLogs: number; // days
    voiceRecordings: number;
    transcripts: number;
    messages: number;
  };
  encryption: {
    atRest: boolean;
    inTransit: boolean;
    keyRotation: number; // days
  };
  backup: {
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number; // days
    offsite: boolean;
  };
  monitoring: {
    realTime: boolean;
    alerting: boolean;
    reporting: boolean;
  };
}

interface AdminPanelProps {
  systemHealth?: SystemHealth;
  users?: UserManagement[];
  complianceSettings?: ComplianceSettings;
  onUserAction?: (action: string, userId: string) => void;
  onSystemAction?: (action: string) => void;
  onUpdateSettings?: (settings: Partial<ComplianceSettings>) => void;
}

export function AdminPanel({
  systemHealth,
  users = [],
  complianceSettings,
  onUserAction,
  onSystemAction,
  onUpdateSettings
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showSystemLogs, setShowSystemLogs] = useState(false);

  // Mock data for demo
  const mockSystemHealth: SystemHealth = {
    overall: 'healthy',
    services: [
      { name: 'WebSocket API', status: 'running', uptime: '99.9%', cpu: 15, memory: 45 },
      { name: 'Voice Service', status: 'running', uptime: '99.8%', cpu: 22, memory: 38 },
      { name: 'Transcription', status: 'running', uptime: '99.7%', cpu: 35, memory: 52 },
      { name: 'AI Processing', status: 'running', uptime: '99.5%', cpu: 40, memory: 68 }
    ],
    infrastructure: {
      apiGateway: 'healthy',
      lambda: 'healthy',
      dynamodb: 'healthy',
      s3: 'healthy',
      cognito: 'degraded'
    },
    metrics: {
      totalRequests: 15420,
      errorRate: 0.2,
      avgLatency: 145,
      activeConnections: 24
    }
  };

  const mockUsers: UserManagement[] = [
    {
      id: 'user-1',
      username: 'garcia.m',
      email: 'garcia@company.com',
      role: 'Security Officer',
      clearanceLevel: 3,
      status: 'active',
      lastLogin: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      permissions: ['voice_access', 'incident_create', 'message_send']
    },
    {
      id: 'user-2',
      username: 'chen.l',
      email: 'chen@company.com',
      role: 'Dispatcher',
      clearanceLevel: 4,
      status: 'active',
      lastLogin: '2024-01-15T09:15:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      permissions: ['voice_access', 'incident_create', 'message_send', 'broadcast_send']
    }
  ];

  const mockCompliance: ComplianceSettings = {
    dataRetention: {
      auditLogs: 2555, // 7 years
      voiceRecordings: 365,
      transcripts: 1095, // 3 years
      messages: 365
    },
    encryption: {
      atRest: true,
      inTransit: true,
      keyRotation: 90
    },
    backup: {
      frequency: 'daily',
      retention: 30,
      offsite: true
    },
    monitoring: {
      realTime: true,
      alerting: true,
      reporting: true
    }
  };

  const currentSystemHealth = systemHealth || mockSystemHealth;
  const currentUsers = users.length > 0 ? users : mockUsers;
  const currentCompliance = complianceSettings || mockCompliance;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'active': return 'text-green-600';
      case 'warning':
      case 'degraded':
      case 'inactive': return 'text-yellow-600';
      case 'critical':
      case 'down':
      case 'error':
      case 'suspended': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'active': return CheckCircle;
      case 'warning':
      case 'degraded':
      case 'inactive': return AlertTriangle;
      case 'critical':
      case 'down':
      case 'error':
      case 'suspended': return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* System Health Alert */}
      {currentSystemHealth.overall !== 'healthy' && (
        <Alert variant={currentSystemHealth.overall === 'critical' ? 'destructive' : 'default'} className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System health status: {currentSystemHealth.overall}. 
            {currentSystemHealth.overall === 'critical' && ' Immediate attention required.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">
                  {currentUsers.filter(u => u.status === 'active').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Health</p>
                <p className={cn("text-2xl font-bold capitalize", getStatusColor(currentSystemHealth.overall))}>
                  {currentSystemHealth.overall}
                </p>
              </div>
              <Server className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Connections</p>
                <p className="text-2xl font-bold">{currentSystemHealth.metrics.activeConnections}</p>
              </div>
              <Wifi className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{currentSystemHealth.metrics.errorRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Administration
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => onSystemAction?.('refresh')}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="system">System Health</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="flex-1 p-4 space-y-4">
              {/* Infrastructure Status */}
              <div>
                <h3 className="text-sm font-medium mb-3">Infrastructure Status</h3>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(currentSystemHealth.infrastructure).map(([service, status]) => {
                    const StatusIcon = getStatusIcon(status);
                    return (
                      <Card key={service}>
                        <CardContent className="p-3 text-center">
                          <StatusIcon className={cn("h-6 w-6 mx-auto mb-1", getStatusColor(status))} />
                          <p className="text-xs font-medium capitalize">{service}</p>
                          <p className={cn("text-xs capitalize", getStatusColor(status))}>{status}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Service Status */}
              <div>
                <h3 className="text-sm font-medium mb-3">Service Status</h3>
                <div className="space-y-2">
                  {currentSystemHealth.services.map((service) => {
                    const StatusIcon = getStatusIcon(service.status);
                    return (
                      <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={cn("h-4 w-4", getStatusColor(service.status))} />
                          <div>
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">CPU</p>
                            <p className="font-medium">{service.cpu}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Memory</p>
                            <p className="font-medium">{service.memory}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="flex-1 p-0">
              <div className="p-4 pb-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">User Management</h3>
                  <Button size="sm" onClick={() => onUserAction?.('create', '')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add User
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4 pt-0 space-y-3">
                  {currentUsers.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-medium">{user.username}</h4>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              user.status === 'active' ? 'success' :
                              user.status === 'inactive' ? 'secondary' : 'destructive'
                            }>
                              {user.status}
                            </Badge>
                            <Button size="icon" variant="ghost" onClick={() => onUserAction?.('edit', user.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Role</p>
                            <p className="font-medium">{user.role}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Clearance</p>
                            <p className="font-medium">Level {user.clearanceLevel}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Login</p>
                            <p className="font-medium">{new Date(user.lastLogin).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">Permissions</p>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="system" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">System Health Monitoring</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowSystemLogs(!showSystemLogs)}>
                      <Eye className="h-4 w-4 mr-1" />
                      {showSystemLogs ? 'Hide' : 'Show'} Logs
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onSystemAction?.('restart')}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Restart Services
                    </Button>
                  </div>
                </div>

                {showSystemLogs && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs font-mono bg-black text-green-400 p-3 rounded max-h-48 overflow-auto">
                        [2024-01-15 10:30:15] INFO: WebSocket connection established from 192.168.1.100<br/>
                        [2024-01-15 10:30:16] INFO: User garcia.m authenticated successfully<br/>
                        [2024-01-15 10:30:17] INFO: Voice channel join request for emergency-01<br/>
                        [2024-01-15 10:30:18] INFO: Transcription service started for session abc123<br/>
                        [2024-01-15 10:30:19] WARN: High CPU usage detected on voice service (85%)<br/>
                        [2024-01-15 10:30:20] INFO: Auto-scaling triggered for voice service<br/>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Requests</span>
                        <span className="font-medium">{currentSystemHealth.metrics.totalRequests.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Latency</span>
                        <span className="font-medium">{currentSystemHealth.metrics.avgLatency}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Error Rate</span>
                        <span className={cn("font-medium", currentSystemHealth.metrics.errorRate > 1 ? "text-red-600" : "text-green-600")}>
                          {currentSystemHealth.metrics.errorRate}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export System Report
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Configuration
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Database className="h-4 w-4 mr-2" />
                        Backup Database
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="compliance" className="flex-1 p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Data Retention Policies</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="audit-retention">Audit Logs (days)</Label>
                      <Input
                        id="audit-retention"
                        type="number"
                        value={currentCompliance.dataRetention.auditLogs}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="voice-retention">Voice Recordings (days)</Label>
                      <Input
                        id="voice-retention"
                        type="number"
                        value={currentCompliance.dataRetention.voiceRecordings}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transcript-retention">Transcripts (days)</Label>
                      <Input
                        id="transcript-retention"
                        type="number"
                        value={currentCompliance.dataRetention.transcripts}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message-retention">Messages (days)</Label>
                      <Input
                        id="message-retention"
                        type="number"
                        value={currentCompliance.dataRetention.messages}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Encryption Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="encrypt-rest">Encryption at Rest</Label>
                      <Switch id="encrypt-rest" checked={currentCompliance.encryption.atRest} disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="encrypt-transit">Encryption in Transit</Label>
                      <Switch id="encrypt-transit" checked={currentCompliance.encryption.inTransit} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="key-rotation">Key Rotation (days)</Label>
                      <Input
                        id="key-rotation"
                        type="number"
                        value={currentCompliance.encryption.keyRotation}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Backup Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backup-frequency">Frequency</Label>
                      <Input
                        id="backup-frequency"
                        value={currentCompliance.backup.frequency}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backup-retention">Retention (days)</Label>
                      <Input
                        id="backup-retention"
                        type="number"
                        value={currentCompliance.backup.retention}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="offsite-backup">Offsite Backup</Label>
                      <Switch id="offsite-backup" checked={currentCompliance.backup.offsite} disabled />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="flex-1 p-4">
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Advanced system settings</p>
                <p className="text-xs mt-1">Configuration options coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}