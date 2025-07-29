import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Target, 
  Car,
  UserPlus,
  Clock,
  Users,
  Building,
  MoreVertical,
  Filter,
  Eye,
  Bell,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Activity,
  Wifi,
  WifiOff,
  Radio,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Import centralized utilities and types
import { formatTimeAgo } from '@/lib/utils/time';
import { guardStatusColors } from '@/lib/tokens/colors';
import { Guard as GuardType } from '@/lib/types/guards';

// Local Guard interface - using imported GuardType as base
interface Guard extends Omit<GuardType, 'id'> {
  id: number; // Keep local id as number for compatibility
  id: number;
  name: string;
  status: 'available' | 'responding' | 'patrolling' | 'investigating' | 'break' | 'off_duty';
  location: string;
  building: string;
  zone: string;
  lastUpdate: Date;
  radio: string;
  assignedActivity?: number | null;
  badge: string;
  shift: string;
  department: string;
  skills?: string[];
  metrics?: {
    activitiesCreated: number;
    incidentsResponded: number;
    patrolsCompleted: number;
    avgResponseTime: string;
    radioCalls: number;
  };
}

interface Building {
  id: string;
  name: string;
  capacity: number;
  currentGuards: number;
  zones: string[];
}

type ViewMode = 'building' | 'all' | 'status' | 'zone';

interface GuardManagementProps {
  guards: Guard[]; // Uses local Guard interface
  onGuardUpdate: (guardId: number, updates: Partial<Guard>) => void;
  onGuardAssign: (guardId: number, activityId: number) => void;
  onGuardStatusChange: (guardId: number, status: Guard['status']) => void;
  onGuardSelect?: (guard: Guard) => void;
}

// Status configuration using centralized colors
const GuardStatus = {
  responding: {
    icon: '🟠',
    priority: 1,
    description: 'Actively responding to incident',
    bgColor: guardStatusColors.responding.background + ' ' + guardStatusColors.responding.color
  },
  investigating: {
    icon: '🟡',
    priority: 2,
    description: 'On scene investigating',
    bgColor: guardStatusColors.investigating.background + ' ' + guardStatusColors.investigating.color
  },
  available: {
    icon: '🟢',
    priority: 3,
    description: 'Ready for assignment',
    bgColor: guardStatusColors.available.background + ' ' + guardStatusColors.available.color
  },
  patrolling: {
    icon: '🔵',
    priority: 4,
    description: 'On routine patrol',
    bgColor: guardStatusColors.patrolling.background + ' ' + guardStatusColors.patrolling.color
  },
  break: {
    icon: '⏸️',
    priority: 5,
    description: 'On scheduled break',
    bgColor: guardStatusColors.break.background + ' ' + guardStatusColors.break.color
  },
  off_duty: {
    icon: '⚫',
    priority: 6,
    description: 'Not on shift',
    bgColor: guardStatusColors.off_duty.background + ' ' + guardStatusColors.off_duty.color
  }
};

// Mock buildings data
const mockBuildings: Building[] = [
  { id: 'building-a', name: 'Building A', capacity: 5, currentGuards: 4, zones: ['Zone A-1', 'Zone A-2', 'Zone A-3'] },
  { id: 'building-b', name: 'Building B', capacity: 3, currentGuards: 3, zones: ['Zone B-1', 'Zone B-2'] },
  { id: 'parking', name: 'Parking Lot', capacity: 2, currentGuards: 1, zones: ['Sector P-1', 'Sector P-2'] },
  { id: 'perimeter', name: 'Perimeter', capacity: 2, currentGuards: 2, zones: ['North Gate', 'South Gate'] }
];

// formatTimeAgo now imported from centralized utilities

const getMetrics = (guard: Guard, status: Guard['status']) => {
  switch (status) {
    case 'responding':
      return `${formatTimeAgo(guard.lastUpdate)} / INC-${guard.assignedActivity || '---'}`;
    case 'patrolling':
      return `${formatTimeAgo(guard.lastUpdate)} / Route`;
    case 'break':
      return `Back: ${Math.floor(Math.random() * 30) + 5}m`;
    case 'available':
      return `${formatTimeAgo(guard.lastUpdate)} / Ready`;
    case 'off_duty':
      return guard.shift ? `Returns: ${guard.shift.split(' - ')[1]}` : 'Off Duty';
    default:
      return formatTimeAgo(guard.lastUpdate);
  }
};

// Enhanced Guard Card Component
interface GuardCardProps {
  guard: Guard;
  onClick: () => void;
  onQuickAction: (action: string, guard: Guard) => void;
  isExpanded?: boolean;
  isCompact?: boolean;
}

function GuardCard({ guard, onClick, onQuickAction, isExpanded = false, isCompact = true }: GuardCardProps) {
  const statusConfig = GuardStatus[guard.status];
  const [isHovered, setIsHovered] = useState(false);
  
  // Status indicator dot
  const StatusDot = ({ status }: { status: Guard['status'] }) => (
    <div 
      className={`w-3 h-3 rounded-full ${statusConfig.color === '#FF6B35' ? 'bg-orange-500' : 
        statusConfig.color === '#FFD93D' ? 'bg-yellow-500' :
        statusConfig.color === '#6BCF7F' ? 'bg-green-500' :
        statusConfig.color === '#4A90E2' ? 'bg-blue-500' :
        statusConfig.color === '#95A5A6' ? 'bg-gray-400' : 'bg-gray-600'
      } ${status === 'responding' || status === 'investigating' ? 'animate-pulse' : ''}`}
    />
  );

  if (isCompact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`relative border rounded p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                isExpanded ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={onClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Status indicator */}
              <div className="absolute top-2 right-2">
                <StatusDot status={guard.status} />
              </div>
              
              <div className="space-y-1.5">
                {/* Name */}
                <div className="font-medium text-sm truncate pr-4">{guard.name}</div>
                
                {/* Zone */}
                <div className="text-xs text-gray-600 truncate">{guard.zone}</div>
                
                {/* Radio channel */}
                <div className="flex items-center gap-1">
                  <Radio className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{guard.radio}</span>
                </div>

                {/* Quick actions on hover */}
                {isHovered && (
                  <div className="flex gap-1 pt-1 animate-in fade-in-0 duration-200">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAction('call', guard);
                      }}
                    >
                      <Phone className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAction('locate', guard);
                      }}
                    >
                      <MapPin className="h-2.5 w-2.5" />
                    </Button>
                    {guard.status === 'available' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 hover:bg-green-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAction('assign', guard);
                        }}
                      >
                        <Target className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-medium">{guard.name}</div>
              <div className="text-sm text-muted-foreground">{guard.badge}</div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${statusConfig.bgColor}`}>
                  {statusConfig.icon} {guard.status.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm">📍 {guard.location}</div>
              <div className="text-sm">📻 {guard.radio}</div>
              <div className="text-sm">⏰ {formatTimeAgo(guard.lastUpdate)}</div>
              {guard.skills && (
                <div className="text-sm">
                  🏆 {guard.skills.join(', ')}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded view for detailed mode
  return (
    <div 
      className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
        isExpanded ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusDot status={guard.status} />
            <span className="font-medium text-sm">{guard.name}</span>
          </div>
          <Badge className={`text-xs ${statusConfig.bgColor}`}>
            {statusConfig.icon} {guard.status.toUpperCase()}
          </Badge>
        </div>

        <div className="text-xs text-gray-600">{guard.location}</div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">📻 {guard.radio}</span>
          <span className="text-gray-500">{formatTimeAgo(guard.lastUpdate)}</span>
        </div>

        {guard.skills && (
          <div className="flex gap-1">
            {guard.skills.map(skill => (
              <Badge key={skill} variant="outline" className="text-xs px-1 py-0">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onQuickAction('call', guard); }}>
              <Phone className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onQuickAction('message', guard); }}>
              <MessageCircle className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onQuickAction('locate', guard); }}>
              <MapPin className="h-3 w-3" />
            </Button>
          </div>
          
          {guard.status === 'available' && (
            <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={(e) => { e.stopPropagation(); onQuickAction('assign', guard); }}>
              Assign
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Building View with Collapsible Sections
interface BuildingViewProps {
  guards: Guard[];
  buildings: Building[];
  onGuardClick: (guard: Guard) => void;
  onQuickAction: (action: string, guard: Guard) => void;
  selectedGuard: Guard | null;
  isCompact?: boolean;
}

function BuildingView({ guards, buildings, onGuardClick, onQuickAction, selectedGuard, isCompact = true }: BuildingViewProps) {
  const [collapsedBuildings, setCollapsedBuildings] = useState<Set<string>>(new Set());

  const getGuardsByBuilding = (buildingId: string) => {
    return guards.filter(guard => guard.building === buildingId);
  };

  const getEmptyPosts = (building: Building) => {
    const currentGuards = getGuardsByBuilding(building.id).length;
    return Math.max(0, building.capacity - currentGuards);
  };

  const toggleBuilding = (buildingId: string) => {
    const newCollapsed = new Set(collapsedBuildings);
    if (newCollapsed.has(buildingId)) {
      newCollapsed.delete(buildingId);
    } else {
      newCollapsed.add(buildingId);
    }
    setCollapsedBuildings(newCollapsed);
  };

  const getCapacityPercentage = (building: Building) => {
    const buildingGuards = getGuardsByBuilding(building.id);
    return (buildingGuards.length / building.capacity) * 100;
  };

  const getStatusBreakdown = (buildingGuards: Guard[]) => {
    const breakdown = buildingGuards.reduce((acc, guard) => {
      acc[guard.status] = (acc[guard.status] || 0) + 1;
      return acc;
    }, {} as Record<Guard['status'], number>);
    return breakdown;
  };

  return (
    <div className="space-y-2">
      {buildings.map(building => {
        const buildingGuards = getGuardsByBuilding(building.id);
        const emptyPosts = getEmptyPosts(building);
        const isCollapsed = collapsedBuildings.has(building.id);
        const capacityPercentage = getCapacityPercentage(building);
        const statusBreakdown = getStatusBreakdown(buildingGuards);
        
        return (
          <Collapsible key={building.id} open={!isCollapsed} onOpenChange={() => toggleBuilding(building.id)}>
            <div className="border rounded-lg bg-white overflow-hidden">
              {/* Building Header */}
              <CollapsibleTrigger asChild>
                <div className="p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <Building className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-sm">{building.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {buildingGuards.length}/{building.capacity}
                      </Badge>
                    </div>
                    
                    {/* Quick status indicators */}
                    <div className="flex items-center gap-2">
                      {/* Status dots */}
                      <div className="flex gap-1">
                        {statusBreakdown.responding > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <span>{statusBreakdown.responding} Responding</span>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {statusBreakdown.available > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <span>{statusBreakdown.available} Available</span>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {statusBreakdown.patrolling > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <span>{statusBreakdown.patrolling} Patrolling</span>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      
                      {emptyPosts > 0 && (
                        <Badge variant="outline" className="text-yellow-700 bg-yellow-50 text-xs px-1 py-0">
                          {emptyPosts} Open
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Capacity Progress Bar */}
                  <div className="mt-2">
                    <Progress 
                      value={capacityPercentage} 
                      className="h-1"
                      style={{
                        '--progress-background': capacityPercentage === 100 ? '#10b981' : 
                                                capacityPercentage >= 80 ? '#f59e0b' : '#ef4444'
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Building Content */}
              <CollapsibleContent>
                <div className="p-3">
                  <div className={`flex flex-wrap gap-2`}>
                    {buildingGuards.map(guard => (
                      <div key={guard.id} className={isCompact ? "w-[calc(25%-6px)]" : "w-[calc(33.333%-8px)]"}>
                        <GuardCard
                          guard={guard}
                          onClick={() => onGuardClick(guard)}
                          onQuickAction={onQuickAction}
                          isExpanded={selectedGuard?.id === guard.id}
                          isCompact={isCompact}
                        />
                      </div>
                    ))}
                    
                    {/* Empty posts indicators */}
                    {Array.from({ length: Math.min(emptyPosts, isCompact ? 2 : 3) }).map((_, index) => (
                      <div
                        key={`empty-${index}`}
                        className={`${isCompact ? "w-[calc(25%-6px)]" : "w-[calc(33.333%-8px)]"} border border-dashed border-gray-300 rounded p-3 flex flex-col items-center justify-center text-gray-500 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors min-h-[90px]`}
                        onClick={() => console.log(`Assign to ${building.zones[index] || `Post ${index + 1}`}`)}
                      >
                        <UserPlus className="h-4 w-4 mb-1" />
                        <span className="text-xs font-medium">Assign</span>
                        <span className="text-xs text-gray-400">{building.zones[index] || `Post ${index + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}

// Enhanced Status View Component
interface StatusViewProps {
  guards: Guard[];
  onGuardClick: (guard: Guard) => void;
  onQuickAction: (action: string, guard: Guard) => void;
  selectedGuard: Guard | null;
  isCompact?: boolean;
}

function StatusView({ guards, onGuardClick, onQuickAction, selectedGuard, isCompact = true }: StatusViewProps) {
  const [collapsedStatuses, setCollapsedStatuses] = useState<Set<Guard['status']>>(new Set());

  const getGuardsByStatus = (status: Guard['status']) => {
    return guards.filter(guard => guard.status === status);
  };

  const toggleStatus = (status: Guard['status']) => {
    const newCollapsed = new Set(collapsedStatuses);
    if (newCollapsed.has(status)) {
      newCollapsed.delete(status);
    } else {
      newCollapsed.add(status);
    }
    setCollapsedStatuses(newCollapsed);
  };

  const statusOrder: Guard['status'][] = ['responding', 'investigating', 'available', 'patrolling', 'break', 'off_duty'];

  return (
    <div className="space-y-2">
      {statusOrder.map(status => {
        const statusGuards = getGuardsByStatus(status);
        if (statusGuards.length === 0) return null;
        
        const statusConfig = GuardStatus[status];
        const isCollapsed = collapsedStatuses.has(status);
        
        return (
          <Collapsible key={status} open={!isCollapsed} onOpenChange={() => toggleStatus(status)}>
            <div className="border rounded-lg bg-white overflow-hidden">
              <CollapsibleTrigger asChild>
                <div className="p-2 hover:bg-gray-50 cursor-pointer transition-colors border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      <span className="text-lg">{statusConfig.icon}</span>
                      <span className="text-sm font-medium">
                        {status.toUpperCase()} ({statusGuards.length})
                      </span>
                    </div>
                    <Badge className={`text-xs ${statusConfig.bgColor}`}>
                      {statusGuards.length}
                    </Badge>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="p-2">
                  <div className={`flex flex-wrap gap-2`}>
                    {statusGuards.map(guard => (
                      <div key={guard.id} className={isCompact ? "w-[calc(20%-6.4px)]" : "w-[calc(33.333%-8px)]"}>
                        <GuardCard
                          guard={guard}
                          onClick={() => onGuardClick(guard)}
                          onQuickAction={onQuickAction}
                          isExpanded={selectedGuard?.id === guard.id}
                          isCompact={isCompact}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}

// Enhanced All Guards View Component
interface AllGuardsViewProps {
  guards: Guard[];
  onGuardClick: (guard: Guard) => void;
  onQuickAction: (action: string, guard: Guard) => void;
  selectedGuard: Guard | null;
  isCompact?: boolean;
}

function AllGuardsView({ guards, onGuardClick, onQuickAction, selectedGuard, isCompact = true }: AllGuardsViewProps) {
  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-medium">{guards.length}</span> 
            <span className="text-gray-600 ml-1">Total Guards</span>
          </div>
          <div className="flex gap-3">
            {Object.entries(GuardStatus).map(([status, config]) => {
              const count = guards.filter(g => g.status === status).length;
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center gap-1">
                  <span>{config.icon}</span>
                  <span className="text-xs text-gray-600">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guards Grid */}
      <div className={`flex flex-wrap gap-2`}>
        {guards.map(guard => (
          <div key={guard.id} className={isCompact ? "w-[calc(16.666%-10px)]" : "w-[calc(25%-6px)]"}>
            <GuardCard
              guard={guard}
              onClick={() => onGuardClick(guard)}
              onQuickAction={onQuickAction}
              isExpanded={selectedGuard?.id === guard.id}
              isCompact={isCompact}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Guard Management Component
export function GuardManagement({ 
  guards, 
  onGuardUpdate, 
  onGuardAssign, 
  onGuardStatusChange,
  onGuardSelect
}: GuardManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('building');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(true);
  const [filters, setFilters] = useState({
    status: [] as Guard['status'][],
    building: 'all',
    shift: 'current'
  });

  // Filter guards based on search and filters
  const filteredGuards = guards.filter(guard => {
    const matchesSearch = !searchQuery || 
      guard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guard.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guard.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filters.status.length === 0 || filters.status.includes(guard.status);
    const matchesBuilding = filters.building === 'all' || guard.building === filters.building;
    
    return matchesSearch && matchesStatus && matchesBuilding;
  });

  // Get summary statistics
  const getStatusCount = (status: Guard['status']) => {
    return filteredGuards.filter(guard => guard.status === status).length;
  };

  const getTotalActive = () => {
    return filteredGuards.filter(guard => 
      guard.status !== 'off_duty' && guard.status !== 'break'
    ).length;
  };

  const getCriticalCount = () => {
    return filteredGuards.filter(guard => 
      guard.status === 'responding' || guard.status === 'investigating'
    ).length;
  };

  // Handle guard actions
  const handleQuickAction = useCallback((action: string, guard: Guard) => {
    switch (action) {
      case 'call':
        console.log(`Calling ${guard.name}`);
        break;
      case 'message':
        console.log(`Messaging ${guard.name}`);
        break;
      case 'locate':
        console.log(`Locating ${guard.name} on map`);
        break;
      case 'assign':
        console.log(`Assigning ${guard.name} to incident`);
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }, []);

  const handleGuardClick = useCallback((guard: Guard) => {
    setSelectedGuard(selectedGuard?.id === guard.id ? null : guard);
    onGuardSelect?.(guard);
  }, [selectedGuard, onGuardSelect]);

  // Enhanced render view based on mode
  const renderView = () => {
    switch (viewMode) {
      case 'building':
        return (
          <BuildingView
            guards={filteredGuards}
            buildings={mockBuildings}
            onGuardClick={handleGuardClick}
            onQuickAction={handleQuickAction}
            selectedGuard={selectedGuard}
            isCompact={isCompactMode}
          />
        );
      case 'status':
        return (
          <StatusView
            guards={filteredGuards}
            onGuardClick={handleGuardClick}
            onQuickAction={handleQuickAction}
            selectedGuard={selectedGuard}
            isCompact={isCompactMode}
          />
        );
      case 'all':
        return (
          <AllGuardsView
            guards={filteredGuards}
            onGuardClick={handleGuardClick}
            onQuickAction={handleQuickAction}
            selectedGuard={selectedGuard}
            isCompact={isCompactMode}
          />
        );
      case 'zone':
        return (
          <BuildingView
            guards={filteredGuards}
            buildings={mockBuildings}
            onGuardClick={handleGuardClick}
            onQuickAction={handleQuickAction}
            selectedGuard={selectedGuard}
            isCompact={isCompactMode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-white max-h-[350px] border rounded-lg">
        {/* Enhanced Header with Visual Dashboard */}
        <div className="flex-shrink-0 p-3 border-b bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Guard Management</h2>
              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs px-2 py-1">
                {getTotalActive()}/{guards.length} Active
              </Badge>
            </div>
            
            {/* Status Overview */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-xs text-gray-600 font-medium">{getCriticalCount()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600 font-medium">{getStatusCount('available')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-600 font-medium">{getStatusCount('patrolling')}</span>
              </div>
            </div>
          </div>

          {/* Enhanced Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-auto">
              <TabsList className="h-8 p-1">
                <TabsTrigger value="building" className="text-xs px-2 py-1">Buildings</TabsTrigger>
                <TabsTrigger value="status" className="text-xs px-2 py-1">Status</TabsTrigger>
                <TabsTrigger value="all" className="text-xs px-2 py-1">All</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative flex-1 max-w-40">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search guards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>

            {/* Density Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCompactMode(!isCompactMode)}
                    className="h-8 w-8 p-0"
                  >
                    {isCompactMode ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>{isCompactMode ? 'Detailed View' : 'Compact View'}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Quick Filters */}
            <Button
              size="sm"
              variant={filters.status.includes('available') ? 'default' : 'outline'}
              onClick={() => {
                const newStatus = filters.status.includes('available') 
                  ? filters.status.filter(s => s !== 'available')
                  : [...filters.status, 'available'];
                setFilters(prev => ({ ...prev, status: newStatus }));
              }}
              className="h-8 px-2 text-xs"
            >
              🟢 Available
            </Button>
            
            <Button
              size="sm"
              variant={getCriticalCount() > 0 && filters.status.some(s => ['responding', 'investigating'].includes(s)) ? 'default' : 'outline'}
              onClick={() => {
                const critical = ['responding', 'investigating'];
                const hasCritical = critical.some(s => filters.status.includes(s));
                const newStatus = hasCritical
                  ? filters.status.filter(s => !critical.includes(s))
                  : [...filters.status, ...critical];
                setFilters(prev => ({ ...prev, status: newStatus }));
              }}
              className="h-8 px-2 text-xs"
            >
              🚨 Critical
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-2">
          {renderView()}
        </ScrollArea>

        {/* Advanced Filters Modal */}
        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Advanced Filters</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(GuardStatus).map(([status, config]) => (
                    <label key={status} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status as Guard['status'])}
                        onChange={(e) => {
                          const newStatus = e.target.checked
                            ? [...filters.status, status as Guard['status']]
                            : filters.status.filter(s => s !== status);
                          setFilters(prev => ({ ...prev, status: newStatus }));
                        }}
                      />
                      <span className="text-sm">{config.icon} {status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Building</label>
                <Select value={filters.building} onValueChange={(value) => setFilters(prev => ({ ...prev, building: value }))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buildings</SelectItem>
                    {mockBuildings.map(building => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setShowFilters(false)} className="flex-1">
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({ status: [], building: 'all', shift: 'current' });
                    setShowFilters(false);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}