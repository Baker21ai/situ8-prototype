/**
 * Security-related utility functions for activity types, icons, and threat levels
 */

import { LucideIcon, Shield, AlertTriangle, Unlock, Flame, Heart, UserCheck, Ban, Eye, Settings, Users } from 'lucide-react';

export type ActivityType = 
  | 'TAILGATE' 
  | 'ARMED_PERSON' 
  | 'BREACH' 
  | 'FIRE' 
  | 'MEDICAL' 
  | 'PATROL' 
  | 'ACCESS_DENIED'
  | 'SUSPICIOUS_BEHAVIOR'
  | 'EQUIPMENT_FAULT'
  | 'CROWD_DETECTION';

export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type SecurityLevel = 'public' | 'restricted' | 'confidential' | 'secret' | 'top-secret';

export interface ActivityTypeInfo {
  icon: string;
  lucideIcon?: LucideIcon;
  label: string;
  color: string;
  threatLevel: ThreatLevel;
  category: 'security' | 'safety' | 'operational' | 'access';
}

/**
 * Get icon and metadata for activity type
 * @param type - Activity type
 * @returns Icon string and metadata
 */
export function getTypeIcon(type: ActivityType): string {
  const icons: Record<ActivityType, string> = {
    TAILGATE: '🚪',
    ARMED_PERSON: '⚠️',
    BREACH: '🔓',
    FIRE: '🔥',
    MEDICAL: '🏥',
    PATROL: '👮',
    ACCESS_DENIED: '🚫',
    SUSPICIOUS_BEHAVIOR: '👁️',
    EQUIPMENT_FAULT: '⚙️',
    CROWD_DETECTION: '👥'
  };

  return icons[type] || '📋';
}

/**
 * Get comprehensive activity type information
 * @param type - Activity type
 * @returns Detailed activity type information
 */
export function getActivityTypeInfo(type: ActivityType): ActivityTypeInfo {
  const typeInfo: Record<ActivityType, ActivityTypeInfo> = {
    TAILGATE: {
      icon: '🚪',
      lucideIcon: Shield,
      label: 'Tailgating',
      color: 'text-orange-600',
      threatLevel: 'high',
      category: 'security'
    },
    ARMED_PERSON: {
      icon: '⚠️',
      lucideIcon: AlertTriangle,
      label: 'Armed Person',
      color: 'text-red-600',
      threatLevel: 'critical',
      category: 'security'
    },
    BREACH: {
      icon: '🔓',
      lucideIcon: Unlock,
      label: 'Security Breach',
      color: 'text-red-600',
      threatLevel: 'critical',
      category: 'security'
    },
    FIRE: {
      icon: '🔥',
      lucideIcon: Flame,
      label: 'Fire Alert',
      color: 'text-red-600',
      threatLevel: 'critical',
      category: 'safety'
    },
    MEDICAL: {
      icon: '🏥',
      lucideIcon: Heart,
      label: 'Medical Emergency',
      color: 'text-red-600',
      threatLevel: 'high',
      category: 'safety'
    },
    PATROL: {
      icon: '👮',
      lucideIcon: UserCheck,
      label: 'Patrol Activity',
      color: 'text-blue-600',
      threatLevel: 'none',
      category: 'operational'
    },
    ACCESS_DENIED: {
      icon: '🚫',
      lucideIcon: Ban,
      label: 'Access Denied',
      color: 'text-yellow-600',
      threatLevel: 'medium',
      category: 'access'
    },
    SUSPICIOUS_BEHAVIOR: {
      icon: '👁️',
      lucideIcon: Eye,
      label: 'Suspicious Behavior',
      color: 'text-orange-600',
      threatLevel: 'medium',
      category: 'security'
    },
    EQUIPMENT_FAULT: {
      icon: '⚙️',
      lucideIcon: Settings,
      label: 'Equipment Fault',
      color: 'text-gray-600',
      threatLevel: 'low',
      category: 'operational'
    },
    CROWD_DETECTION: {
      icon: '👥',
      lucideIcon: Users,
      label: 'Crowd Detected',
      color: 'text-purple-600',
      threatLevel: 'medium',
      category: 'security'
    }
  };

  return typeInfo[type] || {
    icon: '📋',
    label: 'Unknown Activity',
    color: 'text-gray-600',
    threatLevel: 'low',
    category: 'operational'
  };
}

/**
 * Get threat level color and styling
 * @param level - Threat level
 * @returns Styling information
 */
export function getThreatLevelStyle(level: ThreatLevel) {
  const styles: Record<ThreatLevel, { color: string; bgColor: string; animate: boolean }> = {
    none: {
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      animate: false
    },
    low: {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      animate: false
    },
    medium: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      animate: false
    },
    high: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      animate: true
    },
    critical: {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      animate: true
    }
  };

  return styles[level] || styles.none;
}

/**
 * Get security clearance level information
 * @param level - Security clearance level
 * @returns Security level information
 */
export function getSecurityLevelInfo(level: SecurityLevel) {
  const levels: Record<SecurityLevel, { label: string; color: string; icon: string }> = {
    'public': {
      label: 'Public',
      color: 'text-gray-600',
      icon: '🟢'
    },
    'restricted': {
      label: 'Restricted',
      color: 'text-yellow-600',
      icon: '🟡'
    },
    'confidential': {
      label: 'Confidential',
      color: 'text-orange-600',
      icon: '🟠'
    },
    'secret': {
      label: 'Secret',
      color: 'text-red-600',
      icon: '🔴'
    },
    'top-secret': {
      label: 'Top Secret',
      color: 'text-purple-600',
      icon: '🟣'
    }
  };

  return levels[level] || levels.public;
}

/**
 * Calculate overall threat score from multiple factors
 * @param factors - Object containing various threat factors
 * @returns Numeric threat score (0-100)
 */
export function calculateThreatScore(factors: {
  activityType: ActivityType;
  confidence?: number;
  multipleDetections?: boolean;
  timeOfDay?: 'day' | 'night';
  location?: 'perimeter' | 'restricted' | 'public';
}) {
  let score = 0;
  
  // Base score from activity type
  const typeInfo = getActivityTypeInfo(factors.activityType);
  const threatLevelScores: Record<ThreatLevel, number> = {
    none: 0,
    low: 20,
    medium: 40,
    high: 60,
    critical: 80
  };
  score += threatLevelScores[typeInfo.threatLevel];
  
  // Adjust for confidence
  if (factors.confidence && factors.confidence > 90) {
    score += 10;
  }
  
  // Adjust for multiple detections
  if (factors.multipleDetections) {
    score += 15;
  }
  
  // Adjust for time of day
  if (factors.timeOfDay === 'night') {
    score += 10;
  }
  
  // Adjust for location
  if (factors.location === 'restricted') {
    score += 15;
  } else if (factors.location === 'perimeter') {
    score += 10;
  }
  
  return Math.min(100, score);
}

/**
 * Group activities by category
 * @param activities - Array of activity types
 * @returns Grouped activities
 */
export function groupActivitiesByCategory(activities: ActivityType[]) {
  const groups: Record<string, ActivityType[]> = {
    security: [],
    safety: [],
    operational: [],
    access: []
  };
  
  activities.forEach(type => {
    const info = getActivityTypeInfo(type);
    groups[info.category].push(type);
  });
  
  return groups;
}

/**
 * Get activity category color
 * @param category - Activity category
 * @returns Tailwind color class
 */
export function getCategoryColor(category: 'security' | 'safety' | 'operational' | 'access') {
  const colors = {
    security: 'text-red-600',
    safety: 'text-orange-600',
    operational: 'text-blue-600',
    access: 'text-purple-600'
  };
  
  return colors[category] || 'text-gray-600';
}