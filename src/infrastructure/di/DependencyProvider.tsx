/**
 * React Dependency Injection Provider
 * Provides DI container to React components with hooks for service resolution
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DIContainer, ServiceToken } from './DIContainer';
import { CompositionRoot } from './CompositionRoot';

// Context for the DI container
const DIContext = createContext<DIContainer | null>(null);

// Context for the composition root
const CompositionRootContext = createContext<CompositionRoot | null>(null);

export interface DependencyProviderProps {
  children: ReactNode;
  compositionRoot: CompositionRoot;
  enableDevTools?: boolean;
}

/**
 * Provides dependency injection container to the React component tree
 */
export function DependencyProvider({ 
  children, 
  compositionRoot, 
  enableDevTools = false 
}: DependencyProviderProps) {
  const [container, setContainer] = useState<DIContainer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeContainer = async () => {
      try {
        await compositionRoot.configure();
        
        if (mounted) {
          const containerInstance = compositionRoot.getContainer();
          setContainer(containerInstance);
          setIsInitialized(true);

          // Enable dev tools in development
          if (enableDevTools && typeof window !== 'undefined') {
            (window as any).__DI_CONTAINER__ = containerInstance;
            (window as any).__COMPOSITION_ROOT__ = compositionRoot;
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize DI container'));
        }
      }
    };

    initializeContainer();

    return () => {
      mounted = false;
      if (container) {
        compositionRoot.dispose().catch(console.error);
      }
    };
  }, [compositionRoot, enableDevTools, container]);

  if (error) {
    return <DIErrorBoundary error={error} />;
  }

  if (!isInitialized || !container) {
    return <DILoadingFallback />;
  }

  return (
    <CompositionRootContext.Provider value={compositionRoot}>
      <DIContext.Provider value={container}>
        {children}
      </DIContext.Provider>
    </CompositionRootContext.Provider>
  );
}

/**
 * Hook to access the DI container
 */
export function useDIContainer(): DIContainer {
  const container = useContext(DIContext);
  if (!container) {
    throw new Error('useDIContainer must be used within a DependencyProvider');
  }
  return container;
}

/**
 * Hook to access the composition root
 */
export function useCompositionRoot(): CompositionRoot {
  const compositionRoot = useContext(CompositionRootContext);
  if (!compositionRoot) {
    throw new Error('useCompositionRoot must be used within a DependencyProvider');
  }
  return compositionRoot;
}

/**
 * Hook to resolve a service from the DI container
 */
export function useService<T>(token: ServiceToken<T>): T {
  const container = useDIContainer();
  
  // Use useMemo to avoid re-resolving the service on every render
  // This is safe because services are typically singletons
  const [service] = useState(() => container.resolve(token));
  
  return service;
}

/**
 * Hook to optionally resolve a service from the DI container
 */
export function useOptionalService<T>(token: ServiceToken<T>): T | null {
  const container = useDIContainer();
  
  const [service] = useState(() => container.tryResolve(token));
  
  return service;
}

/**
 * Hook to resolve multiple services at once
 */
export function useServices<T extends Record<string, ServiceToken>>(
  tokens: T
): { [K in keyof T]: T[K] extends ServiceToken<infer U> ? U : any } {
  const container = useDIContainer();
  
  const [services] = useState(() => {
    const resolved: any = {};
    for (const [key, token] of Object.entries(tokens)) {
      resolved[key] = container.resolve(token);
    }
    return resolved;
  });
  
  return services;
}

/**
 * Hook to get container health status
 */
export function useContainerHealth() {
  const compositionRoot = useCompositionRoot();
  const [healthStatus, setHealthStatus] = useState(() => compositionRoot.getHealthStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setHealthStatus(compositionRoot.getHealthStatus());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [compositionRoot]);

  return healthStatus;
}

/**
 * Higher-order component for dependency injection
 */
export function withDependencies<P extends object, T extends Record<string, ServiceToken>>(
  Component: React.ComponentType<P & { services: { [K in keyof T]: T[K] extends ServiceToken<infer U> ? U : any } }>,
  serviceTokens: T
) {
  const WrappedComponent = (props: P) => {
    const services = useServices(serviceTokens);
    return <Component {...props} services={services} />;
  };

  WrappedComponent.displayName = `withDependencies(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Loading fallback component
 */
function DILoadingFallback() {
  return (
    <div className="di-loading-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="di-spinner" style={{
        width: '2rem',
        height: '2rem',
        border: '2px solid #e5e7eb',
        borderTop: '2px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p>Initializing application services...</p>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Error boundary for DI initialization errors
 */
function DIErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="di-error-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: 'bold' }}>
        Application Initialization Failed
      </h1>
      <p style={{ color: '#6b7280', maxWidth: '500px' }}>
        There was an error initializing the application services. Please check the console for more details.
      </p>
      <details style={{ marginTop: '1rem', textAlign: 'left' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          Error Details
        </summary>
        <pre style={{
          background: '#f3f4f6',
          padding: '1rem',
          borderRadius: '0.375rem',
          overflow: 'auto',
          fontSize: '0.875rem',
          marginTop: '0.5rem'
        }}>
          {error.message}
          {error.stack && '\n\n' + error.stack}
        </pre>
      </details>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: '#3b82f6',
          color: 'white',
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Reload Application
      </button>
    </div>
  );
}

/**
 * Development tools component for inspecting the DI container
 */
export function DIDevTools() {
  const container = useDIContainer();
  const healthStatus = useContainerHealth();
  const [isOpen, setIsOpen] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const registeredTokens = container.getRegisteredTokens();

  return (
    <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 9999 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#1f2937',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '0.875rem'
        }}
      >
        🔧 DI Tools
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '3rem',
          right: '0',
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          padding: '1rem',
          minWidth: '300px',
          maxHeight: '400px',
          overflow: 'auto',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 'bold' }}>
            DI Container Status
          </h3>
          
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
            <strong>Health:</strong> {healthStatus.isInitialized ? '✅ Healthy' : '❌ Not Initialized'}
          </div>
          
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
            <strong>Services:</strong> {healthStatus.container.totalServices} total,{' '}
            {healthStatus.container.instantiatedSingletons} instantiated
          </div>

          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem' }}>
              Registered Services ({registeredTokens.length})
            </summary>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem', fontSize: '0.75rem' }}>
              {registeredTokens.map((token, index) => (
                <li key={index} style={{ marginBottom: '0.25rem' }}>
                  {String(token)}
                </li>
              ))}
            </ul>
          </details>

          <button
            onClick={() => {
              console.log('DI Container:', container);
              console.log('Health Status:', healthStatus);
            }}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              marginTop: '0.5rem'
            }}
          >
            Log to Console
          </button>
        </div>
      )}
    </div>
  );
}