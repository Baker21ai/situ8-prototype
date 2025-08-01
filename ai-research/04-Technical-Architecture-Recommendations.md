# Technical Architecture Recommendations for Situ8 AI Agent

## Executive Summary

The recommended architecture integrates AWS Bedrock seamlessly into Situ8's existing React/TypeScript/Zustand stack without disrupting current functionality. The AI agent acts as an intelligent interface layer that translates natural language into existing service calls, maintaining all current business logic and audit trails.

## Recommended Architecture

### High-Level Integration
```
User → AI Chat Interface → AWS Bedrock → Function Calls → Existing Services → Stores → Database
                              ↓
                        Streaming Response
```

### Detailed Component Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                    Situ8 Frontend (React)                      │
├─────────────────────────────────────────────────────────────────┤
│  CommandCenter.tsx  │  Activities.tsx  │  Timeline.tsx          │
│        ↓                    ↓                  ↓               │
│  ┌────────────────────────────────────────────────────────────┐│
│  │              AI Chat Component                             ││
│  │  - Natural language input                                  ││
│  │  - Streaming response display                              ││
│  │  - Function call confirmation                              ││
│  └────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                     Service Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐│
│  │ ActivityService │  │ IncidentService │  │ CaseService      ││
│  │ + AI Integration│  │ + AI Integration│  │ + AI Integration ││
│  └─────────────────┘  └─────────────────┘  └──────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                      AWS Bedrock                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐│
│  │ Claude 3.5      │  │ Function        │  │ Streaming        ││
│  │ Haiku/Sonnet    │  │ Calling         │  │ Responses        ││
│  └─────────────────┘  └─────────────────┘  └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Core Components Design

### 1. AI Chat Interface Component

#### Location: `components/ai/AIChat.tsx`
```typescript
interface AIChatProps {
  context?: 'command-center' | 'activities' | 'timeline' | 'cases';
  onActionComplete?: (action: string, result: any) => void;
}

export function AIChat({ context, onActionComplete }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { streamResponse } = useBedrockStream();
  const { services } = useServices();

  // Handle user input and stream AI response
  const handleUserMessage = async (input: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    // Stream AI response with function calling
    await streamResponse(input, {
      context,
      availableFunctions: getAvailableFunctions(context),
      onFunctionCall: handleFunctionCall,
      onStream: handleStreamChunk,
      onComplete: handleResponseComplete
    });
  };

  return (
    <div className="ai-chat-container">
      <ChatMessages messages={messages} />
      <ChatInput onSubmit={handleUserMessage} disabled={isStreaming} />
      {isStreaming && <StreamingIndicator />}
    </div>
  );
}
```

### 2. AWS Bedrock Integration Service

#### Location: `services/ai.service.ts`
```typescript
export class AIService extends BaseService {
  private bedrock: BedrockRuntimeClient;
  private wsConnections: Map<string, WebSocket> = new Map();

  constructor() {
    super('AIService');
    this.bedrock = new BedrockRuntimeClient({
      region: process.env.VITE_AWS_REGION,
      credentials: {
        accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!
      }
    });
  }

  async streamChat(
    message: string, 
    context: ChatContext,
    onStream: (chunk: string) => void,
    onFunctionCall: (call: FunctionCall) => Promise<any>
  ): Promise<void> {
    const prompt = this.buildPrompt(message, context);
    
    const command = new ConverseStreamCommand({
      modelId: this.selectModel(message, context),
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      toolConfig: {
        tools: this.getAvailableTools(context)
      }
    });

    const response = await this.bedrock.send(command);
    
    for await (const chunk of response.stream!) {
      if (chunk.contentBlockDelta?.delta?.text) {
        onStream(chunk.contentBlockDelta.delta.text);
      }
      
      if (chunk.contentBlockStart?.start?.toolUse) {
        const result = await onFunctionCall(chunk.contentBlockStart.start.toolUse);
        // Continue conversation with function result
      }
    }
  }

  private selectModel(message: string, context: ChatContext): string {
    // Use intelligent routing
    const complexity = this.assessComplexity(message);
    return complexity > 0.7 ? 'anthropic.claude-3-5-sonnet-20241022-v2:0' 
                            : 'anthropic.claude-3-5-haiku-20241022-v1:0';
  }

  private getAvailableTools(context: ChatContext): Tool[] {
    const tools: Tool[] = [];
    
    switch (context) {
      case 'activities':
        tools.push(
          this.createTool('createActivity', 'Create a new security activity'),
          this.createTool('updateActivity', 'Update an existing activity'),
          this.createTool('searchActivities', 'Search for activities')
        );
        break;
      
      case 'timeline':
        tools.push(
          this.createTool('createIncident', 'Create a new security incident'),
          this.createTool('updateIncident', 'Update incident status'),
          this.createTool('escalateIncident', 'Escalate incident priority')
        );
        break;
      
      case 'cases':
        tools.push(
          this.createTool('createCase', 'Create investigation case'),
          this.createTool('addEvidence', 'Add evidence to case'),
          this.createTool('assignInvestigator', 'Assign case investigator')
        );
        break;
    }
    
    return tools;
  }
}
```

### 3. Function Call Handler

#### Location: `services/ai-function-handler.ts`
```typescript
export class AIFunctionHandler {
  constructor(private services: Services) {}

  async handleFunctionCall(call: FunctionCall): Promise<any> {
    const { name, input } = call;
    
    try {
      switch (name) {
        case 'createActivity':
          return await this.createActivity(input);
        case 'createIncident':
          return await this.createIncident(input);
        case 'createCase':
          return await this.createCase(input);
        case 'searchActivities':
          return await this.searchActivities(input);
        default:
          throw new Error(`Unknown function: ${name}`);
      }
    } catch (error) {
      // Log error and return user-friendly message
      this.services.auditService.logError('AI_FUNCTION_CALL_ERROR', {
        function: name,
        input,
        error: error.message
      });
      
      return {
        success: false,
        error: `Sorry, I couldn't ${name}. Please try again or contact support.`
      };
    }
  }

  private async createActivity(input: any): Promise<any> {
    // Validate and sanitize AI input
    const activityData = this.validateActivityInput(input);
    
    // Use existing service with full business logic
    const activity = await this.services.activityService.createActivity(activityData);
    
    return {
      success: true,
      message: `Created activity "${activity.title}" successfully.`,
      data: activity
    };
  }

  private async createIncident(input: any): Promise<any> {
    const incidentData = this.validateIncidentInput(input);
    const incident = await this.services.incidentService.createIncident(incidentData);
    
    return {
      success: true,
      message: `Created ${incident.priority} priority incident for ${incident.location}.`,
      data: incident
    };
  }

  private validateActivityInput(input: any): Partial<EnterpriseActivity> {
    // AI input validation with sensible defaults
    return {
      title: input.title || 'AI Generated Activity',
      type: this.mapActivityType(input.type || input.description),
      location: input.location || 'Unknown Location',
      description: input.description || input.title,
      priority: input.priority || 'medium',
      // Add other required fields with defaults
    };
  }
}
```

### 4. Streaming Hook

#### Location: `hooks/useBedrockStream.ts`
```typescript
export function useBedrockStream() {
  const { aiService } = useServices();
  const [isStreaming, setIsStreaming] = useState(false);

  const streamResponse = useCallback(async (
    message: string,
    options: StreamOptions
  ) => {
    setIsStreaming(true);
    
    try {
      await aiService.streamChat(
        message,
        options.context,
        options.onStream,
        options.onFunctionCall
      );
    } finally {
      setIsStreaming(false);
    }
  }, [aiService]);

  return {
    streamResponse,
    isStreaming
  };
}
```

## Integration Points with Existing Architecture

### 1. Service Layer Integration

The AI agent integrates at the service layer, not the store layer, to maintain consistency:

```typescript
// Current flow (unchanged):
User Action → Component → Service → Store → Database

// New AI flow (additional):
AI Chat → Function Call → Service → Store → Database
```

**Benefits**:
- All business logic remains in services
- Audit trails are automatically maintained
- Validation and error handling preserved
- No changes to existing components needed

### 2. Existing Component Enhancement

Components can be enhanced with AI capabilities without breaking changes:

```typescript
// Before (existing functionality preserved)
export function CommandCenter() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Activities />
      <InteractiveMap />
      <Timeline />
    </div>
  );
}

// After (AI enhanced)
export function CommandCenter() {
  const [showAIChat, setShowAIChat] = useState(false);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <Activities />
      <InteractiveMap />
      <Timeline />
      
      {/* AI Chat overlay/sidebar */}
      {showAIChat && (
        <AIChat 
          context="command-center"
          onActionComplete={(action, result) => {
            // Refresh relevant components
            if (action.startsWith('create')) {
              // Trigger data refresh
            }
          }}
        />
      )}
      
      <AIToggleButton onClick={() => setShowAIChat(!showAIChat)} />
    </div>
  );
}
```

### 3. Store Integration (Read-Only)

AI service can read from stores for context but should never directly modify them:

```typescript
export class AIService extends BaseService {
  private buildPrompt(message: string, context: ChatContext): string {
    // Read current state for context
    const { activities } = useActivityStore.getState();
    const { incidents } = useIncidentStore.getState();
    
    const contextData = {
      recentActivities: activities.slice(0, 5),
      activeIncidents: incidents.filter(i => i.status === 'active'),
      currentTime: new Date().toISOString(),
      // Add relevant context
    };
    
    return this.formatPrompt(message, context, contextData);
  }
}
```

## Security Architecture

### 1. Input Validation & Sanitization

```typescript
export class AIInputValidator {
  static validateUserInput(input: string): string {
    // Prevent injection attacks
    const sanitized = input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
    
    if (sanitized.length > 1000) {
      throw new Error('Input too long');
    }
    
    return sanitized;
  }

  static validateFunctionInput(input: any, schema: JSONSchema): any {
    // Validate against schema
    const valid = ajv.validate(schema, input);
    if (!valid) {
      throw new Error('Invalid function parameters');
    }
    return input;
  }
}
```

### 2. Rate Limiting & Abuse Prevention

```typescript
export class AIRateLimiter {
  private userRequests = new Map<string, number[]>();
  
  async checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const userRequestTimes = this.userRequests.get(userId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = userRequestTimes.filter(time => now - time < 60000);
    
    if (recentRequests.length >= 30) { // 30 requests per minute
      throw new Error('Rate limit exceeded');
    }
    
    recentRequests.push(now);
    this.userRequests.set(userId, recentRequests);
    
    return true;
  }
}
```

### 3. Audit Logging for AI Actions

```typescript
export class AIAuditLogger {
  async logAIInteraction(interaction: {
    userId: string;
    message: string;
    response: string;
    functionsUsed: string[];
    timestamp: Date;
  }): Promise<void> {
    await this.auditService.createAuditEntry({
      entityType: 'ai_interaction',
      action: 'chat',
      userId: interaction.userId,
      details: {
        userMessage: interaction.message,
        aiResponse: interaction.response,
        functionsExecuted: interaction.functionsUsed,
        model: 'claude-3.5-haiku',
        timestamp: interaction.timestamp
      }
    });
  }
}
```

## Performance Optimization

### 1. Intelligent Model Selection

```typescript
class ModelSelector {
  assessComplexity(message: string): number {
    const complexityIndicators = [
      /create.*incident.*with.*evidence/i,
      /analyze.*pattern.*across.*multiple/i,
      /generate.*report.*for.*investigation/i,
      /complex.*query.*involving.*relationships/i
    ];
    
    const simpleIndicators = [
      /create.*activity/i,
      /update.*status/i,
      /what.*is.*the.*current/i,
      /show.*me.*recent/i
    ];
    
    if (simpleIndicators.some(pattern => pattern.test(message))) {
      return 0.2; // Use Haiku
    }
    
    if (complexityIndicators.some(pattern => pattern.test(message))) {
      return 0.8; // Use Sonnet
    }
    
    return 0.5; // Default to Haiku for cost efficiency
  }
}
```

### 2. Response Caching

```typescript
class AIResponseCache {
  private cache = new Map<string, CachedResponse>();
  
  async getCachedResponse(message: string, context: string): Promise<string | null> {
    const key = this.generateCacheKey(message, context);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.response;
    }
    
    return null;
  }
  
  async setCachedResponse(message: string, context: string, response: string): Promise<void> {
    const key = this.generateCacheKey(message, context);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }
}
```

### 3. Streaming Optimization

```typescript
class StreamingOptimizer {
  private chunkBuffer: string[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  
  bufferChunk(chunk: string, onFlush: (content: string) => void): void {
    this.chunkBuffer.push(chunk);
    
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    
    // Batch chunks for better performance
    this.flushTimeout = setTimeout(() => {
      const content = this.chunkBuffer.join('');
      this.chunkBuffer = [];
      onFlush(content);
    }, 50); // 50ms batching
  }
}
```

## Development Environment Setup

### 1. Environment Variables

```env
# AWS Bedrock Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key

# AI Configuration
VITE_AI_DEFAULT_MODEL=anthropic.claude-3-5-haiku-20241022-v1:0
VITE_AI_COMPLEX_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
VITE_AI_MAX_TOKENS=4096
VITE_AI_TEMPERATURE=0.7

# Rate Limiting
VITE_AI_RATE_LIMIT_PER_MINUTE=30
VITE_AI_RATE_LIMIT_PER_HOUR=100
```

### 2. Development Dependencies

```json
{
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.490.0",
    "@aws-sdk/types": "^3.490.0",
    "ajv": "^8.12.0",
    "react-markdown": "^9.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0",
    "aws-sdk-client-mock": "^3.0.0"
  }
}
```

### 3. Testing Strategy

```typescript
// Test AI service with mocked AWS Bedrock
describe('AIService', () => {
  const mockBedrock = mockClient(BedrockRuntimeClient);
  
  beforeEach(() => {
    mockBedrock.reset();
  });

  test('should create activity via function call', async () => {
    mockBedrock.on(ConverseStreamCommand).resolves({
      stream: mockStreamWithFunctionCall('createActivity', {
        title: 'Test Activity',
        type: 'patrol'
      })
    });

    const aiService = new AIService();
    const result = await aiService.streamChat(
      'Create a patrol activity for Building A',
      'activities',
      jest.fn(),
      jest.fn()
    );

    expect(result).toMatchObject({
      success: true,
      data: expect.objectContaining({
        title: 'Test Activity',
        type: 'patrol'
      })
    });
  });
});
```

## Deployment Considerations

### 1. Production Configuration

```typescript
// services/ai.service.prod.ts
export class ProductionAIService extends AIService {
  constructor() {
    super();
    
    // Use IAM roles in production, not access keys
    this.bedrock = new BedrockRuntimeClient({
      region: process.env.AWS_REGION,
      // Credentials automatically loaded from IAM role
    });
  }
  
  protected selectModel(message: string, context: ChatContext): string {
    // More conservative model selection in production
    return 'anthropic.claude-3-5-haiku-20241022-v1:0'; // Always use Haiku for cost control
  }
}
```

### 2. Monitoring & Observability

```typescript
export class AIMetrics {
  private cloudWatch = new CloudWatchClient({});
  
  async recordMetric(name: string, value: number, unit: string = 'Count'): Promise<void> {
    await this.cloudWatch.send(new PutMetricDataCommand({
      Namespace: 'Situ8/AI',
      MetricData: [{
        MetricName: name,
        Value: value,
        Unit: unit,
        Timestamp: new Date()
      }]
    }));
  }
  
  async recordLatency(operation: string, duration: number): Promise<void> {
    await this.recordMetric(`${operation}_Latency`, duration, 'Milliseconds');
  }
  
  async recordTokenUsage(inputTokens: number, outputTokens: number): Promise<void> {
    await Promise.all([
      this.recordMetric('InputTokens', inputTokens),
      this.recordMetric('OutputTokens', outputTokens)
    ]);
  }
}
```

## Recommendations Summary

### ✅ Strengths of This Architecture

1. **Non-Disruptive**: Existing functionality unchanged
2. **Scalable**: Uses AWS managed services for automatic scaling
3. **Secure**: Multiple layers of validation and audit logging
4. **Cost-Effective**: Intelligent model routing minimizes costs
5. **Maintainable**: Clear separation of concerns and testable components

### 🎯 Implementation Priority

1. **Phase 1**: Basic AI chat interface with simple function calls
2. **Phase 2**: Streaming responses and context awareness
3. **Phase 3**: Advanced function calling and multi-step workflows
4. **Phase 4**: Performance optimization and monitoring

### ⚠️ Key Considerations

1. **Token costs**: Monitor usage and implement limits
2. **Response time**: Balance between streaming and batching
3. **Error handling**: Graceful degradation when AI service fails
4. **User training**: Staff need to understand AI capabilities and limitations

**This architecture provides the optimal balance of functionality, security, and maintainability for Situ8's AI agent implementation.**