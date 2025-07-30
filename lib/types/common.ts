/**
 * Common types shared across all entities in the Situ8 business logic system
 */

// User and role management types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  site_access: string[]; // Array of site IDs user can access
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  last_login?: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  can_create_activities: boolean;
  can_assign_activities: boolean;
  can_resolve_activities: boolean;
  can_create_incidents: boolean;
  can_assign_incidents: boolean;
  can_resolve_incidents: boolean;
  can_create_cases: boolean;
  can_manage_bols: boolean;
  can_view_audit_trail: boolean;
  sites_access: 'all' | 'assigned' | 'none';
}

export interface Permission {
  id: string;
  name: string;
  resource: string; // e.g., 'activity', 'incident', 'case', 'bol'
  action: string;   // e.g., 'create', 'read', 'update', 'delete'
}

// Location and site information
export interface Site {
  id: string;
  name: string;
  code: string;
  address: string;
  coordinates: Coordinates;
  timezone: string;
  security_level: 'low' | 'medium' | 'high' | 'critical';
  operational_hours: string;
  contact_info: ContactInfo;
  buildings: Building[];
  is_active: boolean;
}

export interface Building {
  id: string;
  site_id: string;
  name: string;
  code: string;
  floors: Floor[];
  zones: Zone[];
}

export interface Floor {
  id: string;
  building_id: string;
  number: number;
  name: string;
}

export interface Zone {
  id: string;
  building_id: string;
  floor_id?: string;
  name: string;
  type: 'public' | 'restricted' | 'secure' | 'emergency';
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ContactInfo {
  primary_phone: string;
  secondary_phone?: string;
  emergency_phone: string;
  email: string;
}

// Common status and priority types (re-exported for convenience)
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type EntityStatus = 'active' | 'inactive' | 'pending' | 'resolved' | 'archived';

// Universal timestamp interface
export interface Timestamps {
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

// Audit trail base interface
export interface AuditableEntity extends Timestamps {
  id: string;
}

// Search and filtering
export interface SearchFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'in';
  value: any;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationOptions;
}

// File attachment types
export interface Attachment {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  thumbnail_url?: string;
  uploaded_by: string;
  uploaded_at: Date;
  entity_type: 'activity' | 'incident' | 'case' | 'bol';
  entity_id: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  entity_type?: 'activity' | 'incident' | 'case' | 'bol';
  entity_id?: string;
  is_read: boolean;
  created_at: Date;
  expires_at?: Date;
}

// Comment/note system
export interface Comment {
  id: string;
  entity_type: 'activity' | 'incident' | 'case' | 'bol';
  entity_id: string;
  author: User;
  content: string;
  is_internal: boolean; // Internal notes vs external comments
  created_at: Date;
  updated_at: Date;
  parent_comment_id?: string; // For threaded comments
}

// Tag system
export interface Tag {
  id: string;
  name: string;
  color: string;
  type: 'system' | 'user';
  created_by?: string;
  usage_count: number;
}

// Configuration settings
export interface SystemConfiguration {
  retention_days: number;
  auto_incident_types: string[]; // Activity types that auto-create incidents
  pending_validation_minutes: number;
  escalation_minutes: number;
  max_sites_per_user: number;
  bol_confidence_thresholds: {
    low: number;
    medium: number;
    high: number;
  };
}