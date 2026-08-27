import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { IconButton } from './Button';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

export interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const renderIcon = (type: ToastType) => {
    const size = 18;
    switch (type) {
      case 'success':
        return <CheckCircle2 size={size} className="toast-icon" />;
      case 'error':
        return <AlertCircle size={size} className="toast-icon" />;
      case 'warning':
        return <AlertTriangle size={size} className="toast-icon" />;
      case 'info':
        return <Info size={size} className="toast-icon" />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast-item toast-${toast.type}`}>
          {renderIcon(toast.type)}
          <div className="toast-content">
            <span className="toast-title">{toast.title}</span>
            {toast.description && <span className="toast-desc">{toast.description}</span>}
          </div>
          <IconButton
            icon={<X size={14} />}
            ariaLabel="Dismiss toast"
            size="sm"
            onClick={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};
