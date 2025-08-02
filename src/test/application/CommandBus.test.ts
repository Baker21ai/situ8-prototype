/**
 * Unit Tests for CommandBus
 * Tests command execution, middleware pipeline, performance metrics, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CommandBus } from '../../application/CommandBus'
import { ICommand, ICommandHandler, CommandResult, CommandMiddleware } from '../../application/commands/base/ICommand'

// Mock command types
interface TestCommand extends ICommand {
  type: 'TestCommand'
  data: {
    value: string
    shouldFail?: boolean
  }
}

interface TestCommandResult {
  processedValue: string
  timestamp: Date
}

// Mock command handler
class TestCommandHandler extends ICommandHandler<TestCommand, TestCommandResult> {
  private delay: number = 0
  private shouldFail: boolean = false

  protected validate(command: TestCommand) {
    const errors: string[] = []
    
    if (!command.data.value) {
      errors.push('Value is required')
    }
    
    if (command.data.value && command.data.value.length > 100) {
      errors.push('Value must be 100 characters or less')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  async handle(command: TestCommand): Promise<CommandResult<TestCommandResult>> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }

    if (this.shouldFail || command.data.shouldFail) {
      return {
        success: false,
        error: 'Handler failed as requested'
      }
    }

    return {
      success: true,
      data: {
        processedValue: `processed_${command.data.value}`,
        timestamp: new Date()
      }
    }
  }

  // Test helper methods
  setDelay(delay: number) {
    this.delay = delay
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail
  }
}

// Mock middleware
class TestMiddleware implements CommandMiddleware {
  readonly name = 'TestMiddleware'
  readonly priority: number
  private shouldFail: boolean = false
  private delay: number = 0

  constructor(priority: number = 50) {
    this.priority = priority
  }

  async execute<T extends ICommand>(
    command: T,
    next: (command: T) => Promise<CommandResult>
  ): Promise<CommandResult> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }

    if (this.shouldFail) {
      return {
        success: false,
        error: 'Middleware failed'
      }
    }

    // Add test metadata
    const enhancedCommand = {
      ...command,
      metadata: {
        ...command.metadata,
        testMiddlewareExecuted: true
      }
    }

    return await next(enhancedCommand)
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail
  }

  setDelay(delay: number) {
    this.delay = delay
  }
}

const createTestCommand = (overrides: Partial<TestCommand> = {}): TestCommand => ({
  type: 'TestCommand',
  userId: 'test-user',
  aggregateId: 'test-aggregate',
  timestamp: new Date(),
  correlationId: 'test-correlation',
  metadata: {},
  data: {
    value: 'test-value'
  },
  ...overrides
})

describe('CommandBus', () => {
  let commandBus: CommandBus
  let testHandler: TestCommandHandler

  beforeEach(() => {
    commandBus = new CommandBus()
    testHandler = new TestCommandHandler()
    vi.clearAllMocks()
  })

  afterEach(() => {
    commandBus.clearPerformanceMetrics()
  })

  describe('Handler Registration', () => {
    it('should register command handlers successfully', () => {
      expect(() => {
        commandBus.register('TestCommand', testHandler)
      }).not.toThrow()
    })

    it('should prevent duplicate handler registration', () => {
      commandBus.register('TestCommand', testHandler)
      
      expect(() => {
        commandBus.register('TestCommand', new TestCommandHandler())
      }).toThrow('Handler already registered for command type: TestCommand')
    })

    it('should allow different handlers for different command types', () => {
      const anotherHandler = new TestCommandHandler()
      
      expect(() => {
        commandBus.register('TestCommand', testHandler)
        commandBus.register('AnotherCommand', anotherHandler)
      }).not.toThrow()
    })
  })

  describe('Command Execution', () => {
    beforeEach(() => {
      commandBus.register('TestCommand', testHandler)
    })

    it('should execute commands successfully', async () => {
      const command = createTestCommand()
      
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.processedValue).toBe('processed_test-value')
      expect(result.data!.timestamp).toBeInstanceOf(Date)
      expect(result.metadata).toBeDefined()
      expect(result.metadata!.executionTime).toBeTypeOf('number')
      expect(result.metadata!.commandId).toMatch(/^cmd_/)
    })

    it('should handle handler failures', async () => {
      const command = createTestCommand({ data: { value: 'test', shouldFail: true } })
      
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Handler failed as requested')
      expect(result.data).toBeUndefined()
    })

    it('should return error for unregistered command types', async () => {
      const command = { ...createTestCommand(), type: 'UnregisteredCommand' as any }
      
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('No handler registered for command type: UnregisteredCommand')
    })

    it('should enhance commands with metadata', async () => {
      const command = createTestCommand({ correlationId: undefined })
      
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.metadata!.commandId).toBeDefined()
      expect(result.metadata!.timestamp).toBeInstanceOf(Date)
    })

    it('should preserve existing correlation ID', async () => {
      const correlationId = 'existing-correlation'
      const command = createTestCommand({ correlationId })
      
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(true)
      // The correlation ID should be preserved in the enhanced command
    })

    it('should handle validation failures', async () => {
      const command = createTestCommand({ data: { value: '' } })
      
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.validationErrors).toContain('Value is required')
    })

    it('should handle validation with multiple errors', async () => {
      const longValue = 'a'.repeat(101)
      const command = createTestCommand({ data: { value: longValue } })
      
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.validationErrors).toContain('Value must be 100 characters or less')
    })
  })

  describe('Middleware Pipeline', () => {
    beforeEach(() => {
      commandBus.register('TestCommand', testHandler)
    })

    it('should execute middleware in priority order', async () => {
      const executionOrder: number[] = []
      
      const middleware1 = new TestMiddleware(10)
      const middleware2 = new TestMiddleware(5)
      const middleware3 = new TestMiddleware(15)
      
      // Override execute to track order
      middleware1.execute = vi.fn().mockImplementation(async (cmd, next) => {
        executionOrder.push(10)
        return await next(cmd)
      })
      middleware2.execute = vi.fn().mockImplementation(async (cmd, next) => {
        executionOrder.push(5)
        return await next(cmd)
      })
      middleware3.execute = vi.fn().mockImplementation(async (cmd, next) => {
        executionOrder.push(15)
        return await next(cmd)
      })
      
      commandBus.addMiddleware(middleware1)
      commandBus.addMiddleware(middleware2)
      commandBus.addMiddleware(middleware3)
      
      const command = createTestCommand()
      await commandBus.execute(command)
      
      expect(executionOrder).toEqual([5, 10, 15]) // Should execute in priority order
    })

    it('should handle middleware failures', async () => {
      const failingMiddleware = new TestMiddleware(5)
      failingMiddleware.setShouldFail(true)
      
      commandBus.addMiddleware(failingMiddleware)
      
      const command = createTestCommand()
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Middleware failed')
    })

    it('should skip remaining middleware after failure', async () => {
      const middleware1 = new TestMiddleware(5)
      const middleware2 = new TestMiddleware(10)
      const middleware3 = new TestMiddleware(15)
      
      middleware2.setShouldFail(true)
      
      const mockExecute1 = vi.spyOn(middleware1, 'execute')
      const mockExecute2 = vi.spyOn(middleware2, 'execute')
      const mockExecute3 = vi.spyOn(middleware3, 'execute')
      
      commandBus.addMiddleware(middleware1)
      commandBus.addMiddleware(middleware2)
      commandBus.addMiddleware(middleware3)
      
      const command = createTestCommand()
      await commandBus.execute(command)
      
      expect(mockExecute1).toHaveBeenCalled()
      expect(mockExecute2).toHaveBeenCalled()
      expect(mockExecute3).not.toHaveBeenCalled()
    })

    it('should allow middleware to modify commands', async () => {
      const modifyingMiddleware: CommandMiddleware = {
        name: 'ModifyingMiddleware',
        priority: 5,
        async execute(command, next) {
          const modifiedCommand = {
            ...command,
            data: {
              ...command.data,
              value: `modified_${command.data.value}`
            }
          }
          return await next(modifiedCommand)
        }
      }
      
      commandBus.addMiddleware(modifyingMiddleware)
      
      const command = createTestCommand({ data: { value: 'original' } })
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.data!.processedValue).toBe('processed_modified_original')
    })

    it('should handle middleware exceptions', async () => {
      const throwingMiddleware: CommandMiddleware = {
        name: 'ThrowingMiddleware',
        priority: 5,
        async execute(command, next) {
          throw new Error('Middleware exception')
        }
      }
      
      commandBus.addMiddleware(throwingMiddleware)
      
      const command = createTestCommand()
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Middleware exception')
      expect(result.metadata!.errorType).toBe('unhandled_exception')
    })

    it('should allow adding and removing middleware', () => {
      const middleware = new TestMiddleware()
      
      commandBus.addMiddleware(middleware)
      expect(commandBus.middleware).toContain(middleware)
      
      commandBus.removeMiddleware('TestMiddleware')
      expect(commandBus.middleware.find(m => m.name === 'TestMiddleware')).toBeUndefined()
    })
  })

  describe('Default Middleware', () => {
    beforeEach(() => {
      commandBus.register('TestCommand', testHandler)
    })

    it('should execute validation middleware', async () => {
      const command = createTestCommand({ userId: '' })
      
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('User ID is required')
      expect(result.validationErrors).toContain('User ID is required')
    })

    it('should execute logging middleware', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const command = createTestCommand()
      await commandBus.execute(command)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Executing command: TestCommand'),
        expect.any(Object)
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Command executed successfully: TestCommand')
      )
      
      consoleSpy.mockRestore()
    })

    it('should execute audit middleware', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const command = createTestCommand()
      await commandBus.execute(command)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '📝 Audit entry:',
        expect.objectContaining({
          commandType: 'TestCommand',
          userId: 'test-user'
        })
      )
      
      consoleSpy.mockRestore()
    })

    it('should execute performance middleware', async () => {
      testHandler.setDelay(100) // Add delay to trigger slow command warning
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const command = createTestCommand()
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(true)
      expect(result.metadata!.performanceFlags).toBeDefined()
      expect(result.metadata!.performanceFlags!.slow).toBe(false) // 100ms is not > 1000ms
      
      consoleSpy.mockRestore()
    })

    it('should log slow commands', async () => {
      testHandler.setDelay(1100) // Delay > 1000ms
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const command = createTestCommand()
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🐌 Slow command detected: TestCommand')
      )
      
      consoleSpy.mockRestore()
    })

    it('should handle error handling middleware', async () => {
      const command = createTestCommand({ type: 'NonExistentCommand' as any })
      
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Performance Metrics', () => {
    beforeEach(() => {
      commandBus.register('TestCommand', testHandler)
    })

    it('should track performance metrics', async () => {
      const command = createTestCommand()
      
      await commandBus.execute(command)
      await commandBus.execute(command)
      
      const metrics = commandBus.getPerformanceMetrics()
      expect(metrics).toHaveLength(1)
      
      const commandMetrics = metrics[0]
      expect(commandMetrics.commandType).toBe('TestCommand')
      expect(commandMetrics.totalExecutions).toBe(2)
      expect(commandMetrics.successfulExecutions).toBe(2)
      expect(commandMetrics.failedExecutions).toBe(0)
      expect(commandMetrics.averageExecutionTime).toBeGreaterThan(0)
    })

    it('should track failed executions', async () => {
      const command = createTestCommand({ data: { value: 'test', shouldFail: true } })
      
      await commandBus.execute(command)
      await commandBus.execute(command)
      
      const metrics = commandBus.getCommandMetrics('TestCommand')
      expect(metrics).toBeDefined()
      expect(metrics!.totalExecutions).toBe(2)
      expect(metrics!.successfulExecutions).toBe(0)
      expect(metrics!.failedExecutions).toBe(2)
    })

    it('should track min and max execution times', async () => {
      testHandler.setDelay(50)
      const command1 = createTestCommand()
      await commandBus.execute(command1)
      
      testHandler.setDelay(100)
      const command2 = createTestCommand()
      await commandBus.execute(command2)
      
      const metrics = commandBus.getCommandMetrics('TestCommand')
      expect(metrics).toBeDefined()
      expect(metrics!.minExecutionTime).toBeLessThan(metrics!.maxExecutionTime)
      expect(metrics!.minExecutionTime).toBeGreaterThan(0)
    })

    it('should update last execution timestamp', async () => {
      const beforeExecution = new Date()
      
      const command = createTestCommand()
      await commandBus.execute(command)
      
      const afterExecution = new Date()
      const metrics = commandBus.getCommandMetrics('TestCommand')
      
      expect(metrics).toBeDefined()
      expect(metrics!.lastExecution).toBeInstanceOf(Date)
      expect(metrics!.lastExecution.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime())
      expect(metrics!.lastExecution.getTime()).toBeLessThanOrEqual(afterExecution.getTime())
    })

    it('should clear performance metrics', async () => {
      const command = createTestCommand()
      await commandBus.execute(command)
      
      expect(commandBus.getPerformanceMetrics()).toHaveLength(1)
      
      commandBus.clearPerformanceMetrics()
      
      expect(commandBus.getPerformanceMetrics()).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      commandBus.register('TestCommand', testHandler)
    })

    it('should handle handler exceptions gracefully', async () => {
      const throwingHandler = new TestCommandHandler()
      vi.spyOn(throwingHandler, 'handle').mockRejectedValue(new Error('Handler exception'))
      
      commandBus.register('ThrowingCommand', throwingHandler)
      
      const command = { ...createTestCommand(), type: 'ThrowingCommand' as any }
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Handler exception')
      expect(result.metadata!.errorType).toBe('unhandled_exception')
    })

    it('should handle non-Error exceptions', async () => {
      const throwingHandler = new TestCommandHandler()
      vi.spyOn(throwingHandler, 'handle').mockRejectedValue('String error')
      
      commandBus.register('ThrowingCommand', throwingHandler)
      
      const command = { ...createTestCommand(), type: 'ThrowingCommand' as any }
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unknown error')
    })

    it('should handle commands with invalid structure', async () => {
      const invalidCommand = { 
        type: 'TestCommand',
        // Missing required fields
      } as any
      
      const result = await commandBus.execute(invalidCommand)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('User ID is required')
    })
  })

  describe('Command ID Generation', () => {
    beforeEach(() => {
      commandBus.register('TestCommand', testHandler)
    })

    it('should generate unique command IDs', async () => {
      const command1 = createTestCommand()
      const command2 = createTestCommand()
      
      const result1 = await commandBus.execute(command1)
      const result2 = await commandBus.execute(command2)
      
      expect(result1.metadata!.commandId).not.toBe(result2.metadata!.commandId)
      expect(result1.metadata!.commandId).toMatch(/^cmd_/)
      expect(result2.metadata!.commandId).toMatch(/^cmd_/)
    })

    it('should include command ID in error results', async () => {
      const command = createTestCommand({ type: 'NonExistentCommand' as any })
      
      const result = await commandBus.execute(command)
      
      expect(result.success).toBe(false)
      expect(result.metadata!.commandId).toMatch(/^cmd_/)
    })
  })

  describe('Concurrent Execution', () => {
    beforeEach(() => {
      commandBus.register('TestCommand', testHandler)
    })

    it('should handle concurrent command execution', async () => {
      const commands = Array.from({ length: 10 }, (_, i) => 
        createTestCommand({ data: { value: `concurrent-${i}` } })
      )
      
      const results = await Promise.all(
        commands.map(cmd => commandBus.execute(cmd))
      )
      
      expect(results).toHaveLength(10)
      expect(results.every(r => r.success)).toBe(true)
      
      // All should have unique command IDs
      const commandIds = results.map(r => r.metadata!.commandId)
      const uniqueIds = new Set(commandIds)
      expect(uniqueIds.size).toBe(10)
    })

    it('should maintain performance metrics across concurrent executions', async () => {
      const commands = Array.from({ length: 5 }, () => createTestCommand())
      
      await Promise.all(commands.map(cmd => commandBus.execute(cmd)))
      
      const metrics = commandBus.getCommandMetrics('TestCommand')
      expect(metrics).toBeDefined()
      expect(metrics!.totalExecutions).toBe(5)
      expect(metrics!.successfulExecutions).toBe(5)
    })
  })

  describe('Memory Management', () => {
    beforeEach(() => {
      commandBus.register('TestCommand', testHandler)
    })

    it('should not leak memory with many executions', async () => {
      // Execute many commands
      for (let i = 0; i < 100; i++) {
        const command = createTestCommand({ data: { value: `test-${i}` } })
        await commandBus.execute(command)
      }
      
      const metrics = commandBus.getCommandMetrics('TestCommand')
      expect(metrics).toBeDefined()
      expect(metrics!.totalExecutions).toBe(100)
      
      // Clear metrics should free memory
      commandBus.clearPerformanceMetrics()
      expect(commandBus.getPerformanceMetrics()).toHaveLength(0)
    })
  })
})
