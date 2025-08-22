/**
 * Mock Ambient.AI Alert Data Generator
 * Creates realistic alerts for development and testing
 */

import { Alert, AlertType, AlertPriority, AlertStatus } from '../alertStore';

const ALERT_TYPES: AlertType[] = [
  'weapon_detection',
  'perimeter_breach', 
  'loitering',
  'tailgating',
  'unauthorized_access',
  'crowd_gathering',
  'vehicle_alert',
  'suspicious_behavior',
  'after_hours_activity',
  'ppe_violation'
];

const LOCATIONS = [
  { siteName: 'Corporate HQ', siteId: 'site_001', zoneName: 'Main Entrance', zoneId: 'zone_001', deviceName: 'Camera_01' },
  { siteName: 'Corporate HQ', siteId: 'site_001', zoneName: 'Parking Garage', zoneId: 'zone_002', deviceName: 'Camera_02' },
  { siteName: 'Corporate HQ', siteId: 'site_001', zoneName: 'Loading Dock', zoneId: 'zone_003', deviceName: 'Camera_03' },
  { siteName: 'West Campus', siteId: 'site_002', zoneName: 'Perimeter Gate', zoneId: 'zone_004', deviceName: 'Camera_04' },
  { siteName: 'West Campus', siteId: 'site_002', zoneName: 'Server Room', zoneId: 'zone_005', deviceName: 'Camera_05' },
  { siteName: 'East Building', siteId: 'site_003', zoneName: 'Reception Area', zoneId: 'zone_006', deviceName: 'Camera_06' },
];

const PERSONNEL = ['guard_001', 'guard_002', 'guard_003', 'supervisor_001'];

const generateAlertDescription = (alertType: AlertType): { description: string; riskAssessment: string; actions: string[] } => {
  const scenarios = {
    weapon_detection: {
      description: 'Potential weapon detected in restricted area',
      riskAssessment: 'CRITICAL: Immediate security threat requiring urgent response',
      actions: ['Lock down area', 'Dispatch security team', 'Contact law enforcement', 'Evacuate nearby personnel']
    },
    perimeter_breach: {
      description: 'Unauthorized entry detected at perimeter boundary',
      riskAssessment: 'HIGH: Security perimeter compromised, potential intruder',
      actions: ['Verify breach location', 'Dispatch patrol unit', 'Review video footage', 'Check access logs']
    },
    loitering: {
      description: 'Individual detected loitering in restricted zone',
      riskAssessment: 'MEDIUM: Potential reconnaissance or security concern',
      actions: ['Monitor subject behavior', 'Approach for identification', 'Log incident details']
    },
    tailgating: {
      description: 'Unauthorized follow-through detected at access point',
      riskAssessment: 'MEDIUM: Access control bypass attempt',
      actions: ['Verify both individuals', 'Check badge access', 'Review entry protocols']
    },
    unauthorized_access: {
      description: 'Access attempt detected without proper credentials',
      riskAssessment: 'HIGH: Potential security breach or stolen credentials',
      actions: ['Deny access', 'Verify identity', 'Contact facility management', 'Update access logs']
    },
    crowd_gathering: {
      description: 'Large group assembly detected in monitored area',
      riskAssessment: 'MEDIUM: Potential disruption or safety concern',
      actions: ['Monitor group size', 'Assess intent', 'Prepare crowd control measures']
    },
    vehicle_alert: {
      description: 'Unauthorized or suspicious vehicle detected',
      riskAssessment: 'MEDIUM: Potential security or safety risk',
      actions: ['Record license plate', 'Verify authorization', 'Monitor vehicle activity']
    },
    suspicious_behavior: {
      description: 'Anomalous behavior pattern detected by AI analysis',
      riskAssessment: 'MEDIUM: Behavioral indicators suggest potential threat',
      actions: ['Continue monitoring', 'Review behavior patterns', 'Consider intervention']
    },
    after_hours_activity: {
      description: 'Activity detected outside normal operational hours',
      riskAssessment: 'MEDIUM: Unauthorized presence during restricted hours',
      actions: ['Verify authorization', 'Check work schedules', 'Contact personnel']
    },
    ppe_violation: {
      description: 'Required personal protective equipment not detected',
      riskAssessment: 'LOW: Safety protocol violation',
      actions: ['Issue safety reminder', 'Provide required PPE', 'Log violation']
    }
  };

  return scenarios[alertType] || scenarios.suspicious_behavior;
};

const generatePriorityFromType = (alertType: AlertType): AlertPriority => {
  const priorityMap: Record<AlertType, AlertPriority> = {
    weapon_detection: 'critical',
    perimeter_breach: 'high',
    unauthorized_access: 'high',
    crowd_gathering: 'medium',
    vehicle_alert: 'medium',
    suspicious_behavior: 'medium',
    after_hours_activity: 'medium',
    loitering: 'low',
    tailgating: 'low',
    ppe_violation: 'low'
  };
  return priorityMap[alertType] || 'medium';
};

const generateRandomStatus = (): AlertStatus => {
  const statuses: AlertStatus[] = ['detected', 'pending_approval', 'in_progress', 'resolved'];
  const weights = [0.4, 0.3, 0.2, 0.1]; // More likely to be newer alerts
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return statuses[i];
    }
  }
  
  return 'detected';
};

export const generateMockAlert = (index: number): Alert => {
  const alertType = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const priority = generatePriorityFromType(alertType);
  const status = generateRandomStatus();
  const scenario = generateAlertDescription(alertType);
  
  const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
  const alertId = `ambient_${Date.now()}_${index.toString().padStart(3, '0')}`;
  
  return {
    id: alertId,
    alertId,
    deviceId: location.deviceName.toLowerCase(),
    timestamp,
    alertType,
    
    detection: {
      confidence: 0.75 + Math.random() * 0.25, // 75-100% confidence
      objectType: alertType.includes('weapon') ? 'weapon' : 'person',
      subType: alertType.replace('_', ' '),
      boundingBox: {
        x: Math.floor(Math.random() * 500),
        y: Math.floor(Math.random() * 300),
        width: Math.floor(50 + Math.random() * 150),
        height: Math.floor(50 + Math.random() * 200)
      },
      tracking: {
        trackId: `track_${index}_${Math.floor(Math.random() * 1000)}`,
        duration: Math.floor(10 + Math.random() * 300), // 10-310 seconds
        isTracking: Math.random() > 0.3
      },
      personCount: alertType === 'crowd_gathering' ? Math.floor(5 + Math.random() * 20) : Math.floor(1 + Math.random() * 3)
    },
    
    location: {
      ...location,
      coordinates: {
        latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.1
      }
    },
    
    evidence: {
      imageUrl: `https://ambient-ai-demo.s3.amazonaws.com/alerts/${alertId}/image.jpg`,
      thumbnailUrl: `https://ambient-ai-demo.s3.amazonaws.com/alerts/${alertId}/thumb.jpg`,
      videoClipUrl: `https://ambient-ai-demo.s3.amazonaws.com/alerts/${alertId}/clip.mp4`,
      liveStreamUrl: `rtmp://stream.ambient.ai/live/${location.deviceName}`,
      annotatedImageUrl: `https://ambient-ai-demo.s3.amazonaws.com/alerts/${alertId}/annotated.jpg`
    },
    
    priority,
    severity: priority === 'critical' ? 10 : priority === 'high' ? 7 : priority === 'medium' ? 5 : 3,
    category: alertType.split('_')[0],
    tags: [alertType, location.zoneName.toLowerCase().replace(' ', '_'), priority],
    
    aiAnalysis: {
      description: scenario.description,
      riskAssessment: scenario.riskAssessment,
      recommendedActions: scenario.actions,
      falsePositiveRisk: Math.random() * 0.3, // 0-30% false positive risk
      contextualFactors: [
        `Time: ${new Date(timestamp).toLocaleTimeString()}`,
        `Location: ${location.zoneName}`,
        `Device: ${location.deviceName}`,
        'Weather: Clear',
        'Lighting: Adequate'
      ]
    },
    
    situ8: {
      internalAlertId: `situ8_${alertId}`,
      status,
      assignedGuard: status !== 'detected' ? PERSONNEL[Math.floor(Math.random() * PERSONNEL.length)] : undefined,
      assignedAt: status !== 'detected' ? new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString() : undefined,
      sopTriggered: priority === 'critical' || Math.random() > 0.7,
      sopActions: priority === 'critical' ? [
        { action: 'Lock down area', status: 'pending', estimatedExecutionTime: 300 },
        { action: 'Dispatch security', status: 'pending', estimatedExecutionTime: 600 }
      ] : [],
      escalationLevel: priority === 'critical' ? 3 : priority === 'high' ? 2 : 1,
      createdAt: timestamp,
      updatedAt: new Date().toISOString(),
      notes: []
    }
  };
};

export const generateMockAlerts = (count: number = 25): Alert[] => {
  return Array.from({ length: count }, (_, index) => generateMockAlert(index));
};

// Default export for easy use
export default generateMockAlerts;
