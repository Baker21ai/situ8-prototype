/**
 * Activity Domain Entity
 * Pure business domain model with no external dependencies
 */

import { Priority, Status, BusinessImpact } from '../../../../lib/utils/status';
import { ActivityType, SecurityLevel } from '../../../../lib/utils/security';

// Value Objects
export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface ContactInfo {
  primary: string;
  secondary?: string;
  emergency: string;
}

export interface BadgeHolder {
  name: string;
  id: string;
  department?: string;
  clearanceLevel?: SecurityLevel | string;
  photo?: string;
}

export interface SiteMetadata {
  site: string;
  siteCode: string;
  region: string;
  facilityType: string;
  coordinates: Coordinates;
  securityLevel: SecurityLevel;
  operationalHours: string;
  timezone?: string;
  contactInfo?: ContactInfo;
  building?: string;
  zone?: string;
}

export interface ExternalSystemData {
  sourceSystem: string;
  originalType: string;
  rawPayload: Record<string, any>;
  processingTimestamp: string;
  mappingUsed: string;
  originalEvent: Record<string, any>;
}

export interface Evidence {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnail?: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

// Domain Entity
export class Activity {
  public readonly id: string;
  public readonly timestamp: Date;
  public readonly type: ActivityType;
  public readonly title: string;
  public readonly location: string;
  public readonly created_at: Date;
  public readonly created_by: string;
  
  private _priority: Priority;
  private _status: Status;
  private _description?: string;
  private _assignedTo?: string;
  private _updated_at: Date;
  private _updated_by: string;
  private _system_tags: string[];
  private _user_tags: string[];
  private _incident_contexts: string[];
  private _retention_date: Date;
  private _is_archived: boolean;
  private _archive_reason?: string;
  private _allowed_status_transitions: Status[];
  private _requires_approval: boolean;

  // Enhanced properties
  private _zone?: string;
  private _building?: string;
  private _floor?: string;
  private _confidence?: number;
  private _detectedObjects?: string[];
  private _badgeHolder?: BadgeHolder;
  private _respondingUnits?: string[];
  private _evidence?: Evidence[];
  private _businessImpact?: BusinessImpact;
  private _metadata?: SiteMetadata;
  private _externalData?: ExternalSystemData;
  private _escalationLevel?: number;
  private _falsePositiveLikelihood?: number;

  constructor(props: {
    id: string;
    timestamp: Date;
    type: ActivityType;
    title: string;
    location: string;
    priority: Priority;
    status: Status;
    created_by: string;
    description?: string;
    assignedTo?: string;
    zone?: string;
    building?: string;
    confidence?: number;
    badgeHolder?: BadgeHolder;
    businessImpact?: BusinessImpact;
    metadata?: SiteMetadata;
    externalData?: ExternalSystemData;
  }) {
    // Immutable properties
    this.id = props.id;
    this.timestamp = props.timestamp;
    this.type = props.type;
    this.title = props.title;
    this.location = props.location;
    this.created_at = new Date();
    this.created_by = props.created_by;

    // Mutable properties
    this._priority = props.priority;
    this._status = props.status;
    this._description = props.description;
    this._assignedTo = props.assignedTo;
    this._updated_at = new Date();
    this._updated_by = props.created_by;
    this._zone = props.zone;
    this._building = props.building;
    this._confidence = props.confidence;
    this._badgeHolder = props.badgeHolder;
    this._businessImpact = props.businessImpact;
    this._metadata = props.metadata;
    this._externalData = props.externalData;

    // Business rule defaults
    this._system_tags = this.generateSystemTags();
    this._user_tags = [];
    this._incident_contexts = [];
    this._retention_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    this._is_archived = false;
    this._allowed_status_transitions = this.calculateAllowedTransitions();
    this._requires_approval = this.determineApprovalRequirement();
    this._evidence = [];
    this._escalationLevel = 0;
    this._falsePositiveLikelihood = 0;
    this._respondingUnits = [];
    this._detectedObjects = [];
  }

  // Getters
  get priority(): Priority { return this._priority; }
  get status(): Status { return this._status; }
  get description(): string | undefined { return this._description; }
  get assignedTo(): string | undefined { return this._assignedTo; }
  get updated_at(): Date { return this._updated_at; }
  get updated_by(): string { return this._updated_by; }
  get system_tags(): string[] { return [...this._system_tags]; }
  get user_tags(): string[] { return [...this._user_tags]; }
  get incident_contexts(): string[] { return [...this._incident_contexts]; }
  get retention_date(): Date { return this._retention_date; }
  get is_archived(): boolean { return this._is_archived; }
  get archive_reason(): string | undefined { return this._archive_reason; }
  get allowed_status_transitions(): Status[] { return [...this._allowed_status_transitions]; }
  get requires_approval(): boolean { return this._requires_approval; }
  get zone(): string | undefined { return this._zone; }
  get building(): string | undefined { return this._building; }
  get floor(): string | undefined { return this._floor; }
  get confidence(): number | undefined { return this._confidence; }
  get detectedObjects(): string[] | undefined { return this._detectedObjects ? [...this._detectedObjects] : undefined; }
  get badgeHolder(): BadgeHolder | undefined { return this._badgeHolder; }
  get respondingUnits(): string[] | undefined { return this._respondingUnits ? [...this._respondingUnits] : undefined; }
  get evidence(): Evidence[] | undefined { return this._evidence ? [...this._evidence] : undefined; }
  get businessImpact(): BusinessImpact | undefined { return this._businessImpact; }
  get metadata(): SiteMetadata | undefined { return this._metadata; }
  get externalData(): ExternalSystemData | undefined { return this._externalData; }
  get escalationLevel(): number | undefined { return this._escalationLevel; }
  get falsePositiveLikelihood(): number | undefined { return this._falsePositiveLikelihood; }

  // Business Logic Methods
  updateStatus(newStatus: Status, updatedBy: string): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this._status} to ${newStatus}`);
    }
    
    this._status = newStatus;
    this._updated_at = new Date();
    this._updated_by = updatedBy;
    this.refreshSystemTags();
  }

  assignTo(userId: string, assignedBy: string): void {
    this._assignedTo = userId;
    this._updated_at = new Date();
    this._updated_by = assignedBy;
    this.refreshSystemTags();
  }

  escalate(level: number, escalatedBy: string): void {
    if (level <= this._escalationLevel) {
      throw new Error('Escalation level must be higher than current level');
    }
    
    this._escalationLevel = level;
    this._updated_at = new Date();
    this._updated_by = escalatedBy;
    this.refreshSystemTags();
  }

  addUserTag(tag: string): void {
    if (!this._user_tags.includes(tag)) {
      this._user_tags.push(tag);
    }
  }

  removeUserTag(tag: string): void {
    this._user_tags = this._user_tags.filter(t => t !== tag);
  }

  addIncidentContext(incidentId: string): void {
    if (!this._incident_contexts.includes(incidentId)) {
      this._incident_contexts.push(incidentId);
    }
  }

  addEvidence(evidence: Evidence): void {
    if (!this._evidence) {
      this._evidence = [];
    }
    this._evidence.push(evidence);
  }

  archive(reason: string, archivedBy: string): void {
    this._is_archived = true;
    this._archive_reason = reason;
    this._updated_at = new Date();
    this._updated_by = archivedBy;
  }

  // Business Rule Methods
  private canTransitionTo(newStatus: Status): boolean {
    return this._allowed_status_transitions.includes(newStatus);
  }

  private calculateAllowedTransitions(): Status[] {
    // Business rules for status transitions based on current status and type
    switch (this._status) {
      case 'detecting':
        return ['assigned', 'resolved'];
      case 'assigned':
        return ['responding', 'resolved'];
      case 'responding':
        return ['resolved'];
      case 'resolved':
        return []; // No further transitions from resolved
      default:
        return [];
    }
  }

  private determineApprovalRequirement(): boolean {
    // Critical activities require approval for status changes
    return this._priority === 'critical';
  }

  private generateSystemTags(): string[] {
    const tags: string[] = [];
    
    // Priority-based tags
    if (this._priority === 'critical') {
      tags.push('high-priority');
    }
    
    // Type-based tags
    tags.push(`type:${this.type}`);
    
    // Location-based tags
    if (this._building) {
      tags.push(`building:${this._building}`);
    }
    if (this._zone) {
      tags.push(`zone:${this._zone}`);
    }
    
    // Time-based tags
    const hour = this.timestamp.getHours();
    if (hour >= 6 && hour < 18) {
      tags.push('business-hours');
    } else {
      tags.push('after-hours');
    }
    
    // External system tags
    if (this._externalData) {
      tags.push(`source:${this._externalData.sourceSystem}`);
    } else {
      tags.push('source:manual');
    }
    
    return tags;
  }

  private refreshSystemTags(): void {
    this._system_tags = this.generateSystemTags();
  }

  // Domain Events (for future event sourcing)
  getUncommittedEvents(): any[] {
    // TODO: Implement domain events
    return [];
  }

  markEventsAsCommitted(): void {
    // TODO: Implement domain events
  }

  // Validation
  isValid(): boolean {
    return !!(
      this.id &&
      this.title &&
      this.location &&
      this.type &&
      this._priority &&
      this._status &&
      this.created_by
    );
  }

  // Serialization for persistence
  toSnapshot(): any {
    return {
      id: this.id,
      timestamp: this.timestamp,
      type: this.type,
      title: this.title,
      location: this.location,
      priority: this._priority,
      status: this._status,
      description: this._description,
      assignedTo: this._assignedTo,
      created_at: this.created_at,
      created_by: this.created_by,
      updated_at: this._updated_at,
      updated_by: this._updated_by,
      system_tags: this._system_tags,
      user_tags: this._user_tags,
      incident_contexts: this._incident_contexts,
      retention_date: this._retention_date,
      is_archived: this._is_archived,
      archive_reason: this._archive_reason,
      zone: this._zone,
      building: this._building,
      floor: this._floor,
      confidence: this._confidence,
      detectedObjects: this._detectedObjects,
      badgeHolder: this._badgeHolder,
      respondingUnits: this._respondingUnits,
      evidence: this._evidence,
      businessImpact: this._businessImpact,
      metadata: this._metadata,
      externalData: this._externalData,
      escalationLevel: this._escalationLevel,
      falsePositiveLikelihood: this._falsePositiveLikelihood
    };
  }

  static fromSnapshot(snapshot: any): Activity {
    const activity = new Activity({
      id: snapshot.id,
      timestamp: new Date(snapshot.timestamp),
      type: snapshot.type,
      title: snapshot.title,
      location: snapshot.location,
      priority: snapshot.priority,
      status: snapshot.status,
      created_by: snapshot.created_by,
      description: snapshot.description,
      assignedTo: snapshot.assignedTo,
      zone: snapshot.zone,
      building: snapshot.building,
      confidence: snapshot.confidence,
      badgeHolder: snapshot.badgeHolder,
      businessImpact: snapshot.businessImpact,
      metadata: snapshot.metadata,
      externalData: snapshot.externalData
    });

    // Restore mutable state
    activity._updated_at = new Date(snapshot.updated_at);
    activity._updated_by = snapshot.updated_by;
    activity._system_tags = snapshot.system_tags || [];
    activity._user_tags = snapshot.user_tags || [];
    activity._incident_contexts = snapshot.incident_contexts || [];
    activity._retention_date = new Date(snapshot.retention_date);
    activity._is_archived = snapshot.is_archived || false;
    activity._archive_reason = snapshot.archive_reason;
    activity._floor = snapshot.floor;
    activity._detectedObjects = snapshot.detectedObjects;
    activity._respondingUnits = snapshot.respondingUnits;
    activity._evidence = snapshot.evidence;
    activity._escalationLevel = snapshot.escalationLevel || 0;
    activity._falsePositiveLikelihood = snapshot.falsePositiveLikelihood || 0;

    return activity;
  }
}

// Activity Factory for common creation patterns
export class ActivityFactory {
  static createFromExternalSystem(data: {
    externalData: ExternalSystemData;
    type: ActivityType;
    title: string;
    location: string;
    priority: Priority;
    created_by: string;
    confidence?: number;
    building?: string;
    zone?: string;
  }): Activity {
    return new Activity({
      id: `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: data.type,
      title: data.title,
      location: data.location,
      priority: data.priority,
      status: 'detecting',
      created_by: data.created_by,
      confidence: data.confidence,
      building: data.building,
      zone: data.zone,
      externalData: data.externalData
    });
  }

  static createManual(data: {
    type: ActivityType;
    title: string;
    location: string;
    priority: Priority;
    created_by: string;
    description?: string;
    building?: string;
    zone?: string;
  }): Activity {
    return new Activity({
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: data.type,
      title: data.title,
      location: data.location,
      priority: data.priority,
      status: 'detecting',
      created_by: data.created_by,
      description: data.description,
      building: data.building,
      zone: data.zone
    });
  }
}