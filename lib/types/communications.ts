/**
 * Type definitions for communications and radio systems
 */

import { Priority } from '../utils/status';

export type CommunicationType = 'voice' | 'text' | 'ai_response' | 'system';
export type ChannelType = 'main' | 'emergency' | 'dispatch' | 'private' | 'broadcast';
export type CommunicationStatus = 'active' | 'resolved' | 'archived' | 'pending';

// Base communication entry
export interface CommunicationEntry {
  id: string;
  timestamp: Date;
  type: CommunicationType;
  channel: ChannelType;
  from: string;
  to?: string | string[];
  content: string;
  location?: string;
  transcriptionConfidence?: number;
  hasAudio?: boolean;
  audioUrl?: string;
  threadId?: string;
  priority: Priority;
  activityId?: string;
  status: CommunicationStatus;
  metadata?: CommunicationMetadata;
}

// Communication metadata
export interface CommunicationMetadata {
  duration?: number; // For voice communications (seconds)
  deviceId?: string;
  signalStrength?: number;
  encryption?: boolean;
  language?: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent';
  keywords?: string[];
  aiAnalysis?: AIAnalysis;
}

// AI analysis results
export interface AIAnalysis {
  summary: string;
  actionItems: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedResponse?: string;
  detectedEntities: {
    people: string[];
    locations: string[];
    times: string[];
    objects: string[];
  };
  confidence: number;
}

// Radio channel configuration
export interface RadioChannel {
  id: string;
  name: string;
  type: ChannelType;
  frequency?: string;
  encryption: boolean;
  activeUsers: string[];
  permissions: ChannelPermissions;
  recording: boolean;
  priority: number; // Channel priority (1-10)
}

// Channel permissions
export interface ChannelPermissions {
  listen: string[]; // User roles that can listen
  transmit: string[]; // User roles that can transmit
  moderate: string[]; // User roles that can moderate
}

// Communication thread
export interface CommunicationThread {
  id: string;
  startTime: Date;
  endTime?: Date;
  participants: string[];
  messages: CommunicationEntry[];
  subject?: string;
  priority: Priority;
  relatedActivityId?: string;
  status: CommunicationStatus;
  tags?: string[];
}

// Radio device/unit
export interface RadioUnit {
  id: string;
  callsign: string;
  userId?: string;
  type: 'handheld' | 'vehicle' | 'base' | 'mobile';
  status: 'online' | 'offline' | 'transmitting' | 'emergency';
  battery?: number;
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
    lastUpdate: Date;
  };
  activeChannels: string[];
  capabilities: string[];
}

// Emergency broadcast
export interface EmergencyBroadcast {
  id: string;
  timestamp: Date;
  initiator: string;
  type: 'evacuation' | 'lockdown' | 'medical' | 'security' | 'weather' | 'test';
  message: string;
  affectedAreas: string[];
  expiresAt?: Date;
  acknowledgements: BroadcastAcknowledgement[];
  priority: 'critical';
  instructions?: string[];
}

// Broadcast acknowledgement
export interface BroadcastAcknowledgement {
  userId: string;
  timestamp: Date;
  location?: string;
  response?: 'acknowledged' | 'unable' | 'responding';
  notes?: string;
}

// Communication statistics
export interface CommunicationStats {
  totalMessages: number;
  byType: Record<CommunicationType, number>;
  byChannel: Record<ChannelType, number>;
  averageResponseTime: number;
  peakHours: {
    hour: number;
    count: number;
  }[];
  topParticipants: {
    userId: string;
    count: number;
  }[];
}

// Push-to-talk session
export interface PTTSession {
  id: string;
  userId: string;
  channelId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  transcription?: string;
  audioUrl?: string;
  status: 'active' | 'completed' | 'failed';
}

// Communication protocol/procedure
export interface CommunicationProtocol {
  id: string;
  name: string;
  type: string;
  trigger: string;
  steps: string[];
  participants: string[];
  channels: string[];
  priority: Priority;
  estimatedDuration: number; // minutes
}