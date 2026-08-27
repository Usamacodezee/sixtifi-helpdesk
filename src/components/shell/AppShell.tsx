import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import './AppShell.css';

export interface AppShellProps {
  activeNavId: string;
  onSelectNav: (id: string) => void;
  companyId: string;
  onCompanyChange: (companyId: string) => void;
  onNewTicketClick?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeNavId,
  onSelectNav,
  companyId,
  onCompanyChange,
  onNewTicketClick,
  children
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="app-shell-root">
      <Sidebar
        activeNavId={activeNavId}
        onSelectNav={onSelectNav}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="app-shell-main">
        <TopHeader
          companyId={companyId}
          onCompanyChange={onCompanyChange}
          onNewTicketClick={onNewTicketClick}
        />
        <main className="app-shell-content">{children}</main>
      </div>
    </div>
  );
};
