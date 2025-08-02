import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  MessageSquare,
  Mic,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Star,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface QualityMetric {
  period: string;
  responseTime: number;
  resolutionTime: number;
  satisfactionScore: number;
  firstCallResolution: number;
  transcriptionAccuracy: number;
  alertResponseTime: number;
}

interface TeamPerformance {
  userId: string;
  userName: string;
  role: string;
  metrics: {
    responseCalls: number;
    avgResponseTime: number;
    resolutionRate: number;
    satisfactionScore: number;
    activeHours: number;
  };
  trends: {
    responseTime: 'up' | 'down' | 'stable';
    satisfaction: 'up' | 'down' | 'stable';
  };
}

interface QualityAlert {
  id: string;
  type: 'performance' | 'threshold' | 'trend';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
}

interface QualityInsightsProps {
  metrics?: QualityMetric[];
  teamPerformance?: TeamPerformance[];
  alerts?: QualityAlert[];
  onExport?: () => void;
  onRefresh?: () => void;
}

export function QualityInsights({
  metrics = [],
  teamPerformance = [],
  alerts = [],
  onExport,
  onRefresh
}: QualityInsightsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);

  // Mock data for demo
  const mockMetrics = [
    { period: 'Mon', responseTime: 45, resolutionTime: 180, satisfactionScore: 4.2, firstCallResolution: 78, transcriptionAccuracy: 92, alertResponseTime: 12 },
    { period: 'Tue', responseTime: 52, resolutionTime: 165, satisfactionScore: 4.1, firstCallResolution: 82, transcriptionAccuracy: 94, alertResponseTime: 15 },
    { period: 'Wed', responseTime: 38, resolutionTime: 195, satisfactionScore: 4.4, firstCallResolution: 75, firstCallResolution: 75, transcriptionAccuracy: 89, alertResponseTime: 18 },
    { period: 'Thu', responseTime: 41, resolutionTime: 172, satisfactionScore: 4.3, firstCallResolution: 80, transcriptionAccuracy: 91, alertResponseTime: 14 },
    { period: 'Fri', responseTime: 47, resolutionTime: 158, satisfactionScore: 4.5, firstCallResolution: 85, transcriptionAccuracy: 95, alertResponseTime: 11 },
    { period: 'Sat', responseTime: 55, resolutionTime: 210, satisfactionScore: 4.0, firstCallResolution: 72, transcriptionAccuracy: 88, alertResponseTime: 20 },
    { period: 'Sun', responseTime: 43, resolutionTime: 183, satisfactionScore: 4.2, firstCallResolution: 79, transcriptionAccuracy: 93, alertResponseTime: 13 }
  ];

  const mockTeamData = [
    { userId: '1', userName: 'Garcia, M.', role: 'Senior Security', metrics: { responseCalls: 24, avgResponseTime: 38, resolutionRate: 92, satisfactionScore: 4.6, activeHours: 8.5 }, trends: { responseTime: 'down' as const, satisfaction: 'up' as const } },
    { userId: '2', userName: 'Chen, L.', role: 'Security Officer', metrics: { responseCalls: 18, avgResponseTime: 45, resolutionRate: 88, satisfactionScore: 4.3, activeHours: 8.0 }, trends: { responseTime: 'stable' as const, satisfaction: 'stable' as const } },
    { userId: '3', userName: 'Wilson, R.', role: 'Security Officer', metrics: { responseCalls: 21, avgResponseTime: 52, resolutionRate: 85, satisfactionScore: 4.1, activeHours: 7.8 }, trends: { responseTime: 'up' as const, satisfaction: 'down' as const } }
  ];

  const alertDistribution = [
    { name: 'Medical', value: 35, color: '#ef4444' },
    { name: 'Security', value: 28, color: '#f97316' },
    { name: 'Maintenance', value: 20, color: '#eab308' },
    { name: 'Visitor', value: 12, color: '#22c55e' },
    { name: 'Other', value: 5, color: '#6b7280' }
  ];

  const currentMetrics = mockMetrics[mockMetrics.length - 1];
  const previousMetrics = mockMetrics[mockMetrics.length - 2];

  const getTrendIcon = (current: number, previous: number, inverse = false) => {
    const isUp = current > previous;
    const trend = inverse ? !isUp : isUp;
    return trend ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (current: number, previous: number, inverse = false) => {
    const isUp = current > previous;
    const trend = inverse ? !isUp : isUp;
    return trend ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{currentMetrics.responseTime}s</p>
                  {(() => {
                    const TrendIcon = getTrendIcon(currentMetrics.responseTime, previousMetrics.responseTime, true);
                    return (
                      <TrendIcon className={cn("h-4 w-4", getTrendColor(currentMetrics.responseTime, previousMetrics.responseTime, true))} />
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">Target: &lt;60s</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{currentMetrics.satisfactionScore}/5</p>
                  {(() => {
                    const TrendIcon = getTrendIcon(currentMetrics.satisfactionScore, previousMetrics.satisfactionScore);
                    return (
                      <TrendIcon className={cn("h-4 w-4", getTrendColor(currentMetrics.satisfactionScore, previousMetrics.satisfactionScore))} />
                    );
                  })()}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("h-3 w-3", i < Math.floor(currentMetrics.satisfactionScore) ? "text-yellow-400 fill-current" : "text-gray-300")} />
                  ))}
                </div>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">First Call Resolution</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{currentMetrics.firstCallResolution}%</p>
                  {(() => {
                    const TrendIcon = getTrendIcon(currentMetrics.firstCallResolution, previousMetrics.firstCallResolution);
                    return (
                      <TrendIcon className={cn("h-4 w-4", getTrendColor(currentMetrics.firstCallResolution, previousMetrics.firstCallResolution))} />
                    );
                  })()}
                </div>
                <Progress value={currentMetrics.firstCallResolution} className="h-1 mt-1" />
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transcription Accuracy</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{currentMetrics.transcriptionAccuracy}%</p>
                  {(() => {
                    const TrendIcon = getTrendIcon(currentMetrics.transcriptionAccuracy, previousMetrics.transcriptionAccuracy);
                    return (
                      <TrendIcon className={cn("h-4 w-4", getTrendColor(currentMetrics.transcriptionAccuracy, previousMetrics.transcriptionAccuracy))} />
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">Target: &gt;95%</p>
              </div>
              <Mic className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quality & Performance Insights
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="h-8 px-2 text-sm border rounded"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              <Button size="sm" variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={onExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="alerts">Quality Alerts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="flex-1 p-4 space-y-4">
              {/* Response Time Trend */}
              <div>
                <h3 className="text-sm font-medium mb-2">Response Time Trend</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" name="Response Time (s)" />
                      <Line type="monotone" dataKey="alertResponseTime" stroke="#ef4444" name="Alert Response (s)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Satisfaction Trend */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Satisfaction Score Trend</h3>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis domain={[3.5, 5]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="satisfactionScore" stroke="#22c55e" name="Satisfaction" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alert Distribution */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Alert Type Distribution</h3>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={alertDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={50}
                          dataKey="value"
                        >
                          {alertDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Key Performance Indicators</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="firstCallResolution" fill="#22c55e" name="First Call Resolution %" />
                        <Bar dataKey="transcriptionAccuracy" fill="#3b82f6" name="Transcription Accuracy %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                        <p className="text-xl font-bold">{Math.round(mockMetrics.reduce((sum, m) => sum + m.resolutionTime, 0) / mockMetrics.length / 60)}min</p>
                        <p className="text-xs text-muted-foreground mt-1">Target: &lt;3min</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Peak Response Time</p>
                        <p className="text-xl font-bold">{Math.max(...mockMetrics.map(m => m.responseTime))}s</p>
                        <p className="text-xs text-red-600 mt-1">Saturday 7PM</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Best Performance</p>
                        <p className="text-xl font-bold">{Math.min(...mockMetrics.map(m => m.responseTime))}s</p>
                        <p className="text-xs text-green-600 mt-1">Wednesday 2PM</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="team" className="flex-1 p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {mockTeamData.map((member) => (
                    <Card key={member.userId}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                              {member.userName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h4 className="font-medium">{member.userName}</h4>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {member.metrics.activeHours}h active
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Response Calls</p>
                            <p className="font-medium">{member.metrics.responseCalls}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Response</p>
                            <div className="flex items-center gap-1">
                              <p className="font-medium">{member.metrics.avgResponseTime}s</p>
                              {member.trends.responseTime === 'down' && <TrendingDown className="h-3 w-3 text-green-600" />}
                              {member.trends.responseTime === 'up' && <TrendingUp className="h-3 w-3 text-red-600" />}
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Resolution Rate</p>
                            <p className="font-medium">{member.metrics.resolutionRate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Satisfaction</p>
                            <div className="flex items-center gap-1">
                              <p className="font-medium">{member.metrics.satisfactionScore}/5</p>
                              {member.trends.satisfaction === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                              {member.trends.satisfaction === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="alerts" className="flex-1 p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No quality alerts</p>
                      <p className="text-xs mt-1">All metrics within acceptable ranges</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-3 rounded-lg border",
                          alert.severity === 'high' && "border-red-200 bg-red-50",
                          alert.severity === 'medium' && "border-yellow-200 bg-yellow-50",
                          alert.severity === 'low' && "border-blue-200 bg-blue-50"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={cn(
                              "h-4 w-4",
                              alert.severity === 'high' && "text-red-600",
                              alert.severity === 'medium' && "text-yellow-600",
                              alert.severity === 'low' && "text-blue-600"
                            )} />
                            <span className="font-medium text-sm">{alert.title}</span>
                            <Badge variant={
                              alert.severity === 'high' ? 'destructive' :
                              alert.severity === 'medium' ? 'warning' : 'default'
                            }>
                              {alert.severity}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Metric: {alert.metric}</span>
                          <span>Current: {alert.value}</span>
                          <span>Threshold: {alert.threshold}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}