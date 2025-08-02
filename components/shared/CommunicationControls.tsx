import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { useCommunications } from '@/hooks/useCommunications';
import { 
  Mic, 
  Phone, 
  Send, 
  Volume2, 
  VolumeX, 
  Filter, 
  ExternalLink,
  Radio 
} from 'lucide-react';

interface CommunicationControlsProps {
  variant: 'compact' | 'full';
  onOpenFullPage?: () => void;
  showFilters?: boolean;
  className?: string;
}

export const CommunicationControls: React.FC<CommunicationControlsProps> = ({ 
  variant, 
  onOpenFullPage, 
  showFilters = false,
  className = "" 
}) => {
  const {
    sendMessage,
    volume,
    isMuted,
    setVolume,
    setIsMuted,
    activeChannel
  } = useCommunications();

  const [newMessage, setNewMessage] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage, activeChannel);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn(
        "p-3 border-t bg-gray-50/80 backdrop-blur-sm",
        className
      )}>
        <div className="flex items-center gap-3">
          {/* Primary Action - 35% width on larger screens */}
          <Button 
            size="sm" 
            className="flex-[0_0_140px] sm:flex-1 max-w-[180px] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Push to talk - Press and hold to transmit"
          >
            <Mic className="h-4 w-4 mr-2" />
            Push to Talk
          </Button>
          
          {/* Quick Filters - Collapsible on mobile */}
          {showFilters && (
            <div className="hidden sm:flex items-center gap-1.5 flex-[0_0_auto]">
              <Button size="sm" variant="outline" className="text-xs h-7 px-2 hover:bg-gray-50">
                All Sites
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 px-2 hover:bg-gray-50">
                Critical
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 px-2 hover:bg-gray-50">
                Last Hour
              </Button>
            </div>
          )}
          
          {/* Mobile filter toggle */}
          {showFilters && (
            <Button 
              size="sm" 
              variant="outline" 
              className="sm:hidden"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              aria-label="Toggle filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
          
          {/* Secondary Action */}
          {onOpenFullPage && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onOpenFullPage} 
              className="flex-[0_0_auto] hover:bg-gray-50"
              aria-label="Open full communications page"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">View All →</span>
              <span className="sm:hidden">More</span>
            </Button>
          )}
        </div>

        {/* Mobile Filters (Collapsible) */}
        {showFilters && showMobileFilters && (
          <div className="sm:hidden mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                All Sites
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                Critical
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                Last Hour
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant for CommunicationsPage
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t shadow-lg",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Primary Actions - Fixed width */}
          <div className="flex items-center gap-2 flex-[0_0_auto] order-2 sm:order-1">
            <Button 
              className="flex items-center gap-2 min-w-[120px] flex-1 sm:flex-none transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
              aria-label="Push to talk - Press and hold to transmit"
            >
              <Mic className="h-4 w-4" />
              Push to Talk
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2 min-w-[100px] flex-1 sm:flex-none hover:bg-gray-50"
              aria-label="Call guard"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Call</span>
            </Button>
          </div>
          
          {/* Message Input - Flexible with constraints */}
          <div className="flex-1 flex items-center gap-2 min-w-0 max-w-2xl order-1 sm:order-2">
            <Input
              placeholder="Send message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 min-w-[200px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Type message to send"
            />
            <Button 
              onClick={handleSendMessage} 
              size="sm"
              disabled={!newMessage.trim()}
              className="hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Audio Controls - Fixed width with proper spacing */}
          <div className="flex items-center gap-3 flex-[0_0_auto] justify-center sm:justify-start order-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsMuted(!isMuted)}
              className="hover:bg-gray-100"
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <div className="w-24 flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider:bg-blue-600"
                aria-label={`Volume control - ${volume}%`}
              />
            </div>
            <span className="text-xs text-gray-500 min-w-[3ch]" aria-live="polite">
              {volume}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Re-export types for consumers
export type { CommunicationControlsProps };