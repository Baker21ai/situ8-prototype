/**
 * LocationTag Atomic Component
 * Displays location information with type-specific styling
 * Migrated from components/atoms/LocationBadge.tsx
 */

import React from 'react';
import { Badge } from '../../../../components/ui/badge';
import { MapPin, Building, Navigation } from 'lucide-react';

export interface LocationTagProps {
  location: string;
  type?: 'site' | 'building' | 'zone' | 'room';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'minimal';
  className?: string;
}

const SIZE_CLASSES = {
  xs: { text: 'text-xs', padding: 'px-1 py-0.5', icon: 'h-2 w-2', gap: 'gap-0.5' },
  sm: { text: 'text-xs', padding: 'px-1.5 py-0.5', icon: 'h-3 w-3', gap: 'gap-1' },
  md: { text: 'text-sm', padding: 'px-2 py-1', icon: 'h-4 w-4', gap: 'gap-1' },
  lg: { text: 'text-base', padding: 'px-3 py-1.5', icon: 'h-5 w-5', gap: 'gap-1.5' },
  xl: { text: 'text-lg', padding: 'px-4 py-2', icon: 'h-6 w-6', gap: 'gap-2' }
};

const TYPE_ICONS = {
  site: Building,
  building: Building,
  zone: Navigation,
  room: MapPin
};

const TYPE_COLORS = {
  site: {
    default: 'bg-purple-500/20 border-purple-500 text-purple-300',
    outline: 'border-purple-500 text-purple-300 bg-transparent',
    minimal: 'text-purple-300 bg-transparent',
    icon: 'text-purple-400'
  },
  building: {
    default: 'bg-blue-500/20 border-blue-500 text-blue-300',
    outline: 'border-blue-500 text-blue-300 bg-transparent',
    minimal: 'text-blue-300 bg-transparent',
    icon: 'text-blue-400'
  },
  zone: {
    default: 'bg-green-500/20 border-green-500 text-green-300',
    outline: 'border-green-500 text-green-300 bg-transparent',
    minimal: 'text-green-300 bg-transparent',
    icon: 'text-green-400'
  },
  room: {
    default: 'bg-gray-500/20 border-gray-500 text-gray-300',
    outline: 'border-gray-500 text-gray-300 bg-transparent',
    minimal: 'text-gray-300 bg-transparent',
    icon: 'text-gray-400'
  }
};

/**
 * LocationTag - Displays location information with type-specific styling
 * Site badges use purple theme as per design requirements
 * 
 * @example
 * <LocationTag location="Building A" type="building" />
 * <LocationTag location="East Campus" type="site" showIcon />
 * <LocationTag location="Zone 3" type="zone" size="xs" />
 */
export const LocationTag: React.FC<LocationTagProps> = ({
  location,
  type = 'site',
  size = 'sm',
  showIcon = false,
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = SIZE_CLASSES[size];
  const Icon = TYPE_ICONS[type];
  const colors = TYPE_COLORS[type];
  
  const variantStyles = {
    default: colors.default,
    outline: `${colors.outline} border`,
    minimal: colors.minimal
  };

  return (
    <Badge
      className={`
        ${sizeClasses.padding}
        ${sizeClasses.text}
        ${variantStyles[variant]}
        font-medium inline-flex items-center
        ${showIcon ? sizeClasses.gap : ''}
        ${className}
      `}
    >
      {showIcon && (
        <Icon 
          className={`${sizeClasses.icon} ${colors.icon}`}
          aria-hidden="true"
        />
      )}
      {location}
    </Badge>
  );
};

// Specialized variants for convenience
export const LocationTagSite: React.FC<Omit<LocationTagProps, 'type'>> = (props) => (
  <LocationTag {...props} type="site" />
);

export const LocationTagBuilding: React.FC<Omit<LocationTagProps, 'type'>> = (props) => (
  <LocationTag {...props} type="building" />
);

export const LocationTagZone: React.FC<Omit<LocationTagProps, 'type'>> = (props) => (
  <LocationTag {...props} type="zone" />
);

export const LocationTagRoom: React.FC<Omit<LocationTagProps, 'type'>> = (props) => (
  <LocationTag {...props} type="room" />
);

// Compound component for hierarchical location display
export interface HierarchicalLocationProps {
  site?: string;
  building?: string;
  zone?: string;
  room?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
  className = ''
}) => {
  const locations = [
    { value: site, type: 'site' as const },
    { value: building, type: 'building' as const },
    { value: zone, type: 'zone' as const },
    { value: room, type: 'room' as const }
  ].filter(loc => loc.value);
  
  if (locations.length === 0) return null;
  
  return (
    <div className={`inline-flex items-center flex-wrap gap-1 ${className}`}>
      {locations.map((loc, index) => (
        <React.Fragment key={index}>
          <LocationTag
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
