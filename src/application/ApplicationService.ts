/**
 * Application Service
 * Unified service interface combining commands and queries with cross-domain coordination
 */

import { CommandBus, commandBus } from './CommandBus';
import { QueryBus, queryBus } from './QueryBus';
import { ICommand, CommandResult } from './commands/base/ICommand';
import { IQuery, QueryResult } from './queries/base/IQuery';

// Activity Commands and Queries
import { ActivityCommand } from './commands/activity/ActivityCommands';
import { ActivityQuery } from './queries/activity/ActivityQueries';
import { activityCommandHandlers } from './commands/activity/ActivityCommandHandlers';
import { activityQueryHandlers } from './queries/activity/ActivityQueryHandlers';

// Incident Commands and Queries
import { IncidentCommand } from './commands/incident/IncidentCommands';
import { IncidentQuery } from './queries/incident/IncidentQueries';

// Domain dependencies
import { IActivityRepository } from '../domains/activities/repositories/IActivityRepository';
import { CreateActivityUseCase } from '../domains/activities/use-cases/CreateActivity';
import { FilterActivitiesUseCase } from '../domains/activities/use-cases/FilterActivities';
import { ClusterActivitiesUseCase } from '../domains/activities/use-cases/ClusterActivities';

export interface ApplicationServiceConfig {
  activityRepository: IActivityRepository;
  // Add other repositories as needed
}

export class ApplicationService {
  private commandBus: CommandBus;
  private queryBus: QueryBus;
  private isInitialized = false;

  constructor(private config: ApplicationServiceConfig) {
    this.commandBus = commandBus;
    this.queryBus = queryBus;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('ApplicationService is already initialized');
      return;
    }

    try {
      await this.registerCommandHandlers();
      await this.registerQueryHandlers();
      
      this.isInitialized = true;
      console.log('✅ ApplicationService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ApplicationService:', error);
      throw error;
    }
  }

  private async registerCommandHandlers(): Promise<void> {
    // Create use case instances
    const createActivityUseCase = new CreateActivityUseCase(this.config.activityRepository);
    const filterActivitiesUseCase = new FilterActivitiesUseCase(this.config.activityRepository);
    const clusterActivitiesUseCase = new ClusterActivitiesUseCase(this.config.activityRepository);

    // Register Activity Command Handlers
    this.commandBus.register(
      'CreateActivity',
      new activityCommandHandlers.CreateActivityCommandHandler(
        createActivityUseCase,
        this.config.activityRepository
      )
    );

    this.commandBus.register(
      'UpdateActivity',
      new activityCommandHandlers.UpdateActivityCommandHandler(this.config.activityRepository)
    );

    this.commandBus.register(
      'AssignActivity',
      new activityCommandHandlers.AssignActivityCommandHandler(this.config.activityRepository)
    );

    this.commandBus.register(
      'ArchiveActivity',
      new activityCommandHandlers.ArchiveActivityCommandHandler(this.config.activityRepository)
    );

    this.commandBus.register(
      'BulkUpdateStatus',
      new activityCommandHandlers.BulkUpdateStatusCommandHandler(this.config.activityRepository)
    );

    this.commandBus.register(
      'BatchCreateActivities',
      new activityCommandHandlers.BatchCreateActivitiesCommandHandler(createActivityUseCase)
    );

    console.log('✅ Command handlers registered');
  }

  private async registerQueryHandlers(): Promise<void> {
    // Create use case instances
    const filterActivitiesUseCase = new FilterActivitiesUseCase(this.config.activityRepository);
    const clusterActivitiesUseCase = new ClusterActivitiesUseCase(this.config.activityRepository);

    // Register Activity Query Handlers
    this.queryBus.register(
      'GetActivities',
      new activityQueryHandlers.GetActivitiesQueryHandler(
        filterActivitiesUseCase,
        this.config.activityRepository
      )
    );

    this.queryBus.register(
      'GetActivityById',
      new activityQueryHandlers.GetActivityByIdQueryHandler(this.config.activityRepository)
    );

    this.queryBus.register(
      'SearchActivities',
      new activityQueryHandlers.SearchActivitiesQueryHandler(this.config.activityRepository)
    );

    this.queryBus.register(
      'GetActivityStats',
      new activityQueryHandlers.GetActivityStatsQueryHandler(this.config.activityRepository)
    );

    this.queryBus.register(
      'GetActivitiesRequiringAttention',
      new activityQueryHandlers.GetActivitiesRequiringAttentionQueryHandler(this.config.activityRepository)
    );

    console.log('✅ Query handlers registered');
  }

  // ===== COMMAND EXECUTION =====

  async executeCommand<T extends ICommand, R = any>(command: T): Promise<CommandResult<R>> {
    this.ensureInitialized();
    
    try {
      const result = await this.commandBus.execute<T, R>(command);
      
      // Post-command processing
      if (result.success) {
        await this.handleCommandSuccess(command, result);
      } else {
        await this.handleCommandFailure(command, result);
      }
      
      return result;
    } catch (error) {
      console.error('Command execution failed:', error);
      throw error;
    }
  }

  // ===== QUERY EXECUTION =====

  async executeQuery<T extends IQuery, R = any>(query: T): Promise<QueryResult<R>> {
    this.ensureInitialized();
    
    try {
      const result = await this.queryBus.execute<T, R>(query);
      
      // Post-query processing
      if (result.success) {
        await this.handleQuerySuccess(query, result);
      }
      
      return result;
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  // ===== ACTIVITY DOMAIN HELPERS =====

  async createActivity(data: {
    activityType: string;
    title: string;
    location: string;
    priority: string;
    description?: string;
    building?: string;
    zone?: string;
    assignedTo?: string;
    confidence?: number;
    externalData?: any;
  }, userId: string) {
    const command: ActivityCommand = {
      type: 'CreateActivity',
      userId,
      timestamp: new Date(),
      data: {
        activityType: data.activityType as any,
        title: data.title,
        location: data.location,
        priority: data.priority as any,
        description: data.description,
        building: data.building,
        zone: data.zone,
        assignedTo: data.assignedTo,
        confidence: data.confidence,
        externalData: data.externalData
      }
    };

    return this.executeCommand(command);
  }

  async getActivities(filters?: any, pagination?: any, sorting?: any, userId?: string) {
    const query: ActivityQuery = {
      type: 'GetActivities',
      userId,
      timestamp: new Date(),
      filters,
      pagination,
      sorting
    };

    return this.executeQuery(query);
  }

  async getActivityById(activityId: string, options?: {
    includeRelated?: boolean;
    includeTimeline?: boolean;
    includeEvidence?: boolean;
  }, userId?: string) {
    const query: ActivityQuery = {
      type: 'GetActivityById',
      userId,
      timestamp: new Date(),
      activityId,
      ...options
    };

    return this.executeQuery(query);
  }

  async searchActivities(searchText: string, filters?: any, pagination?: any, userId?: string) {
    const query: ActivityQuery = {
      type: 'SearchActivities',
      userId,
      timestamp: new Date(),
      searchText,
      filters,
      pagination
    };

    return this.executeQuery(query);
  }

  async updateActivity(activityId: string, updates: any, reason?: string, userId: string) {
    const command: ActivityCommand = {
      type: 'UpdateActivity',
      aggregateId: activityId,
      userId,
      timestamp: new Date(),
      data: {
        updates,
        reason
      }
    };

    return this.executeCommand(command);
  }

  async assignActivity(activityId: string, assignedTo: string, assignedBy: string, options?: {
    reason?: string;
    notifyAssignee?: boolean;
  }) {
    const command: ActivityCommand = {
      type: 'AssignActivity',
      aggregateId: activityId,
      userId: assignedBy,
      timestamp: new Date(),
      data: {
        assignedTo,
        assignedBy,
        ...options
      }
    };

    return this.executeCommand(command);
  }

  async archiveActivity(activityId: string, reason: string, archivedBy: string, permanent = false) {
    const command: ActivityCommand = {
      type: 'ArchiveActivity',
      aggregateId: activityId,
      userId: archivedBy,
      timestamp: new Date(),
      data: {
        reason,
        archivedBy,
        permanent
      }
    };

    return this.executeCommand(command);
  }

  // ===== TRANSACTION MANAGEMENT =====

  async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
    // In a real implementation, this would handle database transactions
    // For now, just execute the operation
    return await operation();
  }

  // ===== CROSS-DOMAIN COORDINATION =====

  async coordinateIncidentCreation(activityId: string, incidentData: any, userId: string) {
    // This would coordinate between activity and incident domains
    // For now, return a placeholder
    return {
      success: true,
      data: {
        incidentId: `INC-${Date.now()}`,
        linkedActivityId: activityId
      }
    };
  }

  // ===== EVENT PUBLISHING =====

  async publishDomainEvent(event: any) {
    // This would integrate with the event bus for domain events
    console.log('Publishing domain event:', event);
  }

  // ===== MONITORING AND DIAGNOSTICS =====

  getPerformanceMetrics() {
    return {
      commands: this.commandBus.getPerformanceMetrics(),
      queries: this.queryBus.getPerformanceMetrics(),
      cacheStats: this.queryBus.getCacheStats()
    };
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: Date;
  }> {
    const checks = {
      initialized: this.isInitialized,
      commandBus: !!this.commandBus,
      queryBus: !!this.queryBus,
      activityRepository: !!this.config.activityRepository
    };

    const allHealthy = Object.values(checks).every(check => check);
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date()
    };
  }

  // ===== PRIVATE METHODS =====

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('ApplicationService must be initialized before use');
    }
  }

  private async handleCommandSuccess<T extends ICommand>(command: T, result: CommandResult): Promise<void> {
    // Handle successful command execution
    console.log(`✅ Command ${command.type} executed successfully`);
    
    // Invalidate relevant query caches
    if (command.type.includes('Activity')) {
      await this.queryBus.clearCache('activities:*');
      await this.queryBus.clearCache('stats:*');
    }
  }

  private async handleCommandFailure<T extends ICommand>(command: T, result: CommandResult): Promise<void> {
    // Handle failed command execution
    console.error(`❌ Command ${command.type} failed:`, result.error);
    
    // Could implement retry logic, alerting, etc.
  }

  private async handleQuerySuccess<T extends IQuery>(query: T, result: QueryResult): Promise<void> {
    // Handle successful query execution
    if (result.metadata && !result.metadata.cacheHit) {
      console.log(`✅ Query ${query.type} executed successfully (${result.metadata.executionTime}ms)`);
    }
  }
}

// ===== FACTORY FUNCTION =====

export function createApplicationService(config: ApplicationServiceConfig): ApplicationService {
  return new ApplicationService(config);
}

// ===== SINGLETON INSTANCE =====

let applicationServiceInstance: ApplicationService | null = null;

export function getApplicationService(): ApplicationService {
  if (!applicationServiceInstance) {
    throw new Error('ApplicationService not initialized. Call initializeApplicationService first.');
  }
  return applicationServiceInstance;
}

export async function initializeApplicationService(config: ApplicationServiceConfig): Promise<ApplicationService> {
  if (applicationServiceInstance) {
    console.warn('ApplicationService already initialized');
    return applicationServiceInstance;
  }

  applicationServiceInstance = createApplicationService(config);
  await applicationServiceInstance.initialize();
  
  return applicationServiceInstance;
}