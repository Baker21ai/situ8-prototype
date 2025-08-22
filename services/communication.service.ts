/**
 * Communication Service
 * Handles real-time messaging, WebSocket connections, and DynamoDB persistence
 */

import { BaseService } from './base.service';
import { AWSApiClient } from './aws-api';
import { AuditContext, ServiceResponse } from './types';

// Message types
export interface CommunicationMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: 'text' | 'voice' | 'system' | 'emergency';
  timestamp: Date;
  metadata?: {
    voiceTranscription?: string;
    voiceDuration?: number;
    attachments?: string[];
    priority?: 'low' | 'normal' | 'high' | 'emergency';
    tags?: string[];
  };
  status: 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
}

// Channel types
export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'team' | 'incident' | 'broadcast' | 'direct' | 'emergency';
  description?: string;
  memberIds: string[];
  activeMembers: string[];
  requiredClearance?: number;
  isPrivate: boolean;
  isEmergency: boolean;
  metadata?: {
    frequency?: string;
    signalStrength?: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
    lastActivity?: Date;
    messageCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// WebSocket connection info
export interface WebSocketConnection {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  channelIds: string[];
  connectedAt: Date;
  lastSeen: Date;
  status: 'connected' | 'away' | 'busy' | 'offline';
}

// Service response types
export interface MessageResponse extends CommunicationMessage {}
export interface ChannelResponse extends CommunicationChannel {}

export class CommunicationService extends BaseService {
  private awsClient: AWSApiClient;
  private websocketEndpoint: string;
  
  // DynamoDB table names
  private readonly MESSAGES_TABLE = process.env.REACT_APP_TABLE_MESSAGES || 'situ8-communication-messages';
  private readonly CHANNELS_TABLE = process.env.REACT_APP_TABLE_CHANNELS || 'situ8-communication-channels';
  private readonly CONNECTIONS_TABLE = process.env.REACT_APP_TABLE_CONNECTIONS || 'situ8-websocket-connections';

  constructor(awsClient: AWSApiClient) {
    super('Communication');
    this.awsClient = awsClient;
    this.websocketEndpoint = process.env.VITE_WEBSOCKET_URL || 
                           process.env.REACT_APP_WEBSOCKET_URL || 
                           'wss://8hj9sdifek.execute-api.us-west-2.amazonaws.com/dev';
  }

  // Helper methods
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected async createAuditEntry(context: any): Promise<void> {
    // Audit entry creation logic
    console.log('Audit entry created:', context);
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(
    channelId: string,
    content: string,
    senderId: string,
    senderName: string,
    senderRole: string,
    type: CommunicationMessage['type'] = 'text',
    metadata?: CommunicationMessage['metadata'],
    auditContext?: AuditContext
  ): Promise<ServiceResponse<MessageResponse>> {
    try {
      const messageId = this.generateId();
      const timestamp = new Date();

      const message: CommunicationMessage = {
        id: messageId,
        channelId,
        senderId,
        senderName,
        senderRole,
        content,
        type,
        timestamp,
        metadata,
        status: 'sent'
      };

      // Store message in DynamoDB
      const dbResponse = await this.awsClient.makeRequest('/messages', {
        method: 'POST',
        body: {
          action: 'create',
          message,
          tableName: this.MESSAGES_TABLE
        }
      });

      if (!dbResponse.success) {
        throw new Error(dbResponse.error || 'Failed to store message');
      }

      // Send real-time message via WebSocket
      await this.broadcastToChannel(channelId, {
        action: 'newMessage',
        message
      });

      // Update channel last activity
      await this.updateChannelActivity(channelId, timestamp);

      // Create audit entry
      await this.createAuditEntry({
        action: 'send_message',
        resource: 'communication_message',
        resourceId: messageId,
        details: { channelId, type, contentLength: content.length },
        auditContext
      });

      return this.createSuccessResponse(message, 'Message sent successfully');

    } catch (error) {
      this.logError('sendMessage', error);
      return this.createErrorResponse('Failed to send message', error);
    }
  }

  /**
   * Get messages for a channel with pagination
   */
  async getChannelMessages(
    channelId: string,
    limit: number = 50,
    lastEvaluatedKey?: string,
    auditContext?: AuditContext
  ): Promise<ServiceResponse<{ messages: MessageResponse[], hasMore: boolean, lastKey?: string }>> {
    try {
      const response = await this.awsClient.makeRequest('/messages', {
        method: 'GET',
        queryParams: {
          action: 'getByChannel',
          channelId,
          limit: limit.toString(),
          ...(lastEvaluatedKey && { lastEvaluatedKey })
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch messages');
      }

      const messages = response.data?.messages || [];
      const hasMore = response.metadata?.hasMore || false;
      const lastKey = response.metadata?.lastEvaluatedKey;

      // Create audit entry
      await this.createAuditEntry({
        action: 'get_channel_messages',
        resource: 'communication_channel',
        resourceId: channelId,
        details: { messageCount: messages.length, limit },
        auditContext
      });

      return this.createSuccessResponse(
        { messages, hasMore, lastKey },
        'Messages retrieved successfully'
      );

    } catch (error) {
      this.logError('getChannelMessages', error);
      return this.createErrorResponse('Failed to get channel messages', error);
    }
  }

  /**
   * Create a new communication channel
   */
  async createChannel(
    name: string,
    type: CommunicationChannel['type'],
    description: string,
    memberIds: string[],
    creatorId: string,
    requiredClearance?: number,
    metadata?: CommunicationChannel['metadata'],
    auditContext?: AuditContext
  ): Promise<ServiceResponse<ChannelResponse>> {
    try {
      const channelId = this.generateId();
      const timestamp = new Date();

      const channel: CommunicationChannel = {
        id: channelId,
        name,
        type,
        description,
        memberIds: [...memberIds, creatorId], // Include creator
        activeMembers: [],
        requiredClearance,
        isPrivate: type === 'direct' || requiredClearance ? true : false,
        isEmergency: type === 'emergency',
        metadata,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Store channel in DynamoDB
      const dbResponse = await this.awsClient.makeRequest('/channels', {
        method: 'POST',
        body: {
          action: 'create',
          channel,
          tableName: this.CHANNELS_TABLE
        }
      });

      if (!dbResponse.success) {
        throw new Error(dbResponse.error || 'Failed to create channel');
      }

      // Notify members of new channel
      await this.notifyChannelMembers(memberIds, {
        action: 'channelCreated',
        channel
      });

      // Create audit entry
      await this.createAuditEntry({
        action: 'create_channel',
        resource: 'communication_channel',
        resourceId: channelId,
        details: { name, type, memberCount: memberIds.length },
        auditContext
      });

      return this.createSuccessResponse(channel, 'Channel created successfully');

    } catch (error) {
      this.logError('createChannel', error);
      return this.createErrorResponse('Failed to create channel', error);
    }
  }

  /**
   * Get all channels for a user
   */
  async getUserChannels(
    userId: string,
    auditContext?: AuditContext
  ): Promise<ServiceResponse<ChannelResponse[]>> {
    try {
      const response = await this.awsClient.makeRequest('/channels', {
        method: 'GET',
        queryParams: {
          action: 'getUserChannels',
          userId
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch channels');
      }

      const channels = response.data?.channels || [];

      // Create audit entry
      await this.createAuditEntry({
        action: 'get_user_channels',
        resource: 'communication_user',
        resourceId: userId,
        details: { channelCount: channels.length },
        auditContext
      });

      return this.createSuccessResponse(channels, 'Channels retrieved successfully');

    } catch (error) {
      this.logError('getUserChannels', error);
      return this.createErrorResponse('Failed to get user channels', error);
    }
  }

  /**
   * Join a channel
   */
  async joinChannel(
    channelId: string,
    userId: string,
    userName: string,
    auditContext?: AuditContext
  ): Promise<ServiceResponse<void>> {
    try {
      // Update channel membership
      const response = await this.awsClient.makeRequest('/channels', {
        method: 'PUT',
        body: {
          action: 'addMember',
          channelId,
          userId,
          userName
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to join channel');
      }

      // Notify channel of new member
      await this.broadcastToChannel(channelId, {
        action: 'memberJoined',
        userId,
        userName
      });

      // Create audit entry
      await this.createAuditEntry({
        action: 'join_channel',
        resource: 'communication_channel',
        resourceId: channelId,
        details: { userId, userName },
        auditContext
      });

      return this.createSuccessResponse(undefined, 'Joined channel successfully');

    } catch (error) {
      this.logError('joinChannel', error);
      return this.createErrorResponse('Failed to join channel', error);
    }
  }

  /**
   * Leave a channel
   */
  async leaveChannel(
    channelId: string,
    userId: string,
    userName: string,
    auditContext?: AuditContext
  ): Promise<ServiceResponse<void>> {
    try {
      // Update channel membership
      const response = await this.awsClient.makeRequest('/channels', {
        method: 'PUT',
        body: {
          action: 'removeMember',
          channelId,
          userId
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to leave channel');
      }

      // Notify channel of member leaving
      await this.broadcastToChannel(channelId, {
        action: 'memberLeft',
        userId,
        userName
      });

      // Create audit entry
      await this.createAuditEntry({
        action: 'leave_channel',
        resource: 'communication_channel',
        resourceId: channelId,
        details: { userId, userName },
        auditContext
      });

      return this.createSuccessResponse(undefined, 'Left channel successfully');

    } catch (error) {
      this.logError('leaveChannel', error);
      return this.createErrorResponse('Failed to leave channel', error);
    }
  }

  /**
   * Update channel activity timestamp
   */
  private async updateChannelActivity(channelId: string, timestamp: Date): Promise<void> {
    try {
      await this.awsClient.makeRequest('/channels', {
        method: 'PUT',
        body: {
          action: 'updateActivity',
          channelId,
          lastActivity: timestamp.toISOString()
        }
      });
    } catch (error) {
      this.logError('updateChannelActivity', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Broadcast message to all channel members via WebSocket
   */
  private async broadcastToChannel(channelId: string, message: any): Promise<void> {
    try {
      await this.awsClient.makeRequest('/websocket/broadcast', {
        method: 'POST',
        body: {
          action: 'broadcast',
          channelId,
          message
        }
      });
    } catch (error) {
      this.logError('broadcastToChannel', error);
      // Don't throw - message is already stored
    }
  }

  /**
   * Notify specific users via WebSocket
   */
  private async notifyChannelMembers(userIds: string[], message: any): Promise<void> {
    try {
      await this.awsClient.makeRequest('/websocket/notify', {
        method: 'POST',
        body: {
          action: 'notify',
          userIds,
          message
        }
      });
    } catch (error) {
      this.logError('notifyChannelMembers', error);
      // Don't throw - not critical
    }
  }

  /**
   * Health check for communication service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', details: any }> {
    try {
      // Test DynamoDB connectivity
      const dbHealth = await this.awsClient.makeRequest('/health/dynamodb');
      
      // Test WebSocket API connectivity  
      const wsHealth = await this.awsClient.makeRequest('/health/websocket');

      const isHealthy = dbHealth.success && wsHealth.success;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          dynamodb: dbHealth.success ? 'healthy' : dbHealth.error,
          websocket: wsHealth.success ? 'healthy' : wsHealth.error,
          tables: {
            messages: this.MESSAGES_TABLE,
            channels: this.CHANNELS_TABLE,
            connections: this.CONNECTIONS_TABLE
          },
          endpoint: this.websocketEndpoint
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Get a presigned URL for uploading a file attachment (e.g., voice clip)
   */
  async getPresignedUploadUrl(
    fileName: string,
    contentType: string
  ): Promise<ServiceResponse<{ uploadUrl: string; fileUrl: string }>> {
    try {
      const response = await this.awsClient.makeRequest('/uploads', {
        method: 'POST',
        body: {
          action: 'presign',
          fileName,
          contentType
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get presigned URL');
      }

      const { uploadUrl, fileUrl } = response.data || {};
      return this.createSuccessResponse({ uploadUrl, fileUrl }, 'Presigned URL created');
    } catch (error) {
      this.logError('getPresignedUploadUrl', error);
      return this.createErrorResponse('Failed to get presigned URL', error);
    }
  }

  /**
   * Upload a blob to S3 using the presigned URL
   */
  async uploadToPresignedUrl(
    uploadUrl: string,
    data: Blob | ArrayBuffer | Uint8Array,
    contentType: string
  ): Promise<void> {
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: data as any
    });
  }
}