/**
 * Dependency Injection Decorators
 * TypeScript decorators for marking injectable services and dependencies
 */

import 'reflect-metadata';
import { ServiceToken } from './DIContainer';

// Metadata keys for reflection
const INJECTABLE_METADATA_KEY = Symbol('injectable');
const INJECT_METADATA_KEY = Symbol('inject');
const DESIGN_TYPE_METADATA_KEY = 'design:type';
const DESIGN_PARAMTYPES_METADATA_KEY = 'design:paramtypes';

/**
 * Mark a class as injectable
 */
export function Injectable(token?: ServiceToken): ClassDecorator {
  return function <T extends Function>(target: T): T {
    // Store injectable metadata
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, {
      token: token || target,
      target
    }, target);

    // Store parameter types for automatic dependency resolution
    const paramTypes = Reflect.getMetadata(DESIGN_PARAMTYPES_METADATA_KEY, target) || [];
    Reflect.defineMetadata('paramtypes', paramTypes, target);

    return target;
  };
}

/**
 * Inject a specific service by token
 */
export function Inject(token: ServiceToken): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // Get existing inject metadata
    const existingInjects = Reflect.getOwnMetadata(INJECT_METADATA_KEY, target) || [];
    
    // Add new inject metadata
    existingInjects[parameterIndex] = token;
    
    // Store updated metadata
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjects, target);
  };
}

/**
 * Property injection decorator
 */
export function InjectProperty(token: ServiceToken): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // Store property injection metadata
    const existingProps = Reflect.getOwnMetadata('inject:properties', target.constructor) || {};
    existingProps[propertyKey] = token;
    Reflect.defineMetadata('inject:properties', existingProps, target.constructor);
  };
}

/**
 * Mark a service as singleton (default lifetime)
 */
export function Singleton(token?: ServiceToken): ClassDecorator {
  return function <T extends Function>(target: T): T {
    Reflect.defineMetadata('lifetime', 'singleton', target);
    return Injectable(token)(target);
  };
}

/**
 * Mark a service as transient
 */
export function Transient(token?: ServiceToken): ClassDecorator {
  return function <T extends Function>(target: T): T {
    Reflect.defineMetadata('lifetime', 'transient', target);
    return Injectable(token)(target);
  };
}

/**
 * Optional injection - won't throw if service is not found
 */
export function Optional(token: ServiceToken): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // First apply the regular inject decorator
    Inject(token)(target, propertyKey, parameterIndex);
    
    // Then mark as optional
    const existingOptional = Reflect.getOwnMetadata('inject:optional', target) || [];
    existingOptional[parameterIndex] = true;
    Reflect.defineMetadata('inject:optional', existingOptional, target);
  };
}

/**
 * Post-construct method decorator
 */
export function PostConstruct(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  Reflect.defineMetadata('post-construct', propertyKey, target.constructor);
}

/**
 * Pre-destroy method decorator
 */
export function PreDestroy(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  Reflect.defineMetadata('pre-destroy', propertyKey, target.constructor);
}

// Utility functions for reading metadata

/**
 * Check if a class is marked as injectable
 */
export function isInjectable(target: Function): boolean {
  return Reflect.hasMetadata(INJECTABLE_METADATA_KEY, target);
}

/**
 * Get injectable metadata for a class
 */
export function getInjectableMetadata(target: Function): { token: ServiceToken; target: Function } | undefined {
  return Reflect.getMetadata(INJECTABLE_METADATA_KEY, target);
}

/**
 * Get constructor parameter types
 */
export function getParameterTypes(target: Function): Function[] {
  return Reflect.getMetadata(DESIGN_PARAMTYPES_METADATA_KEY, target) || [];
}

/**
 * Get injection tokens for constructor parameters
 */
export function getInjectTokens(target: Function): ServiceToken[] {
  return Reflect.getMetadata(INJECT_METADATA_KEY, target) || [];
}

/**
 * Get optional parameter flags
 */
export function getOptionalFlags(target: Function): boolean[] {
  return Reflect.getMetadata('inject:optional', target) || [];
}

/**
 * Get property injection metadata
 */
export function getPropertyInjects(target: Function): Record<string | symbol, ServiceToken> {
  return Reflect.getMetadata('inject:properties', target) || {};
}

/**
 * Get service lifetime from metadata
 */
export function getLifetime(target: Function): 'singleton' | 'transient' {
  return Reflect.getMetadata('lifetime', target) || 'singleton';
}

/**
 * Get post-construct method name
 */
export function getPostConstructMethod(target: Function): string | undefined {
  return Reflect.getMetadata('post-construct', target);
}

/**
 * Get pre-destroy method name
 */
export function getPreDestroyMethod(target: Function): string | undefined {
  return Reflect.getMetadata('pre-destroy', target);
}

/**
 * Resolve constructor dependencies using metadata
 */
export function resolveConstructorDependencies(
  target: Function,
  resolver: (token: ServiceToken) => any
): any[] {
  const paramTypes = getParameterTypes(target);
  const injectTokens = getInjectTokens(target);
  const optionalFlags = getOptionalFlags(target);
  
  const dependencies: any[] = [];
  
  for (let i = 0; i < paramTypes.length; i++) {
    const token = injectTokens[i] || paramTypes[i];
    const isOptional = optionalFlags[i] || false;
    
    try {
      const dependency = resolver(token);
      dependencies.push(dependency);
    } catch (error) {
      if (isOptional) {
        dependencies.push(null);
      } else {
        throw error;
      }
    }
  }
  
  return dependencies;
}

/**
 * Inject properties after instance creation
 */
export function injectProperties(
  instance: any,
  resolver: (token: ServiceToken) => any
): void {
  const propertyInjects = getPropertyInjects(instance.constructor);
  
  for (const [propertyKey, token] of Object.entries(propertyInjects)) {
    try {
      const dependency = resolver(token);
      instance[propertyKey] = dependency;
    } catch (error) {
      console.warn(`Failed to inject property ${String(propertyKey)}:`, error);
    }
  }
}

/**
 * Call post-construct method if it exists
 */
export async function callPostConstruct(instance: any): Promise<void> {
  const methodName = getPostConstructMethod(instance.constructor);
  if (methodName && typeof instance[methodName] === 'function') {
    const result = instance[methodName]();
    if (result instanceof Promise) {
      await result;
    }
  }
}

/**
 * Call pre-destroy method if it exists
 */
export async function callPreDestroy(instance: any): Promise<void> {
  const methodName = getPreDestroyMethod(instance.constructor);
  if (methodName && typeof instance[methodName] === 'function') {
    const result = instance[methodName]();
    if (result instanceof Promise) {
      await result;
    }
  }
}

/**
 * Create an enhanced factory that uses decorators for dependency resolution
 */
export function createDecoratedFactory<T>(
  constructor: new (...args: any[]) => T,
  container: { resolve: (token: ServiceToken) => any; tryResolve: (token: ServiceToken) => any }
): () => T {
  return () => {
    // Resolve constructor dependencies
    const dependencies = resolveConstructorDependencies(
      constructor,
      (token) => container.resolve(token)
    );
    
    // Create instance
    const instance = new constructor(...dependencies);
    
    // Inject properties
    injectProperties(instance, (token) => container.tryResolve(token));
    
    // Call post-construct
    callPostConstruct(instance).catch(error => {
      console.error('Post-construct failed:', error);
    });
    
    return instance;
  };
}

// Export metadata keys for external use
export const METADATA_KEYS = {
  INJECTABLE: INJECTABLE_METADATA_KEY,
  INJECT: INJECT_METADATA_KEY,
  DESIGN_TYPE: DESIGN_TYPE_METADATA_KEY,
  DESIGN_PARAMTYPES: DESIGN_PARAMTYPES_METADATA_KEY
} as const;