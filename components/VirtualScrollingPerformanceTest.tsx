import React, { useState, useEffect, useMemo } from 'react';
import { EnterpriseActivity } from '../lib/types/activity';
import { EnterpriseActivityManager } from './EnterpriseActivityManager';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { BarChart3, Activity, Zap, AlertTriangle } from 'lucide-react';

// Mock data generator for performance testing
const generateMockActivities = (count: number): EnterpriseActivity[] => {
  const types = ['medical', 'security-breach', 'alert', 'property-damage', 'bol-event'];
  const priorities = ['critical', 'high', 'medium', 'low'] as const;
  const statuses = ['pending', 'active', 'resolved', 'archived'] as const;
  const locations = [
    'Building A - Floor 1', 'Building A - Floor 2', 'Building B - Lobby',
    'Building B - Floor 3', 'Building C - Parking', 'Building D - Cafeteria',
    'Building E - Server Room', 'Building F - Lab 1', 'Building G - Conference'
  ];
  const names = [
    'John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'David Brown',
    'Jennifer Garcia', 'Robert Miller', 'Jessica Anderson', 'William Taylor',
    'Amanda Martinez'
  ];

  return Array.from({ length: count }, (_, index) => {
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const name = names[Math.floor(Math.random() * names.length)];

    return {
      id: `test-activity-${index}`,
      timestamp,
      type: type as any,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Alert #${index + 1}`,
      location,
      priority,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      description: `Generated test activity for performance testing. Index: ${index}`,
      confidence: Math.floor(Math.random() * 100),
      badgeHolder: {
        name,
        id: `badge-${index}`,
        department: 'Security'
      },
      cameraId: `CAM-${Math.floor(Math.random() * 50) + 1}`,
      cameraName: `Camera ${Math.floor(Math.random() * 50) + 1}`,
      // Required base activity fields
      created_at: timestamp,
      updated_at: timestamp,
      created_by: 'system',
      updated_by: 'system',
      system_tags: [`trigger:${Math.random() > 0.5 ? 'human' : 'integration'}`, `location:${location.split(' - ')[0].toLowerCase()}`],
      user_tags: [],
      incident_contexts: [],
      retention_date: new Date(timestamp.getTime() + 30 * 24 * 60 * 60 * 1000),
      is_archived: false,
      allowed_status_transitions: ['pending', 'active', 'resolved'],
      requires_approval: priority === 'critical'
    };
  });
};

interface PerformanceMetrics {
  fps: number[];
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  renderTime: number;
  memoryUsage: number;
  scrollPerformance: number;
}

export function VirtualScrollingPerformanceTest() {
  const [activityCount, setActivityCount] = useState(1000);
  const [mockActivities, setMockActivities] = useState<EnterpriseActivity[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Generate mock data
  const generateData = async (count: number) => {
    setIsGenerating(true);
    const startTime = performance.now();
    
    // Generate in chunks to avoid blocking the UI
    const chunkSize = 1000;
    const chunks = Math.ceil(count / chunkSize);
    const activities: EnterpriseActivity[] = [];
    
    for (let i = 0; i < chunks; i++) {
      const chunkStart = i * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, count);
      const chunkActivities = generateMockActivities(chunkEnd - chunkStart);
      activities.push(...chunkActivities);
      
      // Allow UI to update between chunks
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const endTime = performance.now();
    setMockActivities(activities);
    setIsGenerating(false);
    
    console.log(`Generated ${count} activities in ${endTime - startTime}ms`);
  };

  // Performance monitoring
  const startPerformanceMonitoring = () => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    const fpsHistory: number[] = [];
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        fpsHistory.push(fps);
        
        // Keep only last 60 seconds of data
        if (fpsHistory.length > 60) {
          fpsHistory.shift();
        }
        
        frameCount = 0;
        lastTime = currentTime;
        
        // Update metrics every second
        const averageFPS = fpsHistory.reduce((sum, fps) => sum + fps, 0) / fpsHistory.length;
        const minFPS = Math.min(...fpsHistory);
        const maxFPS = Math.max(...fpsHistory);
        
        const memoryUsage = (performance as any).memory?.usedJSHeapSize 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) 
          : 0;
        
        setPerformanceMetrics({
          fps: [...fpsHistory],
          averageFPS: Math.round(averageFPS),
          minFPS,
          maxFPS,
          renderTime: currentTime - lastTime,
          memoryUsage,
          scrollPerformance: Math.min(fps, 60) // Cap at 60fps for scroll performance
        });
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    // Stop monitoring after 5 minutes
    setTimeout(() => {
      cancelAnimationFrame(animationId);
      setIsMonitoring(false);
    }, 5 * 60 * 1000);
  };

  const stopPerformanceMonitoring = () => {
    setIsMonitoring(false);
    setPerformanceMetrics(null);
  };

  // Auto-generate initial data
  useEffect(() => {
    generateData(activityCount);
  }, [activityCount]);

  const performanceStatus = useMemo(() => {
    if (!performanceMetrics) return null;
    
    const { averageFPS, minFPS } = performanceMetrics;
    
    if (averageFPS >= 55 && minFPS >= 45) {
      return { status: 'excellent', color: 'green', message: 'Excellent performance - 60fps target achieved' };
    } else if (averageFPS >= 45 && minFPS >= 30) {
      return { status: 'good', color: 'yellow', message: 'Good performance - Minor frame drops' };
    } else if (averageFPS >= 30) {
      return { status: 'fair', color: 'orange', message: 'Fair performance - Noticeable frame drops' };
    } else {
      return { status: 'poor', color: 'red', message: 'Poor performance - Significant lag' };
    }
  }, [performanceMetrics]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Performance Test Header */}
      <div className="flex-shrink-0 p-4 bg-white border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold">Virtual Scrolling Performance Test</h1>
            <Badge variant="outline">
              {mockActivities.length.toLocaleString()} Activities
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setActivityCount(1000)}
              disabled={isGenerating}
              size="sm"
            >
              1K
            </Button>
            <Button
              variant="outline"
              onClick={() => setActivityCount(5000)}
              disabled={isGenerating}
              size="sm"
            >
              5K
            </Button>
            <Button
              variant="outline"
              onClick={() => setActivityCount(10000)}
              disabled={isGenerating}
              size="sm"
            >
              10K
            </Button>
            <Button
              variant="outline"
              onClick={() => setActivityCount(25000)}
              disabled={isGenerating}
              size="sm"
            >
              25K
            </Button>
            
            {isMonitoring ? (
              <Button
                variant="destructive"
                onClick={stopPerformanceMonitoring}
                size="sm"
              >
                Stop Monitoring
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={startPerformanceMonitoring}
                disabled={isGenerating || mockActivities.length === 0}
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Start Monitoring
              </Button>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        {performanceMetrics && (
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceMetrics.averageFPS}
              </div>
              <div className="text-sm text-gray-600">Avg FPS</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {performanceMetrics.minFPS}
              </div>
              <div className="text-sm text-gray-600">Min FPS</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {performanceMetrics.maxFPS}
              </div>
              <div className="text-sm text-gray-600">Max FPS</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {performanceMetrics.memoryUsage}MB
              </div>
              <div className="text-sm text-gray-600">Memory</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {performanceMetrics.scrollPerformance}
              </div>
              <div className="text-sm text-gray-600">Scroll FPS</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Math.round(performanceMetrics.renderTime)}ms
              </div>
              <div className="text-sm text-gray-600">Render</div>
            </div>
          </div>
        )}

        {/* Performance Status */}
        {performanceStatus && (
          <Alert className={`border-${performanceStatus.color}-200 bg-${performanceStatus.color}-50`}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className={`text-${performanceStatus.color}-800`}>
              {performanceStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {isGenerating && (
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Generating {activityCount.toLocaleString()} mock activities...
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Activity Manager */}
      <div className="flex-1 overflow-hidden">
        {mockActivities.length > 0 && (
          <EnterpriseActivityManager
            activities={mockActivities}
            realTimeMode={false}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}