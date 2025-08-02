# CQRS Architecture Implementation

This directory contains a complete Command Query Responsibility Segregation (CQRS) implementation for the Situ8 security platform, providing clean separation between command (write) and query (read) operations with enterprise-grade features.

## 📁 Architecture Overview

```
src/application/
├── commands/                 # Command side (writes)
│   ├── base/                # Base command interfaces
│   ├── activity/            # Activity domain commands
│   └── incident/            # Incident domain commands
├── queries/                 # Query side (reads)
│   ├── base/               # Base query interfaces
│   ├── activity/           # Activity domain queries
│   └── incident/           # Incident domain queries
├── CommandBus.ts           # Central command dispatcher
├── QueryBus.ts             # Central query dispatcher with caching
├── ApplicationService.ts   # Unified service interface
├── CQRSIntegrationService.ts # Integration with existing stores
└── examples/               # Usage examples and demos
```

## 🎯 Key Features

### Command Side
- **Validation Pipeline**: Built-in command validation with detailed error reporting
- **Audit Trail**: Automatic audit logging for all command executions
- **Performance Monitoring**: Execution time tracking and slow command detection
- **Error Handling**: Comprehensive error handling with retry capabilities
- **Middleware Support**: Extensible middleware for cross-cutting concerns

### Query Side
- **Intelligent Caching**: Multi-level caching with automatic invalidation
- **Query Optimization**: Performance optimization with execution metrics
- **Result Transformation**: Flexible result formatting and aggregation
- **Cache Strategies**: Configurable TTL and invalidation patterns
- **Performance Analytics**: Query performance monitoring and optimization

### Integration Layer
- **Backward Compatibility**: Seamless integration with existing Zustand stores
- **Transaction Support**: Coordinated multi-operation transactions
- **Event Publishing**: Domain event publishing after command execution
- **Health Monitoring**: System health checks and diagnostics

## 🚀 Quick Start

### 1. Initialize the CQRS System

```typescript
import { initializeCQRS } from './CQRSIntegrationService';

// Initialize the CQRS system
const cqrsService = await initializeCQRS();

// Check system health
const health = await cqrsService.healthCheck();
console.log('CQRS System Status:', health);
```

### 2. Execute Commands (Write Operations)

```typescript
import { getCQRSService } from './CQRSIntegrationService';

const cqrs = getCQRSService();

// Create an activity
const result = await cqrs.getApplicationService().createActivity({
  activityType: 'security-breach',
  title: 'Unauthorized Access Attempt',
  location: 'Building A - Entrance',
  priority: 'high',
  description: 'Multiple failed badge attempts detected',
  building: 'Building A',
  zone: 'Entrance'
}, 'user123');

console.log('Activity created:', result.data?.activityId);
```

### 3. Execute Queries (Read Operations)

```typescript
// Get activities with filters
const activities = await cqrs.getApplicationService().getActivities({
  types: ['security-breach', 'medical'],
  priorities: ['high', 'critical'],
  dateRange: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end: new Date()
  }
}, {
  offset: 0,
  limit: 20
});

console.log('Found activities:', activities.data?.activities);
```

### 4. React Component Integration

```typescript
import { useCQRS } from './CQRSIntegrationService';

function ActivityManager() {
  const { isInitialized, executeCommand, executeQuery, error } = useCQRS();
  
  const createActivity = async (data) => {
    const command = {
      type: 'CreateActivity',
      userId: 'current-user',
      timestamp: new Date(),
      data
    };
    
    return await executeCommand(command);
  };
  
  // Component implementation...
}
```

## 📋 Available Commands

### Activity Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `CreateActivity` | Create new activity | Security incidents, medical emergencies |
| `UpdateActivity` | Update activity properties | Status changes, priority updates |
| `AssignActivity` | Assign activity to user | Task assignment with notifications |
| `ArchiveActivity` | Archive completed activity | Clean up with retention policy |
| `BulkUpdateStatus` | Update multiple activities | Batch operations for efficiency |
| `EscalateActivity` | Escalate activity priority | Emergency escalation workflows |
| `LinkToIncident` | Link activity to incident | Evidence and relationship management |
| `BatchCreateActivities` | Create multiple activities | Bulk import from external systems |

### Incident Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `CreateIncident` | Create new incident | From activities or manual creation |
| `ValidateIncident` | Validate pending incident | Approval/dismissal workflow |
| `EscalateIncident` | Escalate incident | Multi-level escalation |
| `UpdateIncident` | Update incident details | Status, assignment, resolution |
| `AddEvidence` | Add evidence to incident | Chain of custody tracking |
| `AssignIncidentTeam` | Assign investigation team | Team coordination |

## 🔍 Available Queries

### Activity Queries

| Query | Description | Caching | Performance |
|-------|-------------|---------|-------------|
| `GetActivities` | List activities with filters | 30s TTL | Optimized pagination |
| `GetActivityById` | Get single activity | 1m TTL | Related data loading |
| `SearchActivities` | Full-text search | 2m TTL | Highlighted results |
| `GetActivityStats` | Analytics and metrics | 1m TTL | Aggregated calculations |
| `GetActivitiesRequiringAttention` | Urgent activities | 10s TTL | Real-time priority |
| `GetOverdueActivities` | Overdue items | 30s TTL | SLA monitoring |
| `GetRelatedActivities` | Related/clustered activities | 30s TTL | ML-based relationships |
| `GetActivityTimeline` | Historical timeline | 5m TTL | Trend analysis |

### Incident Queries

| Query | Description | Caching | Performance |
|-------|-------------|---------|-------------|
| `GetIncidents` | List incidents with filters | 30s TTL | Status-based filtering |
| `GetPendingIncidents` | Validation queue | 5s TTL | Real-time updates |
| `GetIncidentStats` | Incident analytics | 1m TTL | Performance metrics |
| `GetActiveIncidentsByLocation` | Location-based incidents | 30s TTL | Geographic filtering |
| `SearchIncidents` | Full-text incident search | 2m TTL | Resolution tracking |

## 🔧 Configuration Options

### Command Bus Configuration

```typescript
import { CommandBus } from './CommandBus';

const commandBus = new CommandBus();

// Add custom middleware
commandBus.addMiddleware({
  name: 'CustomValidation',
  priority: 5,
  execute: async (command, next) => {
    // Custom validation logic
    return await next(command);
  }
});
```

### Query Bus Configuration

```typescript
import { QueryBus } from './QueryBus';
import { CustomCacheManager } from './cache/CustomCacheManager';

const queryBus = new QueryBus(new CustomCacheManager({
  maxSize: 5000,
  defaultTTL: 60000,
  compressionEnabled: true
}));
```

### Application Service Configuration

```typescript
import { ApplicationService } from './ApplicationService';

const appService = new ApplicationService({
  activityRepository: new ActivityRepository(),
  // Add other repositories...
});

await appService.initialize();
```

## 📊 Performance Monitoring

### Command Metrics

```typescript
const metrics = cqrsService.getMetrics();

console.log('Command Performance:', {
  totalExecutions: metrics.commands.totalExecutions,
  averageExecutionTime: metrics.commands.averageExecutionTime,
  successRate: metrics.commands.successRate,
  slowCommands: metrics.commands.filter(c => c.averageExecutionTime > 1000)
});
```

### Query Metrics

```typescript
console.log('Query Performance:', {
  cacheHitRate: metrics.cacheStats.cacheHitRate,
  averageQueryTime: metrics.queries.averageExecutionTime,
  slowQueries: metrics.queries.filter(q => q.averageExecutionTime > 500)
});
```

## 🛡️ Error Handling

### Command Validation Errors

```typescript
const result = await executeCommand(invalidCommand);

if (!result.success) {
  console.error('Command failed:', result.error);
  console.error('Validation errors:', result.validationErrors);
}
```

### Query Error Handling

```typescript
try {
  const result = await executeQuery(query);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
} catch (error) {
  console.error('Query execution failed:', error);
  // Fallback logic
}
```

## 🔄 Migration Guide

### From Existing Stores

The CQRS system provides backward compatibility with existing Zustand stores:

```typescript
// Before (direct store usage)
const activityStore = useActivityStore();
await activityStore.createActivity(data);

// After (automatic CQRS forwarding)
// No changes needed - existing code continues to work
const activityStore = useActivityStore();
await activityStore.createActivity(data); // Now uses CQRS internally
```

### Gradual Migration

1. **Initialize CQRS** alongside existing stores
2. **New features** use CQRS directly
3. **Existing code** continues to work via forwarding
4. **Gradually migrate** components to use CQRS directly

## 📈 Scalability Features

### Horizontal Scaling
- **Command Queuing**: Commands can be queued for batch processing
- **Query Caching**: Distributed caching for read scaling
- **Event Sourcing**: Ready for event sourcing implementation

### Performance Optimization
- **Batch Operations**: Efficient bulk command processing
- **Query Optimization**: Automatic query optimization
- **Resource Pooling**: Connection and resource management

## 🧪 Testing

### Unit Testing Commands

```typescript
import { CreateActivityCommandHandler } from './commands/activity/ActivityCommandHandlers';

describe('CreateActivityCommandHandler', () => {
  it('should create activity successfully', async () => {
    const handler = new CreateActivityCommandHandler(mockUseCase, mockRepository);
    const command = { /* valid command */ };
    
    const result = await handler.handle(command);
    
    expect(result.success).toBe(true);
    expect(result.data.activityId).toBeDefined();
  });
});
```

### Integration Testing

```typescript
import { completeWorkflowExample } from './examples/CQRSUsageExamples';

describe('CQRS Integration', () => {
  it('should handle complete workflow', async () => {
    await completeWorkflowExample();
    // Assertions...
  });
});
```

## 🚨 Best Practices

### Command Design
1. **Single Responsibility**: One command per business operation
2. **Immutable**: Commands should be immutable after creation
3. **Validation**: Always validate commands before execution
4. **Idempotency**: Design commands to be idempotent when possible

### Query Design
1. **Specific**: Create specific queries rather than generic ones
2. **Cacheable**: Design queries with caching in mind
3. **Paginated**: Always support pagination for list queries
4. **Filtered**: Provide comprehensive filtering options

### Error Handling
1. **Graceful Degradation**: Provide fallback mechanisms
2. **Detailed Logging**: Log errors with context
3. **User-Friendly**: Return user-friendly error messages
4. **Monitoring**: Monitor error rates and patterns

## 📚 Additional Resources

- [Command Examples](./examples/CQRSUsageExamples.ts) - Complete usage examples
- [Integration Guide](./CQRSIntegrationService.ts) - Integration with existing code
- [Performance Tips](./performance.md) - Performance optimization guide
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

## 🤝 Contributing

When adding new commands or queries:

1. Create command/query interfaces in appropriate domain folder
2. Implement handlers with proper validation
3. Register handlers in ApplicationService
4. Add comprehensive tests
5. Update documentation and examples

## 📝 License

This CQRS implementation is part of the Situ8 security platform and follows the same licensing terms.