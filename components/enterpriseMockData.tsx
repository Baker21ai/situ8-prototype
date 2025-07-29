import { EnterpriseActivity } from '../lib/types/activity';
import { ENTERPRISE_SITES, Site as _Site, getSiteById } from './sitesMockData';

// Get all buildings from all sites
const ALL_BUILDINGS = ENTERPRISE_SITES.flatMap(site => site.buildings);

// Building types mapped from site data
const _BUILDING_TYPES = [
  'Main Warehouse', 'Fulfillment Center', 'Sort Center', 'Distribution Center',
  'Admin Tower', 'Admin Building', 'Admin Office', 'Admin Complex',
  'Security Building', 'Security Center', 'Security HQ', 'Security Command',
  'Maintenance Facility', 'Maintenance Shop', 'Maintenance Hangar',
  'Parking Structure', 'Employee Parking', 'Fleet Parking', 'Vehicle Bay',
  'Loading Dock', 'Truck Loading', 'Outbound Dock', 'Shipping Dock',
  'Returns Processing', 'Quality Control', 'Robotics Center', 'Technology Hub',
  'Employee Center', 'Employee Services', 'Break Room', 'Conference Center',
  'Air Cargo Terminal', 'Rail Terminal', 'Intermodal Terminal', 'Cross-dock Facility',
  'Cold Storage', 'Climate-controlled Storage', 'Hurricane-proof Storage',
  'International Hub', 'International Processing', 'Import Processing',
  'Pick Tower', 'Pack Floor', 'Sort Area', 'Conveyor Systems',
  'Data Center', 'IT Equipment Room', 'Electrical Room', 'HVAC Equipment Room'
];

const ZONES_PER_BUILDING = [
  'Main Entrance', 'Secondary Entrance', 'Emergency Exit A', 'Emergency Exit B',
  'Loading Bay 1', 'Loading Bay 2', 'Loading Bay 3', 'Loading Bay 4',
  'Sort Area Alpha', 'Sort Area Beta', 'Sort Area Gamma', 'Sort Area Delta',
  'Pick Floor 1', 'Pick Floor 2', 'Pick Floor 3', 'Pick Floor 4',
  'Pack Floor 1', 'Pack Floor 2', 'Mezzanine Level', 'Supervisor Office',
  'Break Room A', 'Break Room B', 'Restroom Complex A', 'Restroom Complex B',
  'Receiving Area', 'Outbound Area', 'Returns Processing', 'Quality Control',
  'IT Equipment Room', 'Electrical Room', 'HVAC Equipment Room', 'Security Office'
];

const CAMERA_TYPES = [
  'Fixed Dome', 'PTZ', 'Fixed Bullet', 'Panoramic', 'Thermal', 'LPR', 'Fisheye', 'Body Worn'
];

const DEPARTMENTS = [
  'Warehouse Operations', 'Transportation', 'Security', 'Maintenance', 'IT',
  'Human Resources', 'Safety', 'Quality Assurance', 'Management', 'Facilities'
];

const EMPLOYEE_CLEARANCE_LEVELS = [
  'Basic', 'Standard', 'Elevated', 'High', 'Executive'
];

// Generate realistic employee data
const generateEmployee = () => {
  const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna',
    'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Kenneth', 'Michelle'
  ];
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const employeeId = `EMP${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

  return {
    name: `${firstName} ${lastName}`,
    id: employeeId,
    department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
    clearanceLevel: EMPLOYEE_CLEARANCE_LEVELS[Math.floor(Math.random() * EMPLOYEE_CLEARANCE_LEVELS.length)]
  };
};

// Generate realistic location with site data
const generateLocation = () => {
  // Select a random site
  const site = ENTERPRISE_SITES[Math.floor(Math.random() * ENTERPRISE_SITES.length)];
  
  // Select a building from that site
  const building = site.buildings[Math.floor(Math.random() * site.buildings.length)];
  
  // Generate zone, floor, and sector
  const zone = ZONES_PER_BUILDING[Math.floor(Math.random() * ZONES_PER_BUILDING.length)];
  const floor = Math.random() > 0.3 ? `Floor ${Math.floor(Math.random() * 4) + 1}` : 'Ground Level';
  const sector = `Sector ${String.fromCharCode(65 + Math.floor(Math.random() * 8))}`;
  
  return {
    full: `${site.name} - ${building} - ${floor} - ${zone} - ${sector}`,
    site: site,
    building,
    zone,
    floor,
    sector
  };
};

// Generate realistic camera data
const generateCamera = (location: any) => {
  const cameraType = CAMERA_TYPES[Math.floor(Math.random() * CAMERA_TYPES.length)];
  const cameraNumber = Math.floor(Math.random() * 999) + 1;
  const cameraId = `CAM-${location.building.replace(/\s+/g, '').substring(0, 3).toUpperCase()}-${cameraNumber.toString().padStart(3, '0')}`;
  const cameraName = `${cameraType} ${cameraNumber} (${location.zone})`;
  
  return { cameraId, cameraName };
};

// Activity type probabilities (realistic for enterprise facility)
const ACTIVITY_TYPE_PROBABILITIES = {
  'ACCESS_DENIED': 0.25,      // Most common - badge issues, expired access
  'PATROL': 0.20,             // Regular security patrols
  'TAILGATE': 0.15,           // Common security concern
  'SUSPICIOUS_BEHAVIOR': 0.12, // AI-detected unusual patterns
  'EQUIPMENT_FAULT': 0.10,     // Equipment malfunctions
  'BREACH': 0.08,             // Unauthorized access attempts
  'MEDICAL': 0.04,            // Medical emergencies
  'FIRE': 0.03,               // Fire/smoke detection
  'CROWD_DETECTION': 0.02,    // Crowding in areas
  'ARMED_PERSON': 0.01        // Extremely rare but critical
};

// Priority distribution (realistic)
const PRIORITY_PROBABILITIES = {
  'low': 0.50,
  'medium': 0.30,
  'high': 0.15,
  'critical': 0.05
};

// Status distribution
const STATUS_PROBABILITIES = {
  'new': 0.20,
  'active': 0.15,
  'assigned': 0.25,
  'investigating': 0.20,
  'resolved': 0.18,
  'archived': 0.02
};

// Business impact probabilities
const BUSINESS_IMPACT_PROBABILITIES = {
  'none': 0.40,
  'low': 0.30,
  'medium': 0.20,
  'high': 0.08,
  'critical': 0.02
};

// Generate realistic activity based on type
const generateActivityByType = (type: string, timestamp: Date): Partial<EnterpriseActivity> => {
  const location = generateLocation();
  const _camera = generateCamera(location);
  
  switch (type) {
    case 'TAILGATE':
      return {
        title: 'Tailgating Detected',
        description: 'Individual followed authorized person through access point without badge scan',
        confidence: 85 + Math.random() * 15,
        detectedObjects: ['2 people detected', '1 badge scan recorded'],
        badgeHolder: generateEmployee(),
        aiProcessingTime: 150 + Math.random() * 100,
        confidenceScore: 0.85 + Math.random() * 0.15,
        falsePositiveLikelihood: Math.random() * 0.3
      };
      
    case 'ACCESS_DENIED':
      return {
        title: 'Badge Access Denied',
        description: 'Employee badge access denied - possible expired credentials or restricted area',
        confidence: 95 + Math.random() * 5,
        detectedObjects: ['Badge scan attempt', 'Access denied'],
        badgeHolder: generateEmployee(),
        aiProcessingTime: 50 + Math.random() * 50,
        confidenceScore: 0.95 + Math.random() * 0.05
      };
      
    case 'SUSPICIOUS_BEHAVIOR':
      return {
        title: 'Unusual Behavior Pattern Detected',
        description: 'AI detected behavior pattern deviating from normal operational activities',
        confidence: 70 + Math.random() * 20,
        detectedObjects: ['Person loitering', 'Unusual movement pattern'],
        aiProcessingTime: 300 + Math.random() * 200,
        confidenceScore: 0.70 + Math.random() * 0.20,
        falsePositiveLikelihood: Math.random() * 0.5
      };
      
    case 'EQUIPMENT_FAULT':
      return {
        title: 'Equipment Malfunction Detected',
        description: 'Automated system detected equipment operating outside normal parameters',
        confidence: 90 + Math.random() * 10,
        detectedObjects: ['Equipment anomaly', 'System alert'],
        aiProcessingTime: 100 + Math.random() * 100,
        confidenceScore: 0.90 + Math.random() * 0.10
      };
      
    case 'MEDICAL':
      return {
        title: 'Medical Emergency Detected',
        description: 'Person down or medical distress situation identified',
        confidence: 80 + Math.random() * 15,
        detectedObjects: ['Person down', 'Medical assistance needed'],
        badgeHolder: Math.random() > 0.3 ? generateEmployee() : undefined,
        aiProcessingTime: 200 + Math.random() * 150,
        confidenceScore: 0.80 + Math.random() * 0.15,
        isMassCasualty: Math.random() < 0.05 // 5% chance of mass casualty event
      };
      
    case 'FIRE':
      return {
        title: 'Fire/Smoke Detection Alert',
        description: 'Smoke or fire detected by environmental monitoring systems',
        confidence: 95 + Math.random() * 5,
        detectedObjects: ['Smoke detected', 'Temperature anomaly'],
        aiProcessingTime: 100 + Math.random() * 50,
        confidenceScore: 0.95 + Math.random() * 0.05,
        externalAgencies: ['Fire Department', 'Emergency Services']
      };
      
    case 'ARMED_PERSON':
      return {
        title: 'Weapon Detection Alert',
        description: 'Potential weapon detected through AI analysis',
        confidence: 75 + Math.random() * 20,
        detectedObjects: ['Potential weapon', 'Person of interest'],
        aiProcessingTime: 400 + Math.random() * 200,
        confidenceScore: 0.75 + Math.random() * 0.20,
        isSecurityThreat: true,
        externalAgencies: ['Law Enforcement'],
        escalationLevel: 3
      };
      
    case 'BREACH':
      return {
        title: 'Security Breach Detected',
        description: 'Unauthorized access to restricted area detected',
        confidence: 85 + Math.random() * 15,
        detectedObjects: ['Unauthorized access', 'Security perimeter breach'],
        aiProcessingTime: 200 + Math.random() * 100,
        confidenceScore: 0.85 + Math.random() * 0.15,
        isSecurityThreat: Math.random() > 0.5
      };
      
    case 'PATROL':
      return {
        title: 'Security Patrol Checkpoint',
        description: 'Routine security patrol checkpoint completed',
        confidence: 98 + Math.random() * 2,
        detectedObjects: ['Security officer', 'Patrol route'],
        aiProcessingTime: 50 + Math.random() * 25,
        confidenceScore: 0.98 + Math.random() * 0.02
      };
      
    case 'CROWD_DETECTION':
      return {
        title: 'Crowd Density Alert',
        description: 'Unusual crowd formation detected in operational area',
        confidence: 80 + Math.random() * 15,
        detectedObjects: ['Crowd formation', 'High density area'],
        aiProcessingTime: 250 + Math.random() * 150,
        confidenceScore: 0.80 + Math.random() * 0.15,
        isOperationalImpact: true
      };
      
    default:
      return {
        title: 'General Security Event',
        description: 'Security event requiring attention',
        confidence: 70 + Math.random() * 30,
        aiProcessingTime: 200 + Math.random() * 100,
        confidenceScore: 0.70 + Math.random() * 0.30
      };
  }
};

// Helper function to select based on probability distribution
const selectByProbability = (probabilities: Record<string, number>): string => {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [key, probability] of Object.entries(probabilities)) {
    cumulative += probability;
    if (rand <= cumulative) {
      return key;
    }
  }
  
  return Object.keys(probabilities)[0];
};

// Generate single enterprise activity
const generateEnterpriseActivity = (baseTime: Date, idCounter: number): EnterpriseActivity => {
  const type = selectByProbability(ACTIVITY_TYPE_PROBABILITIES) as EnterpriseActivity['type'];
  const priority = selectByProbability(PRIORITY_PROBABILITIES) as EnterpriseActivity['priority'];
  const status = selectByProbability(STATUS_PROBABILITIES) as EnterpriseActivity['status'];
  const businessImpact = selectByProbability(BUSINESS_IMPACT_PROBABILITIES) as EnterpriseActivity['businessImpact'];
  
  const location = generateLocation();
  const camera = generateCamera(location);
  const activityDetails = generateActivityByType(type, baseTime);
  
  // Generate correlation data
  const correlatedActivities = Math.random() > 0.8 ? [
    `ACT-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
    `ACT-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`
  ] : undefined;
  
  // Additional cameras for high-priority events
  const additionalCameras = priority === 'critical' || priority === 'high' ? [
    `${camera.cameraId}-ALT1`,
    `${camera.cameraId}-ALT2`
  ] : undefined;
  
  // Assign responding units for active events
  const respondingUnits = ['active', 'assigned', 'investigating'].includes(status) ? [
    `Unit-${Math.floor(Math.random() * 20) + 1}`,
    ...(priority === 'critical' ? [`Unit-${Math.floor(Math.random() * 20) + 21}`] : [])
  ] : undefined;
  
  const activity: EnterpriseActivity = {
    id: `ACT-${idCounter.toString().padStart(6, '0')}`,
    timestamp: baseTime,
    type,
    title: activityDetails.title || 'Security Event',
    location: location.full,
    zone: location.zone,
    building: location.building,
    floor: location.floor,
    sector: location.sector,
    priority,
    status,
    description: activityDetails.description,
    confidence: activityDetails.confidence,
    detectedObjects: activityDetails.detectedObjects,
    badgeHolder: activityDetails.badgeHolder,
    assignedTo: ['assigned', 'investigating'].includes(status) ? 
      `Officer ${['Johnson', 'Smith', 'Garcia', 'Chen', 'Williams'][Math.floor(Math.random() * 5)]}` : undefined,
    respondingUnits,
    cameraId: camera.cameraId,
    cameraName: camera.cameraName,
    additionalCameras,
    isBoloActive: Math.random() < 0.05, // 5% chance
    isNewActivity: status === 'new' || (Date.now() - baseTime.getTime()) < 5 * 60 * 1000,
    isMassCasualty: activityDetails.isMassCasualty || false,
    isSecurityThreat: activityDetails.isSecurityThreat || false,
    isOperationalImpact: activityDetails.isOperationalImpact || false,
    correlatedActivities,
    aiProcessingTime: activityDetails.aiProcessingTime,
    confidenceScore: activityDetails.confidenceScore,
    falsePositiveLikelihood: activityDetails.falsePositiveLikelihood || Math.random() * 0.2,
    escalationLevel: activityDetails.escalationLevel || 0,
    externalAgencies: activityDetails.externalAgencies,
    businessImpact,
    complianceFlags: Math.random() > 0.9 ? ['OSHA_REPORTABLE'] : undefined,
    thumbnailUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=200&h=150`,
    gifUrl: Math.random() > 0.7 ? `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=300` : undefined,
    metadata: {
      site: location.site.name,
      siteCode: location.site.code,
      region: location.site.region,
      facilityType: location.site.type,
      coordinates: location.site.coordinates,
      securityLevel: location.site.securityLevel,
      operationalHours: location.site.operationalHours
    }
  };
  
  return activity;
};

// Generate realistic enterprise activity dataset
export const generateEnterpriseActivities = (count: number = 5000): EnterpriseActivity[] => {
  const activities: EnterpriseActivity[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Generate activities over the past 24 hours with realistic distribution
    // More recent activities are more likely
    const hoursAgo = Math.pow(Math.random(), 2) * 24; // Skewed towards recent
    const baseTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    
    // Add some randomness to timestamp (within 15 minutes)
    const randomOffset = (Math.random() - 0.5) * 15 * 60 * 1000;
    const timestamp = new Date(baseTime.getTime() + randomOffset);
    
    const activity = generateEnterpriseActivity(timestamp, i + 1);
    activities.push(activity);
  }
  
  // Sort by timestamp (newest first)
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  return activities;
};

// Generate real-time activity stream
export const generateRealtimeActivity = (idCounter: number): EnterpriseActivity => {
  const now = new Date();
  return generateEnterpriseActivity(now, idCounter);
};

// Facility statistics for dashboard
export const getFacilityStats = (activities: EnterpriseActivity[]) => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const recentActivities = activities.filter(a => a.timestamp.getTime() > oneHourAgo);
  const todayActivities = activities.filter(a => a.timestamp.getTime() > oneDayAgo);
  
  return {
    totalCameras: 847, // Realistic number for large facility
    activeCameras: 839,
    totalActivities: activities.length,
    recentActivities: recentActivities.length,
    criticalToday: todayActivities.filter(a => a.priority === 'critical').length,
    averageResponseTime: '4.2 minutes',
    falsePositiveRate: '12.8%',
    systemUptime: '99.97%',
    buildingsMonitored: ALL_BUILDINGS.length,
    zonesMonitored: ALL_BUILDINGS.length * 8, // Average zones per building
    employeesOnSite: 2847,
    securityPersonnel: 23
  };
};

// Export default dataset
export const enterpriseActivities = generateEnterpriseActivities(5000);
export default enterpriseActivities;