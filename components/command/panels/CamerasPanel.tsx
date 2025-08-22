import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ScrollArea } from '../../ui/scroll-area';
import { 
  Camera, 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  AlertTriangle,
  CheckCircle,
  Circle
} from 'lucide-react';
import { ActivityData } from '../../../lib/types/activity';
import { useMockAssetStore } from '../../../stores/mock/useMockAssetStore';

interface CamerasPanelProps {
  activity: ActivityData;
  isVisible: boolean;
  className?: string;
}

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'alert';
  isRecording: boolean;
  hasAudio: boolean;
  lastUpdate: string;
  previewImage: string;
}

export const CamerasPanel: React.FC<CamerasPanelProps> = ({
  activity,
  isVisible,
  className = ''
}) => {
  const { assets } = useMockAssetStore();
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Filter cameras based on activity location
  const relevantCameras: CameraFeed[] = assets
    .filter(asset => asset.type === 'camera')
    .map(camera => ({
      id: camera.id,
      name: camera.name,
      location: camera.location.zone,
      status: camera.status as 'online' | 'offline' | 'alert',
      isRecording: Math.random() > 0.3, // Mock recording status
      hasAudio: Math.random() > 0.5, // Mock audio capability
      lastUpdate: new Date().toLocaleTimeString(),
      previewImage: `https://picsum.photos/320/240?random=${camera.id}` // Mock preview
    }));

  useEffect(() => {
    if (relevantCameras.length > 0 && !selectedCamera) {
      setSelectedCamera(relevantCameras[0].id);
    }
  }, [relevantCameras, selectedCamera]);

  const selectedCameraData = relevantCameras.find(cam => cam.id === selectedCamera);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50';
      case 'alert': return 'text-red-600 bg-red-50';
      case 'offline': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleCameraControl = (action: string) => {
    console.log(`Camera control: ${action} for camera ${selectedCamera}`);
    // In real implementation, send camera control commands
  };

  if (!isVisible) return null;

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-600" />
            Security Cameras
          </CardTitle>
          <Badge variant="outline">
            {relevantCameras.length} cameras
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Cameras near {activity.location}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 h-[calc(100%-100px)] overflow-hidden">
        {/* Main Camera Feed */}
        {selectedCameraData && (
          <div className="space-y-3">
            <Card className="border-2">
              <CardContent className="p-3">
                {/* Camera Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden mb-3">
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <img
                      src={selectedCameraData.previewImage}
                      alt={selectedCameraData.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Live Indicator */}
                    {isLiveMode && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                    )}

                    {/* Recording Indicator */}
                    {selectedCameraData.isRecording && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        <Circle className="h-3 w-3 text-red-500 fill-current" />
                        REC
                      </div>
                    )}

                    {/* Status Overlay */}
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                      <div className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                        {selectedCameraData.name}
                      </div>
                      <Badge className={getStatusColor(selectedCameraData.status)}>
                        {selectedCameraData.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Camera Controls */}
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCameraControl('zoom-in')}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCameraControl('zoom-out')}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    disabled={!selectedCameraData.hasAudio}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCameraControl('fullscreen')}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Camera List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Available Cameras</h4>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {relevantCameras.map((camera) => (
                <Card
                  key={camera.id}
                  className={`cursor-pointer transition-all ${
                    selectedCamera === camera.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCamera(camera.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">{camera.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {camera.location}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {camera.isRecording && (
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                        <Badge variant="outline" className={getStatusColor(camera.status)}>
                          {camera.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                      <span>Updated: {camera.lastUpdate}</span>
                      {camera.hasAudio && (
                        <span className="flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          Audio
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium text-gray-700">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              <Play className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Camera Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CamerasPanel;