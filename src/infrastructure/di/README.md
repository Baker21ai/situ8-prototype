# Dependency Injection System

A lightweight, TypeScript-first dependency injection container designed specifically for the CQRS architecture, with excellent testability support and React integration.

## 🚀 Features

- **TypeScript-First**: Full type safety with service token inference
- **Lightweight**: Minimal runtime overhead, no heavy frameworks
- **Singleton & Transient Lifetimes**: Choose the right lifetime for each service
- **Easy Testing**: Built-in mocking support for effortless unit testing
- **React Integration**: Custom hooks and providers for seamless React usage
- **CQRS Optimized**: Purpose-built for Command/Query separation
- **Circular Dependency Detection**: Prevents common DI pitfalls
- **Health Monitoring**: Built-in diagnostics and monitoring

## 📦 Quick Start

### 1. Basic Container Usage

```typescript
import { DIContainer, SERVICE_TOKENS } from '@/infrastructure/di';

// Create container
const container = new DIContainer();

// Register services
container.register(SERVICE_TOKENS.ACTIVITY_SERVICE)
  .asSingleton((c) => new ActivityService(
    c.resolve(SERVICE_TOKENS.ACTIVITY_REPOSITORY)
  ));

// Resolve services
const activityService = container.resolve(SERVICE_TOKENS.ACTIVITY_SERVICE);
```

### 2. React Integration

```typescript
import { DependencyProvider, useService } from '@/infrastructure/di';
import { createDevelopmentContainer } from '@/infrastructure/di';

// App setup
function App() {
  const compositionRoot = createDevelopmentContainer();
  
  return (
    <DependencyProvider compositionRoot={compositionRoot}>
      <ActivityComponent />
    </DependencyProvider>
  );
}

// Component usage
function ActivityComponent() {
  const activityService = useService(SERVICE_TOKENS.ACTIVITY_SERVICE);
  const commandBus = useService(SERVICE_TOKENS.COMMAND_BUS);
  
  const createActivity = async (data: any) => {
    await commandBus.execute({
      type: 'CreateActivityCommand',
      userId: 'current-user',
      data
    });
  };
  
  return <div>...</div>;
}
```

### 3. Testing with Mocks

```typescript
import { createActivityTestContainer } from '@/infrastructure/di/TestCompositionRoot';

describe('Activity Service', () => {
  let testRoot: TestCompositionRoot;
  
  beforeEach(async () => {
    testRoot = createActivityTestContainer();
    await testRoot.configure();
  });
  
  it('should create activity', async () => {
    // Arrange
    const commandBus = testRoot.getService(SERVICE_TOKENS.COMMAND_BUS);
    const repository = testRoot.getService(SERVICE_TOKENS.ACTIVITY_REPOSITORY);
    
    repository.create.mockResolvedValue({ id: '123', title: 'Test' });
    
    // Act
    const result = await commandBus.execute({
      type: 'CreateActivityCommand',
      data: { title: 'Test Activity' }
    });
    
    // Assert
    expect(result.success).toBe(true);
    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
```

## 🏗️ Architecture

### Service Tokens

Strongly-typed service tokens prevent runtime errors:

```typescript
const SERVICE_TOKENS = {
  // CQRS Services
  COMMAND_BUS: Symbol('CommandBus'),
  QUERY_BUS: Symbol('QueryBus'),
  
  // Repositories
  ACTIVITY_REPOSITORY: Symbol('ActivityRepository'),
  
  // Domain Services
  ACTIVITY_SERVICE: Symbol('ActivityService'),
} as const;
```

### Composition Root

Central place to wire up all dependencies:

```typescript
export class CompositionRoot {
  async configure(): Promise<void> {
    // Register infrastructure
    this.registerInfrastructure();
    
    // Register repositories
    this.registerRepositories();
    
    // Register CQRS components
    this.registerCQRS();
    
    // Register domain services
    this.registerDomainServices();
  }
}
```

### Service Lifetimes

Choose the appropriate lifetime for each service:

- **Singleton**: One instance per container (default)
- **Transient**: New instance every time

```typescript
// Singleton - shared state
container.register(SERVICE_TOKENS.ACTIVITY_REPOSITORY)
  .asSingleton(() => new ActivityRepository());

// Transient - new instance each time
container.register('UniqueId')
  .asTransient(() => crypto.randomUUID());
```

## 🧪 Testing

### Mock Services

The DI system makes testing incredibly easy:

```typescript
// Create test container with mocks
const testRoot = new TestCompositionRoot();

// Add full mock
testRoot.addMock(SERVICE_TOKENS.ACTIVITY_SERVICE, {
  create: jest.fn().mockResolvedValue({ id: '123' }),
  findById: jest.fn()
});

// Add partial mock (merged with defaults)
testRoot.addPartialMock(SERVICE_TOKENS.COMMAND_BUS, {
  execute: jest.fn().mockResolvedValue({ success: true })
});
```

### Mock Repository

Built-in mock repository for data layer testing:

```typescript
const mockRepo = testRoot.createMockRepository();

// Seed test data
mockRepo.seed([
  { id: '1', title: 'Activity 1' },
  { id: '2', title: 'Activity 2' }
]);

// Use like a real repository
const activity = await mockRepo.findById('1');
const count = await mockRepo.count();

// All methods are Jest mocks
expect(mockRepo.create).toHaveBeenCalledTimes(1);
```

### Test Utilities

Helpful utilities for testing:

```typescript
import { testUtils } from '@/infrastructure/di/TestCompositionRoot';

// Wait for promises
await testUtils.flushPromises();

// Create spies
const spy = testUtils.createSpyMock(originalFunction);

// Reset container mocks
testUtils.resetContainer(testRoot);
```

## 🔧 Advanced Usage

### Decorators (Optional)

If you prefer decorator-based DI:

```typescript
import { Injectable, Inject } from '@/infrastructure/di';

@Injectable()
class ActivityService {
  constructor(
    @Inject(SERVICE_TOKENS.ACTIVITY_REPOSITORY) 
    private repository: ActivityRepository
  ) {}
}
```

### Custom Service Tokens

Create type-safe service tokens:

```typescript
import { createServiceToken } from '@/infrastructure/di';

const CUSTOM_SERVICE = createServiceToken<MyService>('CustomService');

// Full type safety
const service: MyService = container.resolve(CUSTOM_SERVICE);
```

### Environment-Specific Configuration

Different configurations for different environments:

```typescript
// Development - full logging and validation
const devRoot = createDevelopmentContainer();

// Production - optimized performance
const prodRoot = createProductionContainer();

// Testing - mocked dependencies
const testRoot = createTestContainer();
```

## 🔍 Monitoring & Debugging

### Health Status

Monitor container health:

```typescript
const health = container.getHealthStatus();
console.log({
  totalServices: health.totalServices,
  instantiated: health.instantiatedSingletons,
  isHealthy: !health.isDisposed
});
```

### Development Tools

React dev tools for DI inspection:

```typescript
import { DIDevTools } from '@/infrastructure/di';

function App() {
  return (
    <DependencyProvider compositionRoot={compositionRoot}>
      <MyApp />
      <DIDevTools /> {/* Only in development */}
    </DependencyProvider>
  );
}
```

### Dependency Graph

Visualize service dependencies:

```typescript
const registration = createServiceRegistration(container);
const graph = registration.getDependencyGraph();

console.log('Service Dependencies:', graph);
```

## 🚨 Best Practices

### ✅ Do

- Register services in the composition root
- Use singleton lifetime for stateful services
- Mock dependencies in tests
- Use type-safe service tokens
- Dispose containers when done

### ❌ Don't

- Create circular dependencies
- Register services outside composition root
- Use the global container in production
- Forget to dispose test containers
- Mix DI and direct instantiation

## 📚 API Reference

### Core Classes

- `DIContainer`: Main dependency injection container
- `CompositionRoot`: Service registration and wiring
- `ServiceRegistrationHelper`: Helper for service registration

### React Integration

- `DependencyProvider`: React context provider
- `useService<T>(token)`: Hook to resolve single service
- `useServices(tokens)`: Hook to resolve multiple services
- `useDIContainer()`: Hook to access container directly

### Testing

- `TestCompositionRoot`: Enhanced container for testing
- `MockRepository<T>`: Mock repository implementation
- `createActivityTestContainer()`: Pre-configured test container

### Service Tokens

All available service tokens are in `SERVICE_TOKENS`:

```typescript
SERVICE_TOKENS.COMMAND_BUS
SERVICE_TOKENS.QUERY_BUS
SERVICE_TOKENS.ACTIVITY_REPOSITORY
SERVICE_TOKENS.ACTIVITY_SERVICE
// ... and more
```

## 🛠️ Migration Guide

### From Legacy Service Provider

The DI system is backward compatible:

```typescript
// Old way
const { activityService } = useServices();

// New way (gradually migrate)
const { activityService, commandBus } = useServiceMigration();

// Full DI way
const activityService = useService(SERVICE_TOKENS.ACTIVITY_SERVICE);
```

### Gradual Migration Steps

1. **Install DI System**: Add `EnhancedServiceProvider` with `useDI={false}`
2. **Enable DI**: Set `useDI={true}` to use new system internally
3. **Update Components**: Gradually migrate to `useService()` hooks
4. **Remove Legacy**: Remove old service provider when all components migrated

## 🤝 Contributing

When adding new services:

1. Add service token to `SERVICE_TOKENS`
2. Register in `CompositionRoot`
3. Add mock in `TestCompositionRoot`
4. Update type definitions
5. Add tests

## 📄 License

Part of Situ8 Security Platform - Internal use only.