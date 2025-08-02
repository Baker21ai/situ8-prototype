import { useState, useCallback, useEffect } from 'react';

export interface RadioMessage {
  id: string;
  timestamp: string;
  guardId: string;
  guardName: string;
  location: string;
  building?: string;
  channel: 'main' | 'emergency' | 'telegram';
  type: 'voice' | 'text' | 'ai_response';
  content: string;
  transcriptionConfidence?: number;
  activityId?: string;
  activityType?: string;
  threadId?: string;
  isConverted?: boolean;
  originalType?: string;
  status?: 'pending' | 'processed' | 'converted';
  hasAudio?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  isPlaying?: boolean;
  relatedActivities?: string[];
}

export interface Guard {
  id: string;
  name: string;
  status: 'available' | 'responding' | 'investigating' | 'break' | 'offline';
  location: string;
  building?: string;
  lastSeen: string;
  channel: string;
  currentTask?: string;
  shiftStart?: string;
  shiftEnd?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'radio' | 'telegram' | 'integrated';
  activeCount: number;
  totalCount: number;
  lastActivity: string;
  status: 'active' | 'standby' | 'offline';
  messageCount: number;
  transcriptionRate: number;
  incidentCount: number;
}

interface UseCommunicationsState {
  messages: RadioMessage[];
  guards: Guard[];
  channels: Channel[];
  activeChannel: string;
  selectedMessage: RadioMessage | null;
  playingMessage: string | null;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
}

interface UseCommunicationsActions {
  sendMessage: (content: string, channel?: string) => void;
  playAudio: (messageId: string) => void;
  stopAudio: () => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setActiveChannel: (channel: string) => void;
  setSelectedMessage: (message: RadioMessage | null) => void;
  refreshMessages: () => void;
  addMessage: (message: RadioMessage) => void;
  updateGuardStatus: (guardId: string, status: Guard['status']) => void;
}

type UseCommunicationsReturn = UseCommunicationsState & UseCommunicationsActions;

// Mock initial data
const mockMessages: RadioMessage[] = [
  {
    id: 'msg-001',
    timestamp: '14:36:22',
    guardId: 'garcia-m',
    guardName: 'Garcia, M.',
    location: 'Lobby',
    building: 'Building A',
    channel: 'main',
    type: 'voice',
    content: 'Patient stable, paramedics on scene taking over',
    transcriptionConfidence: 0.95,
    activityId: 'ACT-0578',
    activityType: 'medical',
    priority: 'high',
    hasAudio: true,
    duration: 8,
    threadId: 'thread-medical-001',
    relatedActivities: ['ACT-0575', 'ACT-0576']
  },
  {
    id: 'msg-002',
    timestamp: '14:35:02',
    guardId: 'ai-assistant',
    guardName: 'AI Assistant',
    location: 'System',
    building: 'System',
    channel: 'main',
    type: 'ai_response',
    content: 'Medical incident created. Dispatching backup. ETA for EMS?',
    priority: 'medium',
    threadId: 'thread-medical-001'
  }
];

const mockGuards: Guard[] = [
  { 
    id: 'garcia-m', 
    name: 'Garcia, M.', 
    status: 'investigating', 
    location: 'Lobby', 
    building: 'Building A', 
    lastSeen: '14:36', 
    channel: 'main', 
    currentTask: 'Medical Response', 
    shiftStart: '06:00', 
    shiftEnd: '18:00' 
  },
  { 
    id: 'wilson-r', 
    name: 'Wilson, R.', 
    status: 'responding', 
    location: 'Section A', 
    building: 'Building A', 
    lastSeen: '14:33', 
    channel: 'main', 
    currentTask: 'Suspicious Vehicle', 
    shiftStart: '06:00', 
    shiftEnd: '18:00' 
  }
];

const mockChannels: Channel[] = [
  { 
    id: 'main', 
    name: 'Main Channel', 
    type: 'radio', 
    activeCount: 12, 
    totalCount: 15, 
    lastActivity: '10s ago', 
    status: 'active',
    messageCount: 156,
    transcriptionRate: 0.89,
    incidentCount: 12
  },
  { 
    id: 'emergency', 
    name: 'Emergency', 
    type: 'radio', 
    activeCount: 0, 
    totalCount: 15, 
    lastActivity: 'Standby', 
    status: 'standby',
    messageCount: 0,
    transcriptionRate: 1.0,
    incidentCount: 0
  }
];

export const useCommunications = (): UseCommunicationsReturn => {
  const [state, setState] = useState<UseCommunicationsState>({
    messages: mockMessages,
    guards: mockGuards,
    channels: mockChannels,
    activeChannel: 'main',
    selectedMessage: null,
    playingMessage: null,
    volume: 80,
    isMuted: false,
    isLoading: false
  });

  // Send a new message
  const sendMessage = useCallback((content: string, channel: string = state.activeChannel) => {
    if (!content.trim()) return;

    const newMessage: RadioMessage = {
      id: `msg-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      guardId: 'current-user',
      guardName: 'J. Smith',
      location: 'Command Center',
      building: 'Building A',
      channel: channel as 'main' | 'emergency' | 'telegram',
      type: 'text',
      content,
      priority: 'medium'
    };

    setState(prev => ({
      ...prev,
      messages: [newMessage, ...prev.messages]
    }));
  }, [state.activeChannel]);

  // Play audio for a message
  const playAudio = useCallback((messageId: string) => {
    setState(prev => ({ ...prev, playingMessage: messageId }));
    
    // Simulate audio playback duration
    setTimeout(() => {
      setState(prev => ({ ...prev, playingMessage: null }));
    }, 3000);
  }, []);

  // Stop audio playback
  const stopAudio = useCallback(() => {
    setState(prev => ({ ...prev, playingMessage: null }));
  }, []);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume: Math.max(0, Math.min(100, volume)) }));
  }, []);

  // Set muted state
  const setIsMuted = useCallback((muted: boolean) => {
    setState(prev => ({ ...prev, isMuted: muted }));
  }, []);

  // Set active channel
  const setActiveChannel = useCallback((channel: string) => {
    setState(prev => ({ ...prev, activeChannel: channel }));
  }, []);

  // Set selected message
  const setSelectedMessage = useCallback((message: RadioMessage | null) => {
    setState(prev => ({ ...prev, selectedMessage: message }));
  }, []);

  // Refresh messages (simulate API call)
  const refreshMessages = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API delay
    setTimeout(() => {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        messages: [...mockMessages] // In real app, this would be fresh data
      }));
    }, 1000);
  }, []);

  // Add a new message (from external source)
  const addMessage = useCallback((message: RadioMessage) => {
    setState(prev => ({
      ...prev,
      messages: [message, ...prev.messages]
    }));
  }, []);

  // Update guard status
  const updateGuardStatus = useCallback((guardId: string, status: Guard['status']) => {
    setState(prev => ({
      ...prev,
      guards: prev.guards.map(guard => 
        guard.id === guardId 
          ? { ...guard, status, lastSeen: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) }
          : guard
      )
    }));
  }, []);

  // Simulate real-time message updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new message every 30 seconds with 30% probability
      if (Math.random() > 0.7) {
        const randomGuard = state.guards[Math.floor(Math.random() * state.guards.length)];
        const newMessage: RadioMessage = {
          id: `msg-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          guardId: randomGuard.id,
          guardName: randomGuard.name,
          location: randomGuard.location,
          building: randomGuard.building,
          channel: 'main',
          type: 'voice',
          content: ['All clear in my sector', 'Checking loading dock', 'Visitor escort complete', 'Starting perimeter patrol'][Math.floor(Math.random() * 4)],
          transcriptionConfidence: 0.85 + Math.random() * 0.15,
          hasAudio: true,
          priority: 'low'
        };
        
        addMessage(newMessage);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [state.guards, addMessage]);

  return {
    ...state,
    sendMessage,
    playAudio,
    stopAudio,
    setVolume,
    setIsMuted,
    setActiveChannel,
    setSelectedMessage,
    refreshMessages,
    addMessage,
    updateGuardStatus
  };
};