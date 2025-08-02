import { EnterpriseActivity } from '../../lib/types/activity'
import { Priority, Status, BusinessImpact } from '../../lib/utils/status'
import { ActivityType } from '../../lib/utils/security'

/**
 * Factory for creating mock EnterpriseActivity objects for testing
 */
export function createMockActivity(overrides: Partial<EnterpriseActivity> = {}): EnterpriseActivity {
  const now = new Date()
  
  return {
    id: 'test-activity-1',
    title: 'Test Security Activity',
    type: 'security-breach' as ActivityType,
    priority: 'high' as Priority,
    status: 'assigned' as Status,
    timestamp: now,
    location: 'Building A - Main Entrance',
    zone: 'Zone 1',
    description: 'Test activity description for unit testing',
    confidence: 85,
    businessImpact: 'medium' as BusinessImpact,
    tags: ['automated', 'security'],
    source: 'Camera-001',
    cameraName: 'Main Entrance Camera',
    assignedTo: 'Officer Johnson',
    respondingUnits: ['Unit-1', 'Unit-2'],
    escalationLevel: 0,
    isNewActivity: false,
    isBoloActive: false,
    isMassCasualty: false,
    isSecurityThreat: true,
    additionalCameras: ['Camera-002', 'Camera-003'],
    externalData: {
      source: 'TestSystem',
      data: { testKey: 'testValue' },
      timestamp: now,
      confidence: 90
    },
    createdAt: now,
    updatedAt: now,
    ...overrides
  }
}

/**
 * Create multiple mock activities with different properties
 */
export function createMockActivities(count: number = 3): EnterpriseActivity[] {
  const activities: EnterpriseActivity[] = []
  const now = Date.now()
  
  for (let i = 0; i < count; i++) {
    activities.push(createMockActivity({
      id: `test-activity-${i + 1}`,
      title: `Test Activity ${i + 1}`,
      timestamp: new Date(now - (i * 60000)), // Each activity 1 minute apart
      priority: (['critical', 'high', 'medium', 'low'] as Priority[])[i % 4],
      status: (['detecting', 'assigned', 'responding', 'resolved'] as Status[])[i % 4],
      type: (['medical', 'security-breach', 'alert', 'patrol'] as ActivityType[])[i % 4],
      confidence: 70 + (i * 5), // Varying confidence levels
      location: `Building ${String.fromCharCode(65 + i)} - Floor ${i + 1}`
    }))
  }
  
  return activities
}

/**
 * Create mock activity with specific priority
 */
export function createMockActivityWithPriority(priority: Priority): EnterpriseActivity {
  return createMockActivity({ priority })
}

/**
 * Create mock activity with specific status
 */
export function createMockActivityWithStatus(status: Status): EnterpriseActivity {
  return createMockActivity({ status })
}

/**
 * Create mock activity with specific type
 */
export function createMockActivityWithType(type: ActivityType): EnterpriseActivity {
  return createMockActivity({ type })
}

/**
 * Create mock activity with special flags
 */
export function createMockActivityWithFlags(flags: {
  isNewActivity?: boolean
  isBoloActive?: boolean
  isMassCasualty?: boolean
  isSecurityThreat?: boolean
}): EnterpriseActivity {
  return createMockActivity(flags)
}

/**
 * Create mock activity with external data
 */
export function createMockActivityWithExternalData(): EnterpriseActivity {
  return createMockActivity({
    externalData: {
      source: 'ExternalSystem',
      data: {
        sensorId: 'SENSOR-123',
        temperature: 75.5,
        location: { lat: 40.7128, lng: -74.0060 }
      },
      timestamp: new Date(),
      confidence: 95
    }
  })
}

/**
 * Create minimal mock activity (for testing edge cases)
 */
export function createMinimalMockActivity(): EnterpriseActivity {
  return {
    id: 'minimal-activity',
    title: 'Minimal Activity',
    type: 'alert' as ActivityType,
    priority: 'low' as Priority,
    status: 'detecting' as Status,
    timestamp: new Date(),
    location: 'Test Location',
    description: 'Minimal test activity',
    tags: [],
    source: 'test',
    createdAt: new Date(),
    updatedAt: new Date()
  } as EnterpriseActivity
}
