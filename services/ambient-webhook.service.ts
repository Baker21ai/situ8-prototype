import { Alert, AlertType, AlertPriority } from '../stores/alertStore';

interface AmbientWebhookPayload {
  alertId: string;
  deviceId: string;
  timestamp: string;
  alertType: string;
  detection: {
    confidence: number;
    objectType: string;
    subType: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    tracking?: {
      trackId: string;
      duration: number;
      isTracking: boolean;
    };
    personCount?: number;
  };
  location: {
    siteName: string;
    siteId: string;
    zoneName: string;
    zoneId: string;
    deviceName: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  evidence: {
    imageUrl?: string;
    thumbnailUrl?: string;
    videoClipUrl?: string;
    liveStreamUrl?: string;
    annotatedImageUrl?: string;
  };
  priority?: string;
  severity?: number;
  category?: string;
  tags?: string[];
  aiAnalysis?: {
    description: string;
    riskAssessment: string;
    recommendedActions: string[];
    falsePositiveRisk: number;
    contextualFactors: string[];
  };
  webhook?: {
    eventType: string;
    webhookVersion: string;
    retryCount: number;
    signature: string;
  };
}

export class AmbientWebhookService {
  private static instance: AmbientWebhookService;
  private webhookUrl: string = '/api/webhooks/ambient-ai';
  private isListening: boolean = false;

  private constructor() {}

  public static getInstance(): AmbientWebhookService {
    if (!AmbientWebhookService.instance) {
      AmbientWebhookService.instance = new AmbientWebhookService();
    }
    return AmbientWebhookService.instance;
  }

  /**
   * Convert Ambient.AI webhook payload to internal Alert format
   */
  public convertWebhookToAlert(payload: AmbientWebhookPayload): Alert {
    const alertType = this.mapAlertType(payload.alertType);
    const priority = this.determinePriority(payload);
    
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertId: payload.alertId,
      deviceId: payload.deviceId,
      timestamp: payload.timestamp,
      alertType,
      
      detection: {
        confidence: payload.detection.confidence,
        objectType: payload.detection.objectType,
        subType: payload.detection.subType,
        boundingBox: payload.detection.boundingBox,
        tracking: payload.detection.tracking,
        personCount: payload.detection.personCount
      },
      
      location: {
        siteName: payload.location.siteName,
        siteId: payload.location.siteId,
        zoneName: payload.location.zoneName,
        zoneId: payload.location.zoneId,
        deviceName: payload.location.deviceName,
        coordinates: payload.location.coordinates
      },
      
      evidence: {
        imageUrl: payload.evidence.imageUrl,
        thumbnailUrl: payload.evidence.thumbnailUrl,
        videoClipUrl: payload.evidence.videoClipUrl,
        liveStreamUrl: payload.evidence.liveStreamUrl,
        annotatedImageUrl: payload.evidence.annotatedImageUrl
      },
      
      priority,
      severity: payload.severity || this.calculateSeverity(priority, payload.detection.confidence),
      category: payload.category || 'security_alert',
      tags: payload.tags || ['ambient_ai', 'automated'],
      
      aiAnalysis: payload.aiAnalysis || {
        description: `${alertType.replace('_', ' ')} detected with ${Math.round(payload.detection.confidence * 100)}% confidence`,
        riskAssessment: this.assessRisk(priority, payload.detection.confidence),
        recommendedActions: this.getRecommendedActions(alertType),
        falsePositiveRisk: 1 - payload.detection.confidence,
        contextualFactors: this.getContextualFactors(payload)
      },
      
      situ8: {
        internalAlertId: `SITU8_${Date.now()}`,
        status: 'detected',
        assignedGuard: undefined,
        assignedAt: undefined,
        sopTriggered: true,
        sopActions: this.generateSOPActions(alertType, priority),
        escalationLevel: priority === 'critical' ? 2 : 1,
        createdAt: payload.timestamp,
        updatedAt: payload.timestamp,
        notes: [],
        compliance: {
          requiresDocumentation: priority === 'critical' || priority === 'high',
          retentionPeriod: '7_years',
          reportingRequired: this.getReportingRequirements(alertType)
        }
      }
    };
  }

  /**
   * Map Ambient.AI alert types to internal types
   */
  private mapAlertType(ambientType: string): AlertType {
    const typeMapping: Record<string, AlertType> = {
      'weapon_detection': 'weapon_detection',
      'perimeter_breach': 'perimeter_breach',
      'loitering': 'loitering',
      'tailgating': 'tailgating',
      'unauthorized_access': 'unauthorized_access',
      'crowd_detection': 'crowd_gathering',
      'vehicle_detection': 'vehicle_alert',
      'suspicious_activity': 'suspicious_behavior',
      'after_hours': 'after_hours_activity',
      'ppe_violation': 'ppe_violation'
    };
    
    return typeMapping[ambientType] || 'suspicious_behavior';
  }

  /**
   * Determine alert priority based on type and confidence
   */
  private determinePriority(payload: AmbientWebhookPayload): AlertPriority {
    const { alertType, detection } = payload;
    const confidence = detection.confidence;
    
    // Critical threats
    if (alertType === 'weapon_detection' && confidence > 0.8) return 'critical';
    if (alertType === 'perimeter_breach' && confidence > 0.85) return 'critical';
    
    // High priority
    if (alertType === 'weapon_detection' && confidence > 0.6) return 'high';
    if (alertType === 'unauthorized_access' && confidence > 0.8) return 'high';
    if (alertType === 'tailgating' && confidence > 0.8) return 'high';
    if (alertType === 'loitering' && detection.tracking?.duration && detection.tracking.duration > 900) return 'high'; // 15+ minutes
    
    // Medium priority
    if (confidence > 0.7) return 'medium';
    
    return 'low';
  }

  /**
   * Calculate severity score (1-10)
   */
  private calculateSeverity(priority: AlertPriority, confidence: number): number {
    const baseScores = {
      critical: 8,
      high: 6,
      medium: 4,
      low: 2
    };
    
    const confidenceBonus = Math.round(confidence * 2);
    return Math.min(10, baseScores[priority] + confidenceBonus);
  }

  /**
   * Assess risk level based on priority and confidence
   */
  private assessRisk(priority: AlertPriority, confidence: number): string {
    if (priority === 'critical' && confidence > 0.9) return 'IMMEDIATE';
    if (priority === 'critical' || (priority === 'high' && confidence > 0.85)) return 'HIGH';
    if (priority === 'high' || (priority === 'medium' && confidence > 0.8)) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get recommended actions based on alert type
   */
  private getRecommendedActions(alertType: AlertType): string[] {
    const actionMap: Record<AlertType, string[]> = {
      weapon_detection: ['immediate_guard_dispatch', 'lockdown_consideration', 'law_enforcement_contact'],
      perimeter_breach: ['guard_dispatch', 'perimeter_check', 'access_control_review'],
      loitering: ['guard_patrol', 'verbal_warning', 'area_monitoring'],
      tailgating: ['access_verification', 'guard_notification', 'entry_log_review'],
      unauthorized_access: ['immediate_verification', 'area_secure', 'access_review'],
      crowd_gathering: ['area_monitoring', 'crowd_assessment', 'emergency_preparedness'],
      vehicle_alert: ['parking_verification', 'vehicle_log_check', 'towing_consideration'],
      suspicious_behavior: ['behavioral_assessment', 'continued_monitoring', 'guard_awareness'],
      after_hours_activity: ['immediate_verification', 'access_check', 'security_sweep'],
      ppe_violation: ['safety_reminder', 'ppe_provision', 'compliance_log']
    };
    
    return actionMap[alertType] || ['assess_situation', 'monitor_area'];
  }

  /**
   * Generate SOP actions based on alert type and priority
   */
  private generateSOPActions(alertType: AlertType, priority: AlertPriority) {
    const actions = [];
    
    // Standard assessment
    actions.push({
      action: 'assess_threat',
      status: 'pending' as const,
      estimatedExecutionTime: 30
    });
    
    // Priority-based actions
    if (priority === 'critical') {
      actions.push({
        action: 'immediate_dispatch',
        status: 'pending' as const,
        estimatedExecutionTime: 60
      });
      
      if (alertType === 'weapon_detection') {
        actions.push({
          action: 'notify_law_enforcement',
          status: 'pending' as const,
          estimatedExecutionTime: 120
        });
      }
    } else if (priority === 'high') {
      actions.push({
        action: 'dispatch_guard',
        status: 'pending' as const,
        estimatedExecutionTime: 120
      });
    } else {
      actions.push({
        action: 'schedule_patrol',
        status: 'pending' as const,
        estimatedExecutionTime: 300
      });
    }
    
    return actions;
  }

  /**
   * Get contextual factors for the alert
   */
  private getContextualFactors(payload: AmbientWebhookPayload): string[] {
    const factors = [];
    const now = new Date();
    const alertTime = new Date(payload.timestamp);
    const hour = alertTime.getHours();
    
    // Time-based factors
    if (hour >= 9 && hour <= 17) {
      factors.push('business_hours');
    } else {
      factors.push('after_hours');
    }
    
    // Location-based factors
    if (payload.location.zoneName.toLowerCase().includes('entrance')) {
      factors.push('high_traffic_area');
    }
    
    if (payload.location.zoneName.toLowerCase().includes('parking')) {
      factors.push('parking_area');
    }
    
    // Confidence-based factors
    if (payload.detection.confidence > 0.9) {
      factors.push('high_confidence_detection');
    }
    
    return factors;
  }

  /**
   * Get reporting requirements based on alert type
   */
  private getReportingRequirements(alertType: AlertType): string[] {
    const requirements = ['security_incident'];
    
    if (alertType === 'weapon_detection') {
      requirements.push('weapons_log', 'law_enforcement_report');
    }
    
    if (alertType === 'perimeter_breach') {
      requirements.push('access_control_log');
    }
    
    if (alertType === 'ppe_violation') {
      requirements.push('safety_compliance_log');
    }
    
    return requirements;
  }

  /**
   * Validate webhook signature (for production)
   */
  public validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implementation would use HMAC-SHA256 to validate Ambient.AI webhook signature
    // For development, return true
    return true;
  }

  /**
   * Start listening for webhooks (placeholder for actual webhook endpoint)
   */
  public startWebhookListener(onAlert: (alert: Alert) => void): void {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('Ambient.AI webhook listener started');
    
    // In a real implementation, this would set up an Express.js endpoint
    // For now, we'll simulate webhooks for development
    this.simulateWebhooks(onAlert);
  }

  /**
   * Stop webhook listener
   */
  public stopWebhookListener(): void {
    this.isListening = false;
    console.log('Ambient.AI webhook listener stopped');
  }

  /**
   * Simulate webhook payloads for development
   */
  private simulateWebhooks(onAlert: (alert: Alert) => void): void {
    // Simulate random alerts every 30-60 seconds for development
    const simulateAlert = () => {
      if (!this.isListening) return;
      
      const mockPayload: AmbientWebhookPayload = {
        alertId: `ambient_alert_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
        deviceId: `device_${Math.floor(Math.random() * 10) + 1}`,
        timestamp: new Date().toISOString(),
        alertType: ['weapon_detection', 'perimeter_breach', 'loitering', 'unauthorized_access'][Math.floor(Math.random() * 4)],
        detection: {
          confidence: 0.7 + Math.random() * 0.3,
          objectType: 'person',
          subType: 'unauthorized_entry',
          tracking: {
            trackId: `track_${Date.now()}`,
            duration: Math.random() * 600,
            isTracking: true
          }
        },
        location: {
          siteName: 'Situ8 Corporate Campus',
          siteId: 'situ8_hq_001',
          zoneName: ['Main Entrance', 'North Gate', 'Parking Lot B', 'Server Room'][Math.floor(Math.random() * 4)],
          zoneId: `zone_${Math.floor(Math.random() * 10)}`,
          deviceName: 'Security Camera'
        },
        evidence: {
          thumbnailUrl: `https://picsum.photos/300/200?random=${Date.now()}`,
          imageUrl: `https://picsum.photos/800/600?random=${Date.now()}`,
          liveStreamUrl: 'rtsp://example.com/stream'
        }
      };
      
      const alert = this.convertWebhookToAlert(mockPayload);
      onAlert(alert);
      
      // Schedule next simulation
      const nextDelay = 30000 + Math.random() * 30000; // 30-60 seconds
      setTimeout(simulateAlert, nextDelay);
    };
    
    // Start first simulation after 5 seconds
    setTimeout(simulateAlert, 5000);
  }
}