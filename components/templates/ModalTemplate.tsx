import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/components/ui/utils';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

// Template for consistent modal layouts
export interface ModalTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  showCloseButton?: boolean;
  scrollable?: boolean;
  className?: string;
}

/**
 * ModalTemplate - Standardized modal layout template
 * 
 * Provides consistent modal structure with configurable variants,
 * sizes, and built-in accessibility features.
 * 
 * @example
 * <ModalTemplate
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Activity Details"
 *   description="View and manage activity information"
 *   size="lg"
 *   actions={<SaveActions />}
 * >
 *   <ActivityForm />
 * </ModalTemplate>
 */
export const ModalTemplate: React.FC<ModalTemplateProps> = ({
  open,
  onOpenChange,
  children,
  title,
  description,
  icon,
  actions,
  footer,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  scrollable = true,
  className
}) => {
  // Size configurations
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };
  
  // Variant configurations
  const variantConfig = {
    default: {
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      backgroundColor: 'bg-blue-50'
    },
    destructive: {
      iconColor: 'text-red-600',
      borderColor: 'border-red-200', 
      backgroundColor: 'bg-red-50'
    },
    success: {
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      backgroundColor: 'bg-green-50'
    },
    warning: {
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      backgroundColor: 'bg-yellow-50'
    },
    info: {
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      backgroundColor: 'bg-blue-50'
    }
  };
  
  const config = variantConfig[variant];
  
  // Default icons for variants
  const getDefaultIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertTriangle className={cn('h-5 w-5', config.iconColor)} />;
      case 'success':
        return <CheckCircle className={cn('h-5 w-5', config.iconColor)} />;
      case 'warning':
        return <AlertCircle className={cn('h-5 w-5', config.iconColor)} />;
      case 'info':
        return <Info className={cn('h-5 w-5', config.iconColor)} />;
      default:
        return null;
    }
  };
  
  const displayIcon = icon || getDefaultIcon();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          sizeClasses[size],
          size === 'full' && 'h-[95vh]',
          'flex flex-col',
          className
        )}
        onPointerDownOutside={(e) => {
          // Prevent closing on content interaction
          e.preventDefault();
        }}
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {displayIcon && (
                <div className={cn(
                  'flex-shrink-0 mt-1',
                  variant !== 'default' && 'p-2 rounded-full',
                  variant !== 'default' && config.backgroundColor
                )}>
                  {displayIcon}
                </div>
              )}
              
              <div className="flex-1">
                {title && (
                  <DialogTitle className="text-lg font-semibold">
                    {title}
                  </DialogTitle>
                )}
                {description && (
                  <DialogDescription className="text-sm text-muted-foreground mt-1">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 mt-1"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        
        {/* Content */}
        <div className="flex-1 min-h-0">
          {scrollable ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {children}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full">
              {children}
            </div>
          )}
        </div>
        
        {/* Actions or Footer */}
        {(actions || footer) && (
          <>
            <Separator className="my-4" />
            <div className="flex-shrink-0">
              {actions ? (
                <div className="flex items-center justify-end gap-2">
                  {actions}
                </div>
              ) : (
                footer
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Confirmation modal variant
export const ConfirmationModalTemplate: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false
}) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };
  
  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      variant={variant}
      size="sm"
      actions={(
        <>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </>
      )}
    >
      <div className="py-4">
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </ModalTemplate>
  );
};

// Form modal variant
export const FormModalTemplate: React.FC<ModalTemplateProps & {
  onSubmit?: (e: React.FormEvent) => void;
  submitText?: string;
  submitDisabled?: boolean;
  submitVariant?: 'default' | 'destructive';
  showCancelButton?: boolean;
}> = ({
  children,
  onSubmit,
  submitText = 'Save',
  submitDisabled = false,
  submitVariant = 'default',
  showCancelButton = true,
  actions,
  ...props
}) => {
  const formActions = actions || (
    <>
      {showCancelButton && (
        <Button
          type="button"
          variant="outline"
          onClick={() => props.onOpenChange(false)}
        >
          Cancel
        </Button>
      )}
      <Button
        type="submit"
        variant={submitVariant}
        disabled={submitDisabled}
      >
        {submitText}
      </Button>
    </>
  );

  return (
    <ModalTemplate
      {...props}
      actions={formActions}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
      </form>
    </ModalTemplate>
  );
};

// Multi-step modal variant
export const MultiStepModalTemplate: React.FC<ModalTemplateProps & {
  steps: { title: string; content: React.ReactNode }[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onFinish?: () => void;
  nextDisabled?: boolean;
  showStepIndicator?: boolean;
}> = ({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  onFinish,
  nextDisabled = false,
  showStepIndicator = true,
  ...props
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  const stepActions = (
    <>
      {!isFirstStep && (
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          Previous
        </Button>
      )}
      {isLastStep ? (
        <Button
          onClick={onFinish}
          disabled={nextDisabled}
        >
          Finish
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={nextDisabled}
        >
          Next
        </Button>
      )}
    </>
  );

  return (
    <ModalTemplate
      {...props}
      title={currentStepData?.title || props.title}
      actions={stepActions}
    >
      {/* Step Indicator */}
      {showStepIndicator && (
        <div className="flex items-center justify-center space-x-2 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'w-3 h-3 rounded-full cursor-pointer transition-colors',
                index === currentStep
                  ? 'bg-primary'
                  : index < currentStep
                  ? 'bg-primary/60'
                  : 'bg-muted'
              )}
              onClick={() => onStepChange(index)}
            />
          ))}
        </div>
      )}
      
      {/* Step Content */}
      <div className="py-4">
        {currentStepData?.content}
      </div>
    </ModalTemplate>
  );
};

// Loading modal variant
export const LoadingModalTemplate: React.FC<{
  open: boolean;
  title?: string;
  message?: string;
}> = ({
  open,
  title = 'Loading',
  message = 'Please wait...'
}) => {
  return (
    <ModalTemplate
      open={open}
      onOpenChange={() => {}} // Prevent closing
      title={title}
      size="sm"
      showCloseButton={false}
    >
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      </div>
    </ModalTemplate>
  );
};