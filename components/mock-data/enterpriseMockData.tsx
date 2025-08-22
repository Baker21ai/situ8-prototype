import { EnterpriseActivity } from '../../lib/types/activity';
import { ActivityType } from '../../lib/utils/security';
import { Priority, Status } from '../../lib/utils/status';

// Define all possible statuses for the complete Kanban flow
const STATUSES: Status[] = ['detecting', 'pending', 'escalated', 'in-progress', 'review', 'resolved', 'deferred', 'cancelled'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

const generateEnterpriseActivity = (id: number, status?: Status, priority?: Priority): EnterpriseActivity => {
  const now = new Date();
  const randomStatus = status || STATUSES[Math.floor(Math.random() * STATUSES.length)];
  const randomPriority = priority || PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
  
  // Generate realistic timestamps based on status
  let timestamp = now;
  let created_at = now;
  
  switch (randomStatus) {
    case 'detecting':
      // Most recent - just detected
      timestamp = new Date(now.getTime() - Math.random() * 5 * 60 * 1000); // 0-5 minutes ago
      created_at = timestamp;
      break;
    case 'pending':
      // Detected but not yet assigned
      timestamp = new Date(now.getTime() - Math.random() * 30 * 60 * 1000); // 5-35 minutes ago
      created_at = new Date(timestamp.getTime() - Math.random() * 5 * 60 * 1000);
      break;
    case 'escalated':
      // Escalated for higher priority
      timestamp = new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000); // 1-3 hours ago
      created_at = new Date(timestamp.getTime() - Math.random() * 2 * 60 * 60 * 1000);
      break;
    case 'in-progress':
      // Currently being worked on
      timestamp = new Date(now.getTime() - Math.random() * 4 * 60 * 60 * 1000); // 2-6 hours ago
      created_at = new Date(timestamp.getTime() - Math.random() * 4 * 60 * 60 * 1000);
      break;
    case 'review':
      // Completed, awaiting review
      timestamp = new Date(now.getTime() - Math.random() * 8 * 60 * 60 * 1000); // 4-12 hours ago
      created_at = new Date(timestamp.getTime() - Math.random() * 8 * 60 * 60 * 1000);
      break;
    case 'resolved':
      // Resolved incidents
      timestamp = new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000); // 6-18 hours ago
      created_at = new Date(timestamp.getTime() - Math.random() * 12 * 60 * 60 * 1000);
      break;
    case 'deferred':
      // Put on hold
      timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // 12-36 hours ago
      created_at = new Date(timestamp.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      break;
    case 'cancelled':
      // Cancelled incidents
      timestamp = new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000); // 24-72 hours ago
      created_at = new Date(timestamp.getTime() - Math.random() * 48 * 60 * 60 * 1000);
      break;
  }

  return {
    id: `activity-${id}`,
    timestamp,
    type: 'alert',
    title: `Security Incident ${id}: ${getIncidentTitle(randomStatus, randomPriority)}`,
    location: getRandomLocation(),
    priority: randomPriority,
    status: randomStatus,
    description: getIncidentDescription(randomStatus, randomPriority),
    created_at,
    updated_at: timestamp,
    created_by: 'system',
    updated_by: 'system',
    source: 'MANUAL',
    system_tags: ['mock', 'source:manual', `status:${randomStatus}`, `priority:${randomPriority}`],
    user_tags: [],
    incident_contexts: [],
    retention_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    is_archived: false,
    allowed_status_transitions: getStatusTransitions(randomStatus),
    requires_approval: randomPriority === 'critical' || randomStatus === 'review',
  };
};

// Helper function to generate realistic incident titles
const getIncidentTitle = (status: Status, priority: Priority): string => {
  const incidents = [
    'Unauthorized Access Attempt',
    'Suspicious Activity Detected',
    'Perimeter Breach Alert',
    'After-Hours Movement',
    'Vehicle in Restricted Area',
    'Tailgating Incident',
    'Card Reader Malfunction',
    'Camera Tampering Alert',
    'Emergency Exit Misuse',
    'Visitor Protocol Violation'
  ];
  
  const randomIncident = incidents[Math.floor(Math.random() * incidents.length)];
  
  // Add status-specific suffixes
  switch (status) {
    case 'resolved':
      return `${randomIncident} - RESOLVED (${priority.toUpperCase()})`;
    case 'cancelled':
      return `${randomIncident} - CANCELLED (${priority.toUpperCase()})`;
    case 'deferred':
      return `${randomIncident} - DEFERRED (${priority.toUpperCase()})`;
    default:
      return `${randomIncident} (${priority.toUpperCase()})`;
  }
};

// Helper function to generate realistic incident descriptions
const getIncidentDescription = (status: Status, priority: Priority): string => {
  const baseDescription = 'Security system detected unusual activity requiring investigation.';
  
  switch (status) {
    case 'detecting':
      return `${baseDescription} Initial detection phase - analyzing threat level.`;
    case 'pending':
      return `${baseDescription} Incident confirmed, awaiting assignment to security personnel.`;
    case 'escalated':
      return `${baseDescription} Incident escalated due to ${priority} priority level.`;
    case 'in-progress':
      return `${baseDescription} Security team actively investigating and responding.`;
    case 'review':
      return `${baseDescription} Investigation complete, awaiting supervisor review and closure.`;
    case 'resolved':
      return `${baseDescription} Incident successfully resolved and closed.`;
    case 'deferred':
      return `${baseDescription} Investigation temporarily deferred due to resource constraints.`;
    case 'cancelled':
      return `${baseDescription} Incident determined to be false alarm, investigation cancelled.`;
    default:
      return baseDescription;
  }
};

// Helper function to generate random locations
const getRandomLocation = (): string => {
  const locations = [
    'Building A - Main Entrance',
    'Building B - Loading Dock',
    'Building C - Parking Garage',
    'Perimeter Fence - North Gate',
    'Perimeter Fence - South Gate',
    'Employee Parking Lot',
    'Visitor Center',
    'Security Office',
    'Maintenance Building',
    'Data Center Entrance'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
};

// Helper function to get realistic status transitions
const getStatusTransitions = (currentStatus: Status): Status[] => {
  switch (currentStatus) {
    case 'detecting':
      return ['pending', 'escalated', 'cancelled'];
    case 'pending':
      return ['escalated', 'in-progress', 'deferred', 'cancelled'];
    case 'escalated':
      return ['in-progress', 'deferred', 'cancelled'];
    case 'in-progress':
      return ['review', 'escalated', 'deferred'];
    case 'review':
      return ['resolved', 'deferred', 'in-progress'];
    case 'resolved':
      return ['deferred', 'in-progress']; // Can be reopened or deferred
    case 'deferred':
      return ['in-progress', 'cancelled'];
    case 'cancelled':
      return ['pending']; // Can be reopened
    default:
      return ['pending'];
  }
};

export const generateEnterpriseActivities = (count: number): EnterpriseActivity[] => {
  const activities: EnterpriseActivity[] = [];
  
  // Ensure we have at least 2-3 activities in each status column for good demonstration
  STATUSES.forEach((status, index) => {
    const priority = PRIORITIES[index % PRIORITIES.length];
    // Create 2-3 activities per status
    for (let j = 0; j < 2 + (index % 2); j++) {
      activities.push(generateEnterpriseActivity(index * 10 + j, status, priority));
    }
  });
  
  // Fill the rest with random statuses to reach the desired count
  for (let i = activities.length; i < count; i++) {
    activities.push(generateEnterpriseActivity(i));
  }
  
  return activities;
};

export const generateRealtimeActivity = (idCounter: number): EnterpriseActivity => {
  return generateEnterpriseActivity(idCounter);
};

// Generate sample Ambient.AI activity for testing
export const generateAmbientActivity = (id: number, ambientAlertId: string): EnterpriseActivity => {
  const now = new Date();
  return {
    id: `ambient-${id}`,
    timestamp: now,
    type: 'security-breach',
    title: `Ambient AI Alert: Unauthorized Entry`,
    location: 'Building A - Main Entrance',
    priority: 'high',
    status: 'detecting',
    description: 'Motion detected in restricted area after hours.',
    created_at: now,
    updated_at: now,
    created_by: 'ambient-system',
    updated_by: 'ambient-system',
    source: 'AMBIENT',
    system_tags: ['ambient', 'source:ambient', 'high-confidence', 'after-hours'],
    user_tags: [],
    incident_contexts: [],
    retention_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    is_archived: false,
    allowed_status_transitions: ['assigned', 'resolved'],
    requires_approval: false,
    // Ambient-specific fields
    ambient_alert_id: ambientAlertId,
    preview_url: `https://ambient.ai/previews/${ambientAlertId}`,
    deep_link_url: `https://ambient.ai/alerts/${ambientAlertId}`,
    confidence_score: 0.85,
    confidence: 85,
  };
};