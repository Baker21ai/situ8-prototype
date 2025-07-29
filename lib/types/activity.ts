/**
 * Shared type definitions for activities and related entities
 */

import { Priority, Status, BusinessImpact } from '../utils/status';
import { ActivityType, ThreatLevel, SecurityLevel } from '../utils/security';

// Base activity interface
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
}

// Badge holder information
export interface BadgeHolder {
  name: string;
  id: string;
  department?: string;
  clearanceLevel?: SecurityLevel;
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
  type: 'single' | 'cluster';
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