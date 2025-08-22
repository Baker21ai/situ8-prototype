/**
 * Service Health Panel
 * Development-only component that displays real-time service health status
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { useServices } from '../../services/ServiceProvider';
import { debug } from '../../utils/debug';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  Database,
  Server,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'checking' | 'unknown';
  lastChecked: Date;
  responseTime?: number;
  error?: string;
  details?: any;
}

interface PerformanceMetrics {
  storeSize: Record<string, number>;
  memoryUsage: number;
  activeConnections: number;
  apiCalls: number;
  errorRate: number;
}

export const ServiceHealthPanel: React.FC = () => {
  // Only render in development
  if (!import.meta.env.DEV) return null;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    storeSize: {},
    memoryUsage: 0,
    activeConnections: 0,
    apiCalls: 0,
    errorRate: 0
  });
  const [lastApiError, setLastApiError] = useState<string | null>(null);
  const intervalRef = useRef<number>();
  
  const services = useServices();
  
  // Check all service health
  const checkHealth = async () => {
    setIsChecking(true);
    const healthChecks: ServiceHealth[] = [];
    
    for (const [name, service] of Object.entries(services)) {
      if (typeof service === 'object' && 
          service !== null && 
          'healthCheck' in service &&
          typeof service.healthCheck === 'function') {
        
        const startTime = performance.now();
        
        try {
          const health = await service.healthCheck();
          const responseTime = performance.now() - startTime;
          
          healthChecks.push({
            name,
            status: health.status === 'healthy' ? 'healthy' : 'unhealthy',
            lastChecked: new Date(),
            responseTime,
            details: health
          });
          
          debug.perf(`${name}.healthCheck`, responseTime);
        } catch (error) {
          const responseTime = performance.now() - startTime;
          
          healthChecks.push({
            name,
            status: 'unhealthy',
            lastChecked: new Date(),
            responseTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          debug.error(`ServiceHealth.${name}`, error as Error);
        }
      }
    }
    
    setServiceHealth(healthChecks);
    setIsChecking(false);
  };
  
  // Update performance metrics
  const updateMetrics = () => {
    // Get store sizes
    if (window.__SITU8__) {
      const storeSize = window.__SITU8__.perf.measureStoreSize();
      
      // Get memory usage
      const memory = window.__SITU8__.perf.getMemoryUsage();
      const memoryUsage = memory ? 
        Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100) : 0;
      
      setMetrics({
        storeSize,
        memoryUsage,
        activeConnections: getActiveConnections(),
        apiCalls: getApiCallCount(),
        errorRate: getErrorRate()
      });
    }
  };
  
  // Get active WebSocket connections (mock for now)
  const getActiveConnections = () => {
    // This would check actual WebSocket connections
    return Math.floor(Math.random() * 5) + 1;
  };
  
  // Get API call count from localStorage or session
  const getApiCallCount = () => {
    const stored = sessionStorage.getItem('situ8-api-calls');
    return stored ? parseInt(stored, 10) : 0;
  };
  
  // Calculate error rate
  const getErrorRate = () => {
    const errors = sessionStorage.getItem('situ8-error-count');
    const total = sessionStorage.getItem('situ8-api-calls');
    
    if (!errors || !total) return 0;
    
    const errorCount = parseInt(errors, 10);
    const totalCount = parseInt(total, 10);
    
    return totalCount > 0 ? (errorCount / totalCount) * 100 : 0;
  };
  
  // Auto-refresh health checks
  useEffect(() => {
    if (isOpen && !isMinimized) {
      checkHealth();
      updateMetrics();
      
      // Refresh every 30 seconds
      intervalRef.current = window.setInterval(() => {
        checkHealth();
        updateMetrics();
      }, 30000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, isMinimized]);
  
  // Status icon component
  const StatusIcon = ({ status }: { status: ServiceHealth['status'] }) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get overall health status
  const overallHealth = serviceHealth.length === 0 ? 'unknown' :
    serviceHealth.every(s => s.status === 'healthy') ? 'healthy' :
    serviceHealth.some(s => s.status === 'unhealthy') ? 'unhealthy' : 'checking';
  
  // Don't render if not open
  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 shadow-lg"
      >
        <Activity className="h-4 w-4 mr-2" />
        Health
      </Button>
    );
  }
  
  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-xl z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <StatusIcon status={overallHealth} />
            Service Health Monitor
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-7 w-7 p-0"
            >
              {isMinimized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="space-y-4 pb-4">
          {/* Service Status List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Services</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={checkHealth}
                disabled={isChecking}
                className="h-6 px-2"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <ScrollArea className="h-40">
              <div className="space-y-1">
                {serviceHealth.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Click refresh to check services
                  </p>
                ) : (
                  serviceHealth.map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <StatusIcon status={service.status} />
                        <span className="text-xs font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {service.responseTime && (
                          <Badge variant="outline" className="text-xs">
                            {service.responseTime.toFixed(0)}ms
                          </Badge>
                        )}
                        {service.error && (
                          <Badge variant="destructive" className="text-xs">
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* Performance Metrics */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Performance</span>
            
            {/* Memory Usage */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Memory Usage</span>
                <span>{metrics.memoryUsage}%</span>
              </div>
              <Progress value={metrics.memoryUsage} className="h-1" />
            </div>
            
            {/* Store Sizes */}
            {Object.entries(metrics.storeSize).map(([store, size]) => (
              <div key={store} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{store} store</span>
                <Badge variant="outline" className="text-xs">
                  {size} KB
                </Badge>
              </div>
            ))}
            
            {/* Connection Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                {metrics.activeConnections > 0 ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                WebSocket Connections
              </span>
              <Badge variant="outline" className="text-xs">
                {metrics.activeConnections}
              </Badge>
            </div>
            
            {/* API Stats */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                API Calls
              </span>
              <Badge variant="outline" className="text-xs">
                {metrics.apiCalls}
              </Badge>
            </div>
            
            {/* Error Rate */}
            {metrics.errorRate > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-500">Error Rate</span>
                <Badge variant="destructive" className="text-xs">
                  {metrics.errorRate.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>
          
          {/* Last Error */}
          {lastApiError && (
            <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs">
              <p className="font-medium text-red-600 dark:text-red-400">Last API Error:</p>
              <p className="text-red-500 dark:text-red-300 mt-1">{lastApiError}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};