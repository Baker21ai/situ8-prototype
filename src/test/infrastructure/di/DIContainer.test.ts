/**
 * DI Container Tests
 * Tests for the dependency injection container functionality
 */

import { DIContainer, SERVICE_TOKENS } from '../../../infrastructure/di/DIContainer';
import { createServiceRegistration } from '../../../infrastructure/di/ServiceRegistration';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  afterEach(() => {
    container.dispose();
  });

  describe('Service Registration', () => {
    it('should register and resolve singleton services', () => {
      // Arrange
      class TestService {
        public instanceId = Math.random();
      }

      container.register('TestService').asSingleton(() => new TestService());

      // Act
      const instance1 = container.resolve('TestService');
      const instance2 = container.resolve('TestService');

      // Assert
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(instance1).toBe(instance2); // Same instance
      expect(instance1.instanceId).toBe(instance2.instanceId);
    });

    it('should register and resolve transient services', () => {
      // Arrange
      class TestService {
        public instanceId = Math.random();
      }

      container.register('TestService').asTransient(() => new TestService());

      // Act
      const instance1 = container.resolve('TestService');
      const instance2 = container.resolve('TestService');

      // Assert
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(instance1).not.toBe(instance2); // Different instances
      expect(instance1.instanceId).not.toBe(instance2.instanceId);
    });

    it('should register instances directly', () => {
      // Arrange
      const testInstance = { value: 'test' };

      // Act
      container.registerInstance('TestInstance', testInstance);
      const resolved = container.resolve('TestInstance');

      // Assert
      expect(resolved).toBe(testInstance);
    });

    it('should throw error for unregistered services', () => {
      // Act & Assert
      expect(() => container.resolve('NonExistentService')).toThrow(
        'Service not registered: NonExistentService'
      );
    });

    it('should throw error for duplicate registrations', () => {
      // Arrange
      container.register('TestService').asSingleton(() => ({}));

      // Act & Assert
      expect(() => container.register('TestService').asSingleton(() => ({}))).toThrow(
        'Handler already registered for command type: TestService'
      );
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve services with dependencies', () => {
      // Arrange
      class DependencyService {
        public name = 'dependency';
      }

      class MainService {
        constructor(public dependency: DependencyService) {}
      }

      container.register('DependencyService').asSingleton(() => new DependencyService());
      container.register('MainService').asSingleton((c) => new MainService(c.resolve('DependencyService')));

      // Act
      const mainService = container.resolve('MainService');

      // Assert
      expect(mainService).toBeDefined();
      expect(mainService.dependency).toBeDefined();
      expect(mainService.dependency.name).toBe('dependency');
    });

    it('should detect circular dependencies', () => {
      // Arrange
      container.register('ServiceA').asSingleton((c) => {
        return { serviceB: c.resolve('ServiceB') };
      });

      container.register('ServiceB').asSingleton((c) => {
        return { serviceA: c.resolve('ServiceA') };
      });

      // Act & Assert
      expect(() => container.resolve('ServiceA')).toThrow(
        'Circular dependency detected for token: ServiceA'
      );
    });

    it('should support optional resolution', () => {
      // Act
      const service = container.tryResolve('NonExistentService');

      // Assert
      expect(service).toBeNull();
    });
  });

  describe('Container Lifecycle', () => {
    it('should check if service is registered', () => {
      // Arrange
      container.register('TestService').asSingleton(() => ({}));

      // Act & Assert
      expect(container.isRegistered('TestService')).toBe(true);
      expect(container.isRegistered('NonExistentService')).toBe(false);
    });

    it('should get registered tokens', () => {
      // Arrange
      container.register('Service1').asSingleton(() => ({}));
      container.register('Service2').asSingleton(() => ({}));

      // Act
      const tokens = container.getRegisteredTokens();

      // Assert
      expect(tokens).toHaveLength(2);
      expect(tokens).toContain('Service1');
      expect(tokens).toContain('Service2');
    });

    it('should create child containers', () => {
      // Arrange
      container.register('ParentService').asSingleton(() => ({ type: 'parent' }));

      // Act
      const child = container.createChild();
      child.register('ChildService').asSingleton(() => ({ type: 'child' }));

      // Assert
      expect(child.isRegistered('ParentService')).toBe(true);
      expect(child.isRegistered('ChildService')).toBe(true);
      expect(container.isRegistered('ChildService')).toBe(false);
    });

    it('should provide health status', () => {
      // Arrange
      container.register('Service1').asSingleton(() => ({}));
      container.register('Service2').asTransient(() => ({}));
      container.resolve('Service1'); // Instantiate singleton

      // Act
      const health = container.getHealthStatus();

      // Assert
      expect(health.isDisposed).toBe(false);
      expect(health.totalServices).toBe(2);
      expect(health.singletonCount).toBe(1);
      expect(health.transientCount).toBe(1);
      expect(health.instantiatedSingletons).toBe(1);
    });

    it('should dispose properly', () => {
      // Arrange
      const disposableMock = {
        dispose: jest.fn()
      };
      
      container.registerInstance('DisposableService', disposableMock);
      container.resolve('DisposableService'); // Ensure it's resolved

      // Act
      container.dispose();

      // Assert
      expect(disposableMock.dispose).toHaveBeenCalled();
      expect(() => container.resolve('DisposableService')).toThrow(
        'Cannot resolve services from a disposed container'
      );
    });
  });

  describe('Service Registration Helper', () => {
    it('should register services using helper', () => {
      // Arrange
      class TestService {
        public value = 'test';
      }

      const registration = createServiceRegistration(container, {
        enableLogging: false
      });

      // Act
      registration.registerClass('TestService', TestService);
      const service = container.resolve('TestService');

      // Assert
      expect(service).toBeInstanceOf(TestService);
      expect(service.value).toBe('test');
    });

    it('should register factories using helper', () => {
      // Arrange
      const registration = createServiceRegistration(container, {
        enableLogging: false
      });

      // Act
      registration.registerFactory('TestFactory', () => ({ created: 'by-factory' }));
      const service = container.resolve('TestFactory');

      // Assert
      expect(service.created).toBe('by-factory');
    });

    it('should validate registrations', () => {
      // Arrange
      const registration = createServiceRegistration(container, {
        enableValidation: true
      });

      registration.registerFactory('ValidService', () => ({ valid: true }));
      registration.registerFactory('InvalidService', () => {
        throw new Error('Service initialization failed');
      });

      // Act
      const validation = registration.validateRegistrations();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].token).toBe('InvalidService');
    });
  });

  describe('Service Tokens', () => {
    it('should work with symbol tokens', () => {
      // Arrange
      const TOKEN = Symbol('TestService');
      container.register(TOKEN).asSingleton(() => ({ type: 'symbol-service' }));

      // Act
      const service = container.resolve(TOKEN);

      // Assert
      expect(service.type).toBe('symbol-service');
    });

    it('should work with predefined service tokens', () => {
      // Arrange
      const mockActivityService = { type: 'activity-service' };
      
      // Act
      container.registerInstance(SERVICE_TOKENS.ACTIVITY_SERVICE, mockActivityService);
      const service = container.resolve(SERVICE_TOKENS.ACTIVITY_SERVICE);

      // Assert
      expect(service).toBe(mockActivityService);
    });
  });
});