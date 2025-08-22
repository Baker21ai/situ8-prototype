import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SemiCircleDial } from './SemiCircleDial';
import { EnlargedActivityCard } from './EnlargedActivityCard';
import { CamerasPanel } from './panels/CamerasPanel';
import { GuardsPanel } from './panels/GuardsPanel';
import { TimelinePanel } from './panels/TimelinePanel';
import { EnhancedInteractiveMap } from '../map/EnhancedInteractiveMap';
import { ActivityData } from '../../lib/types/activity';
import { X, Maximize2 } from 'lucide-react';

export type DialOption = 'back' | 'cameras' | 'map' | 'guards' | 'timeline';

interface ModularCommandCenterProps {
  activity: ActivityData;
  onClose: () => void;
  className?: string;
}

export const ModularCommandCenter: React.FC<ModularCommandCenterProps> = ({
  activity,
  onClose,
  className = ''
}) => {
  const [selectedOption, setSelectedOption] = useState<DialOption>('map');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle back option selection
  const handleDialChange = (option: DialOption) => {
    if (option === 'back') {
      onClose();
      return;
    }
    setSelectedOption(option);
  };

  // Determine which panels should be visible
  const showCamerasPanel = selectedOption === 'cameras' || selectedOption === 'timeline';
  const showGuardsPanel = selectedOption === 'guards' || selectedOption === 'timeline';
  const showTimelinePanel = selectedOption === 'timeline';

  // Calculate dynamic grid layout based on visible panels with responsive breakpoints
  const getGridLayout = () => {
    if (selectedOption === 'map') {
      return 'grid-cols-1'; // Map only - same on all screen sizes
    } else if (selectedOption === 'cameras') {
      return 'grid-cols-1 md:grid-cols-2'; // Stack on mobile, side-by-side on desktop
    } else if (selectedOption === 'guards') {
      return 'grid-cols-1 md:grid-cols-2'; // Stack on mobile, side-by-side on desktop
    } else if (selectedOption === 'timeline') {
      // On mobile: stack all panels, on tablet: 2 cols, on desktop: 4 cols
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    }
    return 'grid-cols-1';
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm ${className}`}>
      <div className={`
        h-full w-full bg-background transition-all duration-300 
        ${isFullscreen ? 'p-0' : 'p-4'}
      `}>
        <Card className="h-full w-full border-0 shadow-2xl overflow-hidden">
          {/* Header Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Command Center Active
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Content Grid */}
          <div className="h-full flex flex-col">
            {/* Top Section - Dynamic Panel Layout */}
            <div className="flex-1 p-6 pb-0">
              <div className={`h-full grid gap-4 transition-all duration-300 ease-in-out ${getGridLayout()}`}>
                {/* Approvals moved to separate surface (not in dial projection) */}

                {/* Cameras Panel (Left) */}
                {showCamerasPanel && (
                  <div className="h-full animate-in slide-in-from-left duration-300">
                    <CamerasPanel 
                      activity={activity}
                      isVisible={showCamerasPanel}
                      className="h-full"
                    />
                  </div>
                )}

                {/* Map Panel (Center) */}
                <div className={`h-full transition-all duration-300 ease-in-out ${
                  selectedOption === 'map' ? 'col-span-1' : 
                  selectedOption === 'timeline' ? 'col-span-1 md:col-span-2' : 'col-span-1'
                }`}>
                  <Card className="h-full">
                    <div className="h-full relative">
                      {/* Map Title Bar */}
                      <div className="absolute top-2 left-2 z-10">
                        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
                          Security Map - {activity.location}
                        </Badge>
                      </div>
                      
                      {/* Enhanced Map */}
                      <div className="h-full w-full rounded-lg overflow-hidden">
                        <EnhancedInteractiveMap
                          onZoneClick={(building, zone) => {
                            console.log('Zone clicked:', building, zone);
                          }}
                          onGuardClick={(guardName) => {
                            console.log('Guard clicked:', guardName);
                            setSelectedOption('guards');
                          }}
                          activityFilter={{
                            location: activity.location,
                            building: activity.building || undefined,
                            floor: activity.floor || undefined,
                            zone: activity.zone || undefined
                          }}
                          className="h-full w-full"
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Guards Panel (Right) */}
                {showGuardsPanel && (
                  <div className="h-full animate-in slide-in-from-right duration-300">
                    <GuardsPanel 
                      activity={activity}
                      isVisible={showGuardsPanel}
                      className="h-full"
                    />
                  </div>
                )}

                {/* Timeline Panel (Far Right) */}
                {showTimelinePanel && (
                  <div className="h-full animate-in slide-in-from-right duration-500">
                    <TimelinePanel 
                      activity={activity}
                      isVisible={showTimelinePanel}
                      className="h-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Middle Section - Semi-Circle Dial */}
            <div className="py-6 px-6">
              <div className="flex justify-center">
                <SemiCircleDial
                  selectedOption={selectedOption}
                  onOptionSelect={handleDialChange}
                  activity={activity}
                />
              </div>
            </div>

            {/* Bottom Section - Enlarged Activity Card */}
            <div className="p-3 md:p-6 pt-0">
              <EnlargedActivityCard 
                activity={activity}
                onClose={onClose}
                onOptionChange={setSelectedOption}
                className="animate-in slide-in-from-bottom duration-300"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ModularCommandCenter;