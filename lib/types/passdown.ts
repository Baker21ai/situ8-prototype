/**
 * TypeScript Type Definitions for Passdowns Module
 * 
 * These types define the data structures for shift communication handoffs
 * with multi-tenant support and integration with other Situ8 modules
 */

import { Priority, User, Timestamps } from './common';

// Main passdown entity
export interface Passdown extends Timestamps {
  id: string;
  companyId: string; // Multi-tenant isolation
  
  // Shift information
  authorId: string;
  authorName: string;
  fromShift: ShiftType;
  toShift: ShiftType;
  shiftDate: string; // ISO date string
  locationId: string;
  locationName?: string;
  
  // Content
  title: string;
  notes: string;
  urgencyLevel: UrgencyLevel;
  
  // Status tracking
  status: PassdownStatus;
  acknowledgmentRequired: boolean;
  
  // Related entities
  relatedActivities?: string[];
  relatedBOLs?: string[];
  relatedIncidents?: string[];
  relatedCases?: string[];
  attachments?: PassdownAttachment[];
  
  // Metadata
  tags?: string[];
  readReceipts?: PassdownReceipt[];
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

// Shift types based on typical security operations
export type ShiftType = 
  | 'night'      // 11 PM - 7 AM
  | 'day'        // 7 AM - 3 PM
  | 'evening'    // 3 PM - 11 PM
  | 'swing'      // Variable/rotating
  | 'custom';    // Custom defined shifts

// Urgency levels for passdowns
export type UrgencyLevel = 
  | 'low'        // Informational only
  | 'medium'     // Should be aware
  | 'high'       // Requires attention
  | 'critical';  // Immediate action required

// Passdown lifecycle status
export type PassdownStatus = 
  | 'draft'         // Being created
  | 'active'        // Published and visible
  | 'acknowledged'  // Read and acknowledged by recipient
  | 'expired'       // Past relevance date
  | 'archived';     // Archived for records

// Read receipt tracking
export interface PassdownReceipt {
  passdownId: string;
  userId: string;
  userName: string;
  companyId: string;
  readAt: string; // ISO timestamp
  acknowledged: boolean;
  acknowledgedAt?: string;
  notes?: string; // Optional acknowledgment notes
}

// File attachment metadata
export interface PassdownAttachment {
  id: string; // Changed from attachmentId for consistency
  attachmentId?: string; // Backwards compatibility
  passdownId: string;
  companyId: string;
  fileName: string;
  fileSize: number; // bytes
  fileType: string; // Changed from mimeType for consistency
  mimeType?: string; // Backwards compatibility
  s3Key: string;
  s3Bucket: string;
  s3Url?: string; // Pre-signed URL
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  description?: string;
}

// Create passdown request
export interface CreatePassdownRequest {
  fromShift: ShiftType;
  toShift: ShiftType;
  shiftDate: string;
  locationId: string;
  title: string;
  notes: string;
  urgencyLevel: UrgencyLevel;
  acknowledgmentRequired?: boolean;
  relatedActivities?: string[];
  relatedBOLs?: string[];
  relatedIncidents?: string[];
  relatedCases?: string[];
  tags?: string[];
}

// Update passdown request
export interface UpdatePassdownRequest {
  title?: string;
  notes?: string;
  urgencyLevel?: UrgencyLevel;
  status?: PassdownStatus;
  acknowledgmentRequired?: boolean;
  relatedActivities?: string[];
  relatedBOLs?: string[];
  relatedIncidents?: string[];
  relatedCases?: string[];
  tags?: string[];
}

// Passdown filters for queries
export interface PassdownFilters {
  companyId?: string;
  shiftDate?: string;
  fromShift?: ShiftType;
  toShift?: ShiftType;
  urgencyLevel?: UrgencyLevel;
  status?: PassdownStatus;
  locationId?: string;
  authorId?: string;
  hasAttachments?: boolean;
  requiresAcknowledgment?: boolean;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  tags?: string[];
}

// Passdown summary for list views
export interface PassdownSummary {
  id: string;
  title: string;
  fromShift: ShiftType;
  toShift: ShiftType;
  shiftDate: string;
  urgencyLevel: UrgencyLevel;
  status: PassdownStatus;
  authorName: string;
  locationName: string;
  hasAttachments: boolean;
  readCount: number;
  acknowledgmentCount: number;
  createdAt: string;
  preview?: string; // First 200 chars of notes
}

// Passdown statistics
export interface PassdownStats {
  total: number;
  byStatus: Record<PassdownStatus, number>;
  byUrgency: Record<UrgencyLevel, number>;
  byShift: Record<ShiftType, number>;
  todayCount: number;
  pendingAcknowledgment: number;
  recentlyCreated: number; // Last 24 hours
  attachmentCount: number;
}

// Shift schedule configuration
export interface ShiftSchedule {
  shiftType: ShiftType;
  startTime: string; // 24hr format "HH:mm"
  endTime: string;
  days: string[]; // Days of week
  timezone: string;
}

// Notification preferences
export interface PassdownNotificationPrefs {
  userId: string;
  companyId: string;
  notifyNewPassdown: boolean;
  notifyUrgentOnly: boolean;
  notifyShifts: ShiftType[];
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
}

// API Response types
export interface PassdownListResponse {
  passdowns: PassdownSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  stats?: PassdownStats;
}

export interface PassdownDetailResponse {
  passdown: Passdown;
  readReceipts: PassdownReceipt[];
  relatedData?: {
    activities?: any[]; // Import actual Activity type
    bols?: any[]; // Import actual BOL type
    incidents?: any[]; // Import actual Incident type
    cases?: any[]; // Import actual Case type
  };
}

// Validation helpers
export const PASSDOWN_VALIDATION = {
  TITLE_MAX_LENGTH: 200,
  NOTES_MAX_LENGTH: 5000,
  TAGS_MAX_COUNT: 10,
  ATTACHMENTS_MAX_COUNT: 10,
  ATTACHMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// Default values
export const DEFAULT_PASSDOWN_VALUES = {
  urgencyLevel: 'medium' as UrgencyLevel,
  status: 'draft' as PassdownStatus,
  acknowledgmentRequired: false,
} as const;