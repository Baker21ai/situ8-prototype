import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';
import { siteColors } from '@/lib/tokens/colors';
import { badgeSizes, iconSizes } from '@/lib/tokens/spacing';
import { ComponentSize } from '@/lib/types';
import { MapPin, Building, Navigation } from 'lucide-react';

interface LocationBadgeProps {
  location: string;
  type?: 'site' | 'building' | 'zone' | 'room';
  size?: ComponentSize;
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'minimal';
  className?: string;
}

/**
 * LocationBadge - Atomic component for displaying location information
 * Follows the purple theme as per design requirements for site badges
 * 
 * @example
 * <LocationBadge location="Building A" type="building" />
 * <LocationBadge location="East Campus" type="site" showIcon />
 * <LocationBadge location="Zone 3" type="zone" size="xs" />
 */
export const LocationBadge: React.FC<LocationBadgeProps> = ({
  location,
  type = 'site',
  size = 'sm',
  showIcon = false,
  variant = 'default',
  className
}) => {
  const sizeClasses = badgeSizes[size as keyof typeof badgeSizes] || badgeSizes.sm;
  const iconSize = iconSizes[size as keyof typeof iconSizes] || iconSizes.sm;
  
  // Get appropriate icon based on type
  const Icon = {
    site: Building,
    building: Building,
    zone: Navigation,
    room: MapPin
  }[type];
  
  // Variant styles - site badges use purple theme
  const variantClasses = {
    default: cn(
      type === 'site' 
        ? `${siteColors.badge.background} ${siteColors.badge.border} ${siteColors.badge.text}`
        : 'bg-gray-100 border-gray-200 text-gray-800'
    ),
    outline: cn(
      'border bg-transparent',
      type === 'site'
        ? `${siteColors.badge.border} ${siteColors.badge.text}`
        : 'border-gray-200 text-gray-800'
    ),
    minimal: cn(
      'bg-transparent',
      type === 'site'
        ? siteColors.badge.text
        : 'text-gray-800'
    )
  };

  return (
    <Badge
      className={cn(
        sizeClasses.padding,
        sizeClasses.text,
        variantClasses[variant],
        'font-medium inline-flex items-center',
        sizeClasses.gap,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(
          iconSize, 
          type === 'site' ? siteColors.badge.icon : 'text-gray-600'
        )} />
      )}
      {location}
    </Badge>
  );
};

// Compound component for hierarchical location display
interface HierarchicalLocationProps {
  site?: string;
  building?: string;
  zone?: string;
  room?: string;
  size?: ComponentSize;
  separator?: string;
  className?: string;
}

export const HierarchicalLocation: React.FC<HierarchicalLocationProps> = ({
  site,
  building,
  zone,
  room,
  size = 'sm',
  separator = ' › ',
  className
}) => {
  const locations = [
    { value: site, type: 'site' as const },
    { value: building, type: 'building' as const },
    { value: zone, type: 'zone' as const },
    { value: room, type: 'room' as const }
  ].filter(loc => loc.value);
  
  if (locations.length === 0) return null;
  
  return (
    <div className={cn('inline-flex items-center flex-wrap gap-1', className)}>
      {locations.map((loc, index) => (
        <React.Fragment key={index}>
          <LocationBadge
            location={loc.value!}
            type={loc.type}
            size={size}
            variant={index === 0 ? 'default' : 'minimal'}
          />
          {index < locations.length - 1 && (
            <span className="text-muted-foreground text-xs">
              {separator}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Location marker for maps
interface LocationMarkerProps {
  type?: 'site' | 'building' | 'zone' | 'room';
  size?: ComponentSize;
  active?: boolean;
  className?: string;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  type = 'site',
  size = 'md',
  active = false,
  className
}) => {
  const markerSizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };
  
  const Icon = {
    site: Building,
    building: Building,
    zone: Navigation,
    room: MapPin
  }[type];
  
  const iconSize = iconSizes[size as keyof typeof iconSizes] || iconSizes.md;
  
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center transition-all',
        markerSizes[size],
        type === 'site' 
          ? `${siteColors.marker.background} ${siteColors.marker.border} border-2`
          : 'bg-gray-100 border-gray-300 border',
        active && 'ring-2 ring-offset-2 ring-blue-500 scale-110',
        className
      )}
    >
      <Icon className={cn(
        iconSize,
        type === 'site' ? siteColors.badge.icon : 'text-gray-600'
      )} />
    </div>
  );
};