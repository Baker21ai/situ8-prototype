/**
 * Composition Root
 * Central place to wire up all dependencies for the application
 */

import { DIContainer, SERVICE_TOKENS } from './DIContainer';
import { createServiceRegistration, ServiceConfiguration } from './ServiceRegistration';
import { CommandBus } from '../../application/CommandBus';
import { QueryBus } from '../../application/QueryBus';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { eventBus } from '../storage/EventBus';

// Import command and query handlers
import { ActivityCommandHandlers } from '../../application/commands/activity/ActivityCommandHandlers';
import { ActivityQueryHandlers } from '../../application/queries/activity/ActivityQueryHandlers';

export interface CompositionRootConfig extends ServiceConfiguration {
  environment: 'development' | 'production' | 'test';
  enableMetrics?: boolean;
  enableHealthChecks?: boolean;
}

export class CompositionRoot {
  private container: DIContainer;
  private config: CompositionRootConfig;
  private isInitialized = false;

  constructor(container: DIContainer, config: CompositionRootConfig) {
    this.container = container;
    this.config = config;
  }

  /**
   * Configure and register all application services
   */
  async configure(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('CompositionRoot has already been initialized');
    }

    const registration = createServiceRegistration(this.container, this.config);

    // Register infrastructure services
    this.registerInfrastructure(registration);

    // Register repositories
    this.registerRepositories(registration);

    // Register CQRS components
    this.registerCQRS(registration);

    // Register domain services
    this.registerDomainServices(registration);

    // Register command and query handlers
    this.registerHandlers(registration);

    // Initialize services if configured
    if (this.config.initializeServicesOnStartup) {
      await registration.initializeServices();
    }

    // Validate registrations in development
    if (this.config.environment === 'development' && this.config.enableValidation) {
      const validation = registration.validateRegistrations();
      if (!validation.isValid) {
        console.error('❌ Service registration validation failed:', validation.errors);
        throw new Error('Service registration validation failed');
      }
    }

    this.isInitialized = true;

    if (this.config.enableLogging) {
      console.log('🎯 CompositionRoot initialized successfully');
      this.logContainerStatus();
    }
  }

  /**
   * Register infrastructure services
   */
  private registerInfrastructure(registration: ReturnType<typeof createServiceRegistration>) {
    // Event Bus (singleton instance)
    registration.registerInstance(SERVICE_TOKENS.EVENT_BUS, eventBus);

    // Cache Manager (in-memory for now)
    registration.registerFactory(
      SERVICE_TOKENS.CACHE_MANAGER,
      () => new InMemoryCacheManager(),
      'singleton'
    );

    // Logger
    registration.registerFactory(
      SERVICE_TOKENS.LOGGER,
      () => new ConsoleLogger(),
      'singleton'
    );

    // Configuration
    registration.registerInstance(SERVICE_TOKENS.APP_CONFIG, {
      environment: this.config.environment,
      enableMetrics: this.config.enableMetrics || false,
      enableHealthChecks: this.config.enableHealthChecks || false
    });
  }

  /**
   * Register repository implementations
   */
  private registerRepositories(registration: ReturnType<typeof createServiceRegistration>) {
    // Activity Repository
    registration.registerFactory(
      SERVICE_TOKENS.ACTIVITY_REPOSITORY,
      (container) => new ActivityRepository({
        enableCaching: true,
        cacheTimeout: 30000,
        enableSearchIndex: true,
        enableRealTimeUpdates: true
      }),
      'singleton'
    );

    // TODO: Add other repositories as they're implemented
    // registration.registerClass(SERVICE_TOKENS.INCIDENT_REPOSITORY, IncidentRepository);
    // registration.registerClass(SERVICE_TOKENS.CASE_REPOSITORY, CaseRepository);
  }

  /**
   * Register CQRS components
   */
  private registerCQRS(registration: ReturnType<typeof createServiceRegistration>) {
    // Command Bus
    registration.registerFactory(
      SERVICE_TOKENS.COMMAND_BUS,
      (container) => {
        const cacheManager = container.tryResolve(SERVICE_TOKENS.CACHE_MANAGER);
        return new CommandBus();
      },
      'singleton'
    );

    // Query Bus
    registration.registerFactory(
      SERVICE_TOKENS.QUERY_BUS,
      (container) => {
        const cacheManager = container.tryResolve(SERVICE_TOKENS.CACHE_MANAGER);
        return new QueryBus(cacheManager);
      },
      'singleton'
    );
  }

  /**
   * Register domain services
   */
  private registerDomainServices(registration: ReturnType<typeof createServiceRegistration>) {
    // Activity Service
    registration.registerFactory(
      SERVICE_TOKENS.ACTIVITY_SERVICE,
      (container) => {
        const activityRepository = container.resolve(SERVICE_TOKENS.ACTIVITY_REPOSITORY);
        const eventBus = container.resolve(SERVICE_TOKENS.EVENT_BUS);
        
        // Return a simplified service implementation for now
        return {
          repository: activityRepository,
          eventBus,
          async createActivity(data: any) {
            // Implementation would go here
            return null;
          }
        };
      },
      'singleton'
    );

    // Audit Service
    registration.registerFactory(
      SERVICE_TOKENS.AUDIT_SERVICE,
      (container) => {
        const eventBus = container.resolve(SERVICE_TOKENS.EVENT_BUS);
        const logger = container.resolve(SERVICE_TOKENS.LOGGER);
        
        return {
          eventBus,
          logger,
          async logAuditEvent(event: any) {
            logger.info('Audit event:', event);
          }
        };
      },
      'singleton'
    );
  }

  /**
   * Register command and query handlers
   */
  private registerHandlers(registration: ReturnType<typeof createServiceRegistration>) {
    // Activity Command Handlers
    registration.registerFactory(
      'ActivityCommandHandlers',
      (container) => {
        const activityRepository = container.resolve(SERVICE_TOKENS.ACTIVITY_REPOSITORY);
        const eventBus = container.resolve(SERVICE_TOKENS.EVENT_BUS);
        return new ActivityCommandHandlers(activityRepository, eventBus);
      },
      'singleton'
    );

    // Activity Query Handlers
    registration.registerFactory(
      'ActivityQueryHandlers',
      (container) => {
        const activityRepository = container.resolve(SERVICE_TOKENS.ACTIVITY_REPOSITORY);
        return new ActivityQueryHandlers(activityRepository);
      },
      'singleton'
    );

    // Wire up handlers with buses
    this.wireHandlers();
  }

  /**
   * Wire command and query handlers with their respective buses
   */
  private wireHandlers() {
    // This will be called after all services are registered
    setTimeout(() => {
      try {
        const commandBus = this.container.resolve(SERVICE_TOKENS.COMMAND_BUS);
        const queryBus = this.container.resolve(SERVICE_TOKENS.QUERY_BUS);
        const activityCommandHandlers = this.container.resolve('ActivityCommandHandlers');
        const activityQueryHandlers = this.container.resolve('ActivityQueryHandlers');

        // Register command handlers
        if (commandBus && activityCommandHandlers) {
          // Register each command handler
          commandBus.register('CreateActivityCommand', activityCommandHandlers.handleCreateActivity.bind(activityCommandHandlers));
          commandBus.register('UpdateActivityCommand', activityCommandHandlers.handleUpdateActivity.bind(activityCommandHandlers));
          commandBus.register('AssignActivityCommand', activityCommandHandlers.handleAssignActivity.bind(activityCommandHandlers));
          commandBus.register('ResolveActivityCommand', activityCommandHandlers.handleResolveActivity.bind(activityCommandHandlers));
          commandBus.register('ArchiveActivityCommand', activityCommandHandlers.handleArchiveActivity.bind(activityCommandHandlers));
        }

        // Register query handlers
        if (queryBus && activityQueryHandlers) {
          queryBus.register('GetActivityByIdQuery', activityQueryHandlers.handleGetActivityById.bind(activityQueryHandlers));
          queryBus.register('SearchActivitiesQuery', activityQueryHandlers.handleSearchActivities.bind(activityQueryHandlers));
          queryBus.register('GetActivityStatsQuery', activityQueryHandlers.handleGetActivityStats.bind(activityQueryHandlers));
          queryBus.register('GetOverdueActivitiesQuery', activityQueryHandlers.handleGetOverdueActivities.bind(activityQueryHandlers));
        }

        if (this.config.enableLogging) {
          console.log('📡 Command and query handlers wired successfully');
        }
      } catch (error) {
        console.error('❌ Failed to wire handlers:', error);
      }
    }, 0);
  }

  /**
   * Get the configured container
   */
  getContainer(): DIContainer {
    if (!this.isInitialized) {
      throw new Error('CompositionRoot must be configured before accessing container');
    }
    return this.container;
  }

  /**
   * Get a service from the container
   */
  getService<T>(token: string | symbol): T {
    return this.container.resolve(token);
  }

  /**
   * Create a child container for testing
   */
  createTestContainer(): DIContainer {
    return this.container.createChild();
  }

  /**
   * Dispose all services and cleanup
   */
  async dispose(): Promise<void> {
    if (!this.isInitialized) return;

    // Call pre-destroy hooks on services that support it
    const tokens = this.container.getRegisteredTokens();
    for (const token of tokens) {
      try {
        const service = this.container.tryResolve(token);
        if (service && typeof service === 'object' && 'dispose' in service) {
          const disposable = service as any;
          if (typeof disposable.dispose === 'function') {
            await disposable.dispose();
          }
        }
      } catch (error) {
        console.error(`Error disposing service ${String(token)}:`, error);
      }
    }

    this.container.dispose();
    this.isInitialized = false;

    if (this.config.enableLogging) {
      console.log('🛑 CompositionRoot disposed');
    }
  }

  /**
   * Get health status of the container
   */
  getHealthStatus() {
    return {
      isInitialized: this.isInitialized,
      container: this.container.getHealthStatus()
    };
  }

  private logContainerStatus() {
    const status = this.container.getHealthStatus();
    console.log(`📊 Container Status:
    - Total Services: ${status.totalServices}
    - Singletons: ${status.singletonCount}
    - Transients: ${status.transientCount}
    - Instantiated: ${status.instantiatedSingletons}`);
  }
}

// Simple implementations for basic services

class InMemoryCacheManager {
  private cache = new Map<string, { value: any; expires: number }>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttl: number = 30000): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

class ConsoleLogger {
  info(message: string, ...args: any[]): void {
    console.log(`ℹ️ ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`⚠️ ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`❌ ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🐛 ${message}`, ...args);
    }
  }
}

/**
 * Factory functions for different environments
 */

export function createDevelopmentContainer(): CompositionRoot {
  const container = new DIContainer();
  const config: CompositionRootConfig = {
    environment: 'development',
    enableLogging: true,
    enableValidation: true,
    enableMetrics: true,
    enableHealthChecks: true,
    initializeServicesOnStartup: true
  };
  
  return new CompositionRoot(container, config);
}

export function createProductionContainer(): CompositionRoot {
  const container = new DIContainer();
  const config: CompositionRootConfig = {
    environment: 'production',
    enableLogging: false,
    enableValidation: false,
    enableMetrics: true,
    enableHealthChecks: true,
    initializeServicesOnStartup: true
  };
  
  return new CompositionRoot(container, config);
}

export function createTestContainer(): CompositionRoot {
  const container = new DIContainer();
  const config: CompositionRootConfig = {
    environment: 'test',
    enableLogging: false,
    enableValidation: true,
    enableMetrics: false,
    enableHealthChecks: false,
    initializeServicesOnStartup: false
  };
  
  return new CompositionRoot(container, config);
}