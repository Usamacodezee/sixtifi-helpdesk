import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { StatusBadge, PriorityBadge, TicketStatus, TicketPriority, getPlainStatusLabel } from '../components/ui/Badge';
import { SearchInput, SelectInput, FormField } from '../components/ui/FormControls';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { BulkActionsBar } from '../components/ui/BulkActionsBar';
import { ClosingReasonFields, canSubmitClosingReason } from '../components/helpdesk/ClosingReasonFields';
import {
  getClosingReasonById,
  getDefaultClosingReasonId
} from '../data/closingReasons';
import { HELPDESK_COMPANIES, getCompanyById } from '../data/companies';
import { employeesForCompany } from '../data/directory';
import {
  Plus,
  Download,
  Filter,
  X,
  MoreVertical,
  Ticket,
  UserCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Bookmark,
  Eye,
  ArrowUp,
  Ban,
  Copy,
  Bell
} from 'lucide-react';
import './AllTicketsView.css';

type BulkLeadAction = 'assign' | 'priority' | 'escalate' | 'spam' | 'duplicate' | null;

export interface OperationalTicket {
  id: string;
  companyId: string;
  subject: string;
  requester: string;
  category: 'Attendance' | 'Payroll' | 'Leave' | 'HR' | 'IT' | 'Administration' | 'Fleet Support' | 'Warehouse Ops' | 'Store Operations' | 'Retail HR';
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string;
  slaText: string;
  slaState: 'on-track' | 'at-risk' | 'breached';
  lastUpdated: string;
  department: string;
  location: string;
}

export interface AllTicketsViewProps {
  companyId: string;
  onCompanyChange: (companyId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onOpenCreateRequest: () => void;
  onNavigateToTicketDetail: (ticketId: string) => void;
}

export const AllTicketsView: React.FC<AllTicketsViewProps> = ({
  companyId,
  onCompanyChange,
  onShowToast,
  onOpenCreateRequest,
  onNavigateToTicketDetail
}) => {
  const company = getCompanyById(companyId);
  const companyPeople = employeesForCompany(companyId);

  // Search & Filter Controls State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [, setTeamFilter] = useState('all');

  // Extended More Filters State
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [agentFilter, setAgentFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'unassigned' | 'me'>('all');

  const resetQuickFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setSlaFilter('all');
    setAssigneeFilter('all');
    setAgentFilter('all');
    setCurrentPage(1);
  };

  // Selection & Bulk Action State
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [activeMenuTicketId, setActiveMenuTicketId] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<BulkLeadAction>(null);
  const [bulkAssignAgent, setBulkAssignAgent] = useState('Rahul Sharma');
  const [bulkPriority, setBulkPriority] = useState<TicketPriority>('High');
  const [bulkEscalateLevel, setBulkEscalateLevel] = useState(() => employeesForCompany(companyId)[0]?.name || '');
  const [bulkCloseReasonId, setBulkCloseReasonId] = useState('');
  const [bulkCloseComment, setBulkCloseComment] = useState('');

  // Modal States
  const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false);
  const [savedViewName, setSavedViewName] = useState('');
  const [assignModalTicket, setAssignModalTicket] = useState<OperationalTicket | null>(null);
  const [selectedAssignAgent, setSelectedAssignAgent] = useState('Rahul Sharma');

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Operational Tickets Queue Sample Data (128 Total conceptually)
  const [ticketsQueue, setTicketsQueue] = useState<OperationalTicket[]>([
    {
      id: 'TKT-4089',
      companyId: 'co-acme',
      subject: 'Missing attendance punch for Aug 17',
      requester: 'Alex Rivera',
      category: 'Attendance',
      priority: 'High',
      status: 'In Progress',
      assignedTo: 'Rahul Sharma',
      slaText: '2h 14m remaining',
      slaState: 'on-track',
      lastUpdated: 'Today',
      department: 'Human Resources',
      location: 'New York'
    },
    {
      id: 'TKT-4088',
      companyId: 'co-acme',
      subject: 'Payroll deduction clarification',
      requester: 'Marcus Chen',
      category: 'Payroll',
      priority: 'Urgent',
      status: 'In Progress',
      assignedTo: 'Priya Shah',
      slaText: '15m remaining',
      slaState: 'at-risk',
      lastUpdated: 'Today',
      department: 'Engineering',
      location: 'Surat Branch'
    },
    {
      id: 'TKT-4087',
      companyId: 'co-acme',
      subject: 'Attendance regularization request',
      requester: 'Priya Sharma',
      category: 'Attendance',
      priority: 'Medium',
      status: 'Assigned',
      assignedTo: 'Unassigned',
      slaText: '5h remaining',
      slaState: 'on-track',
      lastUpdated: 'Today',
      department: 'Operations',
      location: 'London'
    },
    {
      id: 'TKT-4086',
      companyId: 'co-acme',
      subject: 'New employee hardware request',
      requester: 'David Miller',
      category: 'IT',
      priority: 'Medium',
      status: 'Open',
      assignedTo: 'IT Support',
      slaText: '1d remaining',
      slaState: 'on-track',
      lastUpdated: 'Yesterday',
      department: 'Product',
      location: 'San Francisco'
    },
    {
      id: 'TKT-4085',
      companyId: 'co-acme',
      subject: 'Leave balance discrepancy',
      requester: 'Emma Wilson',
      category: 'Leave',
      priority: 'Low',
      status: 'Open',
      assignedTo: 'Rahul Sharma',
      slaText: 'SLA Breached (2h overdue)',
      slaState: 'breached',
      lastUpdated: 'Yesterday',
      department: 'Marketing',
      location: 'New York'
    },
    {
      id: 'TKT-4084',
      companyId: 'co-acme',
      subject: 'June payslip not visible',
      requester: 'Sarah Jenkins',
      category: 'Payroll',
      priority: 'Medium',
      status: 'Resolved',
      assignedTo: 'Priya Shah',
      slaText: 'Resolved',
      slaState: 'on-track',
      lastUpdated: 'Aug 16',
      department: 'Design',
      location: 'Surat Branch'
    },
    {
      id: 'TKT-5102',
      companyId: 'co-northwind',
      subject: 'Fleet GPS offline — truck 14',
      requester: 'Jordan Lee',
      category: 'Fleet Support',
      priority: 'High',
      status: 'In Progress',
      assignedTo: 'Rahul Sharma',
      slaText: '40m remaining',
      slaState: 'at-risk',
      lastUpdated: 'Today',
      department: 'Logistics',
      location: 'Chicago Hub'
    },
    {
      id: 'TKT-5098',
      companyId: 'co-northwind',
      subject: 'Warehouse scanner sync failure',
      requester: 'Sam Ortiz',
      category: 'Warehouse Ops',
      priority: 'Urgent',
      status: 'Open',
      assignedTo: 'Unassigned',
      slaText: '12m overdue',
      slaState: 'breached',
      lastUpdated: 'Yesterday',
      department: 'Warehouse',
      location: 'Dallas DC'
    },
    {
      id: 'TKT-6201',
      companyId: 'co-contoso',
      subject: 'POS till mismatch — Store 08',
      requester: 'Mia Chen',
      category: 'Store Operations',
      priority: 'High',
      status: 'Assigned',
      assignedTo: 'Priya Shah',
      slaText: '55m remaining',
      slaState: 'at-risk',
      lastUpdated: 'Today',
      department: 'Retail',
      location: 'Store 08'
    },
    {
      id: 'TKT-6195',
      companyId: 'co-contoso',
      subject: 'Part-time shift swap approval',
      requester: 'Chris Evans',
      category: 'Retail HR',
      priority: 'Low',
      status: 'Resolved',
      assignedTo: 'Elena Rostova',
      slaText: 'Resolved',
      slaState: 'on-track',
      lastUpdated: 'Aug 19',
      department: 'Store HR',
      location: 'Store 03'
    }
  ]);

  // Filtering Logic
  const filteredTickets = ticketsQueue.filter(ticket => {
    if (ticket.companyId !== companyId) return false;

    if (assigneeFilter === 'unassigned' && ticket.assignedTo !== 'Unassigned') return false;
    if (assigneeFilter === 'me' && ticket.assignedTo !== 'Rahul Sharma') return false;

    // Search query constraint
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.requester.toLowerCase().includes(searchQuery.toLowerCase());

    // Primary Filters
    const matchesStatus = statusFilter === 'all' || ticket.status.toLowerCase().replace(/\s+/g, '') === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority.toLowerCase() === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category.toLowerCase() === categoryFilter;

    // Extended Filters
    const matchesSla =
      slaFilter === 'all' ||
      (slaFilter === 'attention'
        ? ticket.slaState === 'at-risk' || ticket.slaState === 'breached'
        : ticket.slaState === slaFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesSla;
  });

  // Table Column Definitions
  const columns: Column<OperationalTicket>[] = [
    {
      key: 'id',
      header: 'Ticket ID',
      sortable: true,
      width: '110px',
      render: item => (
        <span
          className="table-cell-id"
          style={{ cursor: 'pointer' }}
          onClick={e => {
            e.stopPropagation();
            onNavigateToTicketDetail(item.id);
          }}
        >
          {item.id}
        </span>
      )
    },
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      render: item => (
        <span
          className="table-cell-subject"
          style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
          onClick={e => {
            e.stopPropagation();
            onNavigateToTicketDetail(item.id);
          }}
        >
          {item.subject}
        </span>
      )
    },
    {
      key: 'requester',
      header: 'Requester',
      sortable: true,
      render: item => (
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
          {item.requester}
        </span>
      )
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.category}</span>
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: item => <PriorityBadge priority={item.priority} />
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: item => <StatusBadge status={item.status} />
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      sortable: true,
      render: item => (
        item.assignedTo === 'Unassigned' ? (
          <button
            className="inline-assign-btn"
            onClick={e => {
              e.stopPropagation();
              setAssignModalTicket(item);
            }}
          >
            <UserCheck size={12} />
            Assign
          </button>
        ) : (
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
            {item.assignedTo}
          </span>
        )
      )
    },
    {
      key: 'slaText',
      header: 'SLA Target',
      sortable: true,
      render: item => (
        <span className={`sla-badge-indicator ${item.slaState}`}>
          {item.slaState === 'breached' && <AlertTriangle size={12} />}
          {item.slaState === 'at-risk' && <Clock size={12} />}
          {item.slaText}
        </span>
      )
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      sortable: true,
      render: item => <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.lastUpdated}</span>
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      align: 'right',
      render: item => (
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <IconButton
            icon={<MoreVertical size={16} />}
            ariaLabel="Options"
            variant="ghost"
            onClick={() => setActiveMenuTicketId(activeMenuTicketId === item.id ? null : item.id)}
          />

          {/* Row Actions Menu */}
          {activeMenuTicketId === item.id && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '32px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 60,
                minWidth: '150px',
                padding: '4px 0'
              }}
            >
              <button
                style={{ width: '100%', padding: '6px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setActiveMenuTicketId(null);
                  onNavigateToTicketDetail(item.id);
                }}
              >
                <Eye size={13} />
                View Ticket
              </button>

              <button
                style={{ width: '100%', padding: '6px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setActiveMenuTicketId(null);
                  setAssignModalTicket(item);
                }}
              >
                <UserCheck size={13} />
                Assign Agent
              </button>

              <button
                style={{ width: '100%', padding: '6px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setActiveMenuTicketId(null);
                  onShowToast('info', 'Status Updated', `Ticket ${item.id} status set to In Progress.`);
                }}
              >
                <Clock size={13} />
                Mark In Progress
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

              <button
                style={{ width: '100%', padding: '6px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', color: 'var(--color-primary-600)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setActiveMenuTicketId(null);
                  onShowToast('success', 'Ticket Resolved', `Ticket ${item.id} marked as Resolved.`);
                }}
              >
                <CheckCircle2 size={13} />
                Resolve Ticket
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  // Bulk Selection Toggles
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedTicketIds(filteredTickets.map(t => t.id));
    else setSelectedTicketIds([]);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) setSelectedTicketIds(prev => [...prev, id]);
    else setSelectedTicketIds(prev => prev.filter(i => i !== id));
  };

  const clearBulkModal = () => {
    setBulkAction(null);
    setBulkCloseReasonId('');
    setBulkCloseComment('');
  };

  const applyBulkToSelected = (updater: (ticket: OperationalTicket) => OperationalTicket) => {
    setTicketsQueue(prev =>
      prev.map(ticket => (selectedTicketIds.includes(ticket.id) ? updater(ticket) : ticket))
    );
  };

  const handleConfirmBulkAction = () => {
    const count = selectedTicketIds.length;
    const idsLabel = selectedTicketIds.slice(0, 3).join(', ') + (count > 3 ? ` +${count - 3} more` : '');

    if (bulkAction === 'assign') {
      applyBulkToSelected(t => ({
        ...t,
        assignedTo: bulkAssignAgent,
        status: t.status === 'Open' ? 'Assigned' : t.status,
        lastUpdated: 'Just now'
      }));
      onShowToast('success', 'Bulk Assign Complete', `${count} tickets assigned to ${bulkAssignAgent}. (${idsLabel})`);
    }

    if (bulkAction === 'priority') {
      applyBulkToSelected(t => ({ ...t, priority: bulkPriority, lastUpdated: 'Just now' }));
      onShowToast('success', 'Priority Updated', `${count} tickets set to ${bulkPriority} priority.`);
    }

    if (bulkAction === 'escalate') {
      applyBulkToSelected(t => ({
        ...t,
        priority: t.priority === 'Urgent' ? 'Urgent' : t.priority === 'High' ? 'Urgent' : 'High',
        lastUpdated: 'Just now'
      }));
      onShowToast(
        'warning',
        'Escalation Triggered',
        `${count} tickets escalated to ${bulkEscalateLevel}. Priority raised where applicable.`
      );
    }

    if (bulkAction === 'spam') {
      const reason = getClosingReasonById(bulkCloseReasonId);
      const reasonLabel = reason?.label || 'Spam';

      applyBulkToSelected(t => ({
        ...t,
        status: 'Closed',
        slaText: 'Closed (Spam)',
        lastUpdated: 'Just now'
      }));
      onShowToast(
        'success',
        'Closed as Spam',
        `${count} tickets closed — ${reasonLabel}.${bulkCloseComment ? ` Note: ${bulkCloseComment}` : ''}`
      );
    }

    if (bulkAction === 'duplicate') {
      const reason = getClosingReasonById(bulkCloseReasonId);
      const reasonLabel = reason?.label || 'Duplicate';

      applyBulkToSelected(t => ({
        ...t,
        status: 'Closed',
        slaText: 'Closed (Duplicate)',
        lastUpdated: 'Just now'
      }));
      onShowToast(
        'success',
        'Closed as Duplicate',
        `${count} tickets closed — ${reasonLabel}.${bulkCloseComment ? ` Note: ${bulkCloseComment}` : ''}`
      );
    }

    setSelectedTicketIds([]);
    clearBulkModal();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setTeamFilter('all');
    setAgentFilter('all');
    setDepartmentFilter('all');
    setLocationFilter('all');
    setSlaFilter('all');
    setAssigneeFilter('all');
    onShowToast('info', 'Filters Cleared', 'All filter constraints reset.');
  };

  return (
    <div className="all-tickets-container">
      {/* PAGE HEADER */}
      <PageHeader
        breadcrumbs={[
          { label: 'Sixtifi WFM' },
          { label: 'Helpdesk' },
          { label: 'All Tickets' }
        ]}
        title="All Tickets"
        subtitle={`Operational queue for ${company.name}.`}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2-5)' }}>
            <Button
              variant="outline"
              leftIcon={<Download size={15} />}
              onClick={() => onShowToast('info', 'Export Started', 'Exporting ticket queue to CSV...')}
            >
              Export
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={onOpenCreateRequest}
            >
              + Create Ticket
            </Button>
          </div>
        }
      />

      {/* SECTION 2 — SEARCH & FILTERS TOOLBAR */}
      <div className="filter-toolbar-box">
        <div className="toolbar-primary-row">
          <div className="toolbar-controls-left">
            <div style={{ width: '200px' }}>
              <SelectInput
                value={companyId}
                onChange={e => {
                  onCompanyChange(e.target.value);
                  setCategoryFilter('all');
                  setCurrentPage(1);
                }}
                aria-label="Company"
              >
                {HELPDESK_COMPANIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </div>

            <div style={{ width: '300px' }}>
              <SearchInput
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Search by ticket ID, subject or employee..."
              />
            </div>

            <div style={{ width: '160px' }}>
              <SelectInput value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="open">{getPlainStatusLabel('Open')}</option>
                <option value="assigned">{getPlainStatusLabel('Assigned')}</option>
                <option value="inprogress">{getPlainStatusLabel('In Progress')}</option>
                <option value="waitingforemployee">{getPlainStatusLabel('Waiting for Employee')}</option>
                <option value="resolved">{getPlainStatusLabel('Resolved')}</option>
                <option value="closed">{getPlainStatusLabel('Closed')}</option>
              </SelectInput>
            </div>

            <div style={{ width: '150px' }}>
              <SelectInput
                value={assigneeFilter}
                onChange={e => setAssigneeFilter(e.target.value as 'all' | 'unassigned' | 'me')}
              >
                <option value="all">All Assignees</option>
                <option value="me">Assigned to me</option>
                <option value="unassigned">Unassigned</option>
              </SelectInput>
            </div>

            <div style={{ width: '130px' }}>
              <SelectInput value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </SelectInput>
            </div>

            <div style={{ width: '140px' }}>
              <SelectInput value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="attendance">Attendance</option>
                <option value="payroll">Payroll</option>
                <option value="leave">Leave</option>
                <option value="hr">HR</option>
                <option value="it">IT</option>
                <option value="administration">Administration</option>
              </SelectInput>
            </div>

            {/* MORE FILTERS POPOVER TRIGGER */}
            <div style={{ position: 'relative' }}>
              <Button
                variant="secondary"
                leftIcon={<Filter size={14} />}
                onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
              >
                More Filters
              </Button>

              {/* MORE FILTERS PANEL */}
              {isMoreFiltersOpen && (
                <div className="more-filters-popover">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Extended Filters</span>
                    <IconButton icon={<X size={14} />} ariaLabel="Close" variant="ghost" size="sm" onClick={() => setIsMoreFiltersOpen(false)} />
                  </div>

                  <div className="popover-grid-layout">
                    <div>
                      <label className="form-label">Assigned Agent</label>
                      <SelectInput value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
                        <option value="all">All Agents</option>
                        <option value="rahul">Rahul Sharma</option>
                        <option value="priya">Priya Shah</option>
                        <option value="elena">Elena Rostova</option>
                      </SelectInput>
                    </div>

                    <div>
                      <label className="form-label">Department</label>
                      <SelectInput value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
                        <option value="all">All Departments</option>
                        <option value="hr">Human Resources</option>
                        <option value="eng">Engineering</option>
                        <option value="ops">Operations</option>
                      </SelectInput>
                    </div>

                    <div>
                      <label className="form-label">Location</label>
                      <SelectInput value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                        <option value="all">All Locations</option>
                        <option value="ny">New York</option>
                        <option value="surat">Surat Branch</option>
                        <option value="london">London</option>
                      </SelectInput>
                    </div>

                    <div>
                      <label className="form-label">SLA Status</label>
                      <SelectInput value={slaFilter} onChange={e => setSlaFilter(e.target.value)}>
                        <option value="all">All SLA States</option>
                        <option value="on-track">On Track</option>
                        <option value="at-risk">At Risk</option>
                        <option value="breached">Breached</option>
                      </SelectInput>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>Clear</Button>
                    <Button variant="primary" size="sm" onClick={() => setIsMoreFiltersOpen(false)}>Apply Filters</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SAVE VIEW BUTTON */}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Bookmark size={14} />}
            onClick={() => setIsSaveViewModalOpen(true)}
          >
            Save View
          </Button>
        </div>

        {/* ACTIVE REMOVABLE FILTER CHIPS */}
        {(statusFilter !== 'all' ||
          priorityFilter !== 'all' ||
          categoryFilter !== 'all' ||
          assigneeFilter !== 'all' ||
          slaFilter !== 'all' ||
          searchQuery) && (
          <div className="active-chips-row">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Filters:</span>

            {statusFilter !== 'all' && (
              <span className="filter-chip-tag">
                Status: {statusFilter}
                <button className="chip-remove-btn" onClick={() => setStatusFilter('all')}><X size={12} /></button>
              </span>
            )}

            {assigneeFilter !== 'all' && (
              <span className="filter-chip-tag">
                Assignee: {assigneeFilter === 'me' ? 'me' : 'unassigned'}
                <button className="chip-remove-btn" onClick={() => setAssigneeFilter('all')}><X size={12} /></button>
              </span>
            )}

            {priorityFilter !== 'all' && (
              <span className="filter-chip-tag">
                Priority: {priorityFilter}
                <button className="chip-remove-btn" onClick={() => setPriorityFilter('all')}><X size={12} /></button>
              </span>
            )}

            {categoryFilter !== 'all' && (
              <span className="filter-chip-tag">
                Category: {categoryFilter}
                <button className="chip-remove-btn" onClick={() => setCategoryFilter('all')}><X size={12} /></button>
              </span>
            )}

            {slaFilter !== 'all' && (
              <span className="filter-chip-tag">
                SLA: {slaFilter}
                <button className="chip-remove-btn" onClick={() => setSlaFilter('all')}><X size={12} /></button>
              </span>
            )}

            {searchQuery && (
              <span className="filter-chip-tag">
                Search: "{searchQuery}"
                <button className="chip-remove-btn" onClick={() => setSearchQuery('')}><X size={12} /></button>
              </span>
            )}

            <Button variant="ghost" size="sm" onClick={handleClearFilters} style={{ fontSize: '11px', height: '22px' }}>
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* CONTEXTUAL BULK ACTION BAR — Lead Ops */}
      <BulkActionsBar selectedCount={selectedTicketIds.length} onClear={() => setSelectedTicketIds([])}>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<UserCheck size={14} />}
          onClick={() => setBulkAction('assign')}
        >
          Assign
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowUp size={14} />}
          onClick={() => setBulkAction('priority')}
        >
          Change Priority
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Bell size={14} />}
          onClick={() => setBulkAction('escalate')}
        >
          Escalate
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Ban size={14} />}
          onClick={() => {
            setBulkCloseReasonId(getDefaultClosingReasonId('spam'));
            setBulkCloseComment('');
            setBulkAction('spam');
          }}
        >
          Close as Spam
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Copy size={14} />}
          onClick={() => {
            setBulkCloseReasonId(getDefaultClosingReasonId('duplicate'));
            setBulkCloseComment('');
            setBulkAction('duplicate');
          }}
        >
          Close as Duplicate
        </Button>
      </BulkActionsBar>

      {/* SECTION 4 — OPERATIONAL TICKET TABLE */}
      {filteredTickets.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Table
            columns={columns}
            data={filteredTickets}
            keyExtractor={t => t.id}
            selectedIds={selectedTicketIds}
            onSelectRow={(id, checked) => handleSelectRow(id, checked)}
            onSelectAll={handleSelectAll}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={key => {
              if (sortColumn === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortColumn(key); setSortDirection('desc'); }
            }}
            onRowClick={item => onNavigateToTicketDetail(item.id)}
          />

          {/* SECTION 5 — PAGINATION */}
          <Pagination
            currentPage={currentPage}
            totalPages={5}
            pageSize={pageSize}
            totalItems={128}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        /* SECTION 4 — EMPTY STATE */
        <EmptyState
          icon={<Ticket size={24} />}
          title="No tickets found"
          description="Try adjusting your filters or search criteria."
          action={
            <Button variant="secondary" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          }
        />
      )}

      {/* SAVE VIEW PRESET MODAL */}
      <Modal
        isOpen={isSaveViewModalOpen}
        onClose={() => setIsSaveViewModalOpen(false)}
        title="Save Custom Filter View"
        subtitle="Save current filter preset for quick access in your workflow."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSaveViewModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!savedViewName.trim()}
              onClick={() => {
                setIsSaveViewModalOpen(false);
                onShowToast('success', 'View Saved', `Filter view "${savedViewName}" saved.`);
                setSavedViewName('');
              }}
            >
              Save View
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label className="form-label" style={{ fontWeight: 600 }}>Preset Name</label>
          <input
            className="input-control"
            value={savedViewName}
            onChange={e => setSavedViewName(e.target.value)}
            placeholder="e.g. My High Priority Tickets, Payroll SLA Breached..."
          />
        </div>
      </Modal>

      {/* AGENT INLINE ASSIGNMENT MODAL */}
      <Modal
        isOpen={!!assignModalTicket}
        onClose={() => setAssignModalTicket(null)}
        title={`Assign Ticket ${assignModalTicket?.id}`}
        subtitle={`Select support specialist to assign ${assignModalTicket?.subject}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignModalTicket(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (assignModalTicket) {
                  setTicketsQueue(prev =>
                    prev.map(t =>
                      t.id === assignModalTicket.id
                        ? { ...t, assignedTo: selectedAssignAgent, status: t.status === 'Open' ? 'Assigned' : t.status, lastUpdated: 'Just now' }
                        : t
                    )
                  );
                }
                onShowToast('success', 'Agent Assigned', `Ticket ${assignModalTicket?.id} assigned to ${selectedAssignAgent}.`);
                setAssignModalTicket(null);
              }}
            >
              Confirm Assignment
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="Assigned Support Specialist">
            <SelectInput value={selectedAssignAgent} onChange={e => setSelectedAssignAgent(e.target.value)}>
              <option value="Rahul Sharma">Rahul Sharma (HR Support Lead)</option>
              <option value="Priya Shah">Priya Shah (Payroll Ops Lead)</option>
              <option value="Elena Rostova">Elena Rostova (HR Partner)</option>
              <option value="Michael Chen">Michael Chen (IT Support)</option>
            </SelectInput>
          </FormField>
        </div>
      </Modal>

      {/* BULK LEAD OPS MODALS */}
      <Modal
        isOpen={bulkAction === 'assign'}
        onClose={clearBulkModal}
        title={`Assign ${selectedTicketIds.length} Tickets`}
        subtitle="Reassign selected tickets to a support specialist."
        footer={
          <>
            <Button variant="secondary" onClick={clearBulkModal}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmBulkAction}>Assign Selected</Button>
          </>
        }
      >
        <FormField label="Assign to">
          <SelectInput value={bulkAssignAgent} onChange={e => setBulkAssignAgent(e.target.value)}>
            <option value="Rahul Sharma">Rahul Sharma (HR Support Lead)</option>
            <option value="Priya Shah">Priya Shah (Payroll Ops Lead)</option>
            <option value="Elena Rostova">Elena Rostova (HR Partner)</option>
            <option value="Michael Chen">Michael Chen (IT Support)</option>
          </SelectInput>
        </FormField>
      </Modal>

      <Modal
        isOpen={bulkAction === 'priority'}
        onClose={clearBulkModal}
        title={`Change Priority — ${selectedTicketIds.length} Tickets`}
        subtitle="Apply a new priority to all selected tickets."
        footer={
          <>
            <Button variant="secondary" onClick={clearBulkModal}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmBulkAction}>Update Priority</Button>
          </>
        }
      >
        <FormField label="New Priority">
          <SelectInput value={bulkPriority} onChange={e => setBulkPriority(e.target.value as TicketPriority)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </SelectInput>
        </FormField>
      </Modal>

      <Modal
        isOpen={bulkAction === 'escalate'}
        onClose={clearBulkModal}
        title={`Escalate ${selectedTicketIds.length} Tickets`}
        subtitle="Notify the next escalation level and raise priority where needed."
        footer={
          <>
            <Button variant="secondary" onClick={clearBulkModal}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmBulkAction}>Escalate Selected</Button>
          </>
        }
      >
        <FormField label="Escalate to" hint={`People in ${company.name}`}>
          <SelectInput value={bulkEscalateLevel} onChange={e => setBulkEscalateLevel(e.target.value)}>
            {companyPeople.map(p => (
              <option key={p.id} value={p.name}>
                {p.name} ({p.department})
              </option>
            ))}
          </SelectInput>
        </FormField>
      </Modal>

      <Modal
        isOpen={bulkAction === 'spam'}
        onClose={clearBulkModal}
        title={`Close as Spam — ${selectedTicketIds.length} Tickets`}
        subtitle="Selected tickets will be marked Closed (Spam)."
        footer={
          <>
            <Button variant="secondary" onClick={clearBulkModal}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleConfirmBulkAction}
              disabled={!canSubmitClosingReason(bulkCloseReasonId, bulkCloseComment)}
            >
              Close as Spam
            </Button>
          </>
        }
      >
        <ClosingReasonFields
          context="spam"
          selectedReasonId={bulkCloseReasonId}
          onReasonChange={setBulkCloseReasonId}
          comment={bulkCloseComment}
          onCommentChange={setBulkCloseComment}
          commentLabel="Internal note"
          commentPlaceholder="e.g. Bulk spam from external sender..."
        />
      </Modal>

      <Modal
        isOpen={bulkAction === 'duplicate'}
        onClose={clearBulkModal}
        title={`Close as Duplicate — ${selectedTicketIds.length} Tickets`}
        subtitle="Selected tickets will be marked Closed (Duplicate)."
        footer={
          <>
            <Button variant="secondary" onClick={clearBulkModal}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleConfirmBulkAction}
              disabled={!canSubmitClosingReason(bulkCloseReasonId, bulkCloseComment)}
            >
              Close as Duplicate
            </Button>
          </>
        }
      >
        <ClosingReasonFields
          context="duplicate"
          selectedReasonId={bulkCloseReasonId}
          onReasonChange={setBulkCloseReasonId}
          comment={bulkCloseComment}
          onCommentChange={setBulkCloseComment}
          commentLabel="Link / note"
          commentPlaceholder="e.g. Duplicate of TKT-4089"
        />
      </Modal>
    </div>
  );
};
