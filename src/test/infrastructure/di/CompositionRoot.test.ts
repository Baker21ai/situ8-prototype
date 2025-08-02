/**
 * Composition Root Tests
 * Tests for the composition root and service wiring
 */

import { CompositionRoot, createDevelopmentContainer, createTestContainer } from '../../../infrastructure/di/CompositionRoot';
import { SERVICE_TOKENS } from '../../../infrastructure/di/DIContainer';
import { TestCompositionRoot, createActivityTestContainer } from '../../../infrastructure/di/TestCompositionRoot';

describe('CompositionRoot', () => {
  let compositionRoot: CompositionRoot;

  afterEach(async () => {
    if (compositionRoot) {
      await compositionRoot.dispose();
    }
  });

  describe('Development Configuration', () => {
    it('should configure development container successfully', async () => {
      // Arrange
      compositionRoot = createDevelopmentContainer();

      // Act
      await compositionRoot.configure();

      // Assert
      expect(compositionRoot.getHealthStatus().isInitialized).toBe(true);
      
      const container = compositionRoot.getContainer();
      expect(container.isRegistered(SERVICE_TOKENS.COMMAND_BUS)).toBe(true);
      expect(container.isRegistered(SERVICE_TOKENS.QUERY_BUS)).toBe(true);
      expect(container.isRegistered(SERVICE_TOKENS.ACTIVITY_REPOSITORY)).toBe(true);
    });

    it('should resolve registered services', async () => {
      // Arrange
      compositionRoot = createDevelopmentContainer();
      await compositionRoot.configure();

      // Act
      const commandBus = compositionRoot.getService(SERVICE_TOKENS.COMMAND_BUS);
      const queryBus = compositionRoot.getService(SERVICE_TOKENS.QUERY_BUS);
      const activityRepository = compositionRoot.getService(SERVICE_TOKENS.ACTIVITY_REPOSITORY);

      // Assert
      expect(commandBus).toBeDefined();
      expect(queryBus).toBeDefined();
      expect(activityRepository).toBeDefined();
      expect(typeof commandBus.execute).toBe('function');
      expect(typeof queryBus.execute).toBe('function');
      expect(typeof activityRepository.create).toBe('function');
    });

    it('should wire command and query handlers', async () => {
      // Arrange
      compositionRoot = createDevelopmentContainer();
      await compositionRoot.configure();

      // Wait for handlers to be wired
      await new Promise(resolve => setTimeout(resolve, 10));

      // Act
      const commandBus = compositionRoot.getService(SERVICE_TOKENS.COMMAND_BUS);
      const queryBus = compositionRoot.getService(SERVICE_TOKENS.QUERY_BUS);

      // Assert
      expect(commandBus).toBeDefined();
      expect(queryBus).toBeDefined();
      
      // Check that handlers are registered (by checking internal state)
      const commandBusInternal = commandBus as any;
      const queryBusInternal = queryBus as any;
      
      expect(commandBusInternal.handlers).toBeDefined();
      expect(queryBusInternal.handlers).toBeDefined();
    });
  });

  describe('Test Configuration', () => {
    it('should create test container without initialization', async () => {
      // Arrange & Act
      compositionRoot = createTestContainer();

      // Assert
      expect(compositionRoot.getHealthStatus().isInitialized).toBe(false);
    });

    it('should configure test container when requested', async () => {
      // Arrange
      compositionRoot = createTestContainer();

      // Act
      await compositionRoot.configure();

      // Assert
      expect(compositionRoot.getHealthStatus().isInitialized).toBe(true);
    });
  });

  describe('Service Lifecycle', () => {
    it('should dispose services properly', async () => {
      // Arrange
      compositionRoot = createDevelopmentContainer();
      await compositionRoot.configure();

      const container = compositionRoot.getContainer();
      const initialHealth = container.getHealthStatus();

      // Act
      await compositionRoot.dispose();

      // Assert
      expect(compositionRoot.getHealthStatus().isInitialized).toBe(false);
      expect(container.getHealthStatus().isDisposed).toBe(true);
    });

    it('should create child containers for testing', async () => {
      // Arrange
      compositionRoot = createDevelopmentContainer();
      await compositionRoot.configure();

      // Act
      const testContainer = compositionRoot.createTestContainer();

      // Assert
      expect(testContainer).toBeDefined();
      expect(testContainer.isRegistered(SERVICE_TOKENS.COMMAND_BUS)).toBe(true);
      expect(testContainer.isRegistered(SERVICE_TOKENS.QUERY_BUS)).toBe(true);
    });
  });

  describe('Health Monitoring', () => {
    it('should provide accurate health status', async () => {
      // Arrange
      compositionRoot = createDevelopmentContainer();

      // Act
      const beforeHealth = compositionRoot.getHealthStatus();
      await compositionRoot.configure();
      const afterHealth = compositionRoot.getHealthStatus();

      // Assert
      expect(beforeHealth.isInitialized).toBe(false);
      expect(afterHealth.isInitialized).toBe(true);
      expect(afterHealth.container.totalServices).toBeGreaterThan(0);
    });
  });
});

describe('TestCompositionRoot', () => {
  let testRoot: TestCompositionRoot;

  afterEach(async () => {
    if (testRoot) {
      await testRoot.dispose();
    }
  });

  describe('Mock Registration', () => {
    it('should register mock services', async () => {
      // Arrange
      const mockService = { getValue: jest.fn().mockReturnValue('mocked') };
      
      testRoot = new TestCompositionRoot();
      testRoot.addMock('TestService', mockService);

      // Act
      await testRoot.configure();
      const service = testRoot.getService('TestService');

      // Assert
      expect(service).toBe(mockService);
      expect(service.getValue()).toBe('mocked');
    });

    it('should create mock repositories', async () => {
      // Arrange
      testRoot = new TestCompositionRoot();
      const mockRepo = testRoot.createMockRepository();

      testRoot.addMock(SERVICE_TOKENS.ACTIVITY_REPOSITORY, mockRepo);

      // Act
      await testRoot.configure();
      const repository = testRoot.getService(SERVICE_TOKENS.ACTIVITY_REPOSITORY);

      // Assert
      expect(repository).toBe(mockRepo);
      expect(jest.isMockFunction(repository.create)).toBe(true);
      expect(jest.isMockFunction(repository.findById)).toBe(true);
    });

    it('should support partial mocks', async () => {
      // Arrange
      testRoot = new TestCompositionRoot();
      testRoot.addPartialMock(SERVICE_TOKENS.ACTIVITY_REPOSITORY, {
        findById: jest.fn().mockResolvedValue({ id: '1', title: 'Mock Activity' })
      });

      // Act
      await testRoot.configure();
      const repository = testRoot.getService(SERVICE_TOKENS.ACTIVITY_REPOSITORY);

      // Assert
      expect(repository.findById).toBeDefined();
      expect(jest.isMockFunction(repository.findById)).toBe(true);
      expect(jest.isMockFunction(repository.create)).toBe(true); // Should have default mock
      
      const result = await repository.findById('1');
      expect(result.title).toBe('Mock Activity');
    });
  });

  describe('Pre-configured Test Containers', () => {
    it('should create activity test container with mocks', async () => {
      // Arrange & Act
      testRoot = createActivityTestContainer();
      await testRoot.configure();

      // Assert
      const commandBus = testRoot.getService(SERVICE_TOKENS.COMMAND_BUS);
      const queryBus = testRoot.getService(SERVICE_TOKENS.QUERY_BUS);
      const repository = testRoot.getService(SERVICE_TOKENS.ACTIVITY_REPOSITORY);

      expect(jest.isMockFunction(commandBus.execute)).toBe(true);
      expect(jest.isMockFunction(queryBus.execute)).toBe(true);
      expect(jest.isMockFunction(repository.create)).toBe(true);
    });
  });

  describe('Mock Repository Functionality', () => {
    it('should provide working mock repository', async () => {
      // Arrange
      testRoot = new TestCompositionRoot();
      const mockRepo = testRoot.createMockRepository();
      
      // Act
      const entity = await mockRepo.create({ title: 'Test Entity' });
      const found = await mockRepo.findById(entity.id);
      const count = await mockRepo.count();

      // Assert
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(found).toEqual(entity);
      expect(count).toBe(1);
    });

    it('should support repository seeding', async () => {
      // Arrange
      testRoot = new TestCompositionRoot();
      const mockRepo = testRoot.createMockRepository();
      
      const seedData = [
        { id: '1', title: 'Entity 1' },
        { id: '2', title: 'Entity 2' }
      ];

      // Act
      mockRepo.seed(seedData);
      const entities = await mockRepo.findMany();

      // Assert
      expect(entities).toHaveLength(2);
      expect(entities[0].title).toBe('Entity 1');
      expect(entities[1].title).toBe('Entity 2');
    });

    it('should reset mock repository state', async () => {
      // Arrange
      testRoot = new TestCompositionRoot();
      const mockRepo = testRoot.createMockRepository();
      
      await mockRepo.create({ title: 'Test Entity' });

      // Act
      mockRepo.reset();
      const count = await mockRepo.count();

      // Assert
      expect(count).toBe(0);
      expect(mockRepo.create).toHaveBeenCalledTimes(0); // Mocks should be cleared
    });
  });
});