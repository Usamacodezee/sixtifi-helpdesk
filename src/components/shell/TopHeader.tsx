import React from 'react';
import { Search, Bell, Plus, ChevronDown, Building2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { HELPDESK_COMPANIES } from '../../data/companies';
import './TopHeader.css';

export interface TopHeaderProps {
  companyId: string;
  onCompanyChange: (companyId: string) => void;
  onNewTicketClick?: () => void;
  unreadNotificationsCount?: number;
  userName?: string;
  userRole?: string;
  userInitials?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  companyId,
  onCompanyChange,
  onNewTicketClick,
  unreadNotificationsCount = 3,
  userName = 'Alex Rivera',
  userRole = 'HR & IT Operations Lead',
  userInitials = 'AR'
}) => {
  return (
    <header className="app-header">
      {/* Search Input */}
      <div className="header-left">
        <div className="header-company-switcher" title="Helpdesk is configured per company">
          <Building2 size={15} className="header-company-icon" />
          <select
            className="header-company-select"
            value={companyId}
            onChange={e => onCompanyChange(e.target.value)}
            aria-label="Select company"
          >
            {HELPDESK_COMPANIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="header-search-wrapper">
          <Search size={16} className="header-search-icon" />
          <input
            type="text"
            className="header-search-input"
            placeholder="Search tickets, employees, SLAs..."
          />
          <span className="header-search-shortcut">⌘K</span>
        </div>
      </div>

      {/* Right Utility Actions */}
      <div className="header-right">
        {onNewTicketClick && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={onNewTicketClick}
          >
            New Ticket
          </Button>
        )}

        <button className="header-notification-btn" aria-label="Notifications" title="Notifications">
          <Bell size={18} />
          {unreadNotificationsCount > 0 && <span className="notification-unread-dot" />}
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-default)' }} />

        {/* User Profile */}
        <div className="header-user-profile" title="Account settings">
          <div className="user-avatar-circle">{userInitials}</div>
          <div className="user-info-text">
            <span className="user-display-name">{userName}</span>
            <span className="user-display-role">{userRole}</span>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: '2px' }} />
        </div>
      </div>
    </header>
  );
};
