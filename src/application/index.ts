/**
 * Application Layer Index
 * Central export for all CQRS components
 */

// ===== CORE INTERFACES =====
export * from './commands/base/ICommand';
export * from './queries/base/IQuery';

// ===== COMMAND BUS =====
export { CommandBus, commandBus } from './CommandBus';

// ===== QUERY BUS =====
export { QueryBus, queryBus } from './QueryBus';

// ===== APPLICATION SERVICE =====
export { 
  ApplicationService, 
  ApplicationServiceConfig,
  createApplicationService,
  getApplicationService,
  initializeApplicationService 
} from './ApplicationService';

// ===== ACTIVITY DOMAIN =====
export * from './commands/activity/ActivityCommands';
export * from './commands/activity/ActivityCommandHandlers';
export * from './queries/activity/ActivityQueries';
export * from './queries/activity/ActivityQueryHandlers';

// ===== INCIDENT DOMAIN =====
export * from './commands/incident/IncidentCommands';
export * from './queries/incident/IncidentQueries';

// ===== CONVENIENCE TYPES =====
export type Command = 
  | import('./commands/activity/ActivityCommands').ActivityCommand
  | import('./commands/incident/IncidentCommands').IncidentCommand;

export type Query = 
  | import('./queries/activity/ActivityQueries').ActivityQuery
  | import('./queries/incident/IncidentQueries').IncidentQuery;

// ===== UTILITY FUNCTIONS =====

/**
 * Create a command with standard metadata
 */
export function createCommand<T extends Omit<import('./commands/base/ICommand').ICommand, 'timestamp' | 'correlationId'>>(
  command: T
): T & { timestamp: Date; correlationId: string } {
  return {
    ...command,
    timestamp: new Date(),
    correlationId: generateCorrelationId(),
  };
}

/**
 * Create a query with standard metadata
 */
export function createQuery<T extends Omit<import('./queries/base/IQuery').IQuery, 'timestamp' | 'correlationId'>>(
  query: T
): T & { timestamp: Date; correlationId: string } {
  return {
    ...query,
    timestamp: new Date(),
    correlationId: generateCorrelationId(),
  };
}

function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `corr_${timestamp}_${randomPart}`;
}