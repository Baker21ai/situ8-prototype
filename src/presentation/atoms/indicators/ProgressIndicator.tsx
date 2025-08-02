/**
 * ProgressIndicator Atomic Component
 * Displays various progress and confidence metrics
 */

import React from 'react';
import { Progress } from '../../../../components/ui/progress';

export interface ProgressIndicatorProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'default' | 'confidence' | 'risk' | 'performance';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'confidence':
        return percentage >= 80 ? 'text-green-400' : 
               percentage >= 60 ? 'text-yellow-400' : 'text-red-400';
      case 'risk':
        return percentage >= 80 ? 'text-red-400' :
               percentage >= 60 ? 'text-orange-400' : 'text-green-400';
      case 'performance':
        return percentage >= 90 ? 'text-green-400' :
               percentage >= 70 ? 'text-yellow-400' : 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">{label}</span>
          {showValue && (
            <span className={`text-sm font-medium ${getVariantStyles()}`}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <Progress 
        value={percentage} 
        className={`${getSizeStyles()} bg-gray-700`}
      />
    </div>
  );
};

// Specialized variants
export const ConfidenceIndicator: React.FC<Omit<ProgressIndicatorProps, 'variant'>> = (props) => (
  <ProgressIndicator {...props} variant="confidence" label={props.label || "Confidence"} />
);

export const RiskIndicator: React.FC<Omit<ProgressIndicatorProps, 'variant'>> = (props) => (
  <ProgressIndicator {...props} variant="risk" label={props.label || "Risk Level"} />
);

export const PerformanceIndicator: React.FC<Omit<ProgressIndicatorProps, 'variant'>> = (props) => (
  <ProgressIndicator {...props} variant="performance" label={props.label || "Performance"} />
);