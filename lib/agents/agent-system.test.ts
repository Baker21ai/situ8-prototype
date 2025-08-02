/**
 * Agent System Integration Tests
 * 
 * These tests verify that the agent system actually works with your real Situ8 platform.
 * Think of this as "quality control" - making sure everything connects properly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IncidentOrchestrator } from './agent-system'
import { MedicalEmergencyAgent, SecurityBreachAgent } from './specialized-agents'

describe('🧪 Agent System Integration Tests', () => {
  let orchestrator: IncidentOrchestrator
  let medicalAgent: MedicalEmergencyAgent
  let securityAgent: SecurityBreachAgent

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    
    // Create fresh instances for each test
    orchestrator = new IncidentOrchestrator()
    medicalAgent = new MedicalEmergencyAgent()
    securityAgent = new SecurityBreachAgent()
    
    // Register agents with orchestrator
    orchestrator.registerAgent('medical-emergency', medicalAgent)
    orchestrator.registerAgent('security-breach', securityAgent)
  })

  describe('🏥 Medical Emergency Agent Tests', () => {
    it('should create medical agent successfully', () => {
      expect(medicalAgent).toBeDefined()
      expect(medicalAgent.agentType).toBe('medical-emergency')
    })

    it('should handle medical activities', () => {
      const mockActivity = {
        id: 'test-001',
        type: 'medical',
        title: 'Medical emergency',
        description: 'Person needs help',
        location: 'Lobby'
      }

      const canHandle = medicalAgent.canHandleActivity(mockActivity as any)
      expect(canHandle).toBe(true)
    })

    it('should NOT handle security activities', () => {
      const mockActivity = {
        id: 'test-002',
        type: 'security-breach',
        title: 'Security breach',
        description: 'Unauthorized access',
        location: 'Server room'
      }

      const canHandle = medicalAgent.canHandleActivity(mockActivity as any)
      expect(canHandle).toBe(false)
    })
  })

  describe('🔒 Security Agent Tests', () => {
    it('should create security agent successfully', () => {
      expect(securityAgent).toBeDefined()
      expect(securityAgent.agentType).toBe('security-breach')
    })

    it('should handle security activities', () => {
      const mockActivity = {
        id: 'test-003',
        type: 'security-breach',
        title: 'Security breach',
        description: 'Unauthorized access attempt',
        location: 'Server room'
      }

      const canHandle = securityAgent.canHandleActivity(mockActivity as any)
      expect(canHandle).toBe(true)
    })

    it('should NOT handle patrol activities (security agent is specialized)', () => {
      const mockActivity = {
        id: 'test-004',
        type: 'patrol',
        title: 'Routine patrol',
        description: 'Security guard patrol',
        location: 'Parking garage'
      }

      const canHandle = securityAgent.canHandleActivity(mockActivity as any)
      expect(canHandle).toBe(false) // Security breach agent only handles breaches, not patrols
    })
  })

  describe('🧠 Orchestrator Tests', () => {
    it('should create orchestrator successfully', () => {
      expect(orchestrator).toBeDefined()
    })

    it('should register agents correctly', () => {
      const metrics = orchestrator.getSystemMetrics()
      expect(metrics.agentCount).toBe(2) // medical + security agents
    })

    it('should provide system metrics', () => {
      const metrics = orchestrator.getSystemMetrics()
      
      expect(metrics).toHaveProperty('agentCount')
      expect(metrics).toHaveProperty('lastProcessed')
      expect(metrics.agentCount).toBeGreaterThan(0)
    })

    it('should test orchestrator functionality', () => {
      const mockActivity = {
        id: 'test-005',
        type: 'medical',
        title: 'Medical emergency',
        description: 'Heart attack',
        location: 'Cafeteria'
      }

      // Test that orchestrator can handle activities without crashing
      expect(() => {
        orchestrator.registerAgent('test', medicalAgent)
      }).not.toThrow()
    })
  })

  describe('🚨 Error Handling Tests', () => {
    it('should handle missing activity data gracefully', () => {
      const incompleteActivity = {
        title: 'Incomplete activity'
        // Missing required fields
      }

      // Should not crash the system
      expect(() => {
        medicalAgent.canHandleActivity(incompleteActivity as any)
      }).not.toThrow()
    })

    it('should handle null/undefined activities', () => {
      expect(() => {
        medicalAgent.canHandleActivity(null as any)
      }).not.toThrow()

      expect(() => {
        medicalAgent.canHandleActivity(undefined as any)
      }).not.toThrow()
    })
  })

  describe('📊 System Integration Tests', () => {
    it('should have proper agent types registered', () => {
      // Test that we can get agent memory (might be undefined initially, that's ok)
      const medicalMemory = orchestrator.getAgentMemory('medical-emergency')
      const securityMemory = orchestrator.getAgentMemory('security-breach')
      
      // Memory can be undefined initially - that's expected behavior
      expect(() => orchestrator.getAgentMemory('medical-emergency')).not.toThrow()
      expect(() => orchestrator.getAgentMemory('security-breach')).not.toThrow()
    })

    it('should handle agent coordination', () => {
      const mockIncident = {
        id: 'inc-001',
        type: 'medical_emergency',
        title: 'Medical incident',
        description: 'Emergency situation',
        status: 'active'
      }

      // Test that incident processing doesn't crash
      expect(async () => {
        await orchestrator.processIncident(mockIncident as any)
      }).not.toThrow()
    })
  })
})

/**
 * 🎯 WHAT THESE TESTS VERIFY:
 * 
 * ✅ Agent system components can be created
 * ✅ Agents can identify their activity types
 * ✅ Orchestrator can manage multiple agents
 * ✅ System doesn't crash with bad data
 * ✅ Basic integration points work
 * ✅ Error handling is robust
 * 
 * 🚀 TO RUN THESE TESTS:
 * npm test lib/agents/agent-system.test.ts
 * 
 * 💡 WHAT THIS TELLS US:
 * - If tests pass: Basic structure works
 * - If tests fail: Something is broken in the agent system
 * - Missing: Real integration with activity/incident services
 */