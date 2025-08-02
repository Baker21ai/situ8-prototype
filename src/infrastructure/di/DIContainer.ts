/**
 * Dependency Injection Container
 * Lightweight, TypeScript-first DI container with support for singleton and transient lifetimes
 */

export type ServiceLifetime = 'singleton' | 'transient';
export type ServiceFactory<T = any> = (container: DIContainer) => T;
export type ServiceToken<T = any> = string | symbol | (new (...args: any[]) => T);

export interface ServiceDescriptor<T = any> {
  token: ServiceToken<T>;
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  instance?: T;
  dependencies?: ServiceToken[];
}

export interface ServiceRegistration {
  asSingleton<T>(factory: ServiceFactory<T>): ServiceDescriptor<T>;
  asTransient<T>(factory: ServiceFactory<T>): ServiceDescriptor<T>;
}

export class DIContainer {
  private services = new Map<ServiceToken, ServiceDescriptor>();
  private resolving = new Set<ServiceToken>(); // Circular dependency detection
  private disposed = false;

  /**
   * Register a service with the container
   */
  register<T>(token: ServiceToken<T>): ServiceRegistration {
    if (this.disposed) {
      throw new Error('Cannot register services on a disposed container');
    }

    return {
      asSingleton: (factory: ServiceFactory<T>): ServiceDescriptor<T> => {
        const descriptor: ServiceDescriptor<T> = {
          token,
          factory,
          lifetime: 'singleton',
          dependencies: this.extractDependencies(factory)
        };
        this.services.set(token, descriptor);
        return descriptor;
      },

      asTransient: (factory: ServiceFactory<T>): ServiceDescriptor<T> => {
        const descriptor: ServiceDescriptor<T> = {
          token,
          factory,
          lifetime: 'transient',
          dependencies: this.extractDependencies(factory)
        };
        this.services.set(token, descriptor);
        return descriptor;
      }
    };
  }

  /**
   * Register an existing instance as a singleton
   */
  registerInstance<T>(token: ServiceToken<T>, instance: T): void {
    if (this.disposed) {
      throw new Error('Cannot register services on a disposed container');
    }

    const descriptor: ServiceDescriptor<T> = {
      token,
      factory: () => instance,
      lifetime: 'singleton',
      instance,
      dependencies: []
    };
    this.services.set(token, descriptor);
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(token: ServiceToken<T>): T {
    if (this.disposed) {
      throw new Error('Cannot resolve services from a disposed container');
    }

    if (this.resolving.has(token)) {
      throw new Error(`Circular dependency detected for token: ${this.tokenToString(token)}`);
    }

    const descriptor = this.services.get(token);
    if (!descriptor) {
      throw new Error(`Service not registered: ${this.tokenToString(token)}`);
    }

    // Return existing singleton instance
    if (descriptor.lifetime === 'singleton' && descriptor.instance) {
      return descriptor.instance;
    }

    // Resolve dependencies and create instance
    this.resolving.add(token);
    
    try {
      const instance = descriptor.factory(this);
      
      // Store singleton instance
      if (descriptor.lifetime === 'singleton') {
        descriptor.instance = instance;
      }
      
      return instance;
    } finally {
      this.resolving.delete(token);
    }
  }

  /**
   * Try to resolve a service, returning null if not registered
   */
  tryResolve<T>(token: ServiceToken<T>): T | null {
    try {
      return this.resolve(token);
    } catch {
      return null;
    }
  }

  /**
   * Check if a service is registered
   */
  isRegistered<T>(token: ServiceToken<T>): boolean {
    return this.services.has(token);
  }

  /**
   * Get all registered service tokens
   */
  getRegisteredTokens(): ServiceToken[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get service descriptor for a token
   */
  getDescriptor<T>(token: ServiceToken<T>): ServiceDescriptor<T> | undefined {
    return this.services.get(token);
  }

  /**
   * Create a child container that inherits parent registrations
   */
  createChild(): DIContainer {
    const child = new DIContainer();
    
    // Copy parent registrations (shallow copy)
    for (const [token, descriptor] of this.services) {
      child.services.set(token, { ...descriptor });
    }
    
    return child;
  }

  /**
   * Dispose the container and cleanup singleton instances
   */
  dispose(): void {
    if (this.disposed) return;

    // Dispose singleton instances that implement IDisposable
    for (const descriptor of this.services.values()) {
      if (descriptor.instance && typeof descriptor.instance === 'object') {
        const disposable = descriptor.instance as any;
        if (typeof disposable.dispose === 'function') {
          try {
            disposable.dispose();
          } catch (error) {
            console.error('Error disposing service:', error);
          }
        }
      }
    }

    this.services.clear();
    this.resolving.clear();
    this.disposed = true;
  }

  /**
   * Get container health status
   */
  getHealthStatus(): {
    isDisposed: boolean;
    totalServices: number;
    singletonCount: number;
    transientCount: number;
    instantiatedSingletons: number;
  } {
    const services = Array.from(this.services.values());
    
    return {
      isDisposed: this.disposed,
      totalServices: services.length,
      singletonCount: services.filter(s => s.lifetime === 'singleton').length,
      transientCount: services.filter(s => s.lifetime === 'transient').length,
      instantiatedSingletons: services.filter(s => s.lifetime === 'singleton' && s.instance).length
    };
  }

  /**
   * Extract dependencies from factory function (basic implementation)
   * In a production system, this might use reflection or AST parsing
   */
  private extractDependencies(factory: ServiceFactory): ServiceToken[] {
    // For now, return empty array
    // In practice, this could parse the function to extract dependencies
    // or use decorators/metadata to track dependencies
    return [];
  }

  /**
   * Convert token to string for error messages
   */
  private tokenToString(token: ServiceToken): string {
    if (typeof token === 'string') return token;
    if (typeof token === 'symbol') return token.toString();
    if (typeof token === 'function') return token.name || 'Anonymous';
    return String(token);
  }
}

/**
 * Global container instance
 */
export const globalContainer = new DIContainer();

/**
 * Service tokens for common services
 */
export const SERVICE_TOKENS = {
  // CQRS Services
  COMMAND_BUS: Symbol('CommandBus'),
  QUERY_BUS: Symbol('QueryBus'),
  
  // Repositories
  ACTIVITY_REPOSITORY: Symbol('ActivityRepository'),
  INCIDENT_REPOSITORY: Symbol('IncidentRepository'),
  CASE_REPOSITORY: Symbol('CaseRepository'),
  
  // Domain Services
  ACTIVITY_SERVICE: Symbol('ActivityService'),
  INCIDENT_SERVICE: Symbol('IncidentService'),
  CASE_SERVICE: Symbol('CaseService'),
  AUDIT_SERVICE: Symbol('AuditService'),
  
  // Infrastructure
  EVENT_BUS: Symbol('EventBus'),
  CACHE_MANAGER: Symbol('CacheManager'),
  LOGGER: Symbol('Logger'),
  
  // Configuration
  APP_CONFIG: Symbol('AppConfig'),
  DATABASE_CONFIG: Symbol('DatabaseConfig')
} as const;

/**
 * Utility type for service token inference
 */
export type ServiceTokenType<T extends keyof typeof SERVICE_TOKENS> = 
  typeof SERVICE_TOKENS[T];