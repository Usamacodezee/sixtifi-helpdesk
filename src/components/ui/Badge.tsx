import React from 'react';
import { ArrowDown, Minus, ArrowUp, Flame } from 'lucide-react';
import './Badge.css';

export type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed' | 'Reopened' | 'Waiting for Employee';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

/** Plain-language labels shown to users (employees and agents). */
export const PLAIN_STATUS_LABELS: Record<TicketStatus, string> = {
  Open: 'Received',
  Assigned: 'Assigned to support',
  'In Progress': 'Being worked on',
  'Waiting for Employee': 'Need your reply',
  Resolved: 'Resolved',
  Closed: 'Closed',
  Reopened: 'Reopened'
};

export function getPlainStatusLabel(status: TicketStatus): string {
  return PLAIN_STATUS_LABELS[status] || status;
}

export interface StatusBadgeProps {
  status: TicketStatus;
  showDot?: boolean;
  className?: string;
  /** Defaults to plain-language labels. Use "technical" for internal/admin tooling. */
  labelStyle?: 'plain' | 'technical';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showDot = true,
  className = '',
  labelStyle = 'plain'
}) => {
  const statusKey = status.toLowerCase().replace(/\s+/g, '');
  const label = labelStyle === 'technical' ? status : getPlainStatusLabel(status);

  return (
    <span className={`badge badge-status-${statusKey} ${className}`} title={status}>
      {showDot && <span className="badge-dot" />}
      <span>{label}</span>
    </span>
  );
};

export interface PriorityBadgeProps {
  priority: TicketPriority;
  showIcon?: boolean;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  showIcon = true,
  className = ''
}) => {
  const priorityKey = priority.toLowerCase();

  const renderIcon = () => {
    if (!showIcon) return null;
    const iconSize = 12;
    switch (priority) {
      case 'Low':
        return <ArrowDown size={iconSize} />;
      case 'Medium':
        return <Minus size={iconSize} />;
      case 'High':
        return <ArrowUp size={iconSize} />;
      case 'Urgent':
        return <Flame size={iconSize} />;
      default:
        return null;
    }
  };

  return (
    <span className={`badge badge-priority badge-priority-${priorityKey} ${className}`}>
      {renderIcon()}
      <span>{priority}</span>
    </span>
  );
};

export interface GenericBadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'brand';
  className?: string;
}

export const Badge: React.FC<GenericBadgeProps> = ({
  children,
  variant = 'neutral',
  className = ''
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};
