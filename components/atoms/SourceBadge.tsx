/**
 * SourceBadge Component
 * Displays the source of an activity with soft, non-anxiety-inducing colors
 * Shows where activities come from (Ambient AI, Lenel, Manual, Agentic Workflows, etc.)
 */

import { 
  Activity, 
  Camera, 
  Shield, 
  User, 
  Zap, 
  Bot, 
  FileText,
  AlertTriangle,
  Eye,
  Smartphone
} from "lucide-react";

type ActivitySource = 
  | 'ambient-ai' 
  | 'lenel' 
  | 'manual' 
  | 'agentic-workflow'
  | 'sop-manager'
  | 'integration'
  | 'system'
  | 'mobile'
  | 'api'
  | 'scheduled';

interface SourceBadgeProps {
  source: ActivitySource;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sourceConfig = {
  'ambient-ai': {
    label: 'Ambient AI',
    icon: Camera,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    hoverColor: 'hover:bg-blue-100',
    description: 'AI-powered video analytics'
  },
  'lenel': {
    label: 'Lenel',
    icon: Shield,
    color: 'bg-green-50 text-green-700 border-green-200',
    hoverColor: 'hover:bg-green-100',
    description: 'Access control system'
  },
  'manual': {
    label: 'Manual',
    icon: User,
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    hoverColor: 'hover:bg-gray-100',
    description: 'Manually created by user'
  },
  'agentic-workflow': {
    label: 'Agentic',
    icon: Bot,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    hoverColor: 'hover:bg-purple-100',
    description: 'LangChain workflow automation'
  },
  'sop-manager': {
    label: 'SOP Manager',
    icon: FileText,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    hoverColor: 'hover:bg-amber-100',
    description: 'Standard operating procedure'
  },
  'integration': {
    label: 'Integration',
    icon: Zap,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    hoverColor: 'hover:bg-indigo-100',
    description: 'Third-party integration'
  },
  'system': {
    label: 'System',
    icon: AlertTriangle,
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    hoverColor: 'hover:bg-slate-100',
    description: 'System-generated event'
  },
  'mobile': {
    label: 'Mobile',
    icon: Smartphone,
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    hoverColor: 'hover:bg-teal-100',
    description: 'Mobile application'
  },
  'api': {
    label: 'API',
    icon: Activity,
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    hoverColor: 'hover:bg-cyan-100',
    description: 'API endpoint'
  },
  'scheduled': {
    label: 'Scheduled',
    icon: Eye,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    hoverColor: 'hover:bg-rose-100',
    description: 'Scheduled task or patrol'
  }
};

const sizeConfig = {
  sm: {
    text: 'text-xs',
    padding: 'px-2 py-1',
    iconSize: 'h-3 w-3'
  },
  md: {
    text: 'text-sm',
    padding: 'px-3 py-1.5',
    iconSize: 'h-4 w-4'
  },
  lg: {
    text: 'text-base',
    padding: 'px-4 py-2',
    iconSize: 'h-5 w-5'
  }
};

export function SourceBadge({ 
  source, 
  className = '', 
  showIcon = true, 
  size = 'sm' 
}: SourceBadgeProps) {
  const config = sourceConfig[source];
  const sizeStyle = sizeConfig[size];
  const IconComponent = config.icon;

  if (!config) {
    // Fallback for unknown sources
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeStyle.padding} ${sizeStyle.text} bg-gray-50 text-gray-600 border-gray-200 ${className}`}>
        {showIcon && <Activity className={sizeStyle.iconSize} />}
        <span className="font-medium">{source}</span>
      </span>
    );
  }

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 rounded-full border transition-colors duration-200
        ${sizeStyle.padding} ${sizeStyle.text} ${config.color} ${config.hoverColor}
        ${className}
      `}
      title={config.description}
    >
      {showIcon && <IconComponent className={sizeStyle.iconSize} />}
      <span className="font-medium">{config.label}</span>
    </span>
  );
}

/**
 * Helper function to determine activity source from activity data
 */
export function getActivitySource(activity: {
  created_by?: string;
  metadata?: Record<string, any>;
  system_tags?: string[];
}): ActivitySource {
  // Check metadata first for explicit source
  if (activity.metadata?.source) {
    return activity.metadata.source as ActivitySource;
  }

  // Check system tags for source indicators
  if (activity.system_tags?.includes('trigger:integration')) {
    if (activity.system_tags.includes('ambient-ai')) return 'ambient-ai';
    if (activity.system_tags.includes('lenel')) return 'lenel';
    return 'integration';
  }

  if (activity.system_tags?.includes('trigger:agentic')) {
    return 'agentic-workflow';
  }

  if (activity.system_tags?.includes('trigger:sop')) {
    return 'sop-manager';
  }

  if (activity.system_tags?.includes('trigger:mobile')) {
    return 'mobile';
  }

  if (activity.system_tags?.includes('trigger:api')) {
    return 'api';
  }

  if (activity.system_tags?.includes('trigger:scheduled')) {
    return 'scheduled';
  }

  // Check created_by field
  if (activity.created_by === 'system') return 'system';
  if (activity.created_by === 'integration') return 'integration';
  
  // Default to manual for user-created activities
  return 'manual';
}

/**
 * Variant for pending activities with gentle pulsing animation
 */
export function PendingSourceBadge({ 
  source, 
  className = '', 
  showIcon = true, 
  size = 'sm' 
}: SourceBadgeProps) {
  return (
    <div className="relative">
      <SourceBadge 
        source={source} 
        className={`animate-pulse ${className}`} 
        showIcon={showIcon} 
        size={size} 
      />
      <div className="absolute inset-0 rounded-full bg-current opacity-20 animate-ping" />
    </div>
  );
}