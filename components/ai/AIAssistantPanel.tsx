'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { 
  Bot, 
  Minimize2, 
  Maximize2, 
  X, 
  Mic, 
  MessageSquare, 
  History, 
  Settings,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIChat } from './AIChat';
import { VoiceInput } from './VoiceInput';
import { AIHistory } from './AIHistory';
import { ActionConfirmation } from './ActionConfirmation';
import { AIDebugPanel } from './AIDebugPanel';
import { useServices, useAIService, createAuditContext } from '../../services/ServiceProvider';
import { useActivityStore } from '../../stores/activityStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { useAuditStore } from '../../stores/auditStore';
import { useIncidentService, useActivityService, useSearchService } from '../../hooks';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  actionType?: 'create_incident' | 'create_activity' | 'search' | 'update_status';
  actionData?: any;
  isStreaming?: boolean;
}

interface PendingAction {
  id: string;
  type: 'create_incident' | 'create_activity' | 'update_status' | 'assign_guards' | 'send_alert';
  title: string;
  description: string;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  estimatedImpact?: string;
  affectedUsers?: number;
}

interface AIAssistantState {
  isMinimized: boolean;
  isExpanded: boolean;
  currentView: 'chat' | 'history' | 'settings' | 'voice' | 'debug';
  isListening: boolean;
  pendingAction: PendingAction | null;
  isProcessing: boolean;
  hasNewMessage: boolean;
  messages: ChatMessage[];
}

interface Position {
  x: number;
  y: number;
}

export function AIAssistantPanel() {
  // Services and stores
  const services = useServices();
  const { logAction } = useAuditStore();
  
  // Custom service hooks
  const incidentService = useIncidentService();
  const activityService = useActivityService();
  const searchService = useSearchService();
  const aiService = useAIService();

  const [state, setState] = useState<AIAssistantState>({
    isMinimized: true,
    isExpanded: false,
    currentView: 'chat',
    isListening: false,
    pendingAction: null,
    isProcessing: false,
    hasNewMessage: false,
    messages: [
      {
        id: 'test-1',
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant. I can help you create incidents, manage activities, and search records.',
        timestamp: new Date(Date.now() - 300000),
        status: 'sent'
      },
      {
        id: 'test-2',
        role: 'user',
        content: 'Can you show me today\'s incidents?',
        timestamp: new Date(Date.now() - 240000),
        status: 'sent'
      },
      {
        id: 'test-3',
        role: 'assistant',
        content: 'I found 3 incidents for today:\n\n1. Fire alarm in Building A (Resolved)\n2. Medical emergency in Building B (In Progress)\n3. Security breach in Parking Lot C (Under Investigation)',
        timestamp: new Date(Date.now() - 180000),
        status: 'sent'
      },
      {
        id: 'test-4',
        role: 'user',
        content: 'Create a new patrol activity for Building A',
        timestamp: new Date(Date.now() - 120000),
        status: 'sent'
      },
      {
        id: 'test-5',
        role: 'assistant',
        content: 'I\'ve created a new patrol activity for Building A. The patrol has been assigned to Unit 3 and is scheduled to begin in 15 minutes.',
        timestamp: new Date(Date.now() - 60000),
        status: 'sent'
      },
      {
        id: 'test-6',
        role: 'user',
        content: 'What\'s the status of the medical emergency?',
        timestamp: new Date(Date.now() - 30000),
        status: 'sent'
      },
      {
        id: 'test-7',
        role: 'assistant',
        content: 'The medical emergency in Building B is currently in progress. Emergency services arrived 10 minutes ago and the patient is being treated. The area has been secured and normal operations can continue in other parts of the building.',
        timestamp: new Date(Date.now() - 10000),
        status: 'sent'
      }
    ],
  });

  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Test function to add messages for scrolling testing
  const addTestMessage = () => {
    const testMessages = [
      'This is a test message to check scrolling behavior.',
      'Another message to see if auto-scroll works properly.',
      'Let\'s see if the scroll-to-bottom button appears when needed.',
      'Testing the unread message counter functionality.',
      'This should trigger the smart scrolling features.',
      'Final test message to verify everything works correctly.'
    ];
    
    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: `test-${Date.now()}`,
        role: Math.random() > 0.5 ? 'assistant' : 'user',
        content: randomMessage,
        timestamp: new Date(),
        status: 'sent'
      }]
    }));
  };

  // AI Assistant Settings
  const [settings, setSettings] = useState({
    voiceResponses: true,
    autoApproveLowPriority: false,
    showTranscription: true,
    rememberPosition: true,
    enableKeyboardShortcuts: true,
    playNotificationSounds: true
  });

  // Advanced features
  const [showShortcutHelper, setShowShortcutHelper] = useState(false);
  const [quickCommands] = useState([
    'Create fire incident in Building A',
    'Create medical emergency in Building B', 
    'Log patrol activity in North Wing',
    'Show today\'s incidents',
    'Update incident status to resolved'
  ]);

  // Load saved position on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('ai-assistant-position');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
      // Default to bottom-left corner
      setPosition({ 
        x: 20, 
        y: window.innerHeight - 500 
      });
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('ai-assistant-position', JSON.stringify(position));
  }, [position]);

  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('ai-assistant-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('ai-assistant-settings', JSON.stringify(settings));
  }, [settings]);

  // Settings handlers
  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Minimize/expand handlers (defined early to avoid hoisting issues)
  const handleMinimize = () => {
    setState(prev => ({ ...prev, isMinimized: true }));
  };

  const handleExpand = () => {
    setState(prev => ({ 
      ...prev, 
      isMinimized: false, 
      isExpanded: !prev.isExpanded 
    }));
  };

  const handleViewChange = (view: 'chat' | 'history' | 'settings' | 'voice' | 'debug') => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  // Voice input handlers
  const handleStartListening = () => {
    setState(prev => ({ ...prev, isListening: true }));
  };

  const handleStopListening = () => {
    setState(prev => ({ ...prev, isListening: false }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!settings.enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Cmd/Ctrl + K: Toggle AI Assistant
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
        return;
      }

      // Only handle other shortcuts when AI Assistant is open
      if (state.isMinimized) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          if (state.pendingAction) {
            // Cancel pending action
            setState(prev => ({ ...prev, pendingAction: null }));
          } else {
            handleMinimize();
          }
          break;

        case 'Tab':
          if (!event.shiftKey) {
            event.preventDefault();
            const views = ['chat', 'voice', 'history', 'settings', 'debug'] as const;
            const currentIndex = views.indexOf(state.currentView);
            const nextIndex = (currentIndex + 1) % views.length;
            handleViewChange(views[nextIndex]);
          }
          break;

        case ' ':
          if (state.currentView === 'voice') {
            event.preventDefault();
            if (state.isListening) {
              handleStopListening();
            } else {
              handleStartListening();
            }
          }
          break;

        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (state.currentView === 'chat') {
              // Focus chat input if available
              const chatInput = document.querySelector('[data-ai-chat-input]') as HTMLTextAreaElement;
              chatInput?.focus();
            }
          }
          break;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          if (event.altKey) {
            event.preventDefault();
            const views = ['chat', 'voice', 'history', 'settings', 'debug'] as const;
            const viewIndex = parseInt(event.key) - 1;
            if (viewIndex < views.length) {
              handleViewChange(views[viewIndex]);
            }
          }
          break;

        case 'r':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Refresh/reset current view
            if (state.currentView === 'history') {
              // Reload history
              window.location.reload();
            }
          }
          break;

        case 'm':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleMinimize();
          }
          break;

        case 'e':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleExpand();
          }
          break;

        case '?':
          if (event.shiftKey) {
            event.preventDefault();
            setShowShortcutHelper(prev => !prev);
          }
          break;

        case 'h':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setShowShortcutHelper(prev => !prev);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.enableKeyboardShortcuts, state.isMinimized, state.currentView, state.pendingAction, state.isListening, handleMinimize, handleExpand, handleViewChange, handleStartListening, handleStopListening]);

  // Handle shortcut helper dismissal
  useEffect(() => {
    if (!showShortcutHelper) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't dismiss on modifier keys only
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return;
      
      event.stopPropagation();
      setShowShortcutHelper(false);
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [showShortcutHelper]);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.isMinimized) return;
    
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep panel within viewport bounds
      const maxX = window.innerWidth - (state.isExpanded ? 400 : 320);
      const maxY = window.innerHeight - (state.isExpanded ? 600 : 400);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, state.isExpanded]);

  // Check if action requires confirmation
  const requiresConfirmation = (actionType: string, priority: string): boolean => {
    // If auto-approve low priority is enabled, only require confirmation for critical actions
    if (settings.autoApproveLowPriority && priority !== 'critical') {
      return false;
    }
    return actionType === 'create_incident' && (priority === 'critical' || priority === 'high');
  };

  // Process AI commands using custom hooks
  const processCommand = async (message: string): Promise<ChatMessage> => {
    const lowerMessage = message.toLowerCase();

    // Extract location if mentioned
    const locationMatch = message.match(/building\s+([a-z]|[0-9]+)/i);
    const location = locationMatch ? locationMatch[0] : 'Unknown Location';

    // Fire incident command
    if (lowerMessage.includes('fire') && lowerMessage.includes('incident')) {
      const incidentData = {
        type: 'fire_emergency' as const,
        priority: 'critical' as const,
        description: `Fire incident: ${message}`,
        location,
        source: 'ai-assistant'
      };

      if (requiresConfirmation('create_incident', 'critical')) {
        const pendingAction: PendingAction = {
          id: `action-${Date.now()}`,
          type: 'create_incident',
          title: 'Create Critical Fire Incident',
          description: `Create high-priority fire incident in ${location}`,
          data: incidentData,
          priority: 'critical',
          requiresApproval: true,
          estimatedImpact: 'Emergency response teams will be dispatched immediately',
          affectedUsers: 20
        };

        setState(prev => ({ ...prev, pendingAction }));
        
        return {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `⚠️ **Critical Action Requires Confirmation**\n\nI want to create a critical fire incident:\n\n**Type:** Fire Emergency\n**Location:** ${location}\n**Priority:** Critical\n\nThis will immediately notify emergency response teams. Please confirm to proceed.`,
          timestamp: new Date(),
          status: 'sent',
        };
      } else {
        const result = await executeAction(incidentData, 'create_incident');
        return {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
          status: 'sent',
        };
      }
    }

    // Medical incident command
    if (lowerMessage.includes('medical') && lowerMessage.includes('incident')) {
      const incidentData = {
        type: 'medical_emergency' as const,
        priority: 'high' as const,
        description: `Medical incident: ${message}`,
        location,
        source: 'ai-assistant'
      };

      if (requiresConfirmation('create_incident', 'high')) {
        const pendingAction: PendingAction = {
          id: `action-${Date.now()}`,
          type: 'create_incident',
          title: 'Create Medical Emergency Incident',
          description: `Create high-priority medical incident in ${location}`,
          data: incidentData,
          priority: 'high',
          requiresApproval: true,
          estimatedImpact: 'Medical response team will be dispatched',
          affectedUsers: 5
        };

        setState(prev => ({ ...prev, pendingAction }));
        
        return {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `🚑 **Medical Emergency Requires Confirmation**\n\nI want to create a medical emergency incident:\n\n**Type:** Medical Emergency\n**Location:** ${location}\n**Priority:** High\n\nThis will notify medical response teams. Please confirm to proceed.`,
          timestamp: new Date(),
          status: 'sent',
        };
      } else {
        const result = await executeAction(incidentData, 'create_incident');
        return {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
          status: 'sent',
        };
      }
    }

    // Activity creation command
    if (lowerMessage.includes('activity') || lowerMessage.includes('patrol')) {
      const activityType = lowerMessage.includes('patrol') ? 'patrol' : 'evidence';
      const activityData = {
        type: activityType as any,
        priority: 'medium' as const,
        description: message,
        location,
        source: 'ai-assistant'
      };

      const result = await executeAction(activityData, 'create_activity');
      return {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',  
        content: result.message,
        timestamp: new Date(),
        status: 'sent',
      };
    }

    // Search commands
    if (lowerMessage.includes('search') || lowerMessage.includes('show') || lowerMessage.includes('find')) {
      let searchQuery = '';
      let filters = {};

      if (lowerMessage.includes('incident')) {
        searchQuery = lowerMessage.includes('today') ? '' : 'incidents';
        if (lowerMessage.includes('today')) {
          const results = await searchService.searchTodaysIncidents();
          return {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: `🔍 **Today's Incidents**\n\nFound ${results.length} incidents:\n\n${results.map((inc, i) => `• **${inc.id}**: ${inc.type} - ${(inc as any).location || 'Unknown Location'} (${inc.priority}, ${inc.status})`).join('\n')}\n\nTo view detailed information, navigate to the Command Center Timeline.`,
            timestamp: new Date(),
            status: 'sent',
          };
        }
      } else if (lowerMessage.includes('activity') || lowerMessage.includes('activities')) {
        searchQuery = 'activities';
      }

      if (searchQuery) {
        const result = await executeAction({ query: searchQuery, filters }, 'search');
        return {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
          status: 'sent',
        };
      }

      return {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `🔍 **Search Help**\n\nI can help you search for:\n\n• **Incidents**: "Show today's incidents" or "Find critical incidents"\n• **Activities**: "Show today's activities" or "Find patrol activities"\n• **Status**: "Show incident status" or "Check system status"\n\nWhat would you like to search for?`,
        timestamp: new Date(),
        status: 'sent',
      };
    }

    // Status update commands
    if (lowerMessage.includes('status') && !lowerMessage.includes('show')) {
      const incidentMatch = message.match(/incident\s+(\w+-\d+)/i);
      const statusMatch = message.match(/to\s+(active|resolved|investigating|closed)/i);
      
      if (incidentMatch && statusMatch) {
        const incidentId = incidentMatch[1];
        const newStatus = statusMatch[1];
        
        const result = await executeAction({
          entityType: 'incident',
          entityId: incidentId,
          status: newStatus
        }, 'update_status');
        
        return {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
          status: 'sent',
        };
      }
      
      return {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `📊 **Status Update Help**\n\nTo update incident status, use:\n• "Update incident INC-001 to resolved"\n• "Change incident INC-002 status to investigating"\n• "Set incident status to closed"\n\nPlease specify the incident ID and new status.`,
        timestamp: new Date(),
        status: 'sent',
      };
    }

    // Guard assignment commands
    if (lowerMessage.includes('assign') || lowerMessage.includes('guard')) {
      const guardMatch = message.match(/unit\s+(\d+)/i) || message.match(/guard\s+(\w+)/i);
      const incidentMatch = message.match(/incident\s+(\w+-\d+)/i) || message.match(/to\s+(.+)/i);
      
      if (guardMatch) {
        const guardUnit = guardMatch[1];
        const target = incidentMatch ? incidentMatch[1] : 'current incident';
        
        // Log the assignment
        logAction({
          user_id: 'ai-assistant',
          user_name: 'AI Assistant',
          action: 'assign_guard',
          entity_type: 'activity',
          entity_id: `assign-${Date.now()}`,
          description: `Assigned Guard ${guardUnit} to ${target}`,
        });
        
        return {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `👮 **Guard Assignment**\n\n**Unit:** ${guardUnit}\n**Assignment:** ${target}\n**Status:** Notified\n\nGuard ${guardUnit} has been assigned and notified of their new assignment.`,
          timestamp: new Date(),
          status: 'sent',
        };
      }
      
      return {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `👮 **Guard Assignment Help**\n\nTo assign guards, use:\n• "Assign Unit 5 to incident INC-001"\n• "Send Guard Johnson to Building A"\n• "Assign available guards to patrol"\n\nPlease specify the guard unit and assignment location.`,
        timestamp: new Date(),
        status: 'sent',
      };
    }

    // Fallback to Bedrock-generated reply via AI service
    try {
      const history = [...state.messages.map(m => ({ role: m.role, content: m.content })), { role: 'user' as const, content: message }];
      const reply = await aiService.generateReply(history);
      return {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        status: 'sent',
      };
    } catch (e) {
      // Default help message if AI fails
      return {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I can help you with:\n\n🔥 **Fire incidents**: "Create fire incident in Building A"\n🚑 **Medical incidents**: "Create medical incident in Building B"\n📝 **Activities**: "Log patrol activity in North Wing"\n🔍 **Search**: "Show today's incidents" or "Find open incidents"\n📊 **Status updates**: "Update incident INC-001 to resolved"\n👮 **Guard assignments**: "Assign Unit 5 to Building A"\n📋 **Activity logs**: "Show recent activities"\n\n**Pro tip**: You can also check the History tab to retry any failed actions!\n\nWhat would you like me to do?`,
        timestamp: new Date(),
        status: 'sent',
      };
    }
  };

  // Execute confirmed action using custom hooks
  const executeAction = async (actionData: any, actionType: string) => {
    try {
      if (actionType === 'create_incident') {
        const incident = await incidentService.createIncident(actionData);
        return {
          success: true,
          data: incident,
          message: `✅ ${actionData.type === 'fire_emergency' ? 'Fire' : 'Medical'} incident created successfully!\n\n**Incident ID:** ${incident.id}\n**Priority:** ${actionData.priority}\n**Status:** Active\n\nIncident has been added to the timeline and relevant personnel have been notified.`
        };
      } else if (actionType === 'create_activity') {
        const activity = await activityService.createActivity(actionData);
        return {
          success: true,
          data: activity,
          message: `📝 Activity logged successfully!\n\n**Activity ID:** ${activity.id}\n**Type:** ${actionData.type}\n\nActivity has been added to the activity stream.`
        };
      } else if (actionType === 'search') {
        const results = await searchService.searchAll(actionData.query, actionData.filters);
        return {
          success: true,
          data: results,
          message: `🔍 Search completed!\n\n**Query:** "${actionData.query}"\n**Total Results:** ${results.totalCount}\n- Activities: ${results.activities.length}\n- Incidents: ${results.incidents.length}\n- Cases: ${results.cases.length}`
        };
      } else if (actionType === 'update_status') {
        if (actionData.entityType === 'incident') {
          const incident = await incidentService.updateIncident(actionData.entityId, { status: actionData.status });
          return {
            success: true,
            data: incident,
            message: `✅ Incident status updated to "${actionData.status}"`
          };
        } else if (actionData.entityType === 'activity') {
          const activity = await activityService.updateActivity(actionData.entityId, { status: actionData.status });
          return {
            success: true,
            data: activity,
            message: `✅ Activity status updated to "${actionData.status}"`
          };
        }
      }
      
      throw new Error(`Unknown action type: ${actionType}`);
    } catch (error) {
      // Error handling is managed by the hooks
      throw error;
    }
  };

  // AI functionality
  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      status: 'sent',
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isProcessing: true,
    }));

    // Enhanced command parsing using custom hooks
    try {
      const aiResponse = await processCommand(message);


      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiResponse],
        isProcessing: false,
      }));
    } catch (error) {
      console.error('AI processing error:', error);
      
      // Log failed action for retry capability
      logAction({
        user_id: 'ai-assistant',
        user_name: 'AI Assistant',
        action: 'failed_action',
        entity_type: 'activity',
        entity_id: `failed-${Date.now()}`,
        description: `Failed to process command: ${message} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      const errorResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact your system administrator. You can also check the History tab to retry failed actions.`,
        timestamp: new Date(),
        status: 'error',
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorResponse],
        isProcessing: false,
      }));
    }
  };

  const handleActionConfirm = async (messageId: string, confirmed: boolean) => {
    if (!state.pendingAction) return;

    if (confirmed) {
      setState(prev => ({ ...prev, isProcessing: true, pendingAction: null }));
      
      try {
        const result = await executeAction(state.pendingAction.data, state.pendingAction.type);
        if (result?.success) {
          const confirmationResponse: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: result.message,
            timestamp: new Date(),
            status: 'sent',
          };

          setState(prev => ({
            ...prev,
            messages: [...prev.messages, confirmationResponse],
            isProcessing: false,
          }));
        } else {
          throw new Error('Action execution failed');
        }
      } catch (error) {
        const errorResponse: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `❌ Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          status: 'error',
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, errorResponse],
          isProcessing: false,
        }));
      }
    } else {
      // Action cancelled
      const cancelResponse: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `❌ Action cancelled. The ${state.pendingAction.title.toLowerCase()} was not executed.`,
        timestamp: new Date(),
        status: 'sent',
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, cancelResponse],
        pendingAction: null,
      }));
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (transcript.trim()) {
      handleSendMessage(transcript);
    }
  };

  const handleRetryAction = async (action: any) => {
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Simulate original command to retry the action
      const retryMessage = `Retry ${action.type}: ${action.description}`;
      
      // Add retry message to chat
      const retryUserMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: `🔄 Retrying: ${action.title}`,
        timestamp: new Date(),
        status: 'sent',
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, retryUserMessage],
      }));

      // Execute the retry based on action type
      let result;
      if (action.type === 'create_incident') {
        result = await executeAction(action.data, 'create_incident');
      } else if (action.type === 'create_activity') {
        result = await executeAction(action.data, 'create_activity');
      }

      if (result?.success) {
        const successResponse: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `✅ Retry successful!\n\n${result.message}`,
          timestamp: new Date(),
          status: 'sent',
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, successResponse],
          isProcessing: false,
        }));
      } else {
        throw new Error('Retry failed');
      }
    } catch (error) {
      const errorResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `❌ Retry failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        status: 'error',
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorResponse],
        isProcessing: false,
      }));
    }
  };

  // Minimized state - floating button
  if (state.isMinimized) {
    return (
      <div
        className="fixed z-50 select-none"
        style={{ 
          left: '20px', 
          bottom: '20px',
        }}
      >
        <Button
          onClick={() => setState(prev => ({ ...prev, isMinimized: false }))}
          className={cn(
            "h-12 px-4 shadow-lg backdrop-blur-sm border-2 transition-all duration-200",
            "bg-card/90 border-border hover:bg-card hover:scale-105",
            state.hasNewMessage && "animate-pulse border-primary"
          )}
          variant="outline"
        >
          <Bot className="h-5 w-5 mr-2" />
          <span className="font-medium">AI</span>
          {state.hasNewMessage && (
            <div className="w-2 h-2 bg-primary rounded-full ml-2 animate-ping" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="absolute z-50 select-none transition-all duration-300 ease-out"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
      }}
    >
      <ResizablePanel defaultSize={50}>
        <div
          ref={panelRef}
          className="h-full"
        >
          <Card className={cn(
            "h-full shadow-2xl backdrop-blur-md border-2 overflow-hidden",
            "bg-card/95 border-border/50",
            isDragging && "cursor-grabbing"
          )}>
            {/* Header */}
            <CardHeader 
              className={cn(
                "pb-3 cursor-grab active:cursor-grabbing",
                "bg-gradient-to-r from-primary/10 to-accent/10"
              )}
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Bot className="h-4 w-4 text-primary" />
                  AI Assistant
                  {state.isProcessing && (
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  )}
                </CardTitle>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMinimize}
                    className="h-6 w-6 p-0 hover:bg-background/50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-1 mt-2">
                <Button
                  variant={state.currentView === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('chat')}
                  className="h-7 px-2 text-xs"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat
                </Button>
                <Button
                  variant={state.currentView === 'voice' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('voice')}
                  className="h-7 px-2 text-xs"
                >
                  <Mic className="h-3 w-3 mr-1" />
                  Voice
                </Button>
                <Button
                  variant={state.currentView === 'history' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('history')}
                  className="h-7 px-2 text-xs"
                >
                  <History className="h-3 w-3 mr-1" />
                  History
                </Button>
                <Button
                  variant={state.currentView === 'settings' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('settings')}
                  className="h-7 px-2 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
                <Button
                  variant={state.currentView === 'debug' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('debug')}
                  className="h-7 px-2 text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Debug
                </Button>
              </div>
            </CardHeader>

            <Separator />

            {/* Content */}
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              {/* Chat View */}
              {state.currentView === 'chat' && (
                <AIChat
                  messages={state.messages}
                  isProcessing={state.isProcessing}
                  onSendMessage={handleSendMessage}
                  onClearConversation={() => setState(prev => ({ ...prev, messages: [] }))}
                />
              )}

              {/* Voice View */}
              {state.currentView === 'voice' && (
                <div className="flex-1 p-4">
                  <VoiceInput
                    isListening={state.isListening}
                    onStartListening={handleStartListening}
                    onStopListening={handleStopListening}
                    onTranscriptReady={handleVoiceTranscript}
                    isProcessing={state.isProcessing}
                  />
                </div>
              )}

              {/* History View */}
              {state.currentView === 'history' && (
                <div className="flex-1 p-4">
                  <AIHistory onRetryAction={handleRetryAction} />
                </div>
              )}

              {/* Settings View */}
              {state.currentView === 'settings' && (
                <div className="flex-1 p-4 space-y-4">
                  <div className="text-center text-sm text-muted-foreground mb-4">
                    AI Assistant Settings
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">Voice Responses</span>
                        <div className="text-xs text-muted-foreground">Enable audio feedback for AI responses</div>
                      </div>
                      <Switch
                        checked={settings.voiceResponses}
                        onCheckedChange={(checked) => handleSettingChange('voiceResponses', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">Auto-approve Low Priority</span>
                        <div className="text-xs text-muted-foreground">Skip confirmation for low-priority actions</div>
                      </div>
                      <Switch
                        checked={settings.autoApproveLowPriority}
                        onCheckedChange={(checked) => handleSettingChange('autoApproveLowPriority', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">Show Transcription</span>
                        <div className="text-xs text-muted-foreground">Display voice input transcription</div>
                      </div>
                      <Switch
                        checked={settings.showTranscription}
                        onCheckedChange={(checked) => handleSettingChange('showTranscription', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">Remember Position</span>
                        <div className="text-xs text-muted-foreground">Save panel position between sessions</div>
                      </div>
                      <Switch
                        checked={settings.rememberPosition}
                        onCheckedChange={(checked) => handleSettingChange('rememberPosition', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">Keyboard Shortcuts</span>
                        <div className="text-xs text-muted-foreground">Enable keyboard navigation</div>
                      </div>
                      <Switch
                        checked={settings.enableKeyboardShortcuts}
                        onCheckedChange={(checked) => handleSettingChange('enableKeyboardShortcuts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">Notification Sounds</span>
                        <div className="text-xs text-muted-foreground">Play sounds for important notifications</div>
                      </div>
                      <Switch
                        checked={settings.playNotificationSounds}
                        onCheckedChange={(checked) => handleSettingChange('playNotificationSounds', checked)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Keyboard Shortcuts</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• <Badge variant="secondary" className="text-xs">Cmd/Ctrl + K</Badge> Open AI Assistant</div>
                      <div>• <Badge variant="secondary" className="text-xs">ESC</Badge> Close/Cancel action</div>
                      <div>• <Badge variant="secondary" className="text-xs">Enter</Badge> Send message</div>
                      <div>• <Badge variant="secondary" className="text-xs">Tab</Badge> Switch between views</div>
                      <div>• <Badge variant="secondary" className="text-xs">Space</Badge> Start/stop voice input</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Reset</div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSettings({
                          voiceResponses: true,
                          autoApproveLowPriority: false,
                          showTranscription: true,
                          rememberPosition: true,
                          enableKeyboardShortcuts: true,
                          playNotificationSounds: true
                        });
                      }}
                      className="w-full"
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
              )}

              {/* Debug View */}
              {state.currentView === 'debug' && (
                <div className="flex-1 p-4">
                  <AIDebugPanel />
                </div>
              )}
            </CardContent>

            {/* Keyboard Shortcut Helper Overlay */}
            {showShortcutHelper && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-card/95 border border-border/50">
                  <CardContent className="p-4">
                    <div className="text-center mb-4">
                      <h3 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h3>
                      <p className="text-xs text-muted-foreground">Press any key to dismiss</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Toggle AI</span>
                            <Badge variant="secondary" className="text-xs">⌘+K</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Close/Cancel</span>
                            <Badge variant="secondary" className="text-xs">ESC</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Next Tab</span>
                            <Badge variant="secondary" className="text-xs">TAB</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Voice Toggle</span>
                            <Badge variant="secondary" className="text-xs">Space</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Focus Input</span>
                            <Badge variant="secondary" className="text-xs">⌘+↵</Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Chat View</span>
                            <Badge variant="secondary" className="text-xs">Alt+1</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Voice View</span>
                            <Badge variant="secondary" className="text-xs">Alt+2</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">History View</span>
                            <Badge variant="secondary" className="text-xs">Alt+3</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Settings View</span>
                            <Badge variant="secondary" className="text-xs">Alt+4</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">This Help</span>
                            <Badge variant="secondary" className="text-xs">⌘+H</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowShortcutHelper(false)}
                        className="text-xs"
                      >
                        Got it!
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Confirmation Dialog */}
            <ActionConfirmation
              pendingAction={state.pendingAction}
              isOpen={!!state.pendingAction}
              onConfirm={() => {
                if (state.pendingAction) {
                  handleActionConfirm(state.pendingAction.id, true);
                }
              }}
              onCancel={() => {
                if (state.pendingAction) {
                  handleActionConfirm(state.pendingAction.id, false);
                }
              }}
            />
          </Card>
        </div>
      </ResizablePanel>
      <ResizableHandle />
    </ResizablePanelGroup>
  );
}