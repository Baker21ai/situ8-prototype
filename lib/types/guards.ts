/**
 * Type definitions for guard management and personnel
 */

export type GuardStatus = 'available' | 'responding' | 'patrolling' | 'investigating' | 'break' | 'off_duty';
export type ShiftType = 'day' | 'night' | 'swing';
export type SkillLevel = 'trainee' | 'junior' | 'senior' | 'supervisor' | 'manager';

// Guard information
export interface Guard {
  id: number | string;
  name: string;
  status: GuardStatus;
  location: string;
  building: string;
  zone: string;
  lastUpdate: Date;
  radio: string;
  assignedActivity?: number | string | null;
  badge: string;
  shift: string;
  department: string;
  skills?: string[];
  certifications?: Certification[];
  profilePhoto?: string;
  contactInfo?: GuardContactInfo;
  metrics?: GuardMetrics;
}

// Guard certifications
export interface Certification {
  name: string;
  issueDate: Date;
  expiryDate: Date;
  issuingAuthority: string;
  certificateNumber?: string;
}

// Guard contact information
export interface GuardContactInfo {
  phone: string;
  email?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

// Guard performance metrics
export interface GuardMetrics {
  activitiesCreated: number;
  incidentsResponded: number;
  patrolsCompleted: number;
  avgResponseTime: string;
  radioCalls: number;
  shiftsCompleted: number;
  commendations: number;
  incidents: number;
  rating?: number;
}

// Building/facility information
export interface Building {
  id: string;
  name: string;
  code: string;
  address: string;
  capacity: number;
  currentGuards: number;
  requiredGuards: number;
  zones: Zone[];
  floors: Floor[];
  securityLevel: string;
  operationalHours: string;
  manager?: string;
}

// Zone within a building
export interface Zone {
  id: string;
  name: string;
  building: string;
  floor?: string;
  type: 'public' | 'restricted' | 'secure' | 'critical';
  cameras: number;
  accessPoints: number;
  currentOccupancy?: number;
  maxOccupancy?: number;
}

// Floor information
export interface Floor {
  id: string;
  number: number;
  name: string;
  zones: string[];
  evacuationRoutes: number;
  emergencyExits: number;
}

// Guard assignment
export interface GuardAssignment {
  id: string;
  guardId: string;
  buildingId: string;
  zoneId?: string;
  startTime: Date;
  endTime?: Date;
  type: 'patrol' | 'stationary' | 'response' | 'special';
  instructions?: string;
  checkpoints?: Checkpoint[];
}

// Patrol checkpoint
export interface Checkpoint {
  id: string;
  name: string;
  location: string;
  scanRequired: boolean;
  lastScanned?: Date;
  expectedScanTime?: Date;
  notes?: string;
}

// Shift information
export interface Shift {
  id: string;
  name: string;
  type: ShiftType;
  startTime: string; // "08:00"
  endTime: string; // "16:00"
  days: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri"]
  guards: string[]; // Guard IDs
  minimumGuards: number;
}

// Guard roster/schedule
export interface GuardSchedule {
  guardId: string;
  schedule: ScheduleEntry[];
  totalHours: number;
  overtimeHours: number;
}

// Individual schedule entry
export interface ScheduleEntry {
  date: Date;
  shiftId: string;
  buildingId: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'absent' | 'late';
  actualStart?: Date;
  actualEnd?: Date;
  notes?: string;
}

// Guard team/squad
export interface GuardTeam {
  id: string;
  name: string;
  supervisor: string;
  members: string[]; // Guard IDs
  specialization?: string;
  coverage: {
    buildings: string[];
    shifts: string[];
  };
}