/**
 * Command Bus Implementation
 * Central dispatcher for all commands with middleware support
 */

import { ICommand, ICommandHandler, ICommandBus, CommandResult, CommandMiddleware } from './commands/base/ICommand';

export class CommandBus implements ICommandBus {
  private handlers = new Map<string, ICommandHandler<any>>();
  public middleware: CommandMiddleware[] = [];
  private performanceMetrics = new Map<string, CommandPerformanceMetric>();
  private container?: any; // DIContainer reference for middleware dependencies

  constructor(container?: any) {
    this.container = container;
    this.initializeMiddleware();
  }

  private initializeMiddleware(): void {
    // Create middleware instances - they can use container if available
    this.middleware = [
      new ValidationMiddleware(this.container),
      new LoggingMiddleware(this.container),
      new AuditMiddleware(this.container),
      new PerformanceMiddleware(this.container),
      new ErrorHandlingMiddleware(this.container),
    ].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Set the DI container for dependency resolution in middleware
   */
  setContainer(container: any): void {
    this.container = container;
    this.initializeMiddleware(); // Reinitialize middleware with container
  }

  register<T extends ICommand>(commandType: string, handler: ICommandHandler<T>): void {
    if (this.handlers.has(commandType)) {
      throw new Error(`Handler already registered for command type: ${commandType}`);
    }
    
    this.handlers.set(commandType, handler);
    console.log(`✅ Registered command handler for: ${commandType}`);
  }

  async execute<T extends ICommand, R = any>(command: T): Promise<CommandResult<R>> {
    const startTime = Date.now();
    const commandId = this.generateCommandId();
    
    // Enhance command with metadata
    const enhancedCommand = {
      ...command,
      correlationId: command.correlationId || commandId,
      timestamp: command.timestamp || new Date(),
      metadata: {
        ...command.metadata,
        commandId,
        busVersion: '1.0.0',
      }
    };

    try {
      // Find handler
      const handler = this.handlers.get(command.type);
      if (!handler) {
        return {
          success: false,
          error: `No handler registered for command type: ${command.type}`,
          metadata: {
            executionTime: Date.now() - startTime,
            commandId,
            timestamp: new Date(),
          }
        };
      }

      // Execute middleware pipeline
      const result = await this.executeMiddlewarePipeline(enhancedCommand, handler);
      
      // Update performance metrics
      this.updatePerformanceMetrics(command.type, Date.now() - startTime, result.success);
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime: Date.now() - startTime,
          commandId,
          timestamp: new Date(),
        }
      };

    } catch (error) {
      const errorResult: CommandResult<R> = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime: Date.now() - startTime,
          commandId,
          timestamp: new Date(),
        }
      };

      // Update performance metrics for errors
      this.updatePerformanceMetrics(command.type, Date.now() - startTime, false);
      
      return errorResult;
    }
  }

  private async executeMiddlewarePipeline<T extends ICommand>(
    command: T,
    handler: ICommandHandler<T>
  ): Promise<CommandResult> {
    let index = 0;

    const next = async (cmd: T): Promise<CommandResult> => {
      if (index >= this.middleware.length) {
        // All middleware executed, call the actual handler
        return await handler.handle(cmd);
      }

      const middleware = this.middleware[index++];
      return await middleware.execute(cmd, next);
    };

    return await next(command);
  }

  private generateCommandId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `cmd_${timestamp}_${randomPart}`;
  }

  private updatePerformanceMetrics(commandType: string, executionTime: number, success: boolean): void {
    const existing = this.performanceMetrics.get(commandType) || {
      commandType,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      minExecutionTime: Infinity,
      maxExecutionTime: 0,
      lastExecution: new Date(),
    };

    existing.totalExecutions++;
    existing.totalExecutionTime += executionTime;
    existing.averageExecutionTime = existing.totalExecutionTime / existing.totalExecutions;
    existing.minExecutionTime = Math.min(existing.minExecutionTime, executionTime);
    existing.maxExecutionTime = Math.max(existing.maxExecutionTime, executionTime);
    existing.lastExecution = new Date();

    if (success) {
      existing.successfulExecutions++;
    } else {
      existing.failedExecutions++;
    }

    this.performanceMetrics.set(commandType, existing);
  }

  // Public methods for monitoring and diagnostics
  getPerformanceMetrics(): CommandPerformanceMetric[] {
    return Array.from(this.performanceMetrics.values());
  }

  getCommandMetrics(commandType: string): CommandPerformanceMetric | undefined {
    return this.performanceMetrics.get(commandType);
  }

  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
  }

  addMiddleware(middleware: CommandMiddleware): void {
    this.middleware.push(middleware);
    this.middleware.sort((a, b) => a.priority - b.priority);
  }

  removeMiddleware(middlewareName: string): void {
    this.middleware = this.middleware.filter(m => m.name !== middlewareName);
  }
}

// ===== MIDDLEWARE IMPLEMENTATIONS =====

class ValidationMiddleware implements CommandMiddleware {
  readonly name = 'ValidationMiddleware';
  readonly priority = 10; // High priority - run early

  constructor(private container?: any) {}

  async execute<T extends ICommand>(
    command: T,
    next: (command: T) => Promise<CommandResult>
  ): Promise<CommandResult> {
    // Basic command validation
    if (!command.type) {
      return {
        success: false,
        error: 'Command type is required',
        validationErrors: ['Command type is required']
      };
    }

    if (!command.userId) {
      return {
        success: false,
        error: 'User ID is required',
        validationErrors: ['User ID is required']
      };
    }

    return await next(command);
  }
}

class LoggingMiddleware implements CommandMiddleware {
  readonly name = 'LoggingMiddleware';
  readonly priority = 20;

  constructor(private container?: any) {}

  async execute<T extends ICommand>(
    command: T,
    next: (command: T) => Promise<CommandResult>
  ): Promise<CommandResult> {
    const startTime = Date.now();
    
    console.log(`🔄 Executing command: ${command.type}`, {
      commandId: command.metadata?.commandId,
      userId: command.userId,
      timestamp: command.timestamp,
    });

    try {
      const result = await next(command);
      const executionTime = Date.now() - startTime;
      
      if (result.success) {
        console.log(`✅ Command executed successfully: ${command.type} (${executionTime}ms)`);
      } else {
        console.error(`❌ Command failed: ${command.type} (${executionTime}ms)`, {
          error: result.error,
          validationErrors: result.validationErrors,
        });
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`💥 Command threw exception: ${command.type} (${executionTime}ms)`, error);
      throw error;
    }
  }
}

class AuditMiddleware implements CommandMiddleware {
  readonly name = 'AuditMiddleware';
  readonly priority = 30;

  constructor(private container?: any) {}

  async execute<T extends ICommand>(
    command: T,
    next: (command: T) => Promise<CommandResult>
  ): Promise<CommandResult> {
    // Record command execution for audit trail
    const auditEntry = {
      commandType: command.type,
      userId: command.userId,
      timestamp: command.timestamp,
      correlationId: command.correlationId,
      aggregateId: command.aggregateId,
      metadata: command.metadata,
    };

    // In a real implementation, this would persist to an audit store
    console.log('📝 Audit entry:', auditEntry);

    const result = await next(command);

    // Record the result
    const auditResult = {
      ...auditEntry,
      success: result.success,
      error: result.error,
      executionTime: result.metadata?.executionTime,
    };

    console.log('📝 Audit result:', auditResult);

    return result;
  }
}

class PerformanceMiddleware implements CommandMiddleware {
  readonly name = 'PerformanceMiddleware';
  readonly priority = 5; // Very high priority - run first

  constructor(private container?: any) {}

  async execute<T extends ICommand>(
    command: T,
    next: (command: T) => Promise<CommandResult>
  ): Promise<CommandResult> {
    const startTime = Date.now();
    const result = await next(command);
    const executionTime = Date.now() - startTime;

    // Log slow commands
    if (executionTime > 1000) { // > 1 second
      console.warn(`🐌 Slow command detected: ${command.type} (${executionTime}ms)`);
    }

    // Add performance data to result metadata
    return {
      ...result,
      metadata: {
        ...result.metadata,
        executionTime,
        performanceFlags: {
          slow: executionTime > 1000,
          verySlow: executionTime > 5000,
        }
      }
    };
  }
}

class ErrorHandlingMiddleware implements CommandMiddleware {
  readonly name = 'ErrorHandlingMiddleware';
  readonly priority = 100; // Low priority - run last

  constructor(private container?: any) {}

  async execute<T extends ICommand>(
    command: T,
    next: (command: T) => Promise<CommandResult>
  ): Promise<CommandResult> {
    try {
      return await next(command);
    } catch (error) {
      console.error(`💥 Unhandled error in command ${command.type}:`, error);

      // Convert uncaught exceptions to CommandResult
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unhandled error occurred',
        metadata: {
          executionTime: 0,
          commandId: command.metadata?.commandId || 'unknown',
          timestamp: new Date(),
          errorType: 'unhandled_exception',
          originalError: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : error,
        }
      };
    }
  }
}

// ===== SUPPORTING TYPES =====

interface CommandPerformanceMetric {
  commandType: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  lastExecution: Date;
}

// Singleton instance
export const commandBus = new CommandBus();