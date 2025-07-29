import React, { useEffect, useState } from 'react';
import { cn } from '@/components/ui/utils';
import { 
  formatTime, 
  formatTimeAgo, 
  formatTimeAgoShort, 
  formatDateTime,
  TimeFormatOptions 
} from '@/lib/utils/time';
import { ComponentSize } from '@/lib/types';
import { Clock } from 'lucide-react';
import { iconSizes } from '@/lib/tokens/spacing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TimeDisplayProps {
  date: Date | string;
  format?: 'time' | 'relative' | 'relative-short' | 'datetime' | 'auto';
  size?: ComponentSize;
  showIcon?: boolean;
  updateInterval?: number | false; // milliseconds or false to disable
  className?: string;
  options?: TimeFormatOptions;
  showTooltip?: boolean;
}

/**
 * TimeDisplay - Atomic component for displaying time in various formats
 * 
 * @example
 * <TimeDisplay date={new Date()} />
 * <TimeDisplay date={activity.timestamp} format="relative" showIcon />
 * <TimeDisplay date={timestamp} format="time" size="lg" />
 */
export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  date,
  format = 'auto',
  size = 'sm',
  showIcon = false,
  updateInterval = 60000, // Update every minute by default
  className,
  options = {},
  showTooltip = true
}) => {
  const [, setTick] = useState(0);
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Auto-update for relative times
  useEffect(() => {
    if (updateInterval && (format === 'relative' || format === 'relative-short' || format === 'auto')) {
      const interval = setInterval(() => {
        setTick(tick => tick + 1);
      }, updateInterval);
      
      return () => clearInterval(interval);
    }
  }, [format, updateInterval]);
  
  // Text size classes
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  // Icon size
  const iconSize = iconSizes[size as keyof typeof iconSizes] || iconSizes.sm;
  
  // Format the time based on format prop
  const getFormattedTime = () => {
    switch (format) {
      case 'time':
        return formatTime(dateObj, options);
      case 'relative':
        return formatTimeAgo(dateObj, options);
      case 'relative-short':
        return formatTimeAgoShort(dateObj);
      case 'datetime':
        return formatDateTime(dateObj, options);
      case 'auto':
      default:
        // Auto format: show relative for recent times, absolute for older
        const hoursDiff = (Date.now() - dateObj.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
          return formatTimeAgo(dateObj, options);
        } else {
          return formatDateTime(dateObj, options);
        }
    }
  };
  
  const formattedTime = getFormattedTime();
  const absoluteTime = formatDateTime(dateObj, options);
  
  const timeElement = (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        textSizes[size],
        'text-muted-foreground',
        'font-mono',
        className
      )}
    >
      {showIcon && <Clock className={cn(iconSize, 'opacity-70')} />}
      <time dateTime={dateObj.toISOString()}>
        {formattedTime}
      </time>
    </span>
  );
  
  if (showTooltip && format !== 'datetime') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {timeElement}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{absoluteTime}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return timeElement;
};

// Compound component for showing both relative and absolute time
interface DualTimeDisplayProps extends Omit<TimeDisplayProps, 'format'> {
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
interface LiveClockProps {
  format?: '12' | '24';
  showSeconds?: boolean;
  showDate?: boolean;
  size?: ComponentSize;
  className?: string;
}

export const LiveClock: React.FC<LiveClockProps> = ({
  format = '24',
  showSeconds = false,
  showDate = false,
  size = 'md',
  className
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, showSeconds ? 1000 : 60000);
    
    return () => clearInterval(interval);
  }, [showSeconds]);
  
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  const timeOptions: TimeFormatOptions = {
    use12Hour: format === '12',
    showSeconds
  };
  
  return (
    <div className={cn('font-mono', textSizes[size], className)}>
      <div className="font-semibold">
        {formatTime(currentTime, timeOptions)}
      </div>
      {showDate && (
        <div className="text-muted-foreground text-xs">
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      )}
    </div>
  );
};