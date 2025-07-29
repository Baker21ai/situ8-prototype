import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';
import { X, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

// Template for fullscreen overlays and pages
export interface FullscreenTemplateProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
  onClose?: () => void;
  showBackButton?: boolean;
  showCloseButton?: boolean;
  headerBorder?: boolean;
  className?: string;
}

/**
 * FullscreenTemplate - Template for fullscreen overlays and pages
 * 
 * Provides consistent layout for communications pages, activity details,
 * and other fullscreen interfaces.
 * 
 * @example
 * <FullscreenTemplate
 *   title="Communications Hub"
 *   subtitle="Real-time radio and chat communications"
 *   onBack={() => navigate(-1)}
 *   onClose={() => setShowModal(false)}
 *   actions={<FilterActions />}
 * >
 *   <CommunicationsContent />
 * </FullscreenTemplate>
 */
export const FullscreenTemplate: React.FC<FullscreenTemplateProps> = ({
  children,
  header,
  title,
  subtitle,
  actions,
  onBack,
  onClose,
  showBackButton = true,
  showCloseButton = true,
  headerBorder = true,
  className
}) => {
  return (
    <div className={cn('fixed inset-0 bg-background z-50 flex flex-col', className)}>
      {/* Header */}
      <div className={cn(
        'flex-shrink-0 px-4 py-3 bg-background',
        headerBorder && 'border-b'
      )}>
        {header || (
          <div className="flex items-center justify-between">
            {/* Left side - Back button and title */}
            <div className="flex items-center gap-3">
              {showBackButton && onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <div>
                {title && (
                  <h1 className="text-xl font-semibold">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            
            {/* Right side - Actions and close button */}
            <div className="flex items-center gap-2">
              {actions}
              
              {showCloseButton && onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
};

// Split layout variant for side-by-side content
export const SplitFullscreenTemplate: React.FC<FullscreenTemplateProps & {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftWidth?: number; // Percentage
  splitDirection?: 'horizontal' | 'vertical';
  resizable?: boolean;
}> = ({
  leftPanel,
  rightPanel,
  leftWidth = 50,
  splitDirection = 'horizontal',
  resizable = false,
  header,
  title,
  subtitle,
  actions,
  onBack,
  onClose,
  showBackButton = true,
  showCloseButton = true,
  headerBorder = true,
  className
}) => {
  const [leftSize, setLeftSize] = React.useState(leftWidth);
  
  return (
    <div className={cn('fixed inset-0 bg-background z-50 flex flex-col', className)}>
      {/* Header */}
      <div className={cn(
        'flex-shrink-0 px-4 py-3 bg-background',
        headerBorder && 'border-b'
      )}>
        {header || (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && onBack && (
                <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <div>
                {title && <h1 className="text-xl font-semibold">{title}</h1>}
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {actions}
              {showCloseButton && onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Split Content */}
      <div className={cn(
        'flex-1 flex min-h-0',
        splitDirection === 'vertical' ? 'flex-col' : 'flex-row'
      )}>
        {/* Left Panel */}
        <div 
          className={cn(
            'flex-shrink-0',
            splitDirection === 'horizontal' ? 'border-r' : 'border-b'
          )}
          style={{
            [splitDirection === 'horizontal' ? 'width' : 'height']: `${leftSize}%`
          }}
        >
          {leftPanel}
        </div>
        
        {/* Resizer */}
        {resizable && (
          <div className={cn(
            'flex-shrink-0 bg-border hover:bg-border/80 cursor-col-resize',
            splitDirection === 'horizontal' ? 'w-1' : 'h-1 cursor-row-resize'
          )} />
        )}
        
        {/* Right Panel */}
        <div className="flex-1 min-h-0">
          {rightPanel}
        </div>
      </div>
    </div>
  );
};

// Modal overlay variant
export const ModalFullscreenTemplate: React.FC<FullscreenTemplateProps & {
  overlay?: boolean;
  onOverlayClick?: () => void;
}> = ({
  children,
  overlay = true,
  onOverlayClick,
  ...props
}) => {
  return (
    <>
      {/* Overlay */}
      {overlay && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onOverlayClick}
        />
      )}
      
      {/* Content */}
      <FullscreenTemplate 
        {...props}
        className={cn('z-50', props.className)}
      >
        {children}
      </FullscreenTemplate>
    </>
  );
};

// Drawer variant that slides in from side
export const DrawerFullscreenTemplate: React.FC<FullscreenTemplateProps & {
  side?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onOverlayClick?: () => void;
}> = ({
  children,
  side = 'right',
  size = 'lg',
  onOverlayClick,
  ...props
}) => {
  const sizeMap = {
    sm: '25%',
    md: '33%', 
    lg: '50%',
    xl: '75%',
    full: '100%'
  };
  
  const getDrawerStyles = () => {
    const sizeValue = sizeMap[size];
    
    switch (side) {
      case 'left':
        return { width: sizeValue, height: '100%', left: 0, top: 0 };
      case 'right':
        return { width: sizeValue, height: '100%', right: 0, top: 0 };
      case 'top':
        return { height: sizeValue, width: '100%', top: 0, left: 0 };
      case 'bottom':
        return { height: sizeValue, width: '100%', bottom: 0, left: 0 };
      default:
        return { width: sizeValue, height: '100%', right: 0, top: 0 };
    }
  };
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onOverlayClick}
      />
      
      {/* Drawer */}
      <div 
        className="fixed bg-background z-50 shadow-xl border flex flex-col"
        style={getDrawerStyles()}
      >
        <FullscreenTemplate 
          {...props}
          className="relative"
          showBackButton={false}
        >
          {children}
        </FullscreenTemplate>
      </div>
    </>
  );
};