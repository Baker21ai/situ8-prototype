/**
 * Persistence middleware for Zustand stores
 * Handles localStorage persistence for the prototype phase
 */

import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type PersistOptions<T> = {
  name: string;
  storage?: Storage;
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: (state: T) => void;
};

type PersistImpl = <T>(
  storeInitializer: StateCreator<T, [], [], T>,
  options: PersistOptions<T>
) => StateCreator<T, [], [], T>;

type Persist = {
  <T>(
    initializer: StateCreator<T, [], [], T>,
    options: PersistOptions<T>
  ): StateCreator<T, [], [], T>;
};

declare module 'zustand/middleware' {
  interface StoreMutators<S, A> {
    'zustand/persist': WithPersist<S, A>;
  }
}

type WithPersist<S, A> = S extends { getState: () => infer T } 
  ? S & {
      persist: {
        setOptions: (options: Partial<PersistOptions<T>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void>;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: T) => void) => () => void;
        onFinishHydration: (fn: (state: T) => void) => () => void;
      };
    }
  : never;

/**
 * Simple localStorage persistence implementation for prototype
 * In production, this would be replaced with a more robust solution
 */
export const persist: Persist = <T>(
  storeInitializer: StateCreator<T, [], [], T>,
  options: PersistOptions<T>
): StateCreator<T, [], [], T> => {
  return (set, get, api) => {
    const { name, storage = localStorage, partialize, onRehydrateStorage } = options;
    
    // Initialize the store
    const initialState = storeInitializer(set, get, api);
    
    // Load persisted state
    let persistedState: Partial<T> = {};
    try {
      const stored = storage.getItem(name);
      if (stored) {
        persistedState = JSON.parse(stored);
      }
    } catch (error) {
      console.warn(`Failed to load persisted state for ${name}:`, error);
    }
    
    // Merge initial state with persisted state
    const mergedState = { ...initialState, ...persistedState };
    
    // Create the enhanced set function that persists changes
    const persistingSet: typeof set = (partial, replace) => {
      set(partial, replace);
      
      // Persist the updated state
      try {
        const currentState = get();
        const stateToPersist = partialize ? partialize(currentState) : currentState;
        storage.setItem(name, JSON.stringify(stateToPersist));
      } catch (error) {
        console.warn(`Failed to persist state for ${name}:`, error);
      }
    };
    
    // Call onRehydrateStorage if provided
    if (onRehydrateStorage) {
      onRehydrateStorage(mergedState);
    }
    
    // Return the merged state with the persisting set function
    return mergedState;
  };
};

/**
 * Helper function to create a storage key with prefix
 */
export const createStorageKey = (key: string): string => {
  return `situ8-${key}`;
};

/**
 * Helper function to clear all Situ8 storage
 */
export const clearAllStorage = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const situ8Keys = keys.filter(key => key.startsWith('situ8-'));
    situ8Keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear Situ8 storage:', error);
  }
};

/**
 * Helper function to get storage size in KB
 */
export const getStorageSize = (): number => {
  try {
    const keys = Object.keys(localStorage);
    const situ8Keys = keys.filter(key => key.startsWith('situ8-'));
    let totalSize = 0;
    
    situ8Keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    });
    
    return totalSize / 1024; // Convert to KB
  } catch (error) {
    console.warn('Failed to calculate storage size:', error);
    return 0;
  }
};