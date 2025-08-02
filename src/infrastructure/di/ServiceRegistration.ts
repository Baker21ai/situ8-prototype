/**
 * Service Registration Helpers
 * Utilities for registering services with proper typing and validation
 */

import { DIContainer, ServiceToken, ServiceFactory, SERVICE_TOKENS } from './DIContainer';

export interface IDisposable {
  dispose(): void | Promise<void>;
}

export interface IInitializable {
  initialize(): void | Promise<void>;
}

export interface ServiceConfiguration {
  enableValidation?: boolean;
  enableLogging?: boolean;
  initializeServicesOnStartup?: boolean;
}

export class ServiceRegistrationHelper {
  constructor(
    private container: DIContainer,
    private config: ServiceConfiguration = {}
  ) {}

  /**
   * Register a class constructor as a service
   */
  registerClass<T>(
    token: ServiceToken<T>,
    constructor: new (...args: any[]) => T,
    lifetime: 'singleton' | 'transient' = 'singleton'
  ): this {
    const factory: ServiceFactory<T> = (container) => {
      // For now, we'll create instances without dependency injection
      // In a full implementation, this would analyze constructor parameters
      return new constructor();
    };

    if (lifetime === 'singleton') {
      this.container.register(token).asSingleton(factory);
    } else {
      this.container.register(token).asTransient(factory);
    }

    if (this.config.enableLogging) {
      console.log(`📦 Registered ${this.tokenToString(token)} as ${lifetime}`);
    }

    return this;
  }

  /**
   * Register a factory function as a service
   */
  registerFactory<T>(
    token: ServiceToken<T>,
    factory: ServiceFactory<T>,
    lifetime: 'singleton' | 'transient' = 'singleton'
  ): this {
    if (lifetime === 'singleton') {
      this.container.register(token).asSingleton(factory);
    } else {
      this.container.register(token).asTransient(factory);
    }

    if (this.config.enableLogging) {
      console.log(`🏭 Registered factory for ${this.tokenToString(token)} as ${lifetime}`);
    }

    return this;
  }

  /**
   * Register an existing instance
   */
  registerInstance<T>(token: ServiceToken<T>, instance: T): this {
    this.container.registerInstance(token, instance);

    if (this.config.enableLogging) {
      console.log(`🎯 Registered instance for ${this.tokenToString(token)}`);
    }

    return this;
  }

  /**
   * Register multiple services from a configuration object
   */
  registerFromConfig(config: ServiceRegistrationConfig): this {
    for (const [token, registration] of Object.entries(config)) {
      if ('instance' in registration) {
        this.registerInstance(token, registration.instance);
      } else if ('constructor' in registration) {
        this.registerClass(
          token,
          registration.constructor,
          registration.lifetime || 'singleton'
        );
      } else if ('factory' in registration) {
        this.registerFactory(
          token,
          registration.factory,
          registration.lifetime || 'singleton'
        );
      }
    }

    return this;
  }

  /**
   * Initialize all services that implement IInitializable
   */
  async initializeServices(): Promise<void> {
    if (!this.config.initializeServicesOnStartup) return;

    const tokens = this.container.getRegisteredTokens();
    const initPromises: Promise<void>[] = [];

    for (const token of tokens) {
      try {
        const service = this.container.resolve(token);
        if (service && typeof service === 'object' && 'initialize' in service) {
          const initializable = service as IInitializable;
          if (typeof initializable.initialize === 'function') {
            const result = initializable.initialize();
            if (result instanceof Promise) {
              initPromises.push(result);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to initialize service ${this.tokenToString(token)}:`, error);
      }
    }

    if (initPromises.length > 0) {
      await Promise.allSettled(initPromises);
    }

    if (this.config.enableLogging) {
      console.log(`🚀 Initialized ${initPromises.length} services`);
    }
  }

  /**
   * Validate all service registrations
   */
  validateRegistrations(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const tokens = this.container.getRegisteredTokens();

    for (const token of tokens) {
      try {
        // Try to resolve each service to check for issues
        this.container.resolve(token);
      } catch (error) {
        result.isValid = false;
        result.errors.push({
          token: this.tokenToString(token),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (this.config.enableLogging && !result.isValid) {
      console.error('❌ Service registration validation failed:', result.errors);
    }

    return result;
  }

  /**
   * Get dependency graph for debugging
   */
  getDependencyGraph(): DependencyGraph {
    const graph: DependencyGraph = {
      nodes: [],
      edges: []
    };

    const tokens = this.container.getRegisteredTokens();

    for (const token of tokens) {
      const descriptor = this.container.getDescriptor(token);
      if (descriptor) {
        graph.nodes.push({
          token: this.tokenToString(token),
          lifetime: descriptor.lifetime,
          isInstantiated: !!descriptor.instance
        });

        if (descriptor.dependencies) {
          for (const dependency of descriptor.dependencies) {
            graph.edges.push({
              from: this.tokenToString(token),
              to: this.tokenToString(dependency)
            });
          }
        }
      }
    }

    return graph;
  }

  private tokenToString(token: ServiceToken): string {
    if (typeof token === 'string') return token;
    if (typeof token === 'symbol') return token.toString();
    if (typeof token === 'function') return token.name || 'Anonymous';
    return String(token);
  }
}

// Supporting types and interfaces

export interface ServiceRegistrationConfig {
  [token: string]: ServiceRegistrationEntry;
}

export type ServiceRegistrationEntry = 
  | { instance: any }
  | { constructor: new (...args: any[]) => any; lifetime?: 'singleton' | 'transient' }
  | { factory: ServiceFactory; lifetime?: 'singleton' | 'transient' };

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ token: string; error: string }>;
  warnings: Array<{ token: string; warning: string }>;
}

export interface DependencyGraph {
  nodes: Array<{
    token: string;
    lifetime: 'singleton' | 'transient';
    isInstantiated: boolean;
  }>;
  edges: Array<{
    from: string;
    to: string;
  }>;
}

/**
 * Create a service registration helper
 */
export function createServiceRegistration(
  container: DIContainer,
  config?: ServiceConfiguration
): ServiceRegistrationHelper {
  return new ServiceRegistrationHelper(container, config);
}

/**
 * Pre-configured service tokens with type safety
 */
export const TYPED_SERVICE_TOKENS = {
  // CQRS
  CommandBus: SERVICE_TOKENS.COMMAND_BUS as ServiceToken<any>,
  QueryBus: SERVICE_TOKENS.QUERY_BUS as ServiceToken<any>,
  
  // Repositories
  ActivityRepository: SERVICE_TOKENS.ACTIVITY_REPOSITORY as ServiceToken<any>,
  IncidentRepository: SERVICE_TOKENS.INCIDENT_REPOSITORY as ServiceToken<any>,
  CaseRepository: SERVICE_TOKENS.CASE_REPOSITORY as ServiceToken<any>,
  
  // Services
  ActivityService: SERVICE_TOKENS.ACTIVITY_SERVICE as ServiceToken<any>,
  IncidentService: SERVICE_TOKENS.INCIDENT_SERVICE as ServiceToken<any>,
  CaseService: SERVICE_TOKENS.CASE_SERVICE as ServiceToken<any>,
  AuditService: SERVICE_TOKENS.AUDIT_SERVICE as ServiceToken<any>,
  
  // Infrastructure
  EventBus: SERVICE_TOKENS.EVENT_BUS as ServiceToken<any>,
  CacheManager: SERVICE_TOKENS.CACHE_MANAGER as ServiceToken<any>,
  Logger: SERVICE_TOKENS.LOGGER as ServiceToken<any>
} as const;