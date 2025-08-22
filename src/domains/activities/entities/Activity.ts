/**
 * Activity Domain Entity
 * Pure business domain model with no external dependencies
 */

import { Priority, Status, BusinessImpact } from '../../../../lib/utils/status';
import { ActivityType, SecurityLevel } from '../../../../lib/utils/security';
import { DomainEvent, ActivityEvent, EventFactory } from '../events/DomainEvent';

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
  
  // Ambient integration properties
  private _ambient_alert_id?: string;
  private _source: 'AMBIENT' | 'SITU8' | 'MANUAL' = 'MANUAL';
  private _preview_url?: string;
  private _deep_link_url?: string;
  private _confidence_score?: number;
  
  // Domain events (max 10 per activity)
  private _domainEvents: DomainEvent[] = [];
  private readonly MAX_EVENTS = 10;

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
    // Ambient integration properties
    ambient_alert_id?: string;
    source?: 'AMBIENT' | 'SITU8' | 'MANUAL';
    preview_url?: string;
    deep_link_url?: string;
    confidence_score?: number;
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
    
    // Ambient integration properties
    this._ambient_alert_id = props.ambient_alert_id;
    this._source = props.source || 'MANUAL';
    this._preview_url = props.preview_url;
    this._deep_link_url = props.deep_link_url;
    this._confidence_score = props.confidence_score;

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
    
    // Emit created event
    this.addDomainEvent(
      EventFactory.createActivityCreatedEvent(
        this.id,
        this.title,
        this.type,
        this._priority,
        this.location,
        this.created_by
      )
    );
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
  
  // Ambient integration getters
  get ambient_alert_id(): string | undefined { return this._ambient_alert_id; }
  get source(): 'AMBIENT' | 'SITU8' | 'MANUAL' { return this._source; }
  get preview_url(): string | undefined { return this._preview_url; }
  get deep_link_url(): string | undefined { return this._deep_link_url; }
  get confidence_score(): number | undefined { return this._confidence_score; }

  // Business Logic Methods
  updateStatus(newStatus: Status, updatedBy: string): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this._status} to ${newStatus}`);
    }
    
    const oldStatus = this._status;
    this._status = newStatus;
    this._updated_at = new Date();
    this._updated_by = updatedBy;
    this.refreshSystemTags();
    
    // Emit domain event
    this.addDomainEvent(
      EventFactory.createActivityStatusChangedEvent(
        this.id,
        oldStatus,
        newStatus,
        updatedBy
      )
    );
  }

  assignTo(userId: string, assignedBy: string): void {
    const previousAssignee = this._assignedTo;
    this._assignedTo = userId;
    this._updated_at = new Date();
    this._updated_by = assignedBy;
    this.refreshSystemTags();
    
    // Emit domain event
    this.addDomainEvent(
      EventFactory.createActivityAssignedEvent(
        this.id,
        userId,
        assignedBy,
        previousAssignee
      )
    );
  }

  escalate(level: number, escalatedBy: string): void {
    if (level <= this._escalationLevel) {
      throw new Error('Escalation level must be higher than current level');
    }
    
    const previousLevel = this._escalationLevel || 0;
    this._escalationLevel = level;
    this._updated_at = new Date();
    this._updated_by = escalatedBy;
    this.refreshSystemTags();
    
    // Emit domain event
    this.addDomainEvent(
      EventFactory.createActivityEscalatedEvent(
        this.id,
        previousLevel,
        level,
        escalatedBy
      )
    );
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
    
    // Source system tags
    tags.push(`source:${this._source.toLowerCase()}`);
    
    // Legacy external system tags for backward compatibility
    if (this._externalData) {
      tags.push(`external:${this._externalData.sourceSystem}`);
    }
    
    // Ambient specific tags
    if (this._source === 'AMBIENT' && this._confidence_score !== undefined) {
      if (this._confidence_score >= 0.8) {
        tags.push('high-confidence');
      } else if (this._confidence_score >= 0.6) {
        tags.push('medium-confidence');
      } else {
        tags.push('low-confidence');
      }
    }
    
    return tags;
  }

  private refreshSystemTags(): void {
    this._system_tags = this.generateSystemTags();
  }

  // Domain Events
  getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  markEventsAsCommitted(): void {
    this._domainEvents = [];
  }
  
  private addDomainEvent(event: DomainEvent): void {
    // Add event to the list
    this._domainEvents.push(event);
    
    // Keep only the last MAX_EVENTS events (circular buffer)
    if (this._domainEvents.length > this.MAX_EVENTS) {
      this._domainEvents = this._domainEvents.slice(-this.MAX_EVENTS);
    }
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
      falsePositiveLikelihood: this._falsePositiveLikelihood,
      // Ambient integration fields
      ambient_alert_id: this._ambient_alert_id,
      source: this._source,
      preview_url: this._preview_url,
      deep_link_url: this._deep_link_url,
      confidence_score: this._confidence_score
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
      externalData: snapshot.externalData,
      // Ambient integration fields
      ambient_alert_id: snapshot.ambient_alert_id,
      source: snapshot.source,
      preview_url: snapshot.preview_url,
      deep_link_url: snapshot.deep_link_url,
      confidence_score: snapshot.confidence_score
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
      externalData: data.externalData,
      source: 'SITU8'
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
      zone: data.zone,
      source: 'MANUAL'
    });
  }

  static createFromAmbient(data: {
    ambient_alert_id: string;
    type: ActivityType;
    title: string;
    location: string;
    priority: Priority;
    created_by: string;
    preview_url?: string;
    deep_link_url?: string;
    confidence_score?: number;
    description?: string;
    building?: string;
    zone?: string;
    confidence?: number;
  }): Activity {
    return new Activity({
      id: `ambient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: data.type,
      title: data.title,
      location: data.location,
      priority: data.priority,
      status: 'detecting',
      created_by: data.created_by,
      description: data.description,
      building: data.building,
      zone: data.zone,
      confidence: data.confidence,
      // Ambient-specific fields
      source: 'AMBIENT',
      ambient_alert_id: data.ambient_alert_id,
      preview_url: data.preview_url,
      deep_link_url: data.deep_link_url,
      confidence_score: data.confidence_score
    });
  }
}