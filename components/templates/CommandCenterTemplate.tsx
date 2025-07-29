import React from 'react';
import { Card as _Card, CardContent as _CardContent } from '@/components/ui/card';
import { cn } from '@/components/ui/utils';
import { cardPadding, cardSpacing } from '@/lib/tokens/spacing';

// Template for the three-panel command center layout
export interface CommandCenterTemplateProps {
  header: React.ReactNode;
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  footer?: React.ReactNode;
  leftPanelWidth?: 'narrow' | 'normal' | 'wide'; // 20%, 25%, 30%
  rightPanelWidth?: 'narrow' | 'normal' | 'wide'; // 20%, 25%, 30%
  className?: string;
}

/**
 * CommandCenterTemplate - Standardized three-panel layout template
 * 
 * Provides consistent layout structure for command center interfaces
 * with configurable panel widths and responsive behavior.
 * 
 * @example
 * <CommandCenterTemplate
 *   header={<CommandCenterHeader />}
 *   leftPanel={<ActivityStream />}
 *   centerPanel={<InteractiveMap />}
 *   rightPanel={<Timeline />}
 *   leftPanelWidth="normal"
 *   rightPanelWidth="normal"
 * />
 */
export const CommandCenterTemplate: React.FC<CommandCenterTemplateProps> = ({
  header,
  leftPanel,
  centerPanel,
  rightPanel,
  footer,
  leftPanelWidth = 'normal',
  rightPanelWidth = 'normal',
  className
}) => {
  // Panel width configurations
  const panelWidths = {
    narrow: 'w-1/5',  // 20%
    normal: 'w-1/4',  // 25% 
    wide: 'w-3/10'    // 30%
  };
  
  const leftWidth = panelWidths[leftPanelWidth];
  const rightWidth = panelWidths[rightPanelWidth];
  
  // Calculate center panel width based on side panels
  const getCenterWidth = () => {
    const leftPercent = leftPanelWidth === 'narrow' ? 20 : leftPanelWidth === 'normal' ? 25 : 30;
    const rightPercent = rightPanelWidth === 'narrow' ? 20 : rightPanelWidth === 'normal' ? 25 : 30;
    const centerPercent = 100 - leftPercent - rightPercent;
    
    if (centerPercent === 50) return 'w-1/2';
    if (centerPercent === 45) return 'w-9/20';
    if (centerPercent === 40) return 'w-2/5';
    return 'flex-1'; // fallback
  };

  return (
    <div className={cn('h-screen flex flex-col bg-background', className)}>
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        {header}
      </div>

      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel */}
        <div className={cn('flex-shrink-0 border-r', leftWidth)}>
          <div className="h-full">
            {leftPanel}
          </div>
        </div>

        {/* Center Panel */}
        <div className={cn('flex-shrink-0', getCenterWidth())}>
          <div className="h-full">
            {centerPanel}
          </div>
        </div>

        {/* Right Panel */}
        <div className={cn('flex-shrink-0 border-l', rightWidth)}>
          <div className="h-full">
            {rightPanel}
          </div>
        </div>
      </div>

      {/* Footer (Optional) */}
      {footer && (
        <div className="flex-shrink-0 border-t bg-background">
          {footer}
        </div>
      )}
    </div>
  );
};

// Responsive variant for mobile/tablet
export const ResponsiveCommandCenterTemplate: React.FC<CommandCenterTemplateProps & {
  activePanel?: 'left' | 'center' | 'right';
  onPanelChange?: (panel: 'left' | 'center' | 'right') => void;
}> = ({
  header,
  leftPanel,
  centerPanel,
  rightPanel,
  footer,
  activePanel = 'center',
  onPanelChange,
  className
}) => {
  return (
    <div className={cn('h-screen flex flex-col bg-background', className)}>
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        {header}
      </div>

      {/* Desktop: Three Panel Layout */}
      <div className="hidden lg:flex flex-1 min-h-0">
        <div className="w-1/4 border-r">{leftPanel}</div>
        <div className="flex-1">{centerPanel}</div>
        <div className="w-1/4 border-l">{rightPanel}</div>
      </div>

      {/* Mobile/Tablet: Single Panel with Navigation */}
      <div className="lg:hidden flex-1 flex flex-col min-h-0">
        {/* Panel Navigation */}
        <div className="flex border-b bg-muted/50">
          <button
            className={cn(
              'flex-1 py-2 px-4 text-sm font-medium transition-colors',
              activePanel === 'left' 
                ? 'bg-background border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onPanelChange?.('left')}
          >
            Activities
          </button>
          <button
            className={cn(
              'flex-1 py-2 px-4 text-sm font-medium transition-colors',
              activePanel === 'center'
                ? 'bg-background border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onPanelChange?.('center')}
          >
            Map
          </button>
          <button
            className={cn(
              'flex-1 py-2 px-4 text-sm font-medium transition-colors',
              activePanel === 'right'
                ? 'bg-background border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onPanelChange?.('right')}
          >
            Timeline
          </button>
        </div>

        {/* Active Panel Content */}
        <div className="flex-1 min-h-0">
          {activePanel === 'left' && leftPanel}
          {activePanel === 'center' && centerPanel}
          {activePanel === 'right' && rightPanel}
        </div>
      </div>

      {/* Footer (Optional) */}
      {footer && (
        <div className="flex-shrink-0 border-t bg-background">
          {footer}
        </div>
      )}
    </div>
  );
};

// Collapsible panels variant
export const CollapsibleCommandCenterTemplate: React.FC<CommandCenterTemplateProps & {
  leftCollapsed?: boolean;
  rightCollapsed?: boolean;
  onLeftToggle?: () => void;
  onRightToggle?: () => void;
}> = ({
  header,
  leftPanel,
  centerPanel,
  rightPanel,
  footer,
  leftCollapsed = false,
  rightCollapsed = false,
  onLeftToggle,
  onRightToggle,
  className
}) => {
  return (
    <div className={cn('h-screen flex flex-col bg-background', className)}>
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        {header}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel */}
        <div className={cn(
          'flex-shrink-0 border-r transition-all duration-300',
          leftCollapsed ? 'w-12' : 'w-1/4'
        )}>
          <div className="h-full relative">
            {/* Toggle Button */}
            {onLeftToggle && (
              <button
                onClick={onLeftToggle}
                className="absolute top-2 right-2 z-10 p-1 rounded bg-background border shadow-sm hover:shadow-md transition-shadow"
              >
                {leftCollapsed ? '→' : '←'}
              </button>
            )}
            {!leftCollapsed && leftPanel}
          </div>
        </div>

        {/* Center Panel */}
        <div className="flex-1">
          {centerPanel}
        </div>

        {/* Right Panel */}
        <div className={cn(
          'flex-shrink-0 border-l transition-all duration-300',
          rightCollapsed ? 'w-12' : 'w-1/4'
        )}>
          <div className="h-full relative">
            {/* Toggle Button */}
            {onRightToggle && (
              <button
                onClick={onRightToggle}
                className="absolute top-2 left-2 z-10 p-1 rounded bg-background border shadow-sm hover:shadow-md transition-shadow"
              >
                {rightCollapsed ? '←' : '→'}
              </button>
            )}
            {!rightCollapsed && rightPanel}
          </div>
        </div>
      </div>

      {/* Footer */}
      {footer && (
        <div className="flex-shrink-0 border-t bg-background">
          {footer}
        </div>
      )}
    </div>
  );
};