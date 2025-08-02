/**
 * Test Composition Root
 * Specialized composition root for testing with easy mocking support
 */

import { DIContainer, SERVICE_TOKENS } from './DIContainer';
import { CompositionRoot, CompositionRootConfig } from './CompositionRoot';
import { createServiceRegistration } from './ServiceRegistration';

export interface TestCompositionRootConfig extends CompositionRootConfig {
  mocks?: Record<string | symbol, any>;
  partialMocks?: Record<string | symbol, Partial<any>>;
}

export class TestCompositionRoot extends CompositionRoot {
  private mocks: Record<string | symbol, any> = {};
  private partialMocks: Record<string | symbol, Partial<any>> = {};

  constructor(config: TestCompositionRootConfig = { environment: 'test' }) {
    const container = new DIContainer();
    super(container, config);
    
    this.mocks = config.mocks || {};
    this.partialMocks = config.partialMocks || {};
  }

  /**
   * Configure test container with mocks
   */
  async configure(): Promise<void> {
    const container = this.getContainer();
    const registration = createServiceRegistration(container, {
      enableLogging: false,
      enableValidation: false
    });

    // Register mocks first
    this.registerMocks(registration);

    // Then register regular services (mocks will take precedence)
    await super.configure();
  }

  /**
   * Add a mock service
   */
  addMock<T>(token: string | symbol, mock: T): this {
    this.mocks[token] = mock;
    return this;
  }

  /**
   * Add a partial mock (merged with default implementation)
   */
  addPartialMock<T>(token: string | symbol, partialMock: Partial<T>): this {
    this.partialMocks[token] = partialMock;
    return this;
  }

  /**
   * Create a mock repository with common methods
   */
  createMockRepository<T>(): MockRepository<T> {
    return new MockRepository<T>();
  }

  /**
   * Create a mock service with common patterns
   */
  createMockService<T>(overrides: Partial<T> = {}): T {
    const baseMock = {
      initialize: jest.fn(),
      dispose: jest.fn(),
      ...overrides
    };
    return baseMock as T;
  }

  private registerMocks(registration: ReturnType<typeof createServiceRegistration>) {
    // Register full mocks
    for (const [token, mock] of Object.entries(this.mocks)) {
      registration.registerInstance(token, mock);
    }

    // Register partial mocks with default implementations
    for (const [token, partialMock] of Object.entries(this.partialMocks)) {
      const fullMock = this.createDefaultMockForToken(token, partialMock);
      registration.registerInstance(token, fullMock);
    }
  }

  private createDefaultMockForToken(token: string | symbol, partialMock: Partial<any>): any {
    // Create default mocks based on token type
    if (token === SERVICE_TOKENS.ACTIVITY_REPOSITORY) {
      return {
        create: jest.fn(),
        findById: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        ...partialMock
      };
    }

    if (token === SERVICE_TOKENS.COMMAND_BUS) {
      return {
        execute: jest.fn(),
        register: jest.fn(),
        ...partialMock
      };
    }

    if (token === SERVICE_TOKENS.QUERY_BUS) {
      return {
        execute: jest.fn(),
        register: jest.fn(),
        ...partialMock
      };
    }

    if (token === SERVICE_TOKENS.EVENT_BUS) {
      return {
        publish: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        ...partialMock
      };
    }

    // Generic mock
    return {
      initialize: jest.fn(),
      dispose: jest.fn(),
      ...partialMock
    };
  }
}

/**
 * Mock repository implementation for testing
 */
export class MockRepository<T> {
  private entities = new Map<string, T>();
  private nextId = 1;

  // Mock methods with jest spies
  create = jest.fn(async (entity: T & { id?: string }): Promise<T> => {
    const id = entity.id || this.nextId++.toString();
    const entityWithId = { ...entity, id } as T;
    this.entities.set(id, entityWithId);
    return entityWithId;
  });

  findById = jest.fn(async (id: string): Promise<T | null> => {
    return this.entities.get(id) || null;
  });

  findMany = jest.fn(async (query: any = {}): Promise<T[]> => {
    return Array.from(this.entities.values());
  });

  update = jest.fn(async (entity: T & { id: string }): Promise<T> => {
    this.entities.set(entity.id, entity);
    return entity;
  });

  delete = jest.fn(async (id: string): Promise<boolean> => {
    return this.entities.delete(id);
  });

  count = jest.fn(async (query: any = {}): Promise<number> => {
    return this.entities.size;
  });

  // Utility methods for testing
  reset(): void {
    this.entities.clear();
    this.nextId = 1;
    jest.clearAllMocks();
  }

  seed(entities: (T & { id: string })[]): void {
    for (const entity of entities) {
      this.entities.set(entity.id, entity);
    }
  }

  getAll(): T[] {
    return Array.from(this.entities.values());
  }
}

/**
 * Factory functions for common test scenarios
 */

/**
 * Create a test container with activity service mocks
 */
export function createActivityTestContainer(): TestCompositionRoot {
  const testRoot = new TestCompositionRoot();
  
  // Mock activity repository
  testRoot.addMock(SERVICE_TOKENS.ACTIVITY_REPOSITORY, testRoot.createMockRepository());
  
  // Mock command bus
  testRoot.addMock(SERVICE_TOKENS.COMMAND_BUS, {
    execute: jest.fn().mockResolvedValue({ success: true }),
    register: jest.fn()
  });
  
  // Mock query bus
  testRoot.addMock(SERVICE_TOKENS.QUERY_BUS, {
    execute: jest.fn().mockResolvedValue({ success: true, data: [] }),
    register: jest.fn()
  });
  
  return testRoot;
}

/**
 * Create a test container with CQRS mocks
 */
export function createCQRSTestContainer(): TestCompositionRoot {
  const testRoot = new TestCompositionRoot();
  
  // Mock all repositories
  testRoot.addMock(SERVICE_TOKENS.ACTIVITY_REPOSITORY, testRoot.createMockRepository());
  testRoot.addMock(SERVICE_TOKENS.INCIDENT_REPOSITORY, testRoot.createMockRepository());
  testRoot.addMock(SERVICE_TOKENS.CASE_REPOSITORY, testRoot.createMockRepository());
  
  // Mock buses
  testRoot.addMock(SERVICE_TOKENS.COMMAND_BUS, {
    execute: jest.fn().mockResolvedValue({ success: true }),
    register: jest.fn()
  });
  
  testRoot.addMock(SERVICE_TOKENS.QUERY_BUS, {
    execute: jest.fn().mockResolvedValue({ success: true, data: [] }),
    register: jest.fn()
  });
  
  // Mock event bus
  testRoot.addMock(SERVICE_TOKENS.EVENT_BUS, {
    publish: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn()
  });
  
  return testRoot;
}

/**
 * Create a minimal test container for unit tests
 */
export function createMinimalTestContainer(): TestCompositionRoot {
  return new TestCompositionRoot({
    environment: 'test',
    enableLogging: false,
    enableValidation: false,
    enableMetrics: false,
    enableHealthChecks: false,
    initializeServicesOnStartup: false
  });
}

/**
 * Helper to create test props with mocked services
 */
export function createTestPropsWithServices<T extends Record<string, any>>(
  services: T
): { services: T } {
  return { services };
}

/**
 * Jest test utilities
 */
export const testUtils = {
  /**
   * Wait for all promises to resolve
   */
  async flushPromises(): Promise<void> {
    await new Promise(resolve => setImmediate(resolve));
  },

  /**
   * Create a mock that tracks calls but doesn't execute
   */
  createSpyMock<T extends (...args: any[]) => any>(
    implementation?: T
  ): jest.MockedFunction<T> {
    return jest.fn(implementation) as jest.MockedFunction<T>;
  },

  /**
   * Assert that a mock was called with specific arguments
   */
  expectCalledWith<T extends (...args: any[]) => any>(
    mock: jest.MockedFunction<T>,
    ...args: Parameters<T>
  ): void {
    expect(mock).toHaveBeenCalledWith(...args);
  },

  /**
   * Reset all mocks in a test container
   */
  resetContainer(testRoot: TestCompositionRoot): void {
    const container = testRoot.getContainer();
    const tokens = container.getRegisteredTokens();
    
    for (const token of tokens) {
      const service = container.tryResolve(token);
      if (service && typeof service === 'object') {
        for (const key of Object.keys(service)) {
          const method = service[key];
          if (jest.isMockFunction(method)) {
            method.mockReset();
          }
        }
      }
    }
  }
};

export default TestCompositionRoot;