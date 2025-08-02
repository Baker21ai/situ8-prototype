import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText,
  Search,
  Filter,
  Download,
  Shield,
  User,
  Clock,
  Database,
  MessageSquare,
  Radio,
  Settings,
  AlertTriangle,
  Eye,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'configuration' | 'communication' | 'system';
  status: 'success' | 'failed' | 'partial';
  complianceRelevant: boolean;
  retentionCategory: 'standard' | 'extended' | 'permanent';
}

interface AuditLogsProps {
  logs?: AuditLogEntry[];
  onExport?: (filters: any) => void;
  onViewDetails?: (logId: string) => void;
  onRefresh?: () => void;
}

export function AuditLogs({
  logs = [],
  onExport,
  onViewDetails,
  onRefresh
}: AuditLogsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showComplianceOnly, setShowComplianceOnly] = useState(false);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);

  // Mock audit logs for demo
  const mockLogs: AuditLogEntry[] = [
    {
      id: 'audit-001',
      timestamp: new Date().toISOString(),
      userId: 'user-123',
      userName: 'Garcia, M.',
      userRole: 'Security Officer',
      action: 'JOIN_VOICE_CHANNEL',
      resource: 'voice_channel',
      resourceId: 'emergency-01',
      details: { channelName: 'Emergency Channel', duration: 180 },
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome/120.0.0.0',
      sessionId: 'sess-abc123',
      severity: 'medium',
      category: 'communication',
      status: 'success',
      complianceRelevant: true,
      retentionCategory: 'extended'
    },
    {
      id: 'audit-002',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      userId: 'user-456',
      userName: 'Chen, L.',
      userRole: 'Dispatcher',
      action: 'CREATE_INCIDENT',
      resource: 'incident',
      resourceId: 'INC-2024-001234',
      details: { incidentType: 'medical', priority: 'high', location: 'Building A' },
      ipAddress: '192.168.1.101',
      userAgent: 'Chrome/120.0.0.0',
      sessionId: 'sess-def456',
      severity: 'high',
      category: 'data_access',
      status: 'success',
      complianceRelevant: true,
      retentionCategory: 'permanent'
    },
    {
      id: 'audit-003',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      userId: 'user-789',
      userName: 'Admin User',
      userRole: 'System Administrator',
      action: 'MODIFY_USER_PERMISSIONS',
      resource: 'user_permissions',
      resourceId: 'user-123',
      details: { previousRole: 'Security Officer', newRole: 'Senior Security Officer', clearanceLevel: 3 },
      ipAddress: '192.168.1.102',
      userAgent: 'Chrome/120.0.0.0',
      sessionId: 'sess-ghi789',
      severity: 'critical',
      category: 'authorization',
      status: 'success',
      complianceRelevant: true,
      retentionCategory: 'permanent'
    },
    {
      id: 'audit-004',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      userId: 'user-456',
      userName: 'Chen, L.',
      userRole: 'Dispatcher',
      action: 'FAILED_LOGIN_ATTEMPT',
      resource: 'authentication',
      details: { reason: 'invalid_password', attempts: 3 },
      ipAddress: '192.168.1.101',
      userAgent: 'Chrome/120.0.0.0',
      sessionId: 'sess-failed',
      severity: 'medium',
      category: 'authentication',
      status: 'failed',
      complianceRelevant: true,
      retentionCategory: 'extended'
    }
  ];

  const filteredLogs = (logs.length > 0 ? logs : mockLogs).filter(log => {
    if (searchQuery && !log.action.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !log.userName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.resource.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
    if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'all' && log.status !== selectedStatus) return false;
    if (selectedUser !== 'all' && log.userId !== selectedUser) return false;
    if (showComplianceOnly && !log.complianceRelevant) return false;
    
    // Date range filtering
    if (dateRange.from || dateRange.to) {
      const logDate = new Date(log.timestamp);
      if (dateRange.from && logDate < dateRange.from) return false;
      if (dateRange.to && logDate > dateRange.to) return false;
    }
    
    return true;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('AUTH')) return Shield;
    if (action.includes('CREATE') || action.includes('ADD')) return Plus;
    if (action.includes('MODIFY') || action.includes('UPDATE')) return Edit;
    if (action.includes('DELETE') || action.includes('REMOVE')) return Trash2;
    if (action.includes('VIEW') || action.includes('ACCESS')) return Eye;
    if (action.includes('VOICE') || action.includes('CHANNEL')) return Radio;
    if (action.includes('MESSAGE')) return MessageSquare;
    if (action.includes('CONFIG') || action.includes('SETTING')) return Settings;
    return FileText;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return Shield;
      case 'authorization': return Lock;
      case 'data_access': return Database;
      case 'configuration': return Settings;
      case 'communication': return MessageSquare;
      case 'system': return Settings;
      default: return FileText;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'destructive';
      case 'partial': return 'warning';
      default: return 'secondary';
    }
  };

  const uniqueUsers = Array.from(new Set((logs.length > 0 ? logs : mockLogs).map(log => log.userName)));
  const selectedLogData = selectedLog ? filteredLogs.find(log => log.id === selectedLog) : null;

  return (
    <div className="h-full flex gap-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{filteredLogs.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance Events</p>
                  <p className="text-2xl font-bold">
                    {filteredLogs.filter(log => log.complianceRelevant).length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed Actions</p>
                  <p className="text-2xl font-bold">
                    {filteredLogs.filter(log => log.status === 'failed').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Events</p>
                  <p className="text-2xl font-bold">
                    {filteredLogs.filter(log => log.severity === 'critical').length}
                  </p>
                </div>
                <Lock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="authentication">Authentication</SelectItem>
                    <SelectItem value="authorization">Authorization</SelectItem>
                    <SelectItem value="data_access">Data Access</SelectItem>
                    <SelectItem value="configuration">Configuration</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showComplianceOnly}
                      onChange={(e) => setShowComplianceOnly(e.target.checked)}
                      className="rounded"
                    />
                    <span>Compliance relevant only</span>
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onExport?.({ 
                      searchQuery, 
                      selectedCategory, 
                      selectedSeverity, 
                      selectedStatus, 
                      dateRange, 
                      showComplianceOnly 
                    })}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline" onClick={onRefresh}>
                    <Filter className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Trail
              <Badge variant="outline">{filteredLogs.length} events</Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="p-4 pt-0 space-y-2">
                {filteredLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  const CategoryIcon = getCategoryIcon(log.category);
                  const isSelected = selectedLog === log.id;
                  
                  return (
                    <div
                      key={log.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all",
                        getSeverityColor(log.severity),
                        isSelected && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedLog(log.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3">
                          <ActionIcon className="h-5 w-5 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                              <Badge variant={getStatusColor(log.status)}>
                                {log.status}
                              </Badge>
                              <Badge variant="outline">
                                {log.severity}
                              </Badge>
                              {log.complianceRelevant && (
                                <Badge variant="secondary">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Compliance
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {log.resource} {log.resourceId && `(${log.resourceId})`}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{log.userName} ({log.userRole})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CategoryIcon className="h-3 w-3" />
                          <span className="capitalize">{log.category.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No audit logs found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Log Details Panel */}
      {selectedLogData && (
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-lg">Log Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div>
              <h4 className="text-sm font-medium mb-2">Event Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Action:</span>
                  <span className="font-medium">{selectedLogData.action.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resource:</span>
                  <span>{selectedLogData.resource}</span>
                </div>
                {selectedLogData.resourceId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resource ID:</span>
                    <span className="font-mono text-xs">{selectedLogData.resourceId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={getStatusColor(selectedLogData.status)}>
                    {selectedLogData.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Severity:</span>
                  <Badge variant="outline">{selectedLogData.severity}</Badge>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div>
              <h4 className="text-sm font-medium mb-2">User Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User:</span>
                  <span>{selectedLogData.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span>{selectedLogData.userRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="font-mono text-xs">{selectedLogData.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session:</span>
                  <span className="font-mono text-xs">{selectedLogData.sessionId}</span>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div>
              <h4 className="text-sm font-medium mb-2">Event Details</h4>
              <div className="p-3 bg-muted rounded text-xs">
                <pre className="whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(selectedLogData.details, null, 2)}
                </pre>
              </div>
            </div>

            {/* Timestamp */}
            <div>
              <h4 className="text-sm font-medium mb-2">Timestamp</h4>
              <div className="text-sm">
                <p>{new Date(selectedLogData.timestamp).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedLogData.timestamp}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onViewDetails?.(selectedLogData.id)}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Full Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}