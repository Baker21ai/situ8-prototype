import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Zap,
  Eye,
  MessageSquare,
  Shield,
  Database,
  Cpu,
  BarChart3,
  RefreshCw,
  Settings,
  FileText,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AIEvent {
  id: string;
  timestamp: string;
  type: 'transcription' | 'intent' | 'automation' | 'pii' | 'entity';
  source: string;
  confidence: number;
  input: string;
  output: any;
  processingTime: number;
  status: 'success' | 'failed' | 'pending';
  metadata?: Record<string, any>;
}

interface AIMetrics {
  totalProcessed: number;
  successRate: number;
  avgProcessingTime: number;
  avgConfidence: number;
  activeModels: number;
  queueDepth: number;
  errorRate: number;
  costToday: number;
}

interface AIModel {
  id: string;
  name: string;
  type: 'transcription' | 'nlp' | 'intent' | 'pii';
  status: 'active' | 'idle' | 'error' | 'loading';
  usage: {
    requests: number;
    tokens: number;
    cost: number;
  };
  performance: {
    latency: number;
    accuracy: number;
    errorRate: number;
  };
}

interface AIMonitorProps {
  events?: AIEvent[];
  metrics?: AIMetrics;
  models?: AIModel[];
  onRefresh?: () => void;
  onConfigureModel?: (modelId: string) => void;
}

export function AIMonitor({
  events = [],
  metrics = {
    totalProcessed: 1247,
    successRate: 0.94,
    avgProcessingTime: 450,
    avgConfidence: 0.87,
    activeModels: 4,
    queueDepth: 12,
    errorRate: 0.06,
    costToday: 24.50
  },
  models = [],
  onRefresh,
  onConfigureModel
}: AIMonitorProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Mock chart data
  const performanceData = [
    { time: '00:00', requests: 45, latency: 320, accuracy: 92 },
    { time: '01:00', requests: 38, latency: 280, accuracy: 94 },
    { time: '02:00', requests: 52, latency: 350, accuracy: 91 },
    { time: '03:00', requests: 61, latency: 410, accuracy: 89 },
    { time: '04:00', requests: 48, latency: 300, accuracy: 93 },
    { time: '05:00', requests: 55, latency: 340, accuracy: 92 },
  ];

  const costData = [
    { model: 'Transcribe', cost: 8.20, requests: 423 },
    { model: 'Bedrock Claude', cost: 12.30, requests: 156 },
    { model: 'Comprehend', cost: 3.50, requests: 234 },
    { model: 'Textract', cost: 0.50, requests: 12 },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'transcription': return MessageSquare;
      case 'intent': return Brain;
      case 'automation': return Zap;
      case 'pii': return Shield;
      case 'entity': return Eye;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processed Today</p>
                <p className="text-2xl font-bold">{metrics.totalProcessed.toLocaleString()}</p>
                <p className="text-xs text-green-600">+12% from yesterday</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{(metrics.successRate * 100).toFixed(1)}%</p>
                <Progress value={metrics.successRate * 100} className="h-1 mt-1" />
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold">{metrics.avgProcessingTime}ms</p>
                <p className="text-xs text-yellow-600">Target: &lt;500ms</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost Today</p>
                <p className="text-2xl font-bold">${metrics.costToday.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Budget: $50/day</p>
              </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Processing Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="h-8 px-2 text-sm border rounded"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
              <Button size="sm" variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="flex-1 px-4">
              <div className="space-y-4">
                {/* Performance Chart */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Request Volume & Latency</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="requests" 
                          stroke="#3b82f6" 
                          name="Requests"
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="latency" 
                          stroke="#f59e0b" 
                          name="Latency (ms)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Cost by Model</h3>
                  <div className="space-y-2">
                    {costData.map((item) => (
                      <div key={item.model} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.model}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.requests} requests
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">${item.cost.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Queue Status */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Queue Depth</p>
                          <p className="text-lg font-bold">{metrics.queueDepth}</p>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Active Models</p>
                          <p className="text-lg font-bold">{metrics.activeModels}</p>
                        </div>
                        <Brain className="h-4 w-4 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Error Rate</p>
                          <p className="text-lg font-bold">{(metrics.errorRate * 100).toFixed(1)}%</p>
                        </div>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="events" className="flex-1 p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {events.map((event) => {
                    const Icon = getEventIcon(event.type);
                    
                    return (
                      <div
                        key={event.id}
                        className="p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium capitalize">
                              {event.type}
                            </span>
                            <Badge 
                              variant={event.status === 'success' ? 'success' : 'destructive'}
                              className="text-xs"
                            >
                              {event.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(event.confidence * 100)}% conf
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1">
                          {event.input.substring(0, 100)}...
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Source: {event.source}</span>
                          <span>{event.processingTime}ms</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="models" className="flex-1 p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {models.map((model) => (
                    <Card key={model.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium">{model.name}</h4>
                              <p className="text-xs text-muted-foreground capitalize">
                                {model.type} Model
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              model.status === 'active' ? 'success' :
                              model.status === 'error' ? 'destructive' :
                              model.status === 'loading' ? 'warning' : 'secondary'
                            }>
                              {model.status}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onConfigureModel?.(model.id)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Requests</p>
                            <p className="font-medium">{model.usage.requests.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Latency</p>
                            <p className="font-medium">{model.performance.latency}ms</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cost</p>
                            <p className="font-medium">${model.usage.cost.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Accuracy</span>
                            <span>{model.performance.accuracy}%</span>
                          </div>
                          <Progress value={model.performance.accuracy} className="h-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="analytics" className="flex-1 p-4">
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Advanced analytics coming soon</p>
                <p className="text-xs mt-1">
                  Detailed insights and ML performance metrics
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}