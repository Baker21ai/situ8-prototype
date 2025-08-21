/**
 * Structured Debug Logging Utility
 * Provides consistent, searchable console output for faster debugging
 */

interface DebugData {
  [key: string]: any;
}

interface DebugConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  includeTimestamp: boolean;
  includeStackTrace: boolean;
}

// Configuration (can be overridden via localStorage)
const getConfig = (): DebugConfig => {
  try {
    const stored = localStorage.getItem('situ8-debug-config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  
  return {
    enabled: import.meta.env.DEV,
    logLevel: 'debug',
    includeTimestamp: true,
    includeStackTrace: false
  };
};

const config = getConfig();

// Helper to format timestamp
const timestamp = () => {
  if (!config.includeTimestamp) return '';
  return new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit'
  }) + '.' + String(Date.now() % 1000).padStart(3, '0');
};

// Helper to get caller location
const getCallerLocation = (): string => {
  try {
    const stack = new Error().stack;
    if (!stack) return '';
    
    const lines = stack.split('\n');
    // Skip first 3 lines (Error, getCallerLocation, and the debug function)
    const callerLine = lines[3] || '';
    const match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    
    if (match) {
      const [, functionName, file, line] = match;
      const fileName = file.split('/').pop();
      return `${fileName}:${line}`;
    }
    
    return '';
  } catch {
    return '';
  }
};

/**
 * Structured debug logging for consistent output
 */
export const debug = {
  /**
   * Log service-related actions
   * @example debug.service('AuthService', 'login', { email: 'user@example.com' })
   */
  service: (service: string, action: string, data?: DebugData) => {
    if (!config.enabled) return;
    const location = config.includeStackTrace ? getCallerLocation() : '';
    console.log(
      `🔧 [${service}] ${timestamp()} ${action}`,
      location ? `(${location})` : '',
      data || ''
    );
  },

  /**
   * Log errors with context
   * @example debug.error('LoginForm', new Error('Auth failed'), { userId: 123 })
   */
  error: (location: string, error: Error | string, context?: DebugData) => {
    if (!config.enabled) return;
    const errorObj = error instanceof Error ? error : new Error(error);
    const caller = config.includeStackTrace ? getCallerLocation() : '';
    
    console.error(
      `❌ [${location}] ${timestamp()}`,
      caller ? `(${caller})` : '',
      '\n',
      errorObj.message,
      '\n',
      { 
        error: errorObj, 
        context,
        stack: errorObj.stack 
      }
    );
  },

  /**
   * Log state changes
   * @example debug.state('ActivityStore', 'addActivity', oldState, newState)
   */
  state: (store: string, action: string, before?: any, after?: any) => {
    if (!config.enabled || config.logLevel === 'error') return;
    
    console.log(
      `📊 [${store}] ${timestamp()} ${action}`,
      {
        before: before ? '...' : undefined,
        after: after ? '...' : undefined,
        diff: before && after ? { 
          before: typeof before === 'object' ? Object.keys(before).length : before,
          after: typeof after === 'object' ? Object.keys(after).length : after
        } : undefined
      }
    );
    
    // Log full objects in collapsed groups
    if (before || after) {
      console.groupCollapsed(`  └─ State details`);
      if (before) console.log('Before:', before);
      if (after) console.log('After:', after);
      console.groupEnd();
    }
  },

  /**
   * Log API calls and responses
   * @example debug.api('/api/activities', 'GET', 200, { count: 10 })
   */
  api: (endpoint: string, method: string, status: number, data?: DebugData) => {
    if (!config.enabled || config.logLevel === 'error') return;
    
    const statusEmoji = status >= 200 && status < 300 ? '✅' : 
                       status >= 400 && status < 500 ? '⚠️' : 
                       status >= 500 ? '❌' : '🔄';
    
    console.log(
      `🌐 [API] ${timestamp()} ${method} ${endpoint} → ${statusEmoji} ${status}`,
      data || ''
    );
  },

  /**
   * Log WebSocket events
   * @example debug.ws('connect', { url: 'wss://...' })
   */
  ws: (event: string, data?: DebugData) => {
    if (!config.enabled || config.logLevel === 'error') return;
    
    const eventEmoji = {
      connect: '🔌',
      disconnect: '🔌❌',
      message: '📨',
      error: '⚡',
      reconnect: '🔄'
    }[event] || '📡';
    
    console.log(
      `${eventEmoji} [WebSocket] ${timestamp()} ${event}`,
      data || ''
    );
  },

  /**
   * Log performance metrics
   * @example debug.perf('ActivityLoad', 1234, { count: 100 })
   */
  perf: (operation: string, durationMs: number, details?: DebugData) => {
    if (!config.enabled || config.logLevel !== 'debug') return;
    
    const emoji = durationMs < 100 ? '🚀' : 
                  durationMs < 500 ? '⚡' : 
                  durationMs < 1000 ? '🐌' : '🐢';
    
    console.log(
      `${emoji} [Performance] ${timestamp()} ${operation}: ${durationMs}ms`,
      details || ''
    );
  },

  /**
   * Log user actions for breadcrumbs
   * @example debug.action('click', 'Create Activity Button')
   */
  action: (type: string, target: string, data?: DebugData) => {
    if (!config.enabled) return;
    
    console.log(
      `👆 [Action] ${timestamp()} ${type} → ${target}`,
      data || ''
    );
  },

  /**
   * Log warnings
   * @example debug.warn('AuthService', 'Token expiring soon', { expiresIn: '5m' })
   */
  warn: (location: string, message: string, data?: DebugData) => {
    if (!config.enabled || config.logLevel === 'error') return;
    
    console.warn(
      `⚠️ [${location}] ${timestamp()} ${message}`,
      data || ''
    );
  },

  /**
   * Log info messages
   * @example debug.info('App', 'Initialized successfully', { version: '1.0.0' })
   */
  info: (location: string, message: string, data?: DebugData) => {
    if (!config.enabled || ['warn', 'error'].includes(config.logLevel)) return;
    
    console.info(
      `ℹ️ [${location}] ${timestamp()} ${message}`,
      data || ''
    );
  },

  /**
   * Create a group of related logs
   * @example 
   * debug.group('Activity Creation');
   * debug.service('ActivityService', 'validate', data);
   * debug.api('/api/activities', 'POST', 201);
   * debug.groupEnd();
   */
  group: (label: string) => {
    if (!config.enabled) return;
    console.group(`📁 ${label} ${timestamp()}`);
  },

  groupEnd: () => {
    if (!config.enabled) return;
    console.groupEnd();
  },

  /**
   * Table display for structured data
   * @example debug.table('Active Users', users)
   */
  table: (label: string, data: any[] | Record<string, any>) => {
    if (!config.enabled || config.logLevel === 'error') return;
    
    console.log(`📋 [Table] ${timestamp()} ${label}`);
    console.table(data);
  },

  /**
   * Configure debug settings
   * @example debug.configure({ logLevel: 'warn', includeStackTrace: true })
   */
  configure: (newConfig: Partial<DebugConfig>) => {
    Object.assign(config, newConfig);
    localStorage.setItem('situ8-debug-config', JSON.stringify(config));
    console.log('🔧 Debug configuration updated:', config);
  },

  /**
   * Get current configuration
   */
  getConfig: () => ({ ...config }),

  /**
   * Clear console and reset
   */
  clear: () => {
    console.clear();
    console.log('🧹 Console cleared', timestamp());
  }
};

// Make it available globally in development
if (import.meta.env.DEV) {
  (window as any).debug = debug;
  console.log(
    '%c🔧 Situ8 Debug Tools Loaded',
    'background: #2563eb; color: white; padding: 4px 8px; border-radius: 4px;',
    '\nUse window.debug for structured logging'
  );
}