import { ActivityData } from '@/lib/types/activity';

// Enhanced mock activity data for testing all card variants
export const mockActivities: ActivityData[] = [
  {
    id: 'INC-TAILGATE-001',
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    type: 'alert',
    title: 'Tailgating Detected',
    location: 'Main Entrance Door A',
    zone: 'Main Entrance Door A',
    building: 'Building A',
    priority: 'critical',
    status: 'assigned',
    confidence: 95,
    description: '2 people detected entering together, only 1 badge scan recorded',
    detectedObjects: ['2 people detected', '1 badge scan'],
    badgeHolder: {
      name: 'Phil Anderson',
      id: '12345',
      department: 'IT'
    },
    assignedTo: 'Rodriguez',
    respondingUnits: ['1-Alpha', '2-Charlie'],
    gifUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=150',
    cameraId: 'CAM-ENTRANCE-A01',
    isBoloActive: true,
    isNewActivity: true,
    relativeTime: '2m ago',
    evidenceNumber: 3,
    caseRelevance: 'Shows suspect entry method',
    caseTimeOffset: '2 min before main event'
  },
  
  {
    id: 'INC-BREACH-002',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    type: 'security-breach',
    title: 'Unauthorized Door Access',
    location: 'Server Room B - Floor 2',
    zone: 'Server Room B',
    building: 'Building B',
    priority: 'high',
    status: 'responding',
    confidence: 87,
    description: 'Door opened without valid badge access during non-business hours',
    detectedObjects: ['Door breach', 'No badge detected'],
    assignedTo: 'Chen, L.',
    respondingUnits: ['1-Bravo'],
    gifUrl: 'https://images.unsplash.com/photo-1558618666-4c4c8de1a94a?w=400&h=300',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-4c4c8de1a94a?w=200&h=150',
    cameraId: 'CAM-SERVERROOM-B01',
    isBoloActive: false,
    isNewActivity: false,
    relativeTime: '15m ago',
    evidenceNumber: 1,
    caseRelevance: 'Initial breach point identification',
    caseTimeOffset: '15 min before incident escalation'
  },

  {
    id: 'INC-MEDICAL-003',
    timestamp: new Date(Date.now() - 23 * 60 * 1000), // 23 minutes ago
    type: 'medical',
    title: 'Medical Emergency Response',
    location: 'Building C - Floor 1 - Lobby',
    zone: 'Building C Lobby',
    building: 'Building C',
    priority: 'high',
    status: 'resolved',
    description: 'Employee collapse, EMS responded and transported to hospital',
    badgeHolder: {
      name: 'Sarah Johnson',
      id: '67890',
      department: 'HR'
    },
    assignedTo: 'Davis, K.',
    respondingUnits: ['1-Charlie', 'EMS-Unit-7'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=200&h=150',
    cameraId: 'CAM-LOBBY-C01',
    isBoloActive: false,
    isNewActivity: false,
    relativeTime: '23m ago',
    evidenceNumber: 2,
    caseRelevance: 'Medical incident documentation',
    caseTimeOffset: 'Concurrent with security response'
  },

  {
    id: 'INC-PATROL-004',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    type: 'patrol',
    title: 'Routine Security Round',
    location: 'Building A - Parking Garage',
    zone: 'Parking Level B1',
    building: 'Building A',
    priority: 'low',
    status: 'resolved',
    description: 'Completed standard perimeter check, no anomalies detected',
    assignedTo: 'Martinez, A.',
    respondingUnits: ['Patrol-1'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150',
    cameraId: 'CAM-PARKING-A01',
    isBoloActive: false,
    isNewActivity: false,
    relativeTime: '45m ago'
  },

  {
    id: 'INC-ACCESS-005',
    timestamp: new Date(Date.now() - 52 * 60 * 1000), // 52 minutes ago
    type: 'alert',
    title: 'Badge Reader Malfunction',
    location: 'Building A - Main Entrance',
    zone: 'Main Entrance',
    building: 'Building A',
    priority: 'medium',
    status: 'responding',
    confidence: 92,
    description: 'Multiple badge read failures reported by employees',
    detectedObjects: ['Badge reader error', '5 failed attempts'],
    assignedTo: 'Wilson, R.',
    respondingUnits: ['Maintenance-1'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=150',
    cameraId: 'CAM-ENTRANCE-MAIN',
    isBoloActive: false,
    isNewActivity: false,
    relativeTime: '52m ago',
    evidenceNumber: 4,
    caseRelevance: 'System vulnerability documentation',
    caseTimeOffset: '1 hour before main incident'
  },

  {
    id: 'INC-FIRE-006',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
    type: 'alert',
    title: 'Smoke Detection Alert',
    location: 'Building B - Kitchen Area',
    zone: 'Kitchen',
    building: 'Building B',
    priority: 'critical',
    status: 'resolved',
    confidence: 98,
    description: 'Smoke detector triggered, false alarm from cooking activities',
    detectedObjects: ['Smoke detected', 'Heat signature elevated'],
    assignedTo: 'Thompson, J.',
    respondingUnits: ['Fire-Response-1', '1-Delta'],
    gifUrl: 'https://images.unsplash.com/photo-1574270168050-38a7e7b8c00e?w=400&h=300',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574270168050-38a7e7b8c00e?w=200&h=150',
    cameraId: 'CAM-KITCHEN-B01',
    isBoloActive: false,
    isNewActivity: false,
    relativeTime: '1h 30m ago'
  },

  {
    id: 'INC-ARMED-007',
    timestamp: new Date(Date.now() - 2.2 * 60 * 60 * 1000), // 2.2 hours ago
    type: 'bol-event',
    title: 'Weapon Detection Alert',
    location: 'Building A - Security Checkpoint',
    zone: 'Security Checkpoint',
    building: 'Building A',
    priority: 'critical',
    status: 'resolved',
    confidence: 89,
    description: 'Metal detector alert, security guard firearm properly identified',
    detectedObjects: ['Metal object detected', 'Security personnel verified'],
    badgeHolder: {
      name: 'Officer Blake',
      id: 'SEC-001',
      department: 'Security'
    },
    assignedTo: 'Supervisor Garcia',
    respondingUnits: ['Security-Team-1'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=150',
    cameraId: 'CAM-CHECKPOINT-A01',
    isBoloActive: false,
    isNewActivity: false,
    relativeTime: '2h 12m ago',
    evidenceNumber: 5,
    caseRelevance: 'Security protocol verification',
    caseTimeOffset: '2 hours prior to shift change'
  },

  {
    id: 'INC-BREACH-008',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    type: 'security-breach',
    title: 'Perimeter Fence Alert',
    location: 'North Perimeter - Section 7',
    zone: 'North Perimeter',
    building: 'Perimeter',
    priority: 'medium',
    status: 'resolved',
    confidence: 76,
    description: 'Motion detected near perimeter fence, identified as wildlife',
    detectedObjects: ['Motion detected', 'Animal movement pattern'],
    assignedTo: 'Park, J.',
    respondingUnits: ['Perimeter-1'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1585314062604-1a357de8b000?w=200&h=150',
    cameraId: 'CAM-PERIMETER-N07',
    isBoloActive: false,
    isNewActivity: false,
    relativeTime: '3h ago'
  }
];

// Helper functions for working with activity data
export const getActivitiesByPriority = (activities: ActivityData[]) => {
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  return activities.sort((a, b) => {
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
    if (aPriority !== bPriority) return bPriority - aPriority;
    
    // Safe timestamp comparison
    if (a.timestamp && b.timestamp) {
      return b.timestamp.getTime() - a.timestamp.getTime();
    }
    return 0;
  });
};

export const getActivitiesByTime = (activities: ActivityData[]) => {
  return activities.sort((a, b) => {
    if (a.timestamp && b.timestamp) {
      return b.timestamp.getTime() - a.timestamp.getTime();
    }
    return 0;
  });
};

export const getActivitiesByStatus = (activities: ActivityData[], status?: string) => {
  if (!status) return activities;
  return activities.filter(activity => activity.status === status);
};

export const getActivitiesByType = (activities: ActivityData[], type?: string) => {
  if (!type) return activities;
  return activities.filter(activity => activity.type === type);
};

export const getCriticalActivities = (activities: ActivityData[]) => {
  return activities.filter(activity => 
    activity.priority === 'critical' && 
    (activity.status === 'detecting' || activity.status === 'assigned')
  );
};

export const getNewActivities = (activities: ActivityData[]) => {
  return activities.filter(activity => activity.isNewActivity);
};

export const getBoloActivities = (activities: ActivityData[]) => {
  return activities.filter(activity => activity.isBoloActive);
};

export default mockActivities;