import React from 'react';
import { Loader2 } from 'lucide-react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classNames} disabled={disabled || isLoading} {...props}>
      {isLoading && <Loader2 className="btn-spinner" />}
      {!isLoading && leftIcon}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon: React.ReactNode;
  ariaLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'ghost',
  size = 'md',
  icon,
  ariaLabel,
  className = '',
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`btn btn-icon btn-${variant} btn-${size} ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
      {...props}
    >
      {icon}
    </button>
  );
};
