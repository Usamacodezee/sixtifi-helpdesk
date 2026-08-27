import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Ticket,
  UserCheck,
  Users,
  FolderTree,
  Clock,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './Sidebar.css';

export interface SidebarProps {
  activeNavId: string;
  onSelectNav: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  assignedBadgeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNavId,
  onSelectNav,
  isCollapsed,
  onToggleCollapse,
  assignedBadgeCount = 12
}) => {
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-requests', label: 'My Requests', icon: FileText },
    { id: 'all-tickets', label: 'All Tickets', icon: Ticket },
    { id: 'my-assigned-tickets', label: 'My Assigned Tickets', icon: UserCheck, badge: assignedBadgeCount }
  ];

  const managementNavItems = [
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'sla-escalation', label: 'SLA & Escalation', icon: Clock }
  ];

  const bottomNavItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle }
  ];

  const renderItem = (item: { id: string; label: string; icon: any; badge?: number }) => {
    const Icon = item.icon;
    const isActive = activeNavId === item.id;

    return (
      <a
        key={item.id}
        href={`#${item.id}`}
        className={`sidebar-item ${isActive ? 'is-active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          onSelectNav(item.id);
        }}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="sidebar-item-left">
          <Icon size={18} className="sidebar-item-icon" />
          {!isCollapsed && <span className="sidebar-item-label">{item.label}</span>}
        </div>
        {!isCollapsed && item.badge !== undefined && (
          <span className="sidebar-badge">{item.badge}</span>
        )}
      </a>
    );
  };

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'is-collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-logo-icon">S</div>
        {!isCollapsed && (
          <div className="brand-info">
            <span className="brand-name">Sixtifi</span>
            <span className="brand-module-tag">Helpdesk</span>
          </div>
        )}
      </div>

      {/* Main Nav Items */}
      <div className="sidebar-nav-container">
        <div className="sidebar-section-group">
          {!isCollapsed && <div className="sidebar-section-label">Main</div>}
          {mainNavItems.map(renderItem)}
        </div>

        <div className="sidebar-section-group">
          {!isCollapsed && <div className="sidebar-section-label">Management</div>}
          {managementNavItems.map(renderItem)}
        </div>
      </div>

      {/* Visually Separated Bottom Section */}
      <div className="sidebar-bottom-section">
        {bottomNavItems.map(renderItem)}
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};
