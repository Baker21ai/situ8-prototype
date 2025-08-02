import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Database, 
  Clock, 
  ArrowRight,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';
import { ExternalSystemData } from '../lib/types/activity';

interface ExternalDataDisplayProps {
  externalData: ExternalSystemData;
  variant?: 'compact' | 'full' | 'inline';
  className?: string;
}

/**
 * 🎯 EXTERNAL DATA DISPLAY COMPONENT
 * Shows raw data from 3rd party integrations (Lenel, Ambient AI, etc.)
 */
export const ExternalDataDisplay: React.FC<ExternalDataDisplayProps> = ({
  externalData,
  variant = 'compact',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRawPayload, setShowRawPayload] = useState(false);

  // Get system icon and color
  const getSystemInfo = (system: string) => {
    switch (system.toLowerCase()) {
      case 'lenel':
        return { icon: '🔒', color: 'bg-blue-100 text-blue-800', name: 'Lenel OnGuard' };
      case 'ambientai':
        return { icon: '🤖', color: 'bg-purple-100 text-purple-800', name: 'Ambient AI' };
      case 'genetec':
        return { icon: '📹', color: 'bg-green-100 text-green-800', name: 'Genetec' };
      default:
        return { icon: '🔌', color: 'bg-gray-100 text-gray-800', name: system };
    }
  };

  const systemInfo = getSystemInfo(externalData.sourceSystem);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Render compact inline version
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1 text-xs ${className}`}>
        <span className="text-gray-500">via</span>
        <Badge variant="outline" className={`${systemInfo.color} text-xs`}>
          <span className="mr-1">{systemInfo.icon}</span>
          {systemInfo.name}
        </Badge>
        <span className="text-gray-400">•</span>
        <code className="text-xs bg-gray-100 px-1 rounded">
          {externalData.originalType}
        </code>
      </div>
    );
  }

  // Render compact version
  if (variant === 'compact') {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-between h-auto p-2 ${className}`}
          >
            <div className="flex items-center gap-2">
              <Database className="h-3 w-3 text-gray-500" />
              <span className="text-xs font-medium">External Data</span>
              <Badge variant="outline" className={`${systemInfo.color} text-xs`}>
                {systemInfo.icon} {systemInfo.name}
              </Badge>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="bg-gray-50 rounded p-2 space-y-1">
            {/* Original Event Type */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Original Type:</span>
              <code className="bg-white px-1 rounded text-blue-600">
                {externalData.originalType}
              </code>
            </div>
            
            {/* Mapping Used */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Mapping:</span>
              <span className="font-mono text-xs">
                {externalData.mappingUsed}
              </span>
            </div>
            
            {/* Processing Time */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Processed:</span>
              <span className="text-xs">
                {formatTimestamp(externalData.processingTimestamp)}
              </span>
            </div>

            {/* Raw Payload Toggle */}
            <div className="pt-1 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawPayload(!showRawPayload)}
                className="w-full justify-between h-6 text-xs"
              >
                <span>Raw Payload</span>
                {showRawPayload ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
              
              {showRawPayload && (
                <div className="mt-1 bg-black text-green-400 p-2 rounded text-xs font-mono overflow-auto max-h-32">
                  <pre>{JSON.stringify(externalData.rawPayload, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Render full version
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4" />
          External System Data
          <Badge variant="outline" className={systemInfo.color}>
            {systemInfo.icon} {systemInfo.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Event Mapping */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Event Translation</h4>
          <div className="flex items-center gap-2 text-xs">
            <code className="bg-red-100 text-red-800 px-2 py-1 rounded">
              {externalData.originalType}
            </code>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <code className="bg-green-100 text-green-800 px-2 py-1 rounded">
              {externalData.mappingUsed.split(' -> ')[1]}
            </code>
          </div>
        </div>

        {/* Processing Info */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Processing Details</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Source:</span>
              <div className="font-mono">{externalData.sourceSystem}</div>
            </div>
            <div>
              <span className="text-gray-600">Processed:</span>
              <div>{formatTimestamp(externalData.processingTimestamp)}</div>
            </div>
          </div>
        </div>

        {/* Original Event */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Original Event</h4>
          <div className="bg-gray-50 p-2 rounded">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(externalData.originalEvent, null, 2)}
            </pre>
          </div>
        </div>

        {/* Raw Payload */}
        <Collapsible open={showRawPayload} onOpenChange={setShowRawPayload}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Code className="h-3 w-3 mr-2" />
              {showRawPayload ? 'Hide' : 'Show'} Raw Payload
              {showRawPayload ? (
                <ChevronDown className="h-3 w-3 ml-2" />
              ) : (
                <ChevronRight className="h-3 w-3 ml-2" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-2">
            <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-auto max-h-48">
              <pre>{JSON.stringify(externalData.rawPayload, null, 2)}</pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default ExternalDataDisplay;