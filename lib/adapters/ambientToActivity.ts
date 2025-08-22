/**
 * Adapter to convert Ambient.AI alerts to Activity format
 * This enables the unified Activities module to work with Ambient alerts
 */

import { Alert, AlertStatus, AlertPriority } from '../../stores/alertStore';
import { EnterpriseActivity, ActivityType } from '../types/activity';
import { Priority, Status } from '../utils/status';

/**
 * Convert Ambient alert to Activity format
 */
export function ambientAlertToActivity(alert: Alert): EnterpriseActivity {
  return {
    id: alert.situ8.internalAlertId || `AMBIENT_${alert.id}_${Date.now()}`,
    title: generateActivityTitle(alert),
    type: mapAlertTypeToActivityType(alert.alertType),
    priority: mapAlertPriorityToActivityPriority(alert.priority),
    status: mapAlertStatusToActivityStatus(alert.situ8.status),
    timestamp: new Date(alert.timestamp),
    location: `${alert.location.siteName} - ${alert.location.zoneName}`,
    zone: alert.location.zoneName,
    building: alert.location.siteName,
    description: alert.aiAnalysis.description,
    confidence: alert.detection.confidence,
    
    // Ambient-specific fields
    ambient_alert_id: alert.alertId,
    preview_url: alert.evidence.imageUrl || alert.evidence.thumbnailUrl,
    deep_link_url: alert.evidence.liveStreamUrl,
    confidence_score: alert.detection.confidence / 100,
    
    // Assignment and workflow
    assignedTo: alert.situ8.assignedGuard,
    respondingUnits: [], // TODO: Map from SOP actions if available
    
    // Evidence
    gifUrl: alert.evidence.videoClipUrl,
    thumbnailUrl: alert.evidence.thumbnailUrl,
    cameraId: alert.deviceId,
    
    // Source identification
    source: 'AMBIENT',
    system_tags: ['ambient', 'source:ambient', ...alert.tags],
    user_tags: [],
    
    // Metadata
    created_at: new Date(alert.situ8.createdAt),
    updated_at: new Date(alert.situ8.updatedAt),
    created_by: 'ambient-system',
    updated_by: 'ambient-system',
    
    // Enterprise fields
    incident_contexts: [],
    retention_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    is_archived: false,
    allowed_status_transitions: ['assigned', 'responding', 'resolved'],
    requires_approval: alert.priority === 'critical',
    
    // Activity-specific fields
    detectedObjects: [alert.detection.objectType, alert.detection.subType].filter(Boolean),
    isBoloActive: false,
    isNewActivity: alert.situ8.status === 'detected',
    relativeTime: getRelativeTime(alert.timestamp),
    evidenceNumber: getEvidenceCount(alert),
    
    // Notes from Ambient
    notes: alert.situ8.notes || []
  };
}

/**
 * Convert multiple Ambient alerts to Activities
 */
export function ambientAlertsToActivities(alerts: Alert[]): EnterpriseActivity[] {
  return alerts.map(ambientAlertToActivity);
}

/**
 * Convert Activity back to Ambient alert (for updates)
 */
export function activityToAmbientAlert(activity: EnterpriseActivity, originalAlert: Alert): Alert {
  return {
    ...originalAlert,
    situ8: {
      ...originalAlert.situ8,
      status: mapActivityStatusToAlertStatus(activity.status),
      assignedGuard: activity.assignedTo || originalAlert.situ8.assignedGuard,
      updatedAt: new Date().toISOString(),
      notes: activity.notes || originalAlert.situ8.notes || []
    }
  };
}

// Mapping helper functions

function mapAlertTypeToActivityType(alertType: string): ActivityType {
  const typeMap: Record<string, ActivityType> = {
    'weapon_detection': 'bol-event',
    'perimeter_breach': 'security-breach', 
    'unauthorized_access': 'security-breach',
    'tailgating': 'alert',
    'loitering': 'alert',
    'suspicious_behavior': 'alert',
    'after_hours_activity': 'alert',
    'crowd_gathering': 'alert',
    'vehicle_alert': 'alert',
    'ppe_violation': 'alert'
  };
  
  return typeMap[alertType] || 'alert';
}

function mapAlertPriorityToActivityPriority(priority: AlertPriority): Priority {
  const priorityMap: Record<AlertPriority, Priority> = {
    'critical': 'critical',
    'high': 'high', 
    'medium': 'medium',
    'low': 'low'
  };
  
  return priorityMap[priority];
}

function mapAlertStatusToActivityStatus(status: AlertStatus): Status {
  const statusMap: Record<AlertStatus, Status> = {
    'detected': 'detecting',
    'pending_approval': 'assigned', 
    'in_progress': 'responding',
    'resolved': 'resolved'
  };
  
  return statusMap[status];
}

function mapActivityStatusToAlertStatus(status: Status): AlertStatus {
  const statusMap: Record<Status, AlertStatus> = {
    'detecting': 'detected',
    'assigned': 'pending_approval',
    'responding': 'in_progress', 
    'resolved': 'resolved',
    'in-progress': 'in_progress',
    'review': 'pending_approval',
    'deferred': 'pending_approval',
    'cancelled': 'resolved'
  };
  
  return statusMap[status] || 'detected';
}

function generateActivityTitle(alert: Alert): string {
  const typeMap: Record<string, string> = {
    'weapon_detection': 'Weapon Detection Alert',
    'perimeter_breach': 'Perimeter Breach Detected',
    'unauthorized_access': 'Unauthorized Access Attempt',
    'tailgating': 'Tailgating Detected',
    'loitering': 'Loitering Detected',
    'suspicious_behavior': 'Suspicious Behavior Alert',
    'after_hours_activity': 'After Hours Activity Detected',
    'crowd_gathering': 'Crowd Gathering Alert',
    'vehicle_alert': 'Vehicle Alert',
    'ppe_violation': 'PPE Violation Detected'
  };
  
  return typeMap[alert.alertType] || 'Security Alert';
}

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const alertTime = new Date(timestamp).getTime();
  const diff = now - alertTime;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function getEvidenceCount(alert: Alert): number {
  let count = 0;
  if (alert.evidence.imageUrl) count++;
  if (alert.evidence.videoClipUrl) count++;
  if (alert.evidence.thumbnailUrl) count++;
  if (alert.evidence.annotatedImageUrl) count++;
  return count;
}