/**
 * TimeDisplay Atomic Component
 * Displays time in various formats with auto-updating capability
 * Migrated from components/atoms/TimeDisplay.tsx
 */

import React, { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Clock } from 'lucide-react';

export interface TimeDisplayProps {
  date: Date | string;
  format?: 'time' | 'relative' | 'relative-short' | 'datetime' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  updateInterval?: number | false; // milliseconds or false to disable
  className?: string;
  showTooltip?: boolean;
}

const SIZE_CLASSES = {
  xs: { text: 'text-xs', icon: 'h-2 w-2' },
  sm: { text: 'text-sm', icon: 'h-3 w-3' },
  md: { text: 'text-base', icon: 'h-4 w-4' },
  lg: { text: 'text-lg', icon: 'h-5 w-5' },
  xl: { text: 'text-xl', icon: 'h-6 w-6' }
};

/**
 * Formats a time ago string in short form
 * @param date - The date to format
 * @returns Short relative time string (e.g., "2m", "1h", "3d")
 */
function formatTimeAgoShort(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
  return `${Math.floor(diffInSeconds / 2592000)}mo`;
}

/**
 * TimeDisplay - Displays time in various formats with optional auto-updating
 * 
 * @example
 * <TimeDisplay date={new Date()} />
 * <TimeDisplay date={activity.timestamp} format="relative" showIcon />
 * <TimeDisplay date={timestamp} format="time" size="lg" />
 */
export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  date,
  format: formatType = 'auto',
  size = 'sm',
  showIcon = false,
  updateInterval = 60000, // Update every minute by default
  className = '',
  showTooltip = true
}) => {
  const [, setTick] = useState(0);
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const sizeClasses = SIZE_CLASSES[size];
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) {
    return (
      <span className={`${sizeClasses.text} text-muted-foreground ${className}`}>
        Invalid date
      </span>
    );
  }
  
  // Auto-update for relative times
  useEffect(() => {
    if (updateInterval && (formatType === 'relative' || formatType === 'relative-short' || formatType === 'auto')) {
      const interval = setInterval(() => {
        setTick(tick => tick + 1);
      }, updateInterval);
      
      return () => clearInterval(interval);
    }
  }, [formatType, updateInterval]);
  
  // Format the time based on format prop
  const getFormattedTime = () => {
    switch (formatType) {
      case 'time':
        return format(dateObj, 'HH:mm');
      case 'relative':
        return formatDistanceToNow(dateObj, { addSuffix: true });
      case 'relative-short':
        return formatTimeAgoShort(dateObj);
      case 'datetime':
        return format(dateObj, 'MMM d, yyyy HH:mm');
      case 'auto':
      default:
        // Auto format: show relative for recent times, absolute for older
        const hoursDiff = (Date.now() - dateObj.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
          return formatDistanceToNow(dateObj, { addSuffix: true });
        } else {
          return format(dateObj, 'MMM d, yyyy HH:mm');
        }
    }
  };
  
  const formattedTime = getFormattedTime();
  const absoluteTime = format(dateObj, 'MMM d, yyyy HH:mm:ss');
  
  return (
    <span
      className={`
        inline-flex items-center gap-1
        ${sizeClasses.text}
        text-muted-foreground
        font-mono
        ${className}
      `}
      title={showTooltip && formatType !== 'datetime' ? absoluteTime : undefined}
    >
      {showIcon && (
        <Clock 
          className={`${sizeClasses.icon} opacity-70`}
          aria-hidden="true"
        />
      )}
      <time dateTime={dateObj.toISOString()}>
        {formattedTime}
      </time>
    </span>
  );
};

// Specialized variants for convenience
export const TimeDisplayRelative: React.FC<Omit<TimeDisplayProps, 'format'>> = (props) => (
  <TimeDisplay {...props} format="relative" />
);

export const TimeDisplayAbsolute: React.FC<Omit<TimeDisplayProps, 'format'>> = (props) => (
  <TimeDisplay {...props} format="time" />
);

export const TimeDisplayShort: React.FC<Omit<TimeDisplayProps, 'format'>> = (props) => (
  <TimeDisplay {...props} format="relative-short" />
);

// Compound component for showing both relative and absolute time
export interface DualTimeDisplayProps extends Omit<TimeDisplayProps, 'format'> {
  separator?: string;
}

export const DualTimeDisplay: React.FC<DualTimeDisplayProps> = ({
  separator = ' • ',
  ...props
}) => {
  return (
    <span className="inline-flex items-center">
      <TimeDisplay {...props} format="time" showTooltip={false} />
      <span className="text-muted-foreground mx-1">{separator}</span>
      <TimeDisplay {...props} format="relative" showIcon={false} />
    </span>
  );
};

// Live clock component
export interface LiveClockProps {
  format?: '12' | '24';
  showSeconds?: boolean;
  showDate?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LiveClock: React.FC<LiveClockProps> = ({
  format: clockFormat = '24',
  showSeconds = false,
  showDate = false,
  size = 'md',
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const sizeClasses = SIZE_CLASSES[size];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, showSeconds ? 1000 : 60000);
    
    return () => clearInterval(interval);
  }, [showSeconds]);
  
  const timeFormat = clockFormat === '12' 
    ? (showSeconds ? 'h:mm:ss a' : 'h:mm a')
    : (showSeconds ? 'HH:mm:ss' : 'HH:mm');
  
  return (
    <div className={`font-mono ${sizeClasses.text} ${className}`}>
      <div className="font-semibold">
        {format(currentTime, timeFormat)}
      </div>
      {showDate && (
        <div className="text-muted-foreground text-xs">
          {format(currentTime, 'EEE, MMM d')}
        </div>
      )}
    </div>
  );
};
