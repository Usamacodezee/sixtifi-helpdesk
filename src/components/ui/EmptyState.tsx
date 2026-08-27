import React from 'react';
import { Inbox } from 'lucide-react';
import './EmptyState.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox size={24} />,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}) => {
  return (
    <div className={`empty-state-card ${className}`}>
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {(action || secondaryAction) && (
        <div className="empty-state-actions">
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  );
};
