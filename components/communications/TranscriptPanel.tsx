import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Search, 
  Filter,
  Download,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mic,
  Brain,
  TrendingUp,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transcript {
  id: string;
  channelId: string;
  sessionId: string;
  speakerId: string;
  speakerName: string;
  speakerRole?: string;
  timestamp: string;
  duration: number;
  content: string;
  redactedContent?: string;
  confidence: number;
  language?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  intent?: {
    type: string;
    confidence: number;
    entities?: Array<{
      type: string;
      value: string;
      confidence: number;
    }>;
  };
  piiDetected?: Array<{
    type: string;
    location: [number, number];
    redacted: boolean;
  }>;
  keywords?: string[];
  automationTriggered?: boolean;
  incidentCreated?: boolean;
  status: 'processing' | 'completed' | 'failed';
}

interface TranscriptPanelProps {
  transcripts: Transcript[];
  showRedacted?: boolean;
  onExport?: () => void;
}

export function TranscriptPanel({ 
  transcripts, 
  showRedacted = false,
  onExport 
}: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAutomated, setShowOnlyAutomated] = useState(false);
  const [showOnlyPII, setShowOnlyPII] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);

  const filteredTranscripts = transcripts.filter(transcript => {
    if (searchQuery) {
      const content = showRedacted ? transcript.redactedContent : transcript.content;
      if (!content?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    
    if (showOnlyAutomated && !transcript.automationTriggered) {
      return false;
    }
    
    if (showOnlyPII && (!transcript.piiDetected || transcript.piiDetected.length === 0)) {
      return false;
    }
    
    if (selectedIntent && transcript.intent?.type !== selectedIntent) {
      return false;
    }
    
    return true;
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'negative': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default: return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'processing': return <Activity className="h-3 w-3 text-blue-500 animate-spin" />;
      case 'failed': return <XCircle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  // Calculate stats
  const stats = {
    totalDuration: transcripts.reduce((sum, t) => sum + t.duration, 0),
    avgConfidence: transcripts.length > 0 
      ? transcripts.reduce((sum, t) => sum + t.confidence, 0) / transcripts.length 
      : 0,
    piiCount: transcripts.reduce((sum, t) => sum + (t.piiDetected?.length || 0), 0),
    automatedCount: transcripts.filter(t => t.automationTriggered).length
  };

  // Get unique intents
  const uniqueIntents = Array.from(
    new Set(transcripts.map(t => t.intent?.type).filter(Boolean))
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transcripts
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {transcripts.length} transcripts
            </Badge>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="text-sm font-medium">
              {Math.round(stats.totalDuration / 60)}m
            </div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className={cn("text-sm font-medium", getConfidenceColor(stats.avgConfidence))}>
              {Math.round(stats.avgConfidence * 100)}%
            </div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-xs text-muted-foreground">PII Found</div>
            <div className="text-sm font-medium text-orange-600">
              {stats.piiCount}
            </div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-xs text-muted-foreground">Automated</div>
            <div className="text-sm font-medium text-blue-600">
              {stats.automatedCount}
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showOnlyAutomated ? 'default' : 'outline'}
              onClick={() => setShowOnlyAutomated(!showOnlyAutomated)}
              className="text-xs"
            >
              <Brain className="h-3 w-3 mr-1" />
              Automated
            </Button>
            <Button
              size="sm"
              variant={showOnlyPII ? 'default' : 'outline'}
              onClick={() => setShowOnlyPII(!showOnlyPII)}
              className="text-xs"
            >
              <Shield className="h-3 w-3 mr-1" />
              PII
            </Button>
            {uniqueIntents.length > 0 && (
              <select
                value={selectedIntent || ''}
                onChange={(e) => setSelectedIntent(e.target.value || null)}
                className="h-7 px-2 text-xs border rounded"
              >
                <option value="">All Intents</option>
                {uniqueIntents.map(intent => (
                  <option key={intent} value={intent}>
                    {intent}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 pt-0 space-y-2">
            {filteredTranscripts.map((transcript) => (
              <div
                key={transcript.id}
                className={cn(
                  "p-3 rounded-lg border bg-card",
                  transcript.automationTriggered && "border-blue-200 bg-blue-50/50",
                  transcript.incidentCreated && "border-red-200 bg-red-50/50"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mic className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {transcript.speakerName}
                    </span>
                    {transcript.speakerRole && (
                      <Badge variant="outline" className="text-xs">
                        {transcript.speakerRole}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(transcript.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transcript.status)}
                    {getSentimentIcon(transcript.sentiment)}
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getConfidenceColor(transcript.confidence))}
                    >
                      {Math.round(transcript.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
                
                {/* Content */}
                <p className="text-sm mb-2">
                  {showRedacted && transcript.redactedContent 
                    ? transcript.redactedContent 
                    : transcript.content}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Intent */}
                    {transcript.intent && (
                      <Badge variant="secondary" className="text-xs">
                        {transcript.intent.type} ({Math.round(transcript.intent.confidence * 100)}%)
                      </Badge>
                    )}
                    
                    {/* PII indicator */}
                    {transcript.piiDetected && transcript.piiDetected.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {transcript.piiDetected.length} PII
                      </Badge>
                    )}
                    
                    {/* Automation indicator */}
                    {transcript.automationTriggered && (
                      <Badge variant="default" className="text-xs">
                        <Brain className="h-3 w-3 mr-1" />
                        Automated
                      </Badge>
                    )}
                    
                    {/* Incident indicator */}
                    {transcript.incidentCreated && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Incident
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{transcript.duration}s</span>
                  </div>
                </div>
                
                {/* Keywords */}
                {transcript.keywords && transcript.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {transcript.keywords.map((keyword, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {filteredTranscripts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No transcripts found</p>
                {searchQuery && (
                  <p className="text-xs mt-1">
                    Try adjusting your search
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}