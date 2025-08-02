# Chat System Integration - Implementation Plan

> **Last Updated:** August 2, 2025  
> **Purpose:** Technical implementation guide for chat system integration  
> **Architecture:** Service-based architecture with WebSocket real-time updates  

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend Layer                              │
├─────────────────────────────────────────────────────────────────────┤
│  ChatPage → ChatLayout → [ContactsPanel, ChatList, ChatWindow]       │
│                    ↓                                                  │
│               ChatStore (Zustand)                                     │
│                    ↓                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                          Service Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│  ChatService ← WebSocketService → RadioRoutingService                │
│      ↓              ↓                    ↓                           │
│  BaseService    AWS SDK           UserDirectoryService               │
│                    ↓                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                         Backend Layer                                 │
├─────────────────────────────────────────────────────────────────────┤
│  API Gateway WebSocket ← Lambda Functions → DynamoDB Tables          │
│         ↓                                        ↓                    │
│  Cognito Auth                      [connections, channels, messages]  │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Decisions

### Service Architecture Pattern
Following the existing Situ8 pattern where:
- **Services** handle business logic, validation, and external API calls
- **Stores** manage UI state and delegate to services
- **Components** are presentation-only, using stores for state

### WebSocket Strategy
- Single persistent connection per user session
- Automatic reconnection with exponential backoff
- Message queueing during disconnection
- Heartbeat/ping mechanism for connection health

### State Management Approach
```typescript
// Store only manages UI state
interface ChatUIState {
  isLoading: boolean;
  error: string | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, ChatMessage[]>;
  typingIndicators: TypingIndicator[];
}

// Service handles all business logic
class ChatService extends BaseService {
  async sendMessage(data: SendMessageDTO): Promise<ServiceResponse<Message>> {
    // Validation
    // Audit logging
    // WebSocket send
    // DynamoDB persist
    // Error handling
  }
}
```

### Authentication Flow
1. User logs in via Cognito
2. JWT token stored in auth store
3. WebSocket connection includes token in connection params
4. Lambda authorizer validates token
5. User attributes (role, clearance) extracted from token
6. All subsequent messages include connection context

## 🏗️ Component Structure

### File Organization
```
components/
├── ChatPage.tsx                    # Main page wrapper
└── communications/
    ├── ChatLayout.tsx              # Layout orchestrator
    ├── ContactsPanel.tsx           # User directory UI
    ├── ChatList.tsx                # Conversation list UI
    ├── ChatWindow.tsx              # Message interface
    ├── CreateGroupModal.tsx        # Group creation (TODO)
    ├── RadioMessageIndicator.tsx   # Radio message UI (TODO)
    └── VoiceRecorder.tsx          # Voice message UI (TODO)

services/
├── ServiceProvider.tsx             # DI container (update)
├── chat.service.ts                # Main chat service (TODO)
├── websocket.service.ts           # WebSocket manager (TODO)
├── radio-routing.service.ts      # Radio routing logic (TODO)
└── user-directory.service.ts     # Cognito user fetch (TODO)

stores/
└── chatStore.ts                   # UI state management (refactor)
```

### Import Path Strategy
All imports use relative paths:
```typescript
// ❌ Wrong (using alias)
import { Button } from '@/components/ui/button';

// ✅ Correct (relative path)
import { Button } from '../../components/ui/button';
```

## 🔌 Service Integration Details

### ChatService Implementation
```typescript
export class ChatService extends BaseService {
  private wsService: WebSocketService;
  private userDirectory: UserDirectoryService;

  constructor() {
    super('ChatService');
    this.wsService = new WebSocketService();
    this.userDirectory = new UserDirectoryService();
  }

  async initialize(): Promise<void> {
    await this.wsService.connect();
    await this.userDirectory.loadUsers();
  }

  async createConversation(
    participants: string[],
    type: ConversationType,
    metadata?: ConversationMetadata
  ): Promise<ServiceResponse<Conversation>> {
    try {
      // Validate participants exist
      const validParticipants = await this.validateParticipants(participants);
      
      // Create in DynamoDB
      const conversation = await this.createInDynamoDB({
        id: generateId(),
        participants: validParticipants,
        type,
        metadata,
        createdAt: new Date().toISOString()
      });

      // Notify participants via WebSocket
      await this.wsService.broadcast('conversation.created', conversation);

      // Audit log
      await this.audit('CONVERSATION_CREATED', { conversationId: conversation.id });

      return this.success(conversation);
    } catch (error) {
      return this.error('Failed to create conversation', error);
    }
  }

  async sendMessage(
    conversationId: string,
    content: string,
    type: MessageType = 'text',
    attachments?: Attachment[]
  ): Promise<ServiceResponse<Message>> {
    // Implementation with validation, persistence, and broadcasting
  }
}
```

### WebSocket Service Design
```typescript
export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageQueue: QueuedMessage[] = [];
  private reconnectAttempts = 0;
  private handlers = new Map<string, MessageHandler[]>();

  async connect(): Promise<void> {
    const token = useAuthStore.getState().token;
    const wsUrl = `${WS_ENDPOINT}?token=${token}`;
    
    this.ws = new WebSocket(wsUrl);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.flushMessageQueue();
    };

    this.ws.onclose = () => {
      this.scheduleReconnect();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };
  }

  send(action: string, payload: any): void {
    const message = { action, payload, timestamp: Date.now() };
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  on(event: string, handler: MessageHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }
}
```

### Radio Routing Service
```typescript
export class RadioRoutingService {
  determineTargetConversations(
    radioMessage: RadioMessage,
    userContext: UserContext
  ): string[] {
    const targets: string[] = [];

    // Building-based routing
    if (radioMessage.metadata.location) {
      const buildingConversation = this.findBuildingConversation(
        radioMessage.metadata.location
      );
      if (buildingConversation) targets.push(buildingConversation);
    }

    // Role-based routing
    if (radioMessage.priority === 'emergency') {
      const supervisorChannel = this.findRoleConversation('supervisor');
      if (supervisorChannel) targets.push(supervisorChannel);
    }

    // Channel-based routing
    const channelMapping = this.getChannelMapping(radioMessage.channel);
    if (channelMapping) targets.push(...channelMapping.conversations);

    return [...new Set(targets)]; // Remove duplicates
  }
}
```

## 🔐 Security Considerations

### Message Security
- All messages encrypted in transit (WSS)
- DynamoDB encryption at rest
- No PII in logs or error messages
- Message content sanitization before display

### Access Control
```typescript
// Lambda authorizer extracts user context
interface UserContext {
  userId: string;
  email: string;
  role: 'admin' | 'supervisor' | 'guard' | 'viewer';
  clearanceLevel: number;
  badgeNumber: string;
  facilityCodes: string[];
}

// Service checks permissions
canAccessConversation(user: UserContext, conversation: Conversation): boolean {
  // Direct participant
  if (conversation.participants.includes(user.userId)) return true;
  
  // Building access
  if (conversation.type === 'building' && 
      user.facilityCodes.includes(conversation.metadata.buildingCode)) {
    return true;
  }
  
  // Admin override
  if (user.role === 'admin') return true;
  
  return false;
}
```

### Rate Limiting
- Message sending: 10 messages per second per user
- File uploads: 5 per minute
- API calls: 100 per minute
- WebSocket connections: 1 per user

## 🚀 Performance Optimizations

### Virtual Scrolling for Messages
```typescript
// Use react-window for large message lists
<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <MessageItem message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

### Message Caching Strategy
```typescript
class MessageCache {
  private cache = new Map<string, CachedMessages>();
  private maxAge = 5 * 60 * 1000; // 5 minutes

  get(conversationId: string): ChatMessage[] | null {
    const cached = this.cache.get(conversationId);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(conversationId);
      return null;
    }
    
    return cached.messages;
  }

  set(conversationId: string, messages: ChatMessage[]): void {
    this.cache.set(conversationId, {
      messages,
      timestamp: Date.now()
    });
  }
}
```

### Optimistic Updates
```typescript
// Store shows message immediately
const optimisticMessage = {
  id: `temp-${Date.now()}`,
  content,
  status: 'sending',
  timestamp: new Date().toISOString()
};

// Update store optimistically
addMessage(optimisticMessage);

// Send via service
const result = await chatService.sendMessage(conversationId, content);

// Update with real data or rollback
if (result.success) {
  updateMessage(optimisticMessage.id, result.data);
} else {
  removeMessage(optimisticMessage.id);
  showError(result.error);
}
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// ChatService tests
describe('ChatService', () => {
  it('should validate participants before creating conversation', async () => {
    const service = new ChatService();
    const result = await service.createConversation(['invalid-user'], 'direct');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid participants');
  });
});

// WebSocket service tests
describe('WebSocketService', () => {
  it('should queue messages when disconnected', () => {
    const service = new WebSocketService();
    service.disconnect();
    service.send('test', { data: 'value' });
    expect(service.getQueueLength()).toBe(1);
  });
});
```

### Integration Tests
```typescript
// Full flow test
it('should send and receive messages', async () => {
  // Login
  const auth = await authService.login('test@example.com', 'password');
  
  // Connect WebSocket
  const ws = new WebSocketService();
  await ws.connect(auth.token);
  
  // Send message
  const chat = new ChatService();
  const result = await chat.sendMessage('conv-1', 'Hello');
  
  // Verify received
  await waitFor(() => {
    const messages = chatStore.getState().messages['conv-1'];
    expect(messages).toContainEqual(
      expect.objectContaining({ content: 'Hello' })
    );
  });
});
```

## 🔄 Migration Strategy

### Phase 1: Service Layer (No UI Changes)
1. Create all services
2. Add to ServiceProvider
3. Services use mock data initially
4. Test service methods work

### Phase 2: Connect Services (Gradual)
1. Update one component at a time
2. Start with ContactsPanel (simplest)
3. Keep mock data as fallback
4. Verify each component works

### Phase 3: WebSocket Integration
1. Deploy WebSocket test endpoint
2. Connect in development only
3. Add feature flag for WebSocket
4. Gradually enable for users

### Phase 4: Remove Mock Data
1. Delete mock arrays
2. Remove demo conversations
3. Clean up unused code
4. Full integration test

## 📝 Configuration

### Environment Variables
```bash
# .env.development
VITE_WEBSOCKET_ENDPOINT=wss://8hj9sdifek.execute-api.us-west-2.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-west-2_ECLKvbdSp
VITE_COGNITO_CLIENT_ID=5ouh548bibh1rrp11neqcvvqf6
VITE_AWS_REGION=us-west-2
VITE_CHAT_MESSAGE_LIMIT=50
VITE_CHAT_TYPING_TIMEOUT=3000
```

### Feature Flags
```typescript
export const CHAT_FEATURES = {
  USE_WEBSOCKET: process.env.NODE_ENV === 'production',
  ENABLE_VOICE_MESSAGES: true,
  ENABLE_FILE_ATTACHMENTS: true,
  ENABLE_RADIO_INTEGRATION: true,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/*', 'application/pdf', '.doc', '.docx']
};
```

## 🚦 Success Criteria

### Functional Requirements Met
- [x] Users can chat with each other
- [x] Voice messages supported
- [x] Radio snippets integrated
- [ ] Real-time message delivery
- [ ] Conversation persistence
- [ ] User presence tracking

### Performance Targets
- Message delivery: <100ms
- Initial load: <500ms  
- 1000+ messages without lag
- 50+ concurrent users
- 99.9% uptime

### Code Quality Metrics
- TypeScript strict mode passes
- 80%+ test coverage
- No eslint errors
- All TODOs removed
- Full documentation

---

This implementation plan provides the technical blueprint for integrating the chat system properly into the Situ8 platform, moving from mock data to a production-ready real-time communication system.