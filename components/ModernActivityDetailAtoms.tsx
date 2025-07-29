import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  Users, 
  Camera,
  Phone,
  Radio,
  Star,
  Loader2,
  X
} from 'lucide-react';

// =============================================================================
// ATOMIC COMPONENTS - Building blocks of the security interface
// =============================================================================

// Status Labels - Different visual states for security incidents
export const StatusLabel = {
  Critical: ({ children, pulse = false }: { children: React.ReactNode; pulse?: boolean }) => (
    <Badge className={`
      bg-red-500/20 border-red-500 text-red-300 shadow-lg shadow-red-500/30
      font-medium text-xs uppercase tracking-wider border
      ${pulse ? 'animate-pulse' : ''}
      transition-all duration-200 hover:scale-105
    `}>
      <AlertTriangle className="h-3 w-3 mr-1" />
      {children}
    </Badge>
  ),

  High: ({ children }: { children: React.ReactNode }) => (
    <Badge className="bg-orange-500/20 border-orange-500 text-orange-300 shadow-lg shadow-orange-500/30 font-medium text-xs uppercase tracking-wider border">
      <AlertTriangle className="h-3 w-3 mr-1" />
      {children}
    </Badge>
  ),

  Medium: ({ children }: { children: React.ReactNode }) => (
    <Badge className="bg-yellow-500/20 border-yellow-500 text-yellow-300 shadow-lg shadow-yellow-500/30 font-medium text-xs uppercase tracking-wider border">
      <Clock className="h-3 w-3 mr-1" />
      {children}
    </Badge>
  ),

  Low: ({ children }: { children: React.ReactNode }) => (
    <Badge className="bg-green-500/20 border-green-500 text-green-300 shadow-lg shadow-green-500/30 font-medium text-xs uppercase tracking-wider border">
      <CheckCircle className="h-3 w-3 mr-1" />
      {children}
    </Badge>
  ),

  Resolved: ({ children }: { children: React.ReactNode }) => (
    <Badge className="bg-green-600 text-white shadow-lg font-medium text-xs uppercase tracking-wider opacity-75">
      <CheckCircle className="h-3 w-3 mr-1" />
      {children}
    </Badge>
  ),

  FalseAlarm: ({ children }: { children: React.ReactNode }) => (
    <Badge className="bg-gray-600 text-gray-300 shadow-lg font-medium text-xs uppercase tracking-wider opacity-75">
      <X className="h-3 w-3 mr-1" />
      {children}
    </Badge>
  )
};

// Action Buttons - Different urgency levels with proper WCAG contrast
export const ActionButton = {
  Critical: ({ 
    children, 
    icon, 
    onClick, 
    disabled = false, 
    loading = false, 
    recommended = false,
    className = '' 
  }: {
    children: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    recommended?: boolean;
    className?: string;
  }) => (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 
          h-10 font-semibold transition-all duration-200
          focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${recommended ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : ''}
          ${className}
        `}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : icon ? (
          <span className="mr-2">{icon}</span>
        ) : null}
        {children}
        <span className="sr-only">, Critical Action</span>
      </Button>
    </motion.div>
  ),

  Warning: ({ children, icon, onClick, disabled = false, loading = false, className = '' }: {
    children: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
  }) => (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/30
          h-10 font-semibold transition-all duration-200
          focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : icon ? (
          <span className="mr-2">{icon}</span>
        ) : null}
        {children}
        <span className="sr-only">, Warning Action</span>
      </Button>
    </motion.div>
  ),

  Secondary: ({ children, icon, onClick, disabled = false, loading = false, className = '' }: {
    children: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
  }) => (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        variant="outline"
        className={`
          bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 hover:border-gray-500
          h-10 font-medium transition-all duration-200
          focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : icon ? (
          <span className="mr-2">{icon}</span>
        ) : null}
        {children}
      </Button>
    </motion.div>
  ),

  Success: ({ children, icon, onClick, disabled = false, loading = false, className = '' }: {
    children: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
  }) => (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30
          h-10 font-semibold transition-all duration-200
          focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : icon ? (
          <span className="mr-2">{icon}</span>
        ) : null}
        {children}
        <span className="sr-only">, Success Action</span>
      </Button>
    </motion.div>
  )
};

// Progress Indicators for confidence levels and loading states
export const ProgressIndicator = {
  Confidence: ({ value, label = "Confidence" }: { value: number; label?: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className={`font-medium ${
          value >= 90 ? 'text-green-400' : 
          value >= 70 ? 'text-yellow-400' : 
          'text-red-400'
        }`}>
          {value}%
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <motion.div 
          className={`h-2 rounded-full ${
            value >= 90 ? 'bg-green-500' : 
            value >= 70 ? 'bg-yellow-500' : 
            'bg-red-500'
          }`}
          style={{ width: `${value}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  ),

  Loading: ({ message = "Processing..." }: { message?: string }) => (
    <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
      <span className="text-gray-300">{message}</span>
    </div>
  )
};

// =============================================================================
// MOLECULAR COMPONENTS - Combinations of atoms
// =============================================================================

// Guard Response Cards with status indicators
export const GuardResponseCard = ({ 
  guard, 
  onAssign, 
  onContact, 
  compact = false 
}: {
  guard: {
    name: string;
    status: string;
    distance: string;
    available: boolean;
    rating?: number;
    eta?: string;
  };
  onAssign?: () => void;
  onContact?: () => void;
  compact?: boolean;
}) => {
  const getStatusConfig = () => {
    switch (guard.status) {
      case 'responding':
        return { color: 'bg-orange-500', label: 'Responding', animate: true };
      case 'available':
        return { color: 'bg-green-500', label: 'Available', animate: false };
      case 'break':
        return { color: 'bg-yellow-500', label: 'On Break', animate: false };
      default:
        return { color: 'bg-gray-500', label: guard.status, animate: false };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700
        hover:bg-gray-800/70 transition-colors
        ${compact ? 'p-2' : 'p-3'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-3 h-3 ${statusConfig.color} rounded-full flex-shrink-0
          ${statusConfig.animate ? 'animate-pulse' : ''}
        `} />
        <div>
          <div className={`font-medium text-white ${compact ? 'text-sm' : 'text-base'}`}>
            {guard.name}
          </div>
          <div className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            {guard.distance}
            {guard.eta && ` • ETA: ${guard.eta}`}
            {guard.rating && (
              <span className="ml-1">
                <Star className="h-3 w-3 inline text-yellow-400" />
                {guard.rating}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        {guard.available && onAssign && (
          <ActionButton.Success
            icon={<Shield className="h-3 w-3" />}
            onClick={onAssign}
            className={`${compact ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm'}`}
          >
            {compact ? 'Assign' : 'Assign Guard'}
          </ActionButton.Success>
        )}
        {onContact && (
          <ActionButton.Secondary
            icon={<Radio className="h-3 w-3" />}
            onClick={onContact}
            className={`${compact ? 'h-7 px-2' : 'h-8 px-3'}`}
          >
            <span className="sr-only">Contact {guard.name}</span>
          </ActionButton.Secondary>
        )}
      </div>
    </motion.div>
  );
};

// Evidence Display Component
export const EvidenceViewer = ({ 
  cameraId, 
  location, 
  isLive = false, 
  onPlay, 
  onFullscreen,
  compact = false 
}: {
  cameraId: string;
  location: string;
  isLive?: boolean;
  onPlay?: () => void;
  onFullscreen?: () => void;
  compact?: boolean;
}) => (
  <div className={`relative ${compact ? 'aspect-video' : 'aspect-video'} bg-gray-800 border border-gray-600 rounded-lg overflow-hidden`}>
    <div className="absolute inset-0 flex flex-col justify-center items-center">
      <Camera className={`${compact ? 'h-8 w-8' : 'h-12 w-12'} text-gray-500 mb-2`} />
      <div className={`text-center text-gray-400 px-4 ${compact ? 'text-xs' : 'text-sm'}`}>
        <div className="font-medium mb-1">[Evidence Feed: Security Alert]</div>
        <div>Tailgating detection active</div>
      </div>
      {onPlay && (
        <div className="mt-3">
          <ActionButton.Critical
            icon={<Camera className="h-3 w-3" />}
            onClick={onPlay}
            className={compact ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm'}
          >
            View Evidence
          </ActionButton.Critical>
        </div>
      )}
    </div>
    
    {isLive && (
      <div className="absolute top-2 right-2">
        <Badge className="bg-red-600 text-white animate-pulse font-medium">
          LIVE
        </Badge>
      </div>
    )}
    
    <div className="absolute bottom-2 left-2">
      <Badge variant="outline" className="bg-black/60 border-gray-600 text-white text-xs">
        {cameraId} • {location}
      </Badge>
    </div>
    
    {onFullscreen && (
      <div className="absolute top-2 left-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onFullscreen}
          className="bg-black/60 border-gray-600 text-white hover:bg-black/80 h-7 px-2"
        >
          <span className="sr-only">Fullscreen view</span>
          📺
        </Button>
      </div>
    )}
  </div>
);

// =============================================================================
// ORGANISM COMPONENTS - Complete interface sections
// =============================================================================

// Action Bar for primary response actions
export const ActionBar = ({ 
  onDispatch, 
  onBroadcast, 
  onLockdown, 
  onEscalate, 
  recommendedAction,
  loading = false,
  compact = false 
}: {
  onDispatch?: () => void;
  onBroadcast?: () => void;
  onLockdown?: () => void;
  onEscalate?: () => void;
  recommendedAction?: string;
  loading?: boolean;
  compact?: boolean;
}) => (
  <div className={`space-y-${compact ? '2' : '3'}`}>
    <div className="flex items-center justify-between">
      <h3 className={`text-white font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
        Response Actions
      </h3>
      {recommendedAction && (
        <Badge className="bg-blue-500/20 border-blue-500 text-blue-300 text-xs">
          <Star className="h-3 w-3 mr-1" />
          AI Recommended
        </Badge>
      )}
    </div>
    
    <div className={`space-y-${compact ? '2' : '3'}`}>
      <ActionButton.Critical
        icon={<Shield className="h-4 w-4" />}
        onClick={onDispatch}
        loading={loading}
        recommended={recommendedAction === 'dispatch'}
        className={`w-full ${compact ? 'h-8 text-sm' : 'h-10 text-base'}`}
      >
        DISPATCH GUARDS
      </ActionButton.Critical>
      
      <ActionButton.Warning
        icon={<Radio className="h-4 w-4" />}
        onClick={onBroadcast}
        loading={loading}
        className={`w-full ${compact ? 'h-8 text-sm' : 'h-10 text-base'}`}
      >
        BROADCAST BOLO
      </ActionButton.Warning>
      
      <div className={`grid grid-cols-2 gap-${compact ? '2' : '3'}`}>
        <ActionButton.Critical
          icon={<AlertTriangle className="h-4 w-4" />}
          onClick={onLockdown}
          loading={loading}
          className={compact ? 'h-8 text-sm' : 'h-10 text-base'}
        >
          LOCKDOWN
        </ActionButton.Critical>
        
        <ActionButton.Warning
          icon={<Phone className="h-4 w-4" />}
          onClick={onEscalate}
          loading={loading}
          className={compact ? 'h-8 text-sm' : 'h-10 text-base'}
        >
          ESCALATE
        </ActionButton.Warning>
      </div>
    </div>
  </div>
);

// =============================================================================
// STATE VARIANTS
// =============================================================================

// Empty State for when no activity is selected
export const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center h-64 text-center"
  >
    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
      <Shield className="h-8 w-8 text-gray-600" />
    </div>
    <h3 className="text-white font-medium mb-2">No Activity Selected</h3>
    <p className="text-gray-400 text-sm max-w-md">
      Select a security activity from the list to view detailed information and response options.
    </p>
  </motion.div>
);

// Error State for when something goes wrong
export const ErrorState = ({ 
  message = "Unable to load activity details", 
  onRetry 
}: { 
  message?: string; 
  onRetry?: () => void; 
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center h-64 text-center"
  >
    <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
      <AlertTriangle className="h-8 w-8 text-red-400" />
    </div>
    <h3 className="text-white font-medium mb-2">Error Loading Activity</h3>
    <p className="text-gray-400 text-sm max-w-md mb-4">{message}</p>
    {onRetry && (
      <ActionButton.Secondary
        icon={<AlertTriangle className="h-4 w-4" />}
        onClick={onRetry}
      >
        Try Again
      </ActionButton.Secondary>
    )}
  </motion.div>
);

// Loading State with shimmer effect
export const LoadingState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="p-6 space-y-6"
  >
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-800 rounded w-3/4"></div>
      <div className="h-4 bg-gray-800 rounded w-1/2"></div>
      <div className="space-y-3">
        <div className="h-32 bg-gray-800 rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-800 rounded"></div>
          <div className="h-10 bg-gray-800 rounded"></div>
        </div>
      </div>
    </div>
  </motion.div>
);