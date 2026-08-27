import React from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import './FormControls.css';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  hint,
  error,
  children,
  className = ''
}) => {
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label">
          <span className="form-label-text">
            {label}
            {required && <span className="form-required">*</span>}
          </span>
        </label>
      )}
      {children}
      {error && <span className="form-error">{error}</span>}
      {!error && hint && <span className="form-hint">{hint}</span>}
    </div>
  );
};

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hasError?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  leftIcon,
  rightIcon,
  hasError,
  className = '',
  ...props
}) => {
  return (
    <div className="input-wrapper">
      {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
      <input
        className={`input-control ${leftIcon ? 'with-icon-left' : ''} ${
          rightIcon ? 'with-icon-right' : ''
        } ${hasError ? 'has-error' : ''} ${className}`}
        {...props}
      />
      {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
    </div>
  );
};

export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  children: React.ReactNode;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  hasError,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="input-wrapper">
      <select
        className={`input-control ${hasError ? 'has-error' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={16} className="select-arrow" />
    </div>
  );
};

export interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const TextareaInput = React.forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  ({ hasError, className = '', ...props }, ref) => {
    return (
      <div className="input-wrapper">
        <textarea
          ref={ref}
          className={`input-control ${hasError ? 'has-error' : ''} ${className}`}
          {...props}
        />
      </div>
    );
  }
);
TextareaInput.displayName = 'TextareaInput';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onClear,
  placeholder = 'Search tickets, categories, or keywords...',
  className = '',
  ...props
}) => {
  return (
    <div className="input-wrapper">
      <span className="input-icon-left">
        <Search size={16} />
      </span>
      <input
        type="text"
        className={`input-control with-icon-left ${value ? 'with-icon-right' : ''} ${className}`}
        placeholder={placeholder}
        value={value}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          className="input-icon-right"
          onClick={onClear}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className = '',
  ...props
}) => {
  return (
    <label className={`checkbox-container ${className}`}>
      <input type="checkbox" className="checkbox-input" {...props} />
      {label && <span>{label}</span>}
    </label>
  );
};

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false
}) => {
  return (
    <label
      className="toggle-container"
      onClick={() => !disabled && onChange(!checked)}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className={`toggle-switch ${checked ? 'is-active' : ''}`}>
        <div className="toggle-thumb" />
      </div>
      {label && <span className="text-body" style={{ fontWeight: 500 }}>{label}</span>}
    </label>
  );
};
