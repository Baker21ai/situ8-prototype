import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft, 
  Camera, 
  Map, 
  Shield, 
  Clock,
  CheckCircle
} from 'lucide-react';
import { ActivityData } from '../../lib/types/activity';
import { useActivityStore } from '../../stores/activityStore';
import { DialOption } from './ModularCommandCenter';

interface SemiCircleDialProps {
  selectedOption: DialOption;
  onOptionSelect: (option: DialOption) => void;
  activity: ActivityData;
  className?: string;
}

const dialOptions = [
  {
    id: 'back' as DialOption,
    label: 'Back',
    icon: ArrowLeft,
    description: 'Return to activities',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    position: { left: '0%', transform: 'translateX(0%)' }
  },
  {
    id: 'cameras' as DialOption,
    label: 'Cameras',
    icon: Camera,
    description: 'Security cameras',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    position: { left: '25%', transform: 'translateX(-50%)' }
  },
  {
    id: 'map' as DialOption,
    label: 'Map',
    icon: Map,
    description: 'Interactive map',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    position: { left: '50%', transform: 'translateX(-50%)' }
  },
  {
    id: 'guards' as DialOption,
    label: 'Guards',
    icon: Shield,
    description: 'Guard tracking',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    position: { left: '75%', transform: 'translateX(-50%)' }
  },
  {
    id: 'timeline' as DialOption,
    label: 'Timeline',
    icon: Clock,
    description: 'Event timeline',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    position: { left: '100%', transform: 'translateX(-100%)' }
  }
];

export const SemiCircleDial: React.FC<SemiCircleDialProps> = ({
  selectedOption,
  onOptionSelect,
  activity,
  className = ''
}) => {
  const { filteredActivities } = useActivityStore();
  // Get contextual counts for badges
  const getCameraCount = () => {
    // Mock: In real implementation, filter cameras by activity location
    return 3;
  };

  const getGuardCount = () => {
    // Mock: In real implementation, get guards assigned to this activity
    return activity.assignedTo ? 1 : 0;
  };

  const getTimelineEvents = () => {
    // Mock: In real implementation, get related events
    return 8;
  };

  // Approvals moved to separate surface; no dial badge needed

  const getContextualBadge = (option: DialOption) => {
    switch (option) {
      case 'approvals':
        return getPendingApprovals();
      case 'cameras':
        return getCameraCount();
      case 'guards':
        return getGuardCount();
      case 'timeline':
        return getTimelineEvents();
      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Semi-circle background */}
      <div className="relative">
        {/* Background Arc */}
        <svg
          width="400"
          height="120"
          viewBox="0 0 400 120"
          className="absolute inset-0"
        >
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f3f4f6" />
              <stop offset="50%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#f3f4f6" />
            </linearGradient>
          </defs>
          
          {/* Main arc */}
          <path
            d="M 40 100 A 160 160 0 0 1 360 100"
            stroke="url(#arcGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* Selection indicator arc */}
          <path
            d="M 40 100 A 160 160 0 0 1 360 100"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-blue-500 opacity-30"
            strokeDasharray="8 4"
          />
        </svg>

        {/* Dial Options */}
        <div className="relative h-[120px] w-[400px]">
          {dialOptions.map((option) => {
            const isSelected = selectedOption === option.id;
            const Icon = option.icon;
            const badgeCount = getContextualBadge(option.id);

            return (
              <div
                key={option.id}
                className="absolute top-0"
                style={option.position}
              >
                <div className="flex flex-col items-center">
                  {/* Option Button */}
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="lg"
                    onClick={() => onOptionSelect(option.id)}
                    className={`
                      h-16 w-16 rounded-full p-0 relative transition-all duration-300
                      ${isSelected 
                        ? 'scale-110 shadow-lg ring-2 ring-blue-500 ring-offset-2' 
                        : 'hover:scale-105 hover:shadow-md'
                      }
                      ${isSelected ? '' : option.bgColor}
                    `}
                  >
                    <Icon 
                      className={`h-6 w-6 ${
                        isSelected ? 'text-white' : option.color
                      }`} 
                    />
                    
                    {/* Badge for contextual counts */}
                    {badgeCount !== null && badgeCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {badgeCount}
                      </Badge>
                    )}
                  </Button>

                  {/* Option Label */}
                  <div className="mt-3 text-center">
                    <div className={`text-sm font-medium ${
                      isSelected ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selection Indicator */}
        <div className="absolute top-[85px] left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-blue-500 opacity-70" />
        </div>

        {/* Activity Context Indicator */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
          <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                activity.priority === 'high' ? 'bg-red-500' :
                activity.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              {activity.title}
            </div>
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default SemiCircleDial;