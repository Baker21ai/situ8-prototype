/**
 * Custom hook for AI Assistant actions
 * Provides clean interface for executing AI commands with service integration
 */

import { useState, useCallback } from 'react';
import { useServices, createAuditContext } from '../../../services/ServiceProvider';

export interface AIActionResult {
  success: boolean;
  message: string;
  entityId?: string;
  entityType?: 'incident' | 'activity' | 'case';
}

export interface AIActionRequest {
  command: string;
  location?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
}

export function useAIActions() {
  const services = useServices();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeFireIncident = useCallback(async (request: AIActionRequest): Promise<AIActionResult> => {
    if (!services?.incidentService) {
      return { success: false, message: 'Incident service not available' };
    }

    try {
      setIsExecuting(true);
      
      const auditContext = createAuditContext(
        'ai-assistant',
        'AI Assistant',
        'system',
        'create_incident',
        'AI-generated fire incident'
      );

      const response = await services.incidentService.createIncident({
        type: 'fire_emergency',
        priority: request.priority || 'critical',
        description: request.description || `Fire incident: ${request.command}`,
        title: `Fire Emergency - ${request.location || 'Unknown Location'}`,
        status: 'active',
      }, auditContext);

      if (response.success && response.data) {
        return {
          success: true,
          message: `🔥 Fire incident created successfully!\n\n**Incident ID:** ${response.data.id}\n**Location:** ${request.location || 'Unknown Location'}\n\nIncident has been added to the timeline for immediate response.`,
          entityId: response.data.id,
          entityType: 'incident'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to create fire incident'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error creating fire incident: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      setIsExecuting(false);
    }
  }, [services]);

  const executeMedicalIncident = useCallback(async (request: AIActionRequest): Promise<AIActionResult> => {
    if (!services?.incidentService) {
      return { success: false, message: 'Incident service not available' };
    }

    try {
      setIsExecuting(true);
      
      const auditContext = createAuditContext(
        'ai-assistant',
        'AI Assistant',
        'system',
        'create_incident',
        'AI-generated medical incident'
      );

      const response = await services.incidentService.createIncident({
        type: 'medical_emergency',
        priority: request.priority || 'high',
        description: request.description || `Medical incident: ${request.command}`,
        title: `Medical Emergency - ${request.location || 'Unknown Location'}`,
        status: 'active',
      }, auditContext);

      if (response.success && response.data) {
        return {
          success: true,
          message: `🏥 Medical incident created successfully!\n\n**Incident ID:** ${response.data.id}\n**Location:** ${request.location || 'Unknown Location'}\n\nIncident has been added to the timeline for immediate response.`,
          entityId: response.data.id,
          entityType: 'incident'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to create medical incident'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error creating medical incident: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      setIsExecuting(false);
    }
  }, [services]);

  const executeActivity = useCallback(async (request: AIActionRequest): Promise<AIActionResult> => {
    if (!services?.activityService) {
      return { success: false, message: 'Activity service not available' };
    }

    try {
      setIsExecuting(true);
      
      const activityType = request.command.toLowerCase().includes('patrol') ? 'patrol' : 'evidence';
      
      const auditContext = createAuditContext(
        'ai-assistant',
        'AI Assistant',
        'system',
        'create_activity',
        'AI-generated activity'
      );

      const response = await services.activityService.createActivity({
        type: activityType,
        description: request.description || request.command,
        location: request.location || 'Unknown Location',
        reported_by: 'AI Assistant',
        tags: ['ai-created'],
      }, auditContext);

      if (response.success && response.data) {
        return {
          success: true,
          message: `📝 Activity logged successfully!\n\n**Activity ID:** ${response.data.id}\n**Type:** ${activityType}\n**Location:** ${request.location || 'Unknown Location'}\n\nActivity has been added to the activity stream.`,
          entityId: response.data.id,
          entityType: 'activity'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to create activity'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error creating activity: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      setIsExecuting(false);
    }
  }, [services]);

  const parseLocation = useCallback((command: string): string => {
    const locationMatch = command.match(/building\s+([a-z]|[0-9]+)/i);
    return locationMatch ? locationMatch[0] : 'Unknown Location';
  }, []);

  const parseCommand = useCallback((command: string): AIActionRequest => {
    const location = parseLocation(command);
    
    // Extract priority if mentioned
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (command.toLowerCase().includes('critical') || command.toLowerCase().includes('emergency')) {
      priority = 'critical';
    } else if (command.toLowerCase().includes('high')) {
      priority = 'high';
    } else if (command.toLowerCase().includes('low')) {
      priority = 'low';
    }

    return {
      command,
      location,
      priority,
      description: command
    };
  }, [parseLocation]);

  const executeCommand = useCallback(async (command: string): Promise<AIActionResult> => {
    const request = parseCommand(command);
    
    if (command.toLowerCase().includes('fire')) {
      return executeFireIncident(request);
    } else if (command.toLowerCase().includes('medical')) {
      return executeMedicalIncident(request);
    } else if (command.toLowerCase().includes('activity') || command.toLowerCase().includes('patrol')) {
      return executeActivity(request);
    } else {
      return {
        success: false,
        message: 'Command not recognized. Try commands like:\n• "Create fire incident in Building A"\n• "Create medical emergency in Building B"\n• "Log patrol activity in North Wing"'
      };
    }
  }, [parseCommand, executeFireIncident, executeMedicalIncident, executeActivity]);

  return {
    executeCommand,
    executeFireIncident,
    executeMedicalIncident,
    executeActivity,
    parseCommand,
    isExecuting
  };
}