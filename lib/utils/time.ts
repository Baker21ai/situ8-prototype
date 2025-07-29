/**
 * Time utility functions for consistent time formatting across the application
 */

export interface TimeFormatOptions {
  /** Use relative time (e.g., "2 hours ago") vs absolute */
  relative?: boolean;
  /** Show seconds in time display */
  showSeconds?: boolean;
  /** Use 12-hour format */
  use12Hour?: boolean;
  /** Maximum unit to show (e.g., 'days' won't show weeks/months) */
  maxUnit?: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  /** Custom "now" text */
  nowText?: string;
}

/**
 * Format a date to relative time (e.g., "5 minutes ago", "2 hours ago")
 * @param date - The date to format
 * @param options - Formatting options
 * @returns Formatted relative time string
 */
export function formatTimeAgo(date: Date, options: TimeFormatOptions = {}): string {
  const { maxUnit = 'months', nowText = 'Now' } = options;
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) {
    return nowText;
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24 && maxUnit !== 'minutes') {
    return `${hours}h ago`;
  }

  if (days < 7 && maxUnit !== 'minutes' && maxUnit !== 'hours') {
    return `${days}d ago`;
  }

  if (weeks < 4 && maxUnit !== 'minutes' && maxUnit !== 'hours' && maxUnit !== 'days') {
    return `${weeks}w ago`;
  }

  if (months < 12 && maxUnit === 'months') {
    return `${months}mo ago`;
  }

  // Fallback to date string
  return date.toLocaleDateString();
}

/**
 * Format a date to time string (e.g., "14:30", "2:30 PM")
 * @param date - The date to format
 * @param options - Formatting options
 * @returns Formatted time string
 */
export function formatTime(date: Date, options: TimeFormatOptions = {}): string {
  const { showSeconds = false, use12Hour = false } = options;

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: use12Hour
  });
}

/**
 * Format a date to a combined date/time string
 * @param date - The date to format
 * @param options - Formatting options
 * @returns Formatted date/time string
 */
export function formatDateTime(date: Date, options: TimeFormatOptions = {}): string {
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
  const timeStr = formatTime(date, options);
  return `${dateStr} at ${timeStr}`;
}

/**
 * Get a short relative time string (e.g., "5m", "2h", "3d")
 * Useful for compact displays
 * @param date - The date to format
 * @returns Short relative time string
 */
export function formatTimeAgoShort(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 365) return `${days}d`;
  return `${Math.floor(days / 365)}y`;
}

/**
 * Calculate time difference between two dates
 * @param startDate - Start date
 * @param endDate - End date (defaults to now)
 * @returns Object with time units
 */
export function getTimeDifference(startDate: Date, endDate: Date = new Date()) {
  const diff = endDate.getTime() - startDate.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    milliseconds: diff,
    seconds,
    minutes,
    hours,
    days,
    formatted: formatTimeAgo(startDate)
  };
}

/**
 * Check if a date is within a certain time range from now
 * @param date - Date to check
 * @param minutes - Number of minutes for the range
 * @returns Boolean indicating if date is within range
 */
export function isWithinMinutes(date: Date, minutes: number): boolean {
  const diff = Date.now() - date.getTime();
  return diff <= minutes * 60 * 1000;
}

/**
 * Format duration in milliseconds to human readable string
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  return `${seconds}s`;
}