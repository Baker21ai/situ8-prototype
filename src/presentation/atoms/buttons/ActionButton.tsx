/**
 * ActionButton Atomic Component
 * Context-aware action buttons with variants
 */

import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ActionButtonProps {
  variant: 'critical' | 'warning' | 'secondary' | 'success';
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant,
  icon,
  children,
  onClick,
  disabled = false,
  loading = false,
  size = 'md',
  className = ''
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'critical':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 ring-red-500/50';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/30 ring-orange-500/50';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30 ring-green-500/50';
      default:
        return 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 hover:border-gray-500';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-8 text-sm px-3';
      case 'lg':
        return 'h-12 text-lg px-6';
      default:
        return 'h-10 text-base px-4';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
    >
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          ${getVariantStyles()}
          ${getSizeStyles()}
          font-semibold transition-all duration-200
          focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <span className="mr-2">{icon}</span>
        )}
        {children}
      </Button>
    </motion.div>
  );
};

// Convenient sub-components for common variants
export const ActionButtonCritical: React.FC<Omit<ActionButtonProps, 'variant'>> = (props) => (
  <ActionButton {...props} variant="critical" />
);

export const ActionButtonWarning: React.FC<Omit<ActionButtonProps, 'variant'>> = (props) => (
  <ActionButton {...props} variant="warning" />
);

export const ActionButtonSuccess: React.FC<Omit<ActionButtonProps, 'variant'>> = (props) => (
  <ActionButton {...props} variant="success" />
);

export const ActionButtonSecondary: React.FC<Omit<ActionButtonProps, 'variant'>> = (props) => (
  <ActionButton {...props} variant="secondary" />
);