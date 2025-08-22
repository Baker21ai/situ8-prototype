/**
 * Mock Ambient.AI Alert Data Structure
 * Based on Ambient.AI webhook specifications and security operations requirements
 */

// Example Ambient.AI Webhook Alert Payload
const ambientAlertExample = {
    // Core Alert Identification
    alertId: "ambient_alert_20250122_142315_001",
    deviceId: "ambient_device_main_entrance_01",
    timestamp: "2025-01-22T14:23:15.342Z",
    alertType: "weapon_detection",
    
    // Detection Details
    detection: {
        confidence: 0.94,
        objectType: "weapon",
        subType: "handgun",
        boundingBox: {
            x: 342,
            y: 186,
            width: 48,
            height: 72
        },
        tracking: {
            trackId: "track_001_weapon",
            duration: 2.3, // seconds
            isTracking: true
        }
    },
    
    // Location Context
    location: {
        siteName: "Situ8 Corporate Campus",
        siteId: "situ8_hq_001",
        zoneName: "Main Entrance",
        zoneId: "zone_main_entrance",
        deviceName: "Main Entrance Security Camera",
        coordinates: {
            latitude: 37.7749,
            longitude: -122.4194
        }
    },
    
    // Visual Evidence
    evidence: {
        imageUrl: "https://ambient-evidence.s3.amazonaws.com/alerts/20250122/142315_001_full.jpg",
        thumbnailUrl: "https://ambient-evidence.s3.amazonaws.com/alerts/20250122/142315_001_thumb.jpg",
        videoClipUrl: "https://ambient-evidence.s3.amazonaws.com/alerts/20250122/142315_001_clip.mp4",
        liveStreamUrl: "rtsp://ambient-stream.situ8.com:554/main_entrance_01",
        annotatedImageUrl: "https://ambient-evidence.s3.amazonaws.com/alerts/20250122/142315_001_annotated.jpg"
    },
    
    // Alert Priority & Classification
    priority: "critical",
    severity: 9,
    category: "security_threat",
    tags: ["weapon", "entrance", "immediate_response"],
    
    // AI Analysis
    aiAnalysis: {
        description: "High-confidence weapon detection at main entrance. Object appears to be a handgun in subject's right hand.",
        riskAssessment: "IMMEDIATE",
        recommendedActions: [
            "immediate_guard_dispatch",
            "lockdown_consideration", 
            "emergency_notification",
            "law_enforcement_contact"
        ],
        falsePositiveRisk: 0.06,
        contextualFactors: [
            "business_hours",
            "high_traffic_area",
            "no_authorized_personnel_nearby"
        ]
    },
    
    // Webhook & Integration
    webhook: {
        eventType: "alert.created",
        webhookVersion: "2.1",
        retryCount: 0,
        signature: "sha256=a3c8d9e7f2b1a5c6d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1"
    },
    
    // Situ8 Custom Fields (Added by our system)
    situ8: {
        internalAlertId: "SITU8_2025_0122_001",
        status: "detected", // detected, pending_approval, in_progress, resolved
        assignedGuard: null,
        assignedAt: null,
        sopTriggered: true,
        sopActions: [
            {
                action: "dispatch_nearest_guard",
                status: "pending",
                estimatedExecutionTime: 30 // seconds
            },
            {
                action: "notify_supervisor",
                status: "pending", 
                estimatedExecutionTime: 5
            },
            {
                action: "prepare_lockdown_protocol",
                status: "pending",
                estimatedExecutionTime: 60
            }
        ],
        escalationLevel: 1,
        createdAt: "2025-01-22T14:23:15.342Z",
        updatedAt: "2025-01-22T14:23:15.342Z",
        notes: [],
        compliance: {
            requiresDocumentation: true,
            retentionPeriod: "7_years",
            reportingRequired: ["security_incident", "weapons_log"]
        }
    }
};

// Different Alert Types Examples
const alertTypeExamples = {
    
    // Weapon Detection
    weaponDetection: {
        alertType: "weapon_detection",
        detection: {
            objectType: "weapon",
            subType: "handgun",
            confidence: 0.94
        },
        priority: "critical",
        severity: 9,
        aiAnalysis: {
            recommendedActions: ["immediate_guard_dispatch", "lockdown_consideration", "law_enforcement_contact"]
        }
    },
    
    // Perimeter Breach
    perimeterBreach: {
        alertType: "perimeter_breach",
        detection: {
            objectType: "person",
            subType: "unauthorized_entry",
            confidence: 0.91
        },
        priority: "critical",
        severity: 8,
        aiAnalysis: {
            recommendedActions: ["guard_dispatch", "perimeter_check", "access_control_review"]
        }
    },
    
    // Loitering
    loitering: {
        alertType: "loitering",
        detection: {
            objectType: "person",
            subType: "extended_presence",
            confidence: 0.89,
            tracking: {
                duration: 1500 // 25 minutes
            }
        },
        priority: "critical", // escalated due to duration
        severity: 7,
        aiAnalysis: {
            recommendedActions: ["guard_patrol", "verbal_warning", "area_monitoring"]
        }
    },
    
    // Tailgating
    tailgating: {
        alertType: "tailgating",
        detection: {
            objectType: "multiple_persons",
            subType: "unauthorized_access",
            confidence: 0.88,
            personCount: 2
        },
        priority: "high",
        severity: 6,
        aiAnalysis: {
            recommendedActions: ["access_verification", "guard_notification", "entry_log_review"]
        }
    },
    
    // Unauthorized Access
    unauthorizedAccess: {
        alertType: "unauthorized_access",
        detection: {
            objectType: "person",
            subType: "restricted_area_entry",
            confidence: 0.87
        },
        priority: "high",
        severity: 7,
        aiAnalysis: {
            recommendedActions: ["immediate_verification", "area_secure", "access_review"]
        }
    },
    
    // Crowd Gathering
    crowdGathering: {
        alertType: "crowd_gathering",
        detection: {
            objectType: "crowd",
            subType: "unusual_gathering",
            confidence: 0.82,
            personCount: 15
        },
        priority: "high",
        severity: 5,
        aiAnalysis: {
            recommendedActions: ["area_monitoring", "crowd_assessment", "emergency_preparedness"]
        }
    },
    
    // Vehicle Related
    vehicleAlert: {
        alertType: "vehicle_alert",
        detection: {
            objectType: "vehicle",
            subType: "unauthorized_parking",
            confidence: 0.85,
            licensePlate: "ABC123"
        },
        priority: "medium",
        severity: 4,
        aiAnalysis: {
            recommendedActions: ["parking_verification", "vehicle_log_check", "towing_consideration"]
        }
    },
    
    // Suspicious Behavior
    suspiciousBehavior: {
        alertType: "suspicious_behavior",
        detection: {
            objectType: "person",
            subType: "unusual_activity",
            confidence: 0.76
        },
        priority: "medium",
        severity: 4,
        aiAnalysis: {
            recommendedActions: ["behavioral_assessment", "continued_monitoring", "guard_awareness"]
        }
    },
    
    // After Hours Activity
    afterHoursActivity: {
        alertType: "after_hours_activity",
        detection: {
            objectType: "person",
            subType: "unauthorized_presence",
            confidence: 0.83
        },
        priority: "high",
        severity: 6,
        aiAnalysis: {
            recommendedActions: ["immediate_verification", "access_check", "security_sweep"]
        }
    },
    
    // PPE Violation
    ppeViolation: {
        alertType: "ppe_violation",
        detection: {
            objectType: "person",
            subType: "missing_ppe",
            confidence: 0.79,
            missingItems: ["safety_helmet", "high_vis_vest"]
        },
        priority: "low",
        severity: 3,
        aiAnalysis: {
            recommendedActions: ["safety_reminder", "ppe_provision", "compliance_log"]
        }
    }
};

// Status Progression Examples
const statusProgression = {
    detected: {
        status: "detected",
        description: "Alert just received from Ambient.AI",
        availableActions: ["assign_guard", "execute_sop", "manual_review", "dismiss"],
        nextStatuses: ["pending_approval", "in_progress", "resolved"]
    },
    
    pending_approval: {
        status: "pending_approval", 
        description: "SOP actions suggested, awaiting human approval",
        availableActions: ["approve_sop", "reject_sop", "modify_sop", "escalate"],
        nextStatuses: ["in_progress", "detected", "resolved"]
    },
    
    in_progress: {
        status: "in_progress",
        description: "Guard dispatched or actively responding",
        availableActions: ["update_status", "request_backup", "escalate", "communicate"],
        nextStatuses: ["resolved", "escalated"]
    },
    
    resolved: {
        status: "resolved",
        description: "Incident resolved with documented outcome",
        availableActions: ["view_report", "reopen", "archive"],
        nextStatuses: ["detected"] // for reopening
    }
};

// SOP (Standard Operating Procedure) Examples
const sopExamples = {
    weapon_detection: {
        title: "Weapon Detection Response Protocol",
        priority: "critical",
        steps: [
            {
                order: 1,
                action: "immediate_assessment",
                description: "Verify threat via camera review",
                timeLimit: 30, // seconds
                autoExecute: true
            },
            {
                order: 2,
                action: "dispatch_nearest_guard",
                description: "Deploy closest available security personnel",
                timeLimit: 60,
                autoExecute: false, // requires approval
                requiredRoles: ["security_supervisor"]
            },
            {
                order: 3,
                action: "notify_law_enforcement",
                description: "Contact local police department",
                timeLimit: 120,
                autoExecute: false,
                requiredRoles: ["security_supervisor", "facility_manager"]
            },
            {
                order: 4,
                action: "initiate_lockdown",
                description: "Secure facility if threat confirmed",
                timeLimit: 180,
                autoExecute: false,
                requiredRoles: ["facility_manager"]
            }
        ]
    },
    
    perimeter_breach: {
        title: "Perimeter Breach Response",
        priority: "critical",
        steps: [
            {
                order: 1,
                action: "verify_breach",
                description: "Confirm unauthorized entry",
                timeLimit: 60,
                autoExecute: true
            },
            {
                order: 2,
                action: "dispatch_patrol",
                description: "Send guard to breach location",
                timeLimit: 120,
                autoExecute: true
            },
            {
                order: 3,
                action: "secure_perimeter",
                description: "Check for additional breach points",
                timeLimit: 300,
                autoExecute: false
            }
        ]
    },
    
    loitering: {
        title: "Loitering Response Protocol",
        priority: "high",
        steps: [
            {
                order: 1,
                action: "assess_duration",
                description: "Determine how long person has been present",
                timeLimit: 60,
                autoExecute: true
            },
            {
                order: 2,
                action: "dispatch_guard",
                description: "Send guard for visual assessment",
                timeLimit: 300,
                autoExecute: true
            },
            {
                order: 3,
                action: "verbal_contact",
                description: "Guard makes contact if appropriate",
                timeLimit: 600,
                autoExecute: false
            }
        ]
    }
};

// Mock API Response Structure
const mockApiResponse = {
    success: true,
    timestamp: "2025-01-22T14:23:15.342Z",
    data: {
        alert: ambientAlertExample,
        recommendedSop: sopExamples.weapon_detection,
        guardAvailability: [
            {
                guardId: "guard_martinez_001",
                name: "Martinez, J.",
                status: "available",
                zone: "zone_a",
                estimatedResponseTime: 45, // seconds
                currentLocation: "patrol_point_3"
            },
            {
                guardId: "guard_johnson_002", 
                name: "Johnson, R.",
                status: "busy",
                zone: "zone_b",
                estimatedResponseTime: 180,
                currentActivity: "incident_response"
            }
        ]
    },
    meta: {
        processingTime: 0.234,
        version: "2.1.0",
        webhookId: "wh_ambient_20250122_142315"
    }
};

// Export for use in the application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ambientAlertExample,
        alertTypeExamples,
        statusProgression,
        sopExamples,
        mockApiResponse
    };
}

// For browser usage
if (typeof window !== 'undefined') {
    window.AmbientAlertData = {
        ambientAlertExample,
        alertTypeExamples,
        statusProgression,
        sopExamples,
        mockApiResponse
    };
}