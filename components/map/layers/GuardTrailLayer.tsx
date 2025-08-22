import React, { useEffect, useState } from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMockPatrolStore, GuardTrail, PatrolPosition, initializePatrolSimulation } from '../../../stores/mock/useMockPatrolStore';
import { Shield, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface GuardTrailLayerProps {
  visible: boolean;
  selectedGuardId?: number;
  timeRange?: {
    start: string;
    end: string;
  };
  onPositionClick?: (position: PatrolPosition) => void;
}

// Trail colors for different guards
const getGuardTrailColor = (guardId: number): string => {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green  
    '#8B5CF6', // Purple
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#06B6D4', // Cyan
  ];
  return colors[guardId % colors.length];
};

// Create checkpoint marker
const createCheckpointMarker = (position: PatrolPosition) => {
  const getStatusColor = (status: PatrolPosition['status']) => {
    switch (status) {
      case 'checked': return '#10B981';
      case 'missed': return '#EF4444';
      case 'incident': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const color = getStatusColor(position.status);
  const isCheckpoint = position.checkPoint !== null;

  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: ${isCheckpoint ? '24px' : '12px'};
        height: ${isCheckpoint ? '24px' : '12px'};
        border-radius: 50%;
        border: ${isCheckpoint ? '3px' : '2px'} solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        ${isCheckpoint ? `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M9 11l3 3l8-8"></path>
          </svg>
        ` : ''}
        ${position.status === 'incident' ? `
          <div style="
            position: absolute;
            top: -3px;
            right: -3px;
            width: 8px;
            height: 8px;
            background: #DC2626;
            border-radius: 50%;
            border: 1px solid white;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `,
    className: 'checkpoint-marker',
    iconSize: [isCheckpoint ? 24 : 12, isCheckpoint ? 24 : 12],
    iconAnchor: [isCheckpoint ? 12 : 6, isCheckpoint ? 12 : 6],
    popupAnchor: [0, isCheckpoint ? -12 : -6],
  });
};

export const GuardTrailLayer: React.FC<GuardTrailLayerProps> = ({
  visible,
  selectedGuardId,
  timeRange,
  onPositionClick
}) => {
  const { 
    getGuardTrail, 
    getAllGuardTrails,
    playbackState,
    startPlayback,
    pausePlayback,
    setPlaybackSpeed,
    setPlaybackIndex
  } = useMockPatrolStore();

  const [selectedTrail, setSelectedTrail] = useState<GuardTrail | null>(null);
  const [trails, setTrails] = useState<GuardTrail[]>([]);

  // Initialize simulation on component mount
  useEffect(() => {
    initializePatrolSimulation();
  }, []);

  // Load trail data
  useEffect(() => {
    if (selectedGuardId) {
      const trail = getGuardTrail(selectedGuardId, timeRange);
      setSelectedTrail(trail);
      setTrails([trail]);
    } else {
      const allTrails = getAllGuardTrails(timeRange);
      setTrails(allTrails);
      setSelectedTrail(null);
    }
  }, [selectedGuardId, timeRange, getGuardTrail, getAllGuardTrails]);

  if (!visible || trails.length === 0) return null;

  const handlePositionClick = (position: PatrolPosition) => {
    onPositionClick?.(position);
  };

  const handlePlaybackControl = (trail: GuardTrail) => {
    if (playbackState.isPlaying && playbackState.selectedTrail?.guardId === trail.guardId) {
      pausePlayback();
    } else {
      startPlayback(trail);
    }
  };

  const getStatusIcon = (status: PatrolPosition['status']) => {
    switch (status) {
      case 'checked': return CheckCircle;
      case 'missed': return XCircle;
      case 'incident': return AlertCircle;
      default: return MapPin;
    }
  };

  return (
    <>
      {trails.map((trail) => {
        if (trail.positions.length === 0) return null;

        const color = getGuardTrailColor(trail.guardId);
        const isPlayingThis = playbackState.isPlaying && 
                             playbackState.selectedTrail?.guardId === trail.guardId;

        // Create polyline path from positions
        const pathCoordinates: [number, number][] = trail.positions.map(pos => [
          pos.position.latitude,
          pos.position.longitude
        ]);

        // For playback, only show up to current index
        const visiblePath = isPlayingThis 
          ? pathCoordinates.slice(0, playbackState.currentIndex + 1)
          : pathCoordinates;

        return (
          <React.Fragment key={trail.guardId}>
            {/* Trail polyline */}
            <Polyline
              positions={visiblePath}
              pathOptions={{
                color: color,
                weight: 3,
                opacity: 0.8,
                dashArray: isPlayingThis ? '5, 5' : undefined
              }}
            />

            {/* Position markers */}
            {trail.positions.map((position, index) => {
              // During playback, only show markers up to current position
              if (isPlayingThis && index > playbackState.currentIndex) {
                return null;
              }

              // Show all checkpoints, but only some patrol positions to avoid clutter
              const isCheckpoint = position.checkPoint !== null;
              const showMarker = isCheckpoint || index % 3 === 0 || index === trail.positions.length - 1;

              if (!showMarker) return null;

              return (
                <Marker
                  key={`${trail.guardId}-${position.id}`}
                  position={[position.position.latitude, position.position.longitude]}
                  icon={createCheckpointMarker(position)}
                  eventHandlers={{
                    click: () => handlePositionClick(position),
                  }}
                >
                  <Popup>
                    <Card className="w-72 border-0">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-4 w-4" style={{ color }} />
                            {position.guardName}
                          </CardTitle>
                          <Badge 
                            variant={position.status === 'checked' ? 'default' : 
                                    position.status === 'missed' ? 'destructive' : 
                                    position.status === 'incident' ? 'secondary' : 'outline'}
                            className="capitalize"
                          >
                            {position.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(position.timestamp).toLocaleString()}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {position.checkPoint && (
                          <div>
                            <span className="font-medium text-sm">Checkpoint:</span>
                            <p className="text-sm text-muted-foreground">
                              {position.checkPointName} ({position.checkPoint})
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium">Location:</span>
                            <p className="text-muted-foreground">
                              {position.position.building} • Floor {position.position.floor}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Accuracy:</span>
                            <p className="text-muted-foreground">
                              ±{position.position.accuracy}m
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="font-medium text-sm">Route:</span>
                          <p className="text-sm text-muted-foreground capitalize">
                            {position.patrolRoute.replace('-', ' ')}
                          </p>
                        </div>

                        {position.notes && (
                          <div>
                            <span className="font-medium text-sm">Notes:</span>
                            <p className="text-sm text-muted-foreground">
                              {position.notes}
                            </p>
                          </div>
                        )}

                        {position.status === 'incident' && (
                          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-md">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-orange-800">
                              Incident reported at this location
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Popup>
                </Marker>
              );
            })}

            {/* Trail summary marker at the end */}
            {trail.positions.length > 0 && (
              <Marker
                position={[
                  trail.positions[trail.positions.length - 1].position.latitude,
                  trail.positions[trail.positions.length - 1].position.longitude
                ]}
                icon={L.divIcon({
                  html: `
                    <div style="
                      background: ${color};
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      border: 3px solid white;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <path d="M20 8v6M23 11l-3 3-3-3"></path>
                      </svg>
                    </div>
                  `,
                  className: 'guard-summary-marker',
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                  popupAnchor: [0, -16],
                })}
              >
                <Popup>
                  <Card className="w-80 border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" style={{ color }} />
                        {trail.guardName} - Patrol Summary
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trail.startTime).toLocaleDateString()} Patrol
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Distance:</span>
                          <p className="text-muted-foreground">
                            {(trail.totalDistance / 1000).toFixed(1)} km
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Compliance:</span>
                          <p className="text-muted-foreground">
                            {trail.complianceScore}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Checkpoints:</span>
                          <p className="text-muted-foreground">
                            {trail.checkPointsCompleted} completed
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Missed:</span>
                          <p className="text-muted-foreground">
                            {trail.checkPointsMissed} checkpoints
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant={isPlayingThis ? "secondary" : "outline"}
                          onClick={() => handlePlaybackControl(trail)}
                          className="flex-1"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {isPlayingThis ? 'Pause' : 'Replay'}
                        </Button>
                        {isPlayingThis && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPlaybackSpeed(playbackState.speed === 1 ? 2 : playbackState.speed === 2 ? 4 : 1)}
                            >
                              {playbackState.speed}x
                            </Button>
                          </div>
                        )}
                      </div>

                      {isPlayingThis && (
                        <div className="pt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{playbackState.currentIndex + 1} / {trail.positions.length}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${((playbackState.currentIndex + 1) / trail.positions.length) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Popup>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};