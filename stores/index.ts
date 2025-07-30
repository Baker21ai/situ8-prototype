/**
 * Store exports for the Situ8 application
 * Centralized export point for all Zustand stores
 */

// Export all stores
export { useActivityStore } from './activityStore';
export { useIncidentStore } from './incidentStore';
export { useCaseStore } from './caseStore';
export { useBOLStore } from './bolStore';
export { useAuditStore } from './auditStore';

// Store utilities
export const clearAllStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    const situ8Keys = keys.filter(key => key.startsWith('situ8-'));
    situ8Keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear Situ8 storage:', error);
  }
};

export const getStorageSize = () => {
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

// Combined store hook for components that need multiple stores
import { useActivityStore } from './activityStore';
import { useIncidentStore } from './incidentStore';
import { useCaseStore } from './caseStore';
import { useBOLStore } from './bolStore';
import { useAuditStore } from './auditStore';

export const useAllStores = () => ({
  activity: useActivityStore(),
  incident: useIncidentStore(), 
  case: useCaseStore(),
  bol: useBOLStore(),
  audit: useAuditStore(),
});

// Store initialization helper
export const initializeStores = () => {
  // Load initial data for activity store
  const activityStore = useActivityStore.getState();
  if (activityStore.activities.length === 0) {
    activityStore.loadActivities();
  }
  
  // Enable real-time activity generation
  activityStore.startRealtimeGeneration();
  
  // Other stores will be initialized as needed
  console.log('Situ8 stores initialized with real-time generation');
};

// Development utilities
export const resetAllStores = () => {
  useActivityStore.getState().resetStore();
  useIncidentStore.getState().resetStore();
  useCaseStore.getState().resetStore();
  useBOLStore.getState().resetStore();
  useAuditStore.getState().resetStore();
  console.log('All stores reset');
};

// Store statistics for debugging
export const getStoreStatistics = () => {
  const activityStats = useActivityStore.getState().getActivityStats();
  const incidentStats = useIncidentStore.getState().getIncidentStats();
  const caseStats = useCaseStore.getState().getCaseStats();
  const bolStats = useBOLStore.getState().getBOLStats();
  
  return {
    activities: activityStats,
    incidents: incidentStats,
    cases: caseStats,
    bols: bolStats,
    storageSize: `${Math.round(getStorageSize() * 100) / 100} KB`,
  };
};