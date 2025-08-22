/**
 * Export utilities for activities data
 * Supports CSV and JSON export formats
 */

import { EnterpriseActivity } from '../types/activity';

export interface ExportOptions {
  format: 'csv' | 'json';
  filename?: string;
  includeFields?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  filterBy?: {
    priority?: string;
    status?: string;
    assignedTo?: string;
  };
}

// Default fields for export
const DEFAULT_EXPORT_FIELDS = [
  'id',
  'title',
  'type',
  'priority',
  'status',
  'timestamp',
  'location',
  'description',
  'assignedTo',
  'confidence'
];

/**
 * Export activities to CSV format
 */
export function exportToCSV(activities: EnterpriseActivity[], options: ExportOptions = { format: 'csv' }): string {
  const fields = options.includeFields || DEFAULT_EXPORT_FIELDS;
  const filteredActivities = filterActivities(activities, options);
  
  // Create CSV header
  const header = fields.join(',');
  
  // Create CSV rows
  const rows = filteredActivities.map(activity => {
    return fields.map(field => {
      const value = getFieldValue(activity, field);
      // Escape commas and quotes for CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
}

/**
 * Export activities to JSON format
 */
export function exportToJSON(activities: EnterpriseActivity[], options: ExportOptions = { format: 'json' }): string {
  const fields = options.includeFields || DEFAULT_EXPORT_FIELDS;
  const filteredActivities = filterActivities(activities, options);
  
  const exportData = filteredActivities.map(activity => {
    const exportActivity: any = {};
    fields.forEach(field => {
      exportActivity[field] = getFieldValue(activity, field);
    });
    return exportActivity;
  });
  
  return JSON.stringify({
    exportInfo: {
      timestamp: new Date().toISOString(),
      totalRecords: exportData.length,
      filters: options.filterBy || {},
      dateRange: options.dateRange
    },
    activities: exportData
  }, null, 2);
}

/**
 * Download exported data as file
 */
export function downloadExport(data: string, options: ExportOptions): void {
  const { format, filename } = options;
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `situ8-activities-${timestamp}.${format}`;
  
  const blob = new Blob([data], {
    type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;'
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || defaultFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main export function that handles both formats
 */
export function exportActivities(activities: EnterpriseActivity[], options: ExportOptions): void {
  let exportData: string;
  
  if (options.format === 'csv') {
    exportData = exportToCSV(activities, options);
  } else {
    exportData = exportToJSON(activities, options);
  }
  
  downloadExport(exportData, options);
}

/**
 * Get export statistics
 */
export function getExportStats(activities: EnterpriseActivity[], options: ExportOptions) {
  const filteredActivities = filterActivities(activities, options);
  
  const stats = {
    totalActivities: filteredActivities.length,
    priorityBreakdown: {} as Record<string, number>,
    statusBreakdown: {} as Record<string, number>,
    typeBreakdown: {} as Record<string, number>,
    dateRange: {
      earliest: null as Date | null,
      latest: null as Date | null
    }
  };
  
  filteredActivities.forEach(activity => {
    // Priority breakdown
    const priority = activity.priority || 'unknown';
    stats.priorityBreakdown[priority] = (stats.priorityBreakdown[priority] || 0) + 1;
    
    // Status breakdown
    const status = activity.status || 'unknown';
    stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1;
    
    // Type breakdown
    const type = activity.type || 'unknown';
    stats.typeBreakdown[type] = (stats.typeBreakdown[type] || 0) + 1;
    
    // Date range
    if (activity.timestamp) {
      const date = new Date(activity.timestamp);
      if (!stats.dateRange.earliest || date < stats.dateRange.earliest) {
        stats.dateRange.earliest = date;
      }
      if (!stats.dateRange.latest || date > stats.dateRange.latest) {
        stats.dateRange.latest = date;
      }
    }
  });
  
  return stats;
}

// Helper functions

function filterActivities(activities: EnterpriseActivity[], options: ExportOptions): EnterpriseActivity[] {
  let filtered = [...activities];
  
  // Filter by date range
  if (options.dateRange) {
    filtered = filtered.filter(activity => {
      if (!activity.timestamp) return false;
      const date = new Date(activity.timestamp);
      return date >= options.dateRange!.start && date <= options.dateRange!.end;
    });
  }
  
  // Filter by criteria
  if (options.filterBy) {
    const { priority, status, assignedTo } = options.filterBy;
    
    if (priority) {
      filtered = filtered.filter(activity => activity.priority === priority);
    }
    
    if (status) {
      filtered = filtered.filter(activity => activity.status === status);
    }
    
    if (assignedTo) {
      filtered = filtered.filter(activity => activity.assignedTo === assignedTo);
    }
  }
  
  return filtered;
}

function getFieldValue(activity: EnterpriseActivity, field: string): string {
  const value = (activity as any)[field];
  
  if (value === null || value === undefined) {
    return '';
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

// Predefined export templates
export const EXPORT_TEMPLATES = {
  basic: {
    name: 'Basic Report',
    fields: ['id', 'title', 'priority', 'status', 'timestamp', 'location', 'assignedTo']
  },
  detailed: {
    name: 'Detailed Report',
    fields: DEFAULT_EXPORT_FIELDS
  },
  investigation: {
    name: 'Investigation Report',
    fields: ['id', 'title', 'type', 'priority', 'timestamp', 'location', 'description', 'confidence', 'assignedTo']
  },
  summary: {
    name: 'Summary Report',
    fields: ['id', 'title', 'priority', 'status', 'timestamp', 'assignedTo']
  }
};