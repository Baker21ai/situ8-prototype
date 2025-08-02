/**
 * 🎯 ENTERPRISE ACTIVITY TYPE CONFIGURATION
 * 
 * This is your "Universal Translator" for all activity types!
 * Think of it as a "Rosetta Stone" that maps external system types
 * to your internal business logic.
 * 
 * 🚀 SCALING STRATEGY:
 * - Add new types without touching core validation
 * - Map external types to internal categories
 * - Configure business rules per type
 * - Handle AI and access control integrations
 */

export interface ActivityTypeConfig {
  // Internal canonical name (what your system uses)
  internalType: string;
  
  // Display name for UI
  displayName: string;
  
  // External system mappings (the "translation table")
  externalMappings: {
    // Lenel Access Control mappings
    lenel?: string[];
    // Ambient AI mappings  
    ambientAI?: string[];
    // Manual/UI mappings
    manual?: string[];
    // Future integrations
    [systemName: string]: string[] | undefined;
  };
  
  // Business logic configuration
  businessRules: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    autoCreateIncident: boolean;
    requiresResponse: boolean;
    escalationTimeMinutes: number;
    tags: string[];
  };
  
  // Validation rules
  validation: {
    requiredFields: string[];
    optionalFields: string[];
  };
}

/**
 * 🏗️ THE MASTER CONFIGURATION
 * This is your "Activity Type Bible" - the single source of truth!
 */
export const ACTIVITY_TYPE_REGISTRY: Record<string, ActivityTypeConfig> = {
  // 🚨 SECURITY CATEGORY
  'security-breach': {
    internalType: 'security-breach',
    displayName: 'Security Breach',
    externalMappings: {
      lenel: ['ACCESS_DENIED', 'FORCED_ENTRY', 'TAILGATE', 'CARD_CLONING'],
      ambientAI: ['UNAUTHORIZED_PERSON', 'SUSPICIOUS_BEHAVIOR', 'WEAPON_DETECTED'],
      manual: ['security-breach', 'breach']
    },
    businessRules: {
      priority: 'critical',
      autoCreateIncident: true,
      requiresResponse: true,
      escalationTimeMinutes: 5,
      tags: ['security', 'urgent', 'response-required']
    },
    validation: {
      requiredFields: ['location', 'timestamp', 'description'],
      optionalFields: ['confidence', 'evidence_urls']
    }
  },

  // 🚶 ACCESS CONTROL CATEGORY  
  'access-violation': {
    internalType: 'access-violation',
    displayName: 'Access Violation',
    externalMappings: {
      lenel: ['TAILGATE', 'PIGGYBACKING', 'INVALID_CARD', 'EXPIRED_ACCESS'],
      ambientAI: ['TAILGATING_DETECTED', 'UNAUTHORIZED_ENTRY'],
      manual: ['access-violation', 'tailgate']
    },
    businessRules: {
      priority: 'high',
      autoCreateIncident: true,
      requiresResponse: true,
      escalationTimeMinutes: 10,
      tags: ['access-control', 'violation', 'investigate']
    },
    validation: {
      requiredFields: ['location', 'timestamp', 'access_point'],
      optionalFields: ['card_id', 'person_id', 'confidence']
    }
  },

  // 🤖 AI DETECTION CATEGORY
  'ai-alert': {
    internalType: 'ai-alert',
    displayName: 'AI Detection Alert',
    externalMappings: {
      ambientAI: ['PERSON_DETECTED', 'OBJECT_DETECTED', 'BEHAVIOR_ANOMALY', 'CROWD_DETECTED'],
      lenel: [], // Lenel doesn't generate AI alerts
      manual: ['ai-alert', 'detection']
    },
    businessRules: {
      priority: 'medium',
      autoCreateIncident: false, // AI generates many alerts
      requiresResponse: false,
      escalationTimeMinutes: 30,
      tags: ['ai-generated', 'detection', 'review']
    },
    validation: {
      requiredFields: ['location', 'timestamp', 'confidence'],
      optionalFields: ['detection_type', 'image_url', 'metadata']
    }
  },

  // 🚨 TRADITIONAL CATEGORIES (existing)
  'alert': {
    internalType: 'alert',
    displayName: 'General Alert',
    externalMappings: {
      lenel: ['ALARM_TRIGGERED', 'DOOR_HELD_OPEN'],
      ambientAI: ['GENERAL_ALERT'],
      manual: ['alert', 'general']
    },
    businessRules: {
      priority: 'medium',
      autoCreateIncident: false,
      requiresResponse: true,
      escalationTimeMinutes: 15,
      tags: ['alert', 'general']
    },
    validation: {
      requiredFields: ['location', 'timestamp'],
      optionalFields: ['description', 'severity']
    }
  },

  'patrol': {
    internalType: 'patrol',
    displayName: 'Security Patrol',
    externalMappings: {
      lenel: ['PATROL_CHECKPOINT'],
      ambientAI: [],
      manual: ['patrol', 'checkpoint']
    },
    businessRules: {
      priority: 'low',
      autoCreateIncident: false,
      requiresResponse: false,
      escalationTimeMinutes: 60,
      tags: ['patrol', 'routine']
    },
    validation: {
      requiredFields: ['location', 'timestamp', 'officer_id'],
      optionalFields: ['checkpoint_id', 'notes']
    }
  },

  'medical': {
    internalType: 'medical',
    displayName: 'Medical Emergency',
    externalMappings: {
      lenel: ['MEDICAL_ALARM'],
      ambientAI: ['PERSON_DOWN', 'MEDICAL_EMERGENCY'],
      manual: ['medical', 'emergency']
    },
    businessRules: {
      priority: 'critical',
      autoCreateIncident: true,
      requiresResponse: true,
      escalationTimeMinutes: 2,
      tags: ['medical', 'emergency', 'critical']
    },
    validation: {
      requiredFields: ['location', 'timestamp'],
      optionalFields: ['severity', 'responder_id']
    }
  },

  'property-damage': {
    internalType: 'property-damage',
    displayName: 'Property Damage',
    externalMappings: {
      lenel: ['VANDALISM_DETECTED'],
      ambientAI: ['DAMAGE_DETECTED', 'VANDALISM'],
      manual: ['property-damage', 'damage']
    },
    businessRules: {
      priority: 'medium',
      autoCreateIncident: true,
      requiresResponse: true,
      escalationTimeMinutes: 20,
      tags: ['property', 'damage', 'investigate']
    },
    validation: {
      requiredFields: ['location', 'timestamp'],
      optionalFields: ['damage_type', 'estimated_cost']
    }
  },

  'evidence': {
    internalType: 'evidence',
    displayName: 'Evidence Collection',
    externalMappings: {
      lenel: [],
      ambientAI: ['EVIDENCE_CAPTURED'],
      manual: ['evidence', 'collection']
    },
    businessRules: {
      priority: 'medium',
      autoCreateIncident: false,
      requiresResponse: false,
      escalationTimeMinutes: 120,
      tags: ['evidence', 'documentation']
    },
    validation: {
      requiredFields: ['location', 'timestamp', 'evidence_type'],
      optionalFields: ['case_id', 'officer_id', 'chain_of_custody']
    }
  },

  'bol-event': {
    internalType: 'bol-event',
    displayName: 'Be On Lookout Event',
    externalMappings: {
      lenel: [],
      ambientAI: ['PERSON_OF_INTEREST', 'VEHICLE_OF_INTEREST'],
      manual: ['bol-event', 'bolo']
    },
    businessRules: {
      priority: 'high',
      autoCreateIncident: true,
      requiresResponse: true,
      escalationTimeMinutes: 5,
      tags: ['bol', 'person-of-interest', 'urgent']
    },
    validation: {
      requiredFields: ['location', 'timestamp', 'subject_description'],
      optionalFields: ['photo_url', 'last_seen', 'case_reference']
    }
  }
};

/**
 * 🔄 ACTIVITY TYPE MAPPER
 * This is your "Universal Translator" function!
 */
export class ActivityTypeMapper {
  /**
   * Maps external system activity type to internal type
   * @param externalType - The type from external system (e.g., "ACCESS_DENIED")
   * @param systemName - The source system (e.g., "lenel", "ambientAI")
   * @returns Internal activity type or null if not found
   */
  static mapExternalToInternal(externalType: string, systemName: string): string | null {
    for (const [internalType, config] of Object.entries(ACTIVITY_TYPE_REGISTRY)) {
      const mappings = config.externalMappings[systemName];
      if (mappings && mappings.includes(externalType)) {
        return internalType;
      }
    }
    return null;
  }

  /**
   * Gets all valid internal activity types
   */
  static getAllValidTypes(): string[] {
    return Object.keys(ACTIVITY_TYPE_REGISTRY);
  }

  /**
   * Gets configuration for an activity type
   */
  static getConfig(internalType: string): ActivityTypeConfig | null {
    return ACTIVITY_TYPE_REGISTRY[internalType] || null;
  }

  /**
   * Gets business rules for an activity type
   */
  static getBusinessRules(internalType: string) {
    const config = this.getConfig(internalType);
    return config?.businessRules || null;
  }
}

/**
 * 🎯 USAGE EXAMPLES:
 * 
 * // When Lenel sends "ACCESS_DENIED":
 * const internalType = ActivityTypeMapper.mapExternalToInternal("ACCESS_DENIED", "lenel");
 * // Returns: "security-breach"
 * 
 * // When Ambient AI sends "TAILGATING_DETECTED":
 * const internalType = ActivityTypeMapper.mapExternalToInternal("TAILGATING_DETECTED", "ambientAI");
 * // Returns: "access-violation"
 * 
 * // Get all valid types for validation:
 * const validTypes = ActivityTypeMapper.getAllValidTypes();
 * // Returns: ["security-breach", "access-violation", "ai-alert", ...]
 */