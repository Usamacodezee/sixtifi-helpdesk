import { useState } from 'react';
import { AppShell } from './components/shell/AppShell';
import { ToastContainer, ToastMessage, ToastType } from './components/ui/Toast';
import { DashboardView } from './views/DashboardView';
import { MyRequestsView } from './views/MyRequestsView';
import { RaiseRequestView } from './views/RaiseRequestView';
import { TicketDetailView } from './views/TicketDetailView';
import { AllTicketsView } from './views/AllTicketsView';
import { MyAssignedTicketsView } from './views/MyAssignedTicketsView';
import { TeamsView } from './views/TeamsView';
import { CategoriesView } from './views/CategoriesView';
import { SettingsView } from './views/SettingsView';
import { HelpSupportView } from './views/HelpSupportView';
import { AppShellPreview } from './views/AppShellPreview';
import { DesignSystemShowcase } from './views/DesignSystemShowcase';
import { DEFAULT_COMPANY_ID } from './data/companies';
import './styles/global.css';

export function App() {
  const [activeNavId, setActiveNavId] = useState('my-assigned-tickets');
  const [activeTicketId, setActiveTicketId] = useState('TKT-4089');
  const [previousViewId, setPreviousViewId] = useState('my-assigned-tickets');
  const [previousViewLabel, setPreviousViewLabel] = useState('My Assigned Tickets');
  const [focusTicketComment, setFocusTicketComment] = useState(false);
  const [preselectedCategory, setPreselectedCategory] = useState<string | undefined>(undefined);
  const [companyId, setCompanyId] = useState(DEFAULT_COMPANY_ID);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, title: string, description?: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleOpenRaiseRequest = (category?: string) => {
    setPreselectedCategory(category);
    setActiveNavId('raise-request');
  };

  const handleSelectNav = (id: string) => {
    // Legacy reports route redirects to Dashboard
    if (id === 'reports') {
      setActiveNavId('dashboard');
      return;
    }
    setActiveNavId(id);
  };

  const handleNavigateToTicketDetail = (ticketId: string, focusComment: boolean = false, fromLabel?: string) => {
    setActiveTicketId(ticketId);
    setPreviousViewId(activeNavId);
    if (fromLabel) {
      setPreviousViewLabel(fromLabel);
    } else {
      switch (activeNavId) {
        case 'my-requests':
          setPreviousViewLabel('My Requests');
          break;
        case 'my-assigned-tickets':
          setPreviousViewLabel('My Assigned Tickets');
          break;
        case 'all-tickets':
          setPreviousViewLabel('All Tickets');
          break;
        case 'dashboard':
          setPreviousViewLabel('Dashboard');
          break;
        default:
          setPreviousViewLabel('Tickets');
          break;
      }
    }
    setFocusTicketComment(focusComment);
    setActiveNavId('ticket-detail');
  };

  const renderCurrentView = () => {
    switch (activeNavId) {
      case 'dashboard':
        return (
          <DashboardView
            companyId={companyId}
            onCompanyChange={setCompanyId}
            onShowToast={addToast}
            onOpenCreateDrawer={() => handleOpenRaiseRequest()}
            onNavigateToAllTickets={() => setActiveNavId('all-tickets')}
            onNavigateToAllTicketsWithCategoryFilter={() => setActiveNavId('all-tickets')}
            onNavigateToTeamDetail={() => setActiveNavId('teams')}
          />
        );
      case 'my-requests':
        return (
          <MyRequestsView
            companyId={companyId}
            onCompanyChange={setCompanyId}
            onShowToast={addToast}
            onOpenRaiseRequest={handleOpenRaiseRequest}
            onNavigateToTicketDetail={(tId) => handleNavigateToTicketDetail(tId, false, 'My Requests')}
          />
        );
      case 'all-tickets':
        return (
          <AllTicketsView
            companyId={companyId}
            onCompanyChange={setCompanyId}
            onShowToast={addToast}
            onOpenCreateRequest={() => handleOpenRaiseRequest()}
            onNavigateToTicketDetail={(tId) => handleNavigateToTicketDetail(tId, false, 'All Tickets')}
          />
        );
      case 'my-assigned-tickets':
        return (
          <MyAssignedTicketsView
            companyId={companyId}
            onCompanyChange={setCompanyId}
            onShowToast={addToast}
            onOpenCreateRequest={() => handleOpenRaiseRequest()}
            onNavigateToTicketDetail={(tId, focus) => handleNavigateToTicketDetail(tId, !!focus, 'My Assigned Tickets')}
          />
        );
      case 'teams':
        return (
          <TeamsView
            companyId={companyId}
            onShowToast={addToast}
            onNavigateToAllTicketsWithFilter={(_teamName) => setActiveNavId('all-tickets')}
          />
        );
      case 'categories':
        return (
          <CategoriesView
            companyId={companyId}
            onShowToast={addToast}
            onNavigateToAllTicketsWithCategoryFilter={(_categoryName) => setActiveNavId('all-tickets')}
          />
        );
      case 'settings':
        return (
          <SettingsView
            companyId={companyId}
            onCompanyChange={setCompanyId}
            onShowToast={addToast}
          />
        );
      case 'help':
        return (
          <HelpSupportView
            onShowToast={addToast}
            onOpenRaiseRequest={() => handleOpenRaiseRequest()}
          />
        );
      case 'raise-request':
        return (
          <RaiseRequestView
            companyId={companyId}
            onCompanyChange={setCompanyId}
            initialCategory={preselectedCategory}
            onCancel={() => setActiveNavId('my-requests')}
            onSubmitSuccessNavigate={(tId) => handleNavigateToTicketDetail(tId, false, 'My Requests')}
            onShowToast={addToast}
          />
        );
      case 'ticket-detail':
        return (
          <TicketDetailView
            ticketId={activeTicketId}
            backLabel={previousViewLabel}
            focusComment={focusTicketComment}
            onBack={() => setActiveNavId(previousViewId || 'my-assigned-tickets')}
            onShowToast={addToast}
          />
        );
      case 'design-system-catalog':
        return <DesignSystemShowcase onShowToast={addToast} />;
      default:
        return (
          <AppShellPreview
            activeNavId={activeNavId}
            onShowToast={addToast}
            onOpenCreateDrawer={() => handleOpenRaiseRequest()}
          />
        );
    }
  };

  return (
    <AppShell
      activeNavId={activeNavId}
      onSelectNav={handleSelectNav}
      companyId={companyId}
      onCompanyChange={setCompanyId}
      onNewTicketClick={() => handleOpenRaiseRequest()}
    >
      {/* Real Product View Render */}
      {renderCurrentView()}

      {/* Global Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  );
}

export default App;
