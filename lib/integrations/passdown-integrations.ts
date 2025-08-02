/**
 * Passdown Integration Utilities
 * Handles integration between Passdowns and other modules (Activities, BOL, Incidents, Cases)
 */

import { 
  CreatePassdownRequest,
  RelatedEntity,
  RelatedEntityType,
  PassdownCategory,
  UrgencyLevel
} from '../types/passdown';
import { EnterpriseActivity } from '../types/activity';
import { Incident } from '../types/incident';
import { Case } from '../types/case';

// Activity type to passdown category mapping
const ACTIVITY_TO_CATEGORY_MAP: Record<string, PassdownCategory> = {
  'medical': 'emergency',
  'security-breach': 'security',
  'safety-hazard': 'safety',
  'maintenance-issue': 'maintenance',
  'visitor-issue': 'visitor',
  'equipment-failure': 'maintenance',
  'access-control': 'security',
  'fire-alarm': 'emergency',
  'environmental': 'safety',
  'theft': 'security',
  'vandalism': 'security',
  'trespassing': 'security',
  'accident': 'safety',
  'hazmat': 'emergency',
  'power-outage': 'operations',
  'network-issue': 'operations',
  'elevator-issue': 'maintenance',
  'hvac-issue': 'maintenance',
  'water-leak': 'maintenance',
  'lock-issue': 'maintenance',
  'camera-issue': 'maintenance',
  'alarm-issue': 'maintenance'
};

// Activity type to urgency mapping
const ACTIVITY_TO_URGENCY_MAP: Record<string, UrgencyLevel> = {
  'medical': 'critical',
  'security-breach': 'critical',
  'fire-alarm': 'critical',
  'hazmat': 'critical',
  'safety-hazard': 'high',
  'theft': 'high',
  'vandalism': 'high',
  'trespassing': 'high',
  'accident': 'high',
  'maintenance-issue': 'medium',
  'visitor-issue': 'medium',
  'equipment-failure': 'medium',
  'access-control': 'medium',
  'environmental': 'medium',
  'power-outage': 'medium',
  'network-issue': 'medium',
  'elevator-issue': 'low',
  'hvac-issue': 'low',
  'water-leak': 'medium',
  'lock-issue': 'medium',
  'camera-issue': 'low',
  'alarm-issue': 'medium'
};

/**
 * Create a passdown from an activity
 */
export function createPassdownFromActivity(
  activity: EnterpriseActivity
): Partial<CreatePassdownRequest> {
  const category = ACTIVITY_TO_CATEGORY_MAP[activity.type] || 'operations';
  const urgencyLevel = ACTIVITY_TO_URGENCY_MAP[activity.type] || 'medium';
  
  // Generate title based on activity
  const title = `${activity.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${activity.location}`;
  
  // Generate summary
  const summary = `Activity from ${activity.location} requiring shift attention`;
  
  // Generate detailed notes
  let notes = `Activity Details:\n`;
  notes += `- Type: ${activity.type}\n`;
  notes += `- Location: ${activity.location}\n`;
  notes += `- Time: ${new Date(activity.timestamp).toLocaleString()}\n`;
  notes += `- Reporter: ${activity.reportedBy}\n`;
  if (activity.description) {
    notes += `- Description: ${activity.description}\n`;
  }
  if (activity.witness && activity.witness.length > 0) {
    notes += `- Witnesses: ${activity.witness.join(', ')}\n`;
  }
  if (activity.involvedPersons && activity.involvedPersons.length > 0) {
    notes += `- Involved Persons: ${activity.involvedPersons.join(', ')}\n`;
  }
  
  // Add follow-up instructions based on activity type
  notes += `\nFollow-up Required:\n`;
  switch (category) {
    case 'security':
      notes += `- Review security footage\n- File incident report if needed\n- Notify security management`;
      break;
    case 'safety':
      notes += `- Ensure area is secure\n- Document safety measures taken\n- Report to safety officer`;
      break;
    case 'maintenance':
      notes += `- Schedule maintenance work order\n- Monitor equipment status\n- Update facility management`;
      break;
    case 'emergency':
      notes += `- Verify emergency response completed\n- Document all actions taken\n- Follow emergency protocols`;
      break;
    case 'visitor':
      notes += `- Review visitor access logs\n- Update visitor management system\n- Coordinate with reception`;
      break;
    default:
      notes += `- Monitor situation\n- Document any changes\n- Escalate if necessary`;
  }

  const relatedEntities: RelatedEntity[] = [{
    entityType: 'activity' as RelatedEntityType,
    entityId: activity.id,
    relationshipType: 'created_from',
    notes: `Passdown created from activity: ${activity.type} at ${activity.location}`
  }];

  // Generate tags
  const tags = [
    activity.type,
    activity.location,
    category,
    ...(activity.systemTags || [])
  ].filter(Boolean);

  return {
    title,
    summary,
    notes,
    category,
    urgencyLevel,
    acknowledgmentRequired: urgencyLevel === 'critical' || urgencyLevel === 'high',
    tags,
    relatedEntities,
    locationId: activity.locationId
  };
}

/**
 * Create a passdown from an incident
 */
export function createPassdownFromIncident(
  incident: Incident
): Partial<CreatePassdownRequest> {
  const category: PassdownCategory = incident.type.includes('security') ? 'security' : 
                                   incident.type.includes('safety') ? 'safety' :
                                   incident.type.includes('medical') ? 'emergency' : 'operations';
  
  const urgencyLevel: UrgencyLevel = incident.severity === 'critical' ? 'critical' :
                                    incident.severity === 'high' ? 'high' :
                                    incident.severity === 'medium' ? 'medium' : 'low';

  const title = `Incident Follow-up: ${incident.title}`;
  const summary = `Incident requiring ongoing monitoring and shift coordination`;

  let notes = `Incident Information:\n`;
  notes += `- Incident ID: ${incident.id}\n`;
  notes += `- Type: ${incident.type}\n`;
  notes += `- Severity: ${incident.severity}\n`;
  notes += `- Status: ${incident.status}\n`;
  notes += `- Location: ${incident.location}\n`;
  notes += `- Reported: ${new Date(incident.createdAt).toLocaleString()}\n`;
  if (incident.description) {
    notes += `- Description: ${incident.description}\n`;
  }
  if (incident.assignedTo) {
    notes += `- Assigned To: ${incident.assignedTo}\n`;
  }

  notes += `\nShift Responsibilities:\n`;
  if (incident.status === 'active') {
    notes += `- Monitor incident progress\n- Coordinate with assigned personnel\n- Update incident status as needed\n- Escalate if situation worsens`;
  } else if (incident.status === 'resolved') {
    notes += `- Verify resolution is maintaining\n- Monitor for any recurrence\n- Complete final documentation\n- File incident report`;
  } else {
    notes += `- Continue monitoring\n- Provide updates as situation develops\n- Coordinate response activities`;
  }

  const relatedEntities: RelatedEntity[] = [{
    entityType: 'incident' as RelatedEntityType,
    entityId: incident.id,
    relationshipType: 'follow_up',
    notes: `Passdown for ongoing incident management`
  }];

  const tags = [
    'incident',
    incident.type,
    incident.severity,
    incident.status,
    ...(incident.tags || [])
  ].filter(Boolean);

  return {
    title,
    summary,
    notes,
    category,
    urgencyLevel,
    acknowledgmentRequired: urgencyLevel === 'critical' || urgencyLevel === 'high',
    tags,
    relatedEntities,
    locationId: incident.locationId
  };
}

/**
 * Create a passdown from a case
 */
export function createPassdownFromCase(
  caseItem: Case
): Partial<CreatePassdownRequest> {
  const category: PassdownCategory = caseItem.type.includes('investigation') ? 'security' :
                                   caseItem.type.includes('compliance') ? 'operations' : 'other';
  
  const urgencyLevel: UrgencyLevel = caseItem.priority === 'critical' ? 'critical' :
                                    caseItem.priority === 'high' ? 'high' :
                                    caseItem.priority === 'medium' ? 'medium' : 'low';

  const title = `Case Update: ${caseItem.title}`;
  const summary = `Case requiring shift attention and monitoring`;

  let notes = `Case Information:\n`;
  notes += `- Case ID: ${caseItem.id}\n`;
  notes += `- Type: ${caseItem.type}\n`;
  notes += `- Priority: ${caseItem.priority}\n`;
  notes += `- Status: ${caseItem.status}\n`;
  notes += `- Lead Investigator: ${caseItem.leadInvestigator}\n`;
  notes += `- Created: ${new Date(caseItem.createdAt).toLocaleString()}\n`;
  if (caseItem.description) {
    notes += `- Description: ${caseItem.description}\n`;
  }

  notes += `\nShift Actions Required:\n`;
  if (caseItem.status === 'active') {
    notes += `- Monitor for new evidence or developments\n- Coordinate with investigation team\n- Secure any related areas\n- Document any observations`;
  } else if (caseItem.status === 'pending') {
    notes += `- Watch for case reactivation\n- Maintain evidence security\n- Report any related incidents`;
  } else {
    notes += `- Monitor case status\n- Provide support as needed\n- Maintain documentation`;
  }

  const relatedEntities: RelatedEntity[] = [{
    entityType: 'case' as RelatedEntityType,
    entityId: caseItem.id,
    relationshipType: 'monitoring',
    notes: `Passdown for case monitoring and support`
  }];

  const tags = [
    'case',
    caseItem.type,
    caseItem.priority,
    caseItem.status,
    'investigation'
  ].filter(Boolean);

  return {
    title,
    summary,
    notes,
    category,
    urgencyLevel,
    acknowledgmentRequired: urgencyLevel === 'critical' || urgencyLevel === 'high',
    tags,
    relatedEntities
  };
}

/**
 * Generate action items based on entity type and data
 */
export function generateActionItemsForEntity(
  entityType: RelatedEntityType,
  entityData: any
): Array<{ id: string; description: string; completed: boolean }> {
  const actionItems: Array<{ id: string; description: string; completed: boolean }> = [];

  switch (entityType) {
    case 'activity':
      if (entityData.type === 'medical') {
        actionItems.push(
          { id: '1', description: 'Verify EMS response completed', completed: false },
          { id: '2', description: 'File medical incident report', completed: false },
          { id: '3', description: 'Update security log', completed: false }
        );
      } else if (entityData.type === 'security-breach') {
        actionItems.push(
          { id: '1', description: 'Review security footage', completed: false },
          { id: '2', description: 'Check access logs', completed: false },
          { id: '3', description: 'Notify security management', completed: false },
          { id: '4', description: 'File incident report', completed: false }
        );
      } else {
        actionItems.push(
          { id: '1', description: 'Monitor situation', completed: false },
          { id: '2', description: 'Document follow-up actions', completed: false }
        );
      }
      break;

    case 'incident':
      actionItems.push(
        { id: '1', description: 'Check incident status', completed: false },
        { id: '2', description: 'Coordinate with assigned team', completed: false },
        { id: '3', description: 'Update incident log', completed: false }
      );
      if (entityData.severity === 'critical') {
        actionItems.push(
          { id: '4', description: 'Hourly status checks', completed: false },
          { id: '5', description: 'Escalate if no progress', completed: false }
        );
      }
      break;

    case 'case':
      actionItems.push(
        { id: '1', description: 'Monitor case developments', completed: false },
        { id: '2', description: 'Secure evidence areas', completed: false },
        { id: '3', description: 'Report any new information', completed: false }
      );
      break;

    default:
      actionItems.push(
        { id: '1', description: 'Review and monitor', completed: false },
        { id: '2', description: 'Document any changes', completed: false }
      );
  }

  return actionItems;
}

/**
 * Get integration context for cross-module navigation
 */
export interface IntegrationContext {
  sourceModule: 'activities' | 'incidents' | 'cases' | 'passdowns';
  sourceEntityId: string;
  sourceEntityType: RelatedEntityType;
  actionType: 'create_passdown' | 'link_existing' | 'view_related';
}

/**
 * Helper to create integration context
 */
export function createIntegrationContext(
  sourceModule: IntegrationContext['sourceModule'],
  sourceEntityId: string,
  actionType: IntegrationContext['actionType']
): IntegrationContext {
  const sourceEntityType: RelatedEntityType = 
    sourceModule === 'activities' ? 'activity' :
    sourceModule === 'incidents' ? 'incident' :
    sourceModule === 'cases' ? 'case' : 'activity';

  return {
    sourceModule,
    sourceEntityId,
    sourceEntityType,
    actionType
  };
}