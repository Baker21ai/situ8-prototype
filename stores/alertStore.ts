import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import SOPAutomationService, { SOPExecution } from '../services/sop-automation.service';
import { generateMockAlerts } from './mock/mockAmbientAlerts';

// Alert Types based on Ambient.AI webhooks
export type AlertType = 
  | 'weapon_detection'
  | 'perimeter_breach'
  | 'loitering'
  | 'tailgating'
  | 'unauthorized_access'
  | 'crowd_gathering'
  | 'vehicle_alert'
  | 'suspicious_behavior'
  | 'after_hours_activity'
  | 'ppe_violation';

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'detected' | 'pending_approval' | 'in_progress' | 'resolved';

export interface Alert {
  // Core Alert Identification
  id: string;
  alertId: string;
  deviceId: string;
  timestamp: string;
  alertType: AlertType;
  
  // Detection Details
  detection: {
    confidence: number;
    objectType: string;
    subType: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    tracking?: {
      trackId: string;
      duration: number;
      isTracking: boolean;
    };
    personCount?: number;
  };
  
  // Location Context
  location: {
    siteName: string;
    siteId: string;
    zoneName: string;
    zoneId: string;
    deviceName: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Visual Evidence
  evidence: {
    imageUrl?: string;
    thumbnailUrl?: string;
    videoClipUrl?: string;
    liveStreamUrl?: string;
    annotatedImageUrl?: string;
  };
  
  // Alert Priority & Classification
  priority: AlertPriority;
  severity: number;
  category: string;
  tags: string[];
  
  // AI Analysis
  aiAnalysis: {
    description: string;
    riskAssessment: string;
    recommendedActions: string[];
    falsePositiveRisk: number;
    contextualFactors: string[];
  };
  
  // Situ8 Custom Fields
  situ8: {
    internalAlertId: string;
    status: AlertStatus;
    assignedGuard?: string;
    assignedAt?: string;
    sopTriggered: boolean;
    sopActions: Array<{
      action: string;
      status: 'pending' | 'approved' | 'rejected' | 'completed';
      estimatedExecutionTime: number;
    }>;
    escalationLevel: number;
    createdAt: string;
    updatedAt: string;
    notes: Array<{
      id: string;
      author: string;
      content: string;
      timestamp: string;
    }>;
    compliance: {
      requiresDocumentation: boolean;
      retentionPeriod: string;
      reportingRequired: string[];
    };
  };
}

export interface SOPAction {
  order: number;
  action: string;
  description: string;
  timeLimit: number;
  autoExecute: boolean;
  requiredRoles?: string[];
}

export interface SOP {
  title: string;
  priority: AlertPriority;
  steps: SOPAction[];
}

interface AlertState {
  // Data
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  
  // SOP Management
  activeSOPExecutions: Map<string, SOPExecution>; // alertId -> SOPExecution
  
  // UI State
  selectedAlert: Alert | null;
  selectedSOPExecution: SOPExecution | null;
  filterStatus: AlertStatus | 'all';
  filterPriority: AlertPriority | 'all';
  collapsedPriorities: Record<string, boolean>; // column_priority -> collapsed
  
  // Actions
  addAlert: (alert: Alert) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  deleteAlert: (id: string) => void;
  setAlertStatus: (id: string, status: AlertStatus) => void;
  assignGuard: (alertId: string, guardId: string) => void;
  updateAlertAssignment: (alertId: string, assignedTo: string) => void;
  addNote: (alertId: string, note: string, author: string) => void;
  executeSOP: (alertId: string, actionIndex: number) => void;
  
  // SOP Actions
  initiateSOP: (alertId: string) => SOPExecution | null;
  updateSOPExecution: (alertId: string, execution: SOPExecution) => void;
  setSelectedSOPExecution: (execution: SOPExecution | null) => void;
  
  // Filters
  setFilterStatus: (status: AlertStatus | 'all') => void;
  setFilterPriority: (priority: AlertPriority | 'all') => void;
  
  // UI Actions
  setSelectedAlert: (alert: Alert | null) => void;
  togglePriorityCollapse: (column: string, priority: AlertPriority) => void;
  
  // Getters
  getAlertsByStatus: (status: AlertStatus) => Alert[];
  getAlertsByPriority: (priority: AlertPriority) => Alert[];
  getFilteredAlerts: () => Alert[];
  getCriticalAlerts: () => Alert[];
  
  // Real-time updates
  subscribeToAlerts: () => void;
  unsubscribeFromAlerts: () => void;
}

// Mock data for development
const generateMockAlert = (override: Partial<Alert> = {}): Alert => {
  const baseId = Date.now() + Math.random();
  const alertTypes: AlertType[] = ['weapon_detection', 'perimeter_breach', 'loitering', 'unauthorized_access'];
  const priorities: AlertPriority[] = ['critical', 'high', 'medium', 'low'];
  const statuses: AlertStatus[] = ['detected', 'pending_approval', 'in_progress', 'resolved'];
  
  return {
    id: `alert_${baseId}`,
    alertId: `ambient_alert_${Date.now()}_001`,
    deviceId: `ambient_device_${Math.floor(Math.random() * 10) + 1}`,
    timestamp: new Date().toISOString(),
    alertType: alertTypes[Math.floor(Math.random() * alertTypes.length)],
    
    detection: {
      confidence: 0.8 + Math.random() * 0.2,
      objectType: 'person',
      subType: 'unauthorized_entry',
      tracking: {
        trackId: `track_${baseId}`,
        duration: Math.random() * 300,
        isTracking: true
      }
    },
    
    location: {
      siteName: 'Situ8 Corporate Campus',
      siteId: 'situ8_hq_001',
      zoneName: ['Main Entrance', 'Parking Lot B', 'Server Room', 'North Gate'][Math.floor(Math.random() * 4)],
      zoneId: `zone_${Math.floor(Math.random() * 10)}`,
      deviceName: 'Security Camera'
    },
    
    evidence: {
      thumbnailUrl: `https://picsum.photos/300/200?random=${baseId}`,
      imageUrl: `https://picsum.photos/800/600?random=${baseId}`,
      liveStreamUrl: 'rtsp://example.com/stream'
    },
    
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    severity: Math.floor(Math.random() * 10) + 1,
    category: 'security_threat',
    tags: ['ambient_ai', 'automated'],
    
    aiAnalysis: {
      description: 'Automated security alert detected by Ambient.AI system',
      riskAssessment: 'MEDIUM',
      recommendedActions: ['guard_dispatch', 'area_monitoring'],
      falsePositiveRisk: Math.random() * 0.3,
      contextualFactors: ['business_hours', 'high_traffic_area']
    },
    
    situ8: {
      internalAlertId: `SITU8_${Date.now()}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      assignedGuard: Math.random() > 0.5 ? 'guard_martinez_001' : undefined,
      sopTriggered: true,
      sopActions: [
        {
          action: 'assess_threat',
          status: 'completed',
          estimatedExecutionTime: 30
        },
        {
          action: 'dispatch_guard',
          status: 'pending',
          estimatedExecutionTime: 120
        }
      ],
      escalationLevel: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
      compliance: {
        requiresDocumentation: true,
        retentionPeriod: '7_years',
        reportingRequired: ['security_incident']
      }
    },
    
    ...override
  };
};

export const useAlertStore = create<AlertState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    alerts: [
      // Critical alerts
      generateMockAlert({
        priority: 'critical',
        alertType: 'weapon_detection',
        situ8: { 
          ...generateMockAlert().situ8,
          status: 'detected',
          assignedGuard: undefined
        },
        location: { ...generateMockAlert().location, zoneName: 'Main Entrance' }
      }),
      generateMockAlert({
        priority: 'critical',
        alertType: 'perimeter_breach',
        situ8: { 
          ...generateMockAlert().situ8,
          status: 'pending_approval',
          assignedGuard: 'guard_martinez_001'
        },
        location: { ...generateMockAlert().location, zoneName: 'North Gate' }
      }),
      
      // High priority alerts
      generateMockAlert({
        priority: 'high',
        alertType: 'unauthorized_access',
        situ8: { 
          ...generateMockAlert().situ8,
          status: 'detected'
        },
        location: { ...generateMockAlert().location, zoneName: 'Server Room' }
      }),
      generateMockAlert({
        priority: 'high',
        alertType: 'crowd_gathering',
        situ8: { 
          ...generateMockAlert().situ8,
          status: 'in_progress',
          assignedGuard: 'guard_johnson_002'
        },
        location: { ...generateMockAlert().location, zoneName: 'Cafeteria' }
      }),
      
      // Resolved alert
      generateMockAlert({
        priority: 'critical',
        alertType: 'weapon_detection',
        situ8: { 
          ...generateMockAlert().situ8,
          status: 'resolved',
          assignedGuard: 'guard_davis_003'
        },
        location: { ...generateMockAlert().location, zoneName: 'Loading Dock' },
        aiAnalysis: {
          ...generateMockAlert().aiAnalysis,
          description: 'False alarm - maintenance tool mistaken for weapon'
        }
      })
    ],
    loading: false,
    error: null,
    activeSOPExecutions: new Map(),
    selectedAlert: null,
    selectedSOPExecution: null,
    filterStatus: 'all',
    filterPriority: 'all',
    collapsedPriorities: {
      'detected_medium': true,
      'detected_low': true,
      'pending_medium': true,
      'pending_low': true,
      'progress_medium': true,
      'progress_low': true,
      'resolved_medium': true,
      'resolved_low': true
    },
    
    // Actions
    addAlert: (alert) => set((state) => ({
      alerts: [alert, ...state.alerts]
    })),
    
    updateAlert: (id, updates) => set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.id === id ? { ...alert, ...updates } : alert
      )
    })),
    
    deleteAlert: (id) => set((state) => ({
      alerts: state.alerts.filter(alert => alert.id !== id)
    })),
    
    setAlertStatus: (id, status) => set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.id === id 
          ? { 
              ...alert, 
              situ8: { 
                ...alert.situ8, 
                status,
                updatedAt: new Date().toISOString()
              }
            }
          : alert
      )
    })),
    
    assignGuard: (alertId, guardId) => set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              situ8: {
                ...alert.situ8,
                assignedGuard: guardId,
                assignedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            }
          : alert
      )
    })),
    
    updateAlertAssignment: (alertId, assignedTo) => set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.id === alertId || alert.alertId === alertId
          ? {
              ...alert,
              situ8: {
                ...alert.situ8,
                assignedGuard: assignedTo,
                assignedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'pending_approval' as AlertStatus
              }
            }
          : alert
      )
    })),
    
    addNote: (alertId, content, author) => set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              situ8: {
                ...alert.situ8,
                notes: [
                  ...alert.situ8.notes,
                  {
                    id: `note_${Date.now()}`,
                    author,
                    content,
                    timestamp: new Date().toISOString()
                  }
                ],
                updatedAt: new Date().toISOString()
              }
            }
          : alert
      )
    })),
    
    executeSOP: (alertId, actionIndex) => set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              situ8: {
                ...alert.situ8,
                sopActions: alert.situ8.sopActions.map((action, index) =>
                  index === actionIndex
                    ? { ...action, status: 'completed' as const }
                    : action
                ),
                updatedAt: new Date().toISOString()
              }
            }
          : alert
      )
    })),
    
    // SOP Actions
    initiateSOP: (alertId) => {
      const { alerts } = get();
      const alert = alerts.find(a => a.id === alertId);
      if (!alert) return null;

      const sopService = SOPAutomationService.getInstance();
      const execution = sopService.initiateSOPExecution(alert);
      
      if (execution) {
        set((state) => ({
          activeSOPExecutions: new Map(state.activeSOPExecutions).set(alertId, execution)
        }));
      }
      
      return execution;
    },

    updateSOPExecution: (alertId, execution) => set((state) => ({
      activeSOPExecutions: new Map(state.activeSOPExecutions).set(alertId, execution)
    })),

    setSelectedSOPExecution: (execution) => set({ selectedSOPExecution: execution }),
    
    // Filters
    setFilterStatus: (status) => set({ filterStatus: status }),
    setFilterPriority: (priority) => set({ filterPriority: priority }),
    
    // UI Actions
    setSelectedAlert: (alert) => set({ selectedAlert: alert }),
    
    togglePriorityCollapse: (column, priority) => set((state) => {
      const key = `${column}_${priority}`;
      return {
        collapsedPriorities: {
          ...state.collapsedPriorities,
          [key]: !state.collapsedPriorities[key]
        }
      };
    }),
    
    // Getters
    getAlertsByStatus: (status) => {
      const { alerts } = get();
      return alerts.filter(alert => alert.situ8.status === status);
    },
    
    getAlertsByPriority: (priority) => {
      const { alerts } = get();
      return alerts.filter(alert => alert.priority === priority);
    },
    
    getFilteredAlerts: () => {
      const { alerts, filterStatus, filterPriority } = get();
      return alerts.filter(alert => {
        const statusMatch = filterStatus === 'all' || alert.situ8.status === filterStatus;
        const priorityMatch = filterPriority === 'all' || alert.priority === filterPriority;
        return statusMatch && priorityMatch;
      });
    },
    
    getCriticalAlerts: () => {
      const { alerts } = get();
      return alerts.filter(alert => alert.priority === 'critical');
    },
    
    // Real-time subscriptions
    subscribeToAlerts: () => {
      const { addAlert } = get();
      
      // Import webhook service dynamically to avoid circular dependencies
      import('../services/ambient-webhook.service').then(({ AmbientWebhookService }) => {
        const webhookService = AmbientWebhookService.getInstance();
        
        // Start listening for Ambient.AI webhooks
        webhookService.startWebhookListener((alert: Alert) => {
          console.log('New Ambient.AI alert received:', alert);
          addAlert(alert);
          
          // Show browser notification for critical alerts
          if (alert.priority === 'critical' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification(`🚨 Critical Alert: ${alert.alertType.replace('_', ' ')}`, {
                body: `Location: ${alert.location.zoneName} | Confidence: ${Math.round(alert.detection.confidence * 100)}%`,
                icon: '/favicon.ico',
                requireInteraction: true
              });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification(`🚨 Critical Alert: ${alert.alertType.replace('_', ' ')}`, {
                    body: `Location: ${alert.location.zoneName} | Confidence: ${Math.round(alert.detection.confidence * 100)}%`,
                    icon: '/favicon.ico',
                    requireInteraction: true
                  });
                }
              });
            }
          }
        });
        
        console.log('Subscribed to real-time Ambient.AI alerts');
      });
    },
    
    unsubscribeFromAlerts: () => {
      import('../services/ambient-webhook.service').then(({ AmbientWebhookService }) => {
        const webhookService = AmbientWebhookService.getInstance();
        webhookService.stopWebhookListener();
        console.log('Unsubscribed from real-time alerts');
      });
    }
  }))
);

// Helper functions
export const getPriorityColor = (priority: AlertPriority): string => {
  switch (priority) {
    case 'critical': return 'text-red-600 border-red-600 bg-red-50';
    case 'high': return 'text-yellow-600 border-yellow-600 bg-yellow-50';
    case 'medium': return 'text-blue-600 border-blue-600 bg-blue-50';
    case 'low': return 'text-gray-600 border-gray-600 bg-gray-50';
  }
};

export const getStatusColor = (status: AlertStatus): string => {
  switch (status) {
    case 'detected': return 'bg-blue-500';
    case 'pending_approval': return 'bg-yellow-500';
    case 'in_progress': return 'bg-orange-500';
    case 'resolved': return 'bg-green-500';
  }
};

export const getAlertTypeIcon = (type: AlertType): string => {
  switch (type) {
    case 'weapon_detection': return '🔫';
    case 'perimeter_breach': return '🚧';
    case 'loitering': return '⏰';
    case 'tailgating': return '👥';
    case 'unauthorized_access': return '🚫';
    case 'crowd_gathering': return '👨‍👩‍👧‍👦';
    case 'vehicle_alert': return '🚗';
    case 'suspicious_behavior': return '👁️';
    case 'after_hours_activity': return '🌙';
    case 'ppe_violation': return '🦺';
    default: return '⚠️';
  }
};