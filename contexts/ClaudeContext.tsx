import React, { createContext, useContext, ReactNode } from 'react';
import { useClaudeHooks, ClaudeHooksReturn, ClaudeHooksConfig } from '../hooks/useClaudeHooks';

interface ClaudeContextType extends ClaudeHooksReturn {
  // Additional context-specific methods can be added here
}

const ClaudeContext = createContext<ClaudeContextType | undefined>(undefined);

interface ClaudeProviderProps {
  children: ReactNode;
  config?: Partial<ClaudeHooksConfig>;
}

export function ClaudeProvider({ children, config }: ClaudeProviderProps) {
  const claudeHooks = useClaudeHooks(config);

  return (
    <ClaudeContext.Provider value={claudeHooks}>
      {children}
    </ClaudeContext.Provider>
  );
}

export function useClaude(): ClaudeContextType {
  const context = useContext(ClaudeContext);
  if (context === undefined) {
    throw new Error('useClaude must be used within a ClaudeProvider');
  }
  return context;
}

// Higher-order component for easy integration
export function withClaude<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & { claudeConfig?: Partial<ClaudeHooksConfig> }> {
  return function WrappedComponent({ claudeConfig, ...props }: P & { claudeConfig?: Partial<ClaudeHooksConfig> }) {
    return (
      <ClaudeProvider config={claudeConfig}>
        <Component {...(props as P)} />
      </ClaudeProvider>
    );
  };
}