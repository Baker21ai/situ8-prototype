/**
 * Shared type definitions for activities and related entities
 */

import { Priority, Status, BusinessImpact } from '../utils/status';
import { ActivityType, ThreatLevel as _ThreatLevel, SecurityLevel } from '../utils/security';

// Base activity interface with business logic compliance
export interface BaseActivity {
  id: string;
  timestamp: Date;
  type: ActivityType;
  title: string;
  location: string;
  priority: Priority;
  status: Status;
  description?: string;
  assignedTo?: string;
  relativeTime?: string;
  
  // Business logic required fields
  created_at: Date;
  updated_at: Date;
  created_by: string; // User ID who created the activity
  updated_by: string; // User ID who last updated the activity
  
  // Source system tracking
  source?: 'AMBIENT' | 'SITU8' | 'MANUAL';
  
  // Auto-tagging system
  system_tags: string[]; // Auto-generated tags based on type/location/etc
  user_tags: string[];   // Manual tags added by users
  
  // Multi-incident support
  incident_contexts: string[]; // Array of incident IDs this activity belongs to
  
  // Retention and archiving
  retention_date: Date; // 30 days from creation
  is_archived: boolean;
  archive_reason?: string;
  
  // Role-based permissions for status changes
  allowed_status_transitions: Status[]; // Based on user role
  requires_approval: boolean; // For certain status changes
}

// Standard activity data
export interface ActivityData extends BaseActivity {
  zone?: string;
  building?: string;
  floor?: string;
  confidence?: number;
  detectedObjects?: string[];
  badgeHolder?: BadgeHolder;
  respondingUnits?: string[];
  gifUrl?: string;
  thumbnailUrl?: string;
  cameraId?: string;
  isBoloActive?: boolean;
  isNewActivity?: boolean;
  caseRelevance?: string;
  evidenceNumber?: number;
  caseTimeOffset?: string;
  time?: Date;
  evidence?: Evidence[];
  camera?: string;
}

// External system data interface
export interface ExternalSystemData {
  sourceSystem: string;
  originalType: string;
  rawPayload: Record<string, any>;
  processingTimestamp: string;
  mappingUsed: string;
  originalEvent: Record<string, any>;
}

// Enterprise activity with enhanced metadata
export interface EnterpriseActivity extends ActivityData {
  sector?: string;
  cameraName?: string;
  additionalCameras?: string[];
  isMassCasualty?: boolean;
  isSecurityThreat?: boolean;
  isOperationalImpact?: boolean;
  correlatedActivities?: string[];
  aiProcessingTime?: number;
  confidenceScore?: number;
  falsePositiveLikelihood?: number;
  escalationLevel?: number;
  departmentNotified?: string[];
  externalAgencies?: string[];
  complianceFlags?: string[];
  businessImpact?: BusinessImpact;
  metadata?: SiteMetadata;
  threatLevel?: string;
  clusterInfo?: {
    count: number;
    activities: string[];
  };
  // 🎯 RAW EXTERNAL SYSTEM DATA
  externalData?: ExternalSystemData;
  
  // 🎯 AMBIENT.AI INTEGRATION FIELDS
  ambient_alert_id?: string;
  source?: 'AMBIENT' | 'SITU8' | 'MANUAL';
  preview_url?: string;
  deep_link_url?: string;
  confidence_score?: number;
}

// Badge holder information
export interface BadgeHolder {
  name: string;
  id: string;
  department?: string;
  clearanceLevel?: SecurityLevel | string;
  photo?: string;
}

// Site metadata
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

// Geographic coordinates
export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

// Contact information
export interface ContactInfo {
  primary: string;
  secondary?: string;
  emergency: string;
}

// Activity cluster for grouped activities
export interface ActivityCluster {
  id: string;
  clusterType: 'single' | 'cluster';
  type: ActivityType;
  activities: (ActivityData | EnterpriseActivity)[];
  representative: ActivityData | EnterpriseActivity;
  count: number;
  highestPriority: Priority;
  location: string;
  building?: string;
  zone?: string;
  title?: string;
  description?: string;
  timeRange: TimeRange;
  isExpanded?: boolean;
  timestamp: Date;
  priority: Priority;
  status: Status;
}

// Time range
export interface TimeRange {
  start: Date;
  end: Date;
  duration?: number;
}

// Activity filter options
export interface ActivityFilters {
  priority?: Priority[];
  status?: Status[];
  type?: ActivityType[];
  building?: string[];
  timeRange?: TimeRange;
  assigned?: boolean;
  hasEvidence?: boolean;
  searchQuery?: string;
}

// Activity statistics
export interface ActivityStats {
  total: number;
  byPriority: Record<Priority, number>;
  byStatus: Record<Status, number>;
  byType: Record<ActivityType, number>;
  responseTime: {
    average: number;
    min: number;
    max: number;
  };
  resolutionRate: number;
}

// Evidence attachment
export interface Evidence {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnail?: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

// Activity update/action
export interface ActivityAction {
  type: 'assign' | 'update_status' | 'add_note' | 'escalate' | 'resolve' | 'archive';
  activityId: string;
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
  comment?: string;
}

// Activity timeline entry
export interface ActivityTimelineEntry {
  id: string;
  activityId: string;
  timestamp: Date;
  type: 'created' | 'updated' | 'assigned' | 'status_changed' | 'commented' | 'resolved';
  user: string;
  description: string;
  metadata?: Record<string, any>;
}

// Type alias for component compatibility
export type EnterpriseActivityData = EnterpriseActivity;