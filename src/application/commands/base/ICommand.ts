/**
 * Base Command Interface
 * Defines the contract for all commands in the CQRS architecture
 */

export interface ICommand {
  readonly type: string;
  readonly aggregateId?: string;
  readonly userId: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly metadata?: Record<string, any>;
}

/**
 * Command Result Interface
 * Standardized return type for all command operations
 */
export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: string[];
  metadata?: {
    executionTime: number;
    commandId: string;
    timestamp: Date;
  };
}

/**
 * Command Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Command Handler Interface
 * All command handlers must implement this interface
 */
export abstract class ICommandHandler<TCommand extends ICommand, TResult = any> {
  abstract handle(command: TCommand): Promise<CommandResult<TResult>>;
  
  protected validate(command: TCommand): ValidationResult {
    return { isValid: true, errors: [] };
  }
  
  protected async beforeHandle(command: TCommand): Promise<void> {
    // Override in derived classes for pre-processing
  }
  
  protected async afterHandle(command: TCommand, result: CommandResult<TResult>): Promise<void> {
    // Override in derived classes for post-processing
  }
}

/**
 * Command Bus Interface
 * Central dispatcher for all commands
 */
export interface ICommandBus {
  register<T extends ICommand>(commandType: string, handler: ICommandHandler<T>): void;
  execute<T extends ICommand, R = any>(command: T): Promise<CommandResult<R>>;
  middleware: CommandMiddleware[];
}

/**
 * Command Middleware Interface
 * For cross-cutting concerns like logging, caching, security
 */
export interface CommandMiddleware {
  readonly name: string;
  readonly priority: number;
  execute<T extends ICommand>(
    command: T, 
    next: (command: T) => Promise<CommandResult>
  ): Promise<CommandResult>;
}