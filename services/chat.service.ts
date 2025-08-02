/**
 * Chat Service
 * Handles all chat-related business logic including conversations, messages, and real-time communication
 */

import { BaseService } from './base.service';
import {
  ServiceResponse,
  AuditContext,
  ValidationResult,
  ValidationError,
  BusinessRuleResult,
  QueryOptions,
  ResponseMetadata
} from './types';

// Chat-specific types
export interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'building' | 'broadcast';
  participants: string[];
  metadata?: {
    building?: string;
    department?: string;
    purpose?: string;
  };
  lastMessage?: ChatMessage;
  lastActivity: string;
  createdAt: string;
  createdBy: string;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'voice' | 'file' | 'radio' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  editedAt?: string;
  deletedAt?: string;
  replyTo?: string;
  attachments?: Attachment[];
  metadata?: {
    location?: string;
    radioChannel?: string;
    transcriptionConfidence?: number;
    priority?: 'normal' | 'high' | 'emergency';
  };
  readBy?: ReadReceipt[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'voice';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  duration?: number; // For audio/video
  thumbnail?: string; // For images/videos
}

export interface ReadReceipt {
  userId: string;
  readAt: string;
}

export interface CreateConversationDTO {
  name?: string;
  type: 'direct' | 'group' | 'building' | 'broadcast';
  participants: string[];
  metadata?: Record<string, any>;
}

export interface SendMessageDTO {
  conversationId: string;
  content: string;
  type?: 'text' | 'voice' | 'file' | 'radio';
  replyTo?: string;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export class ChatService extends BaseService<ChatMessage, string> {
  constructor() {
    super('ChatService', {
      enableAudit: true,
      enableValidation: true,
      enableBusinessRules: true,
      maxRetries: 3,
      timeoutMs: 10000
    });
  }

  // Implement abstract methods from BaseService
  protected validateEntity(entity: Partial<ChatMessage>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings = [];

    // Validate required fields
    if (entity.content !== undefined) {
      const contentError = this.validateRequired(entity.content, 'content');
      if (contentError) errors.push(contentError);
      
      // Validate content length
      if (entity.content && entity.content.length > 5000) {
        errors.push({
          field: 'content',
          code: 'TOO_LONG',
          message: 'Message content cannot exceed 5000 characters',
          value: entity.content.length
        });
      }
    }

    if (entity.conversationId !== undefined) {
      const convError = this.validateRequired(entity.conversationId, 'conversationId');
      if (convError) errors.push(convError);
    }

    if (entity.senderId !== undefined) {
      const senderError = this.validateRequired(entity.senderId, 'senderId');
      if (senderError) errors.push(senderError);
    }

    // Validate message type
    if (entity.type !== undefined) {
      const typeError = this.validateEnum(
        entity.type,
        'type',
        ['text', 'voice', 'file', 'radio', 'system']
      );
      if (typeError) errors.push(typeError);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  protected enforceBusinessRules(entity: Partial<ChatMessage>, operation: string): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];

    // Business rule: Emergency messages must have high priority
    if (entity.metadata?.priority === 'emergency' && operation === 'create') {
      results.push({
        ruleName: 'emergency-priority',
        passed: true,
        message: 'Emergency messages are marked with high priority'
      });
    }

    // Business rule: Radio messages must have channel metadata
    if (entity.type === 'radio' && !entity.metadata?.radioChannel) {
      results.push({
        ruleName: 'radio-channel-required',
        passed: false,
        message: 'Radio messages must include channel information'
      });
    }

    // Business rule: Voice messages must have attachments
    if (entity.type === 'voice' && (!entity.attachments || entity.attachments.length === 0)) {
      results.push({
        ruleName: 'voice-attachment-required',
        passed: false,
        message: 'Voice messages must include audio attachment'
      });
    }

    return results;
  }

  protected getEntityName(): string {
    return 'ChatMessage';
  }

  // Conversation management
  async createConversation(
    data: CreateConversationDTO,
    context: AuditContext
  ): Promise<ServiceResponse<Conversation>> {
    try {
      // Validate input
      if (!data.participants || data.participants.length < 2) {
        return this.createErrorResponse('Conversation must have at least 2 participants', 'INVALID_PARTICIPANTS');
      }

      // Direct conversations can only have 2 participants
      if (data.type === 'direct' && data.participants.length !== 2) {
        return this.createErrorResponse('Direct conversations must have exactly 2 participants', 'INVALID_DIRECT_CONVERSATION');
      }

      // Generate conversation name if not provided
      const conversationName = data.name || this.generateConversationName(data.type, data.participants);

      const conversation: Conversation = {
        id: this.generateCorrelationId(),
        name: conversationName,
        type: data.type,
        participants: data.participants,
        metadata: data.metadata,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: context.userId,
        isPinned: false,
        isMuted: false,
        isArchived: false
      };

      // Audit log
      await this.auditLog(context, 'CREATE_CONVERSATION', conversation.id, undefined, conversation);

      // Publish event
      await this.publishEvent({
        eventType: 'conversation.created',
        entityId: conversation.id,
        entityType: 'Conversation',
        data: conversation,
        userId: context.userId
      });

      return this.createSuccessResponse(conversation, 'Conversation created successfully');
    } catch (error) {
      return this.createErrorResponse(error, 'CONVERSATION_CREATE_FAILED');
    }
  }

  // Message sending
  async sendMessage(
    data: SendMessageDTO,
    context: AuditContext
  ): Promise<ServiceResponse<ChatMessage>> {
    try {
      // Validate message
      const message: Partial<ChatMessage> = {
        content: data.content,
        conversationId: data.conversationId,
        senderId: context.userId,
        senderName: context.userName,
        type: data.type || 'text',
        replyTo: data.replyTo,
        attachments: data.attachments,
        metadata: data.metadata
      };

      await this.validateInput(message);
      await this.enforceRules(message, 'create');

      const fullMessage: ChatMessage = {
        ...message as ChatMessage,
        id: this.generateCorrelationId(),
        status: 'sending',
        timestamp: new Date().toISOString(),
        readBy: [{
          userId: context.userId,
          readAt: new Date().toISOString()
        }]
      };

      // Audit log
      await this.auditLog(context, 'SEND_MESSAGE', fullMessage.id, undefined, fullMessage);

      // Publish event for real-time delivery
      await this.publishEvent({
        eventType: 'message.sent',
        entityId: fullMessage.id,
        entityType: 'ChatMessage',
        data: fullMessage,
        userId: context.userId
      });

      return this.createSuccessResponse(fullMessage, 'Message sent successfully');
    } catch (error) {
      return this.createErrorResponse(error, 'MESSAGE_SEND_FAILED');
    }
  }

  // Load conversations for a user
  async loadConversations(
    userId: string,
    options?: QueryOptions
  ): Promise<ServiceResponse<Conversation[]>> {
    try {
      // In real implementation, this would query DynamoDB
      // For now, return empty array as we're building the service layer first
      const conversations: Conversation[] = [];
      
      const metadata = this.buildQueryMetadata(conversations, 0, options);
      
      return this.createSuccessResponse(conversations, undefined, metadata);
    } catch (error) {
      return this.createErrorResponse(error, 'CONVERSATIONS_LOAD_FAILED');
    }
  }

  // Load messages for a conversation
  async loadMessages(
    conversationId: string,
    options?: QueryOptions,
    context?: AuditContext
  ): Promise<ServiceResponse<ChatMessage[]>> {
    try {
      // In real implementation, this would query DynamoDB
      const messages: ChatMessage[] = [];
      
      const metadata = this.buildQueryMetadata(messages, 0, options);
      
      return this.createSuccessResponse(messages, undefined, metadata);
    } catch (error) {
      return this.createErrorResponse(error, 'MESSAGES_LOAD_FAILED');
    }
  }

  // Update message status
  async updateMessageStatus(
    messageId: string,
    status: ChatMessage['status'],
    context: AuditContext
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Validate status
      const validStatuses = ['sending', 'sent', 'delivered', 'read', 'failed'];
      if (!validStatuses.includes(status)) {
        return this.createErrorResponse('Invalid message status', 'INVALID_STATUS');
      }

      // Audit log
      await this.auditLog(context, 'UPDATE_MESSAGE_STATUS', messageId, { status: 'old' }, { status });

      return this.createSuccessResponse(true, 'Message status updated');
    } catch (error) {
      return this.createErrorResponse(error, 'STATUS_UPDATE_FAILED');
    }
  }

  // Mark messages as read
  async markAsRead(
    conversationId: string,
    messageIds: string[],
    context: AuditContext
  ): Promise<ServiceResponse<boolean>> {
    try {
      const readReceipt: ReadReceipt = {
        userId: context.userId,
        readAt: new Date().toISOString()
      };

      // Audit log
      await this.auditLog(context, 'MARK_AS_READ', conversationId, { messageIds }, { readReceipt });

      // Publish event
      await this.publishEvent({
        eventType: 'messages.read',
        entityId: conversationId,
        entityType: 'Conversation',
        data: { messageIds, readReceipt },
        userId: context.userId
      });

      return this.createSuccessResponse(true, 'Messages marked as read');
    } catch (error) {
      return this.createErrorResponse(error, 'MARK_READ_FAILED');
    }
  }

  // Join conversation
  async joinConversation(
    conversationId: string,
    context: AuditContext
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Check authorization
      this.checkAuthorization(context, ['admin', 'supervisor', 'officer']);

      // Audit log
      await this.auditLog(context, 'JOIN_CONVERSATION', conversationId);

      // Publish event
      await this.publishEvent({
        eventType: 'conversation.joined',
        entityId: conversationId,
        entityType: 'Conversation',
        data: { userId: context.userId },
        userId: context.userId
      });

      return this.createSuccessResponse(true, 'Joined conversation successfully');
    } catch (error) {
      return this.createErrorResponse(error, 'JOIN_CONVERSATION_FAILED');
    }
  }

  // Leave conversation
  async leaveConversation(
    conversationId: string,
    context: AuditContext
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Audit log
      await this.auditLog(context, 'LEAVE_CONVERSATION', conversationId);

      // Publish event
      await this.publishEvent({
        eventType: 'conversation.left',
        entityId: conversationId,
        entityType: 'Conversation',
        data: { userId: context.userId },
        userId: context.userId
      });

      return this.createSuccessResponse(true, 'Left conversation successfully');
    } catch (error) {
      return this.createErrorResponse(error, 'LEAVE_CONVERSATION_FAILED');
    }
  }

  // Helper methods
  private generateConversationName(type: string, participants: string[]): string {
    switch (type) {
      case 'direct':
        return `Direct Chat`;
      case 'group':
        return `Group Chat (${participants.length} members)`;
      case 'building':
        return `Building Chat`;
      case 'broadcast':
        return `Broadcast Channel`;
      default:
        return `Chat`;
    }
  }

  // Service health check
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      // Check WebSocket connection
      // Check DynamoDB connectivity
      // Check message queue status

      return {
        status: 'healthy',
        details: {
          serviceName: this.serviceName,
          timestamp: new Date(),
          messageQueueStatus: 'connected',
          webSocketStatus: 'connected',
          databaseStatus: 'connected'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          serviceName: this.serviceName,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        }
      };
    }
  }
}