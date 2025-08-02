/**
 * Dependency Injection System - Main Export
 * Lightweight TypeScript-first DI container with React integration
 */

// Import reflect-metadata for decorator support (optional)
// This only needs to be imported once in your application
// Uncomment if you want to use decorators:
// import 'reflect-metadata';

// Core DI container
export {
  DIContainer,
  globalContainer,
  SERVICE_TOKENS,
  type ServiceLifetime,
  type ServiceFactory,
  type ServiceToken,
  type ServiceDescriptor,
  type ServiceRegistration,
  type ServiceTokenType
} from './DIContainer';

// Service registration helpers
export {
  ServiceRegistrationHelper,
  createServiceRegistration,
  TYPED_SERVICE_TOKENS,
  type IDisposable,
  type IInitializable,
  type ServiceConfiguration,
  type ServiceRegistrationConfig,
  type ServiceRegistrationEntry,
  type ValidationResult,
  type DependencyGraph
} from './ServiceRegistration';

// Decorators (optional - requires reflect-metadata)
export {
  Injectable,
  Inject,
  InjectProperty,
  Singleton,
  Transient,
  Optional,
  PostConstruct,
  PreDestroy,
  isInjectable,
  getInjectableMetadata,
  getParameterTypes,
  getInjectTokens,
  getOptionalFlags,
  getPropertyInjects,
  getLifetime,
  getPostConstructMethod,
  getPreDestroyMethod,
  resolveConstructorDependencies,
  injectProperties,
  callPostConstruct,
  callPreDestroy,
  createDecoratedFactory,
  METADATA_KEYS
} from './Decorators';

// Composition root
export {
  CompositionRoot,
  createDevelopmentContainer,
  createProductionContainer,
  createTestContainer,
  type CompositionRootConfig
} from './CompositionRoot';

// React integration
export {
  DependencyProvider,
  DIDevTools,
  useDIContainer,
  useCompositionRoot,
  useService,
  useOptionalService,
  useServices,
  useContainerHealth,
  withDependencies,
  type DependencyProviderProps
} from './DependencyProvider';

// Re-export commonly used patterns
export const DI = {
  // Factory functions
  createContainer: () => new DIContainer(),
  createDevelopmentRoot: createDevelopmentContainer,
  createProductionRoot: createProductionContainer,
  createTestRoot: createTestContainer,
  
  // Tokens
  TOKENS: SERVICE_TOKENS,
  TYPED_TOKENS: TYPED_SERVICE_TOKENS,
  
  // Global container (use sparingly)
  global: globalContainer
} as const;

/**
 * Quick setup functions for common scenarios
 */

/**
 * Create a fully configured DI system for development
 */
export async function setupDevelopmentDI() {
  const compositionRoot = createDevelopmentContainer();
  await compositionRoot.configure();
  return {
    compositionRoot,
    container: compositionRoot.getContainer()
  };
}

/**
 * Create a fully configured DI system for production
 */
export async function setupProductionDI() {
  const compositionRoot = createProductionContainer();
  await compositionRoot.configure();
  return {
    compositionRoot,
    container: compositionRoot.getContainer()
  };
}

/**
 * Create a minimal DI system for testing
 */
export async function setupTestDI() {
  const compositionRoot = createTestContainer();
  await compositionRoot.configure();
  return {
    compositionRoot,
    container: compositionRoot.getContainer()
  };
}

/**
 * Utility for creating mock services in tests
 */
export function createMockService<T>(implementation: Partial<T>): T {
  return implementation as T;
}

/**
 * Utility for creating test container with mocked services
 */
export function createTestContainerWithMocks(mocks: Record<string | symbol, any>) {
  const container = new DIContainer();
  
  // Register mocks
  for (const [token, mock] of Object.entries(mocks)) {
    container.registerInstance(token, mock);
  }
  
  return container;
}

/**
 * Type-safe service token creator
 */
export function createServiceToken<T>(name: string): ServiceToken<T> {
  return Symbol(name);
}

/**
 * Default export for convenience
 */
const DISystem = {
  DIContainer,
  CompositionRoot,
  DependencyProvider,
  setupDevelopmentDI,
  setupProductionDI,
  setupTestDI,
  SERVICE_TOKENS,
  TYPED_SERVICE_TOKENS,
  createServiceToken
};

export default DISystem;