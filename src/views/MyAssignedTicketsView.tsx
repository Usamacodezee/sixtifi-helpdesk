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
import { QuickReplyPicker } from '../components/helpdesk/QuickReplyPicker';
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
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  Ban,
  Copy,
  Bell,
  UserCheck
} from 'lucide-react';
import './MyAssignedTicketsView.css';

type BulkLeadAction = 'assign' | 'priority' | 'escalate' | 'spam' | 'duplicate' | null;

export interface AssignedTicketItem {
  id: string;
  companyId: string;
  subject: string;
  requester: string;
  category: 'Attendance' | 'Payroll' | 'Leave' | 'HR' | 'IT' | 'Administration' | 'Fleet Support' | 'Warehouse Ops' | 'Store Operations' | 'Retail HR';
  priority: TicketPriority;
  status: TicketStatus;
  slaText: string;
  slaState: 'on-track' | 'at-risk' | 'breached';
  lastUpdated: string;
  isDueToday?: boolean;
}

export interface MyAssignedTicketsViewProps {
  companyId: string;
  onCompanyChange: (companyId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onOpenCreateRequest: () => void;
  onNavigateToTicketDetail: (ticketId: string, focusComment?: boolean) => void;
}

export const MyAssignedTicketsView: React.FC<MyAssignedTicketsViewProps> = ({
  companyId,
  onCompanyChange,
  onShowToast,
  onOpenCreateRequest,
  onNavigateToTicketDetail
}) => {
  const company = getCompanyById(companyId);
  const companyPeople = employeesForCompany(companyId);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [sortBy, setSortBy] = useState('sla');
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);

  // Active Menu State
  const [activeMenuTicketId, setActiveMenuTicketId] = useState<string | null>(null);
  const [replyTargetTicket, setReplyTargetTicket] = useState<AssignedTicketItem | null>(null);
  const [quickReplyText, setQuickReplyText] = useState('');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkLeadAction>(null);
  const [bulkAssignAgent, setBulkAssignAgent] = useState('Priya Shah');
  const [bulkPriority, setBulkPriority] = useState<TicketPriority>('High');
  const [bulkEscalateLevel, setBulkEscalateLevel] = useState(() => employeesForCompany(companyId)[0]?.name || '');
  const [bulkCloseReasonId, setBulkCloseReasonId] = useState('');
  const [bulkCloseComment, setBulkCloseComment] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sample Agent Workload Tickets Queue (12 Total Assigned to Agent Rahul Sharma)
  const [agentTickets, setAgentTickets] = useState<AssignedTicketItem[]>([
    {
      id: 'TKT-4089',
      companyId: 'co-acme',
      subject: 'Missing attendance punch for Aug 17',
      requester: 'Alex Rivera',
      category: 'Attendance',
      priority: 'High',
      status: 'In Progress',
      slaText: '2h 14m remaining',
      slaState: 'on-track',
      lastUpdated: '5 min ago',
      isDueToday: true
    },
    {
      id: 'TKT-4088',
      companyId: 'co-acme',
      subject: 'Payroll deduction clarification',
      requester: 'Marcus Chen',
      category: 'Payroll',
      priority: 'Urgent',
      status: 'In Progress',
      slaText: '15m remaining',
      slaState: 'at-risk',
      lastUpdated: '12 min ago',
      isDueToday: true
    },
    {
      id: 'TKT-4087',
      companyId: 'co-acme',
      subject: 'Attendance regularization request',
      requester: 'Priya Sharma',
      category: 'Attendance',
      priority: 'Medium',
      status: 'Assigned',
      slaText: '5h remaining',
      slaState: 'on-track',
      lastUpdated: '25 min ago',
      isDueToday: true
    },
    {
      id: 'TKT-4082',
      companyId: 'co-acme',
      subject: 'Leave balance discrepancy',
      requester: 'Emma Wilson',
      category: 'Leave',
      priority: 'Medium',
      status: 'In Progress',
      slaText: '1d remaining',
      slaState: 'on-track',
      lastUpdated: '1 hour ago',
      isDueToday: false
    },
    {
      id: 'TKT-4079',
      companyId: 'co-acme',
      subject: 'Employee policy clarification',
      requester: 'David Miller',
      category: 'HR',
      priority: 'Low',
      status: 'In Progress',
      slaText: '2d remaining',
      slaState: 'on-track',
      lastUpdated: '2 hours ago',
      isDueToday: false
    },
    {
      id: 'TKT-4075',
      companyId: 'co-acme',
      subject: 'Laptop charger replacement',
      requester: 'Sarah Jenkins',
      category: 'IT',
      priority: 'High',
      status: 'In Progress',
      slaText: 'SLA Breached (1h overdue)',
      slaState: 'breached',
      lastUpdated: '3 hours ago',
      isDueToday: true
    },
    {
      id: 'TKT-5102',
      companyId: 'co-northwind',
      subject: 'Fleet GPS offline — truck 14',
      requester: 'Jordan Lee',
      category: 'Fleet Support',
      priority: 'High',
      status: 'In Progress',
      slaText: '40m remaining',
      slaState: 'at-risk',
      lastUpdated: '20 min ago',
      isDueToday: true
    },
    {
      id: 'TKT-6201',
      companyId: 'co-contoso',
      subject: 'POS till mismatch — Store 08',
      requester: 'Mia Chen',
      category: 'Store Operations',
      priority: 'High',
      status: 'Assigned',
      slaText: '55m remaining',
      slaState: 'at-risk',
      lastUpdated: '1 hour ago',
      isDueToday: true
    }
  ]);

  // Filtering & Sorting Logic
  const filteredTickets = agentTickets.filter(ticket => {
    if (ticket.companyId !== companyId) return false;
    if (dueTodayOnly && !ticket.isDueToday) return false;
    if (highPriorityOnly && ticket.priority !== 'High' && ticket.priority !== 'Urgent') return false;

    const matchesSearch =
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.requester.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ticket.status.toLowerCase().replace(/\s+/g, '') === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority.toLowerCase() === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category.toLowerCase() === categoryFilter;
    const matchesSla =
      slaFilter === 'all' ||
      (slaFilter === 'attention'
        ? ticket.slaState === 'at-risk' || ticket.slaState === 'breached'
        : ticket.slaState === slaFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesSla;
  });

  // Table Columns
  const columns: Column<AssignedTicketItem>[] = [
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
                  onNavigateToTicketDetail(item.id, true);
                }}
              >
                <MessageSquare size={13} />
                Add Reply
              </button>

              <button
                style={{ width: '100%', padding: '6px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setActiveMenuTicketId(null);
                  onShowToast('info', 'Status Changed', `Ticket ${item.id} status updated.`);
                }}
              >
                <Clock size={13} />
                Change Status
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

  // Clear Filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setSlaFilter('all');
    setDueTodayOnly(false);
    setHighPriorityOnly(false);
    onShowToast('info', 'Filters Reset', 'Cleared all workload filters.');
  };

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

  const applyBulkToSelected = (updater: (ticket: AssignedTicketItem) => AssignedTicketItem) => {
    setAgentTickets(prev =>
      prev.map(ticket => (selectedTicketIds.includes(ticket.id) ? updater(ticket) : ticket))
    );
  };

  const handleConfirmBulkAction = () => {
    const count = selectedTicketIds.length;

    if (bulkAction === 'assign') {
      applyBulkToSelected(t => ({ ...t, lastUpdated: 'Just now' }));
      onShowToast('success', 'Bulk Reassign Complete', `${count} tickets reassigned to ${bulkAssignAgent}.`);
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
      onShowToast('warning', 'Escalation Triggered', `${count} tickets escalated to ${bulkEscalateLevel}.`);
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

  return (
    <div className="my-assigned-container">
      {/* PAGE HEADER */}
      <PageHeader
        breadcrumbs={[
          { label: 'Sixtifi WFM' },
          { label: 'Helpdesk' },
          { label: 'My Assigned Tickets' }
        ]}
        title="My Assigned Tickets"
        subtitle={`Your workload for ${company.name}.`}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2-5)' }}>
            <Button
              variant="outline"
              leftIcon={<Download size={15} />}
              onClick={() => onShowToast('info', 'Export Started', 'Exporting assigned workload to CSV...')}
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
      <div className="toolbar-agent-card">
        <div className="agent-toolbar-top">
          <div className="agent-toolbar-left">
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

            <div style={{ width: '310px' }}>
              <SearchInput
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Search my tickets by ticket ID, subject or requester..."
              />
            </div>

            <div style={{ width: '160px' }}>
              <SelectInput value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="open">{getPlainStatusLabel('Open')}</option>
                <option value="inprogress">{getPlainStatusLabel('In Progress')}</option>
                <option value="resolved">{getPlainStatusLabel('Resolved')}</option>
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
              </SelectInput>
            </div>

            <Button
              variant="secondary"
              leftIcon={<Filter size={14} />}
              onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
            >
              More Filters
            </Button>
          </div>

          {/* OPERATIONAL SORT CONTROL */}
          <div className="agent-toolbar-right">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Sort by:</span>
            <SelectInput value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: '140px' }}>
              <option value="sla">SLA Urgency</option>
              <option value="priority">Priority</option>
              <option value="created">Created Date</option>
              <option value="updated">Last Updated</option>
            </SelectInput>
            <IconButton icon={<ArrowUpDown size={14} />} ariaLabel="Toggle Sort" variant="ghost" size="sm" />
          </div>
        </div>

        {/* ACTIVE REMOVABLE FILTER CHIPS */}
        {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Filters:</span>
            {statusFilter !== 'all' && (
              <span className="filter-chip-tag">
                Status: {statusFilter}
                <button className="chip-remove-btn" onClick={() => setStatusFilter('all')}><X size={12} /></button>
              </span>
            )}
            {priorityFilter !== 'all' && (
              <span className="filter-chip-tag">
                Priority: {priorityFilter}
                <button className="chip-remove-btn" onClick={() => setPriorityFilter('all')}><X size={12} /></button>
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleClearFilters} style={{ fontSize: '11px', height: '22px' }}>
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* LEAD BULK OPS BAR */}
      <BulkActionsBar selectedCount={selectedTicketIds.length} onClear={() => setSelectedTicketIds([])}>
        <Button variant="secondary" size="sm" leftIcon={<UserCheck size={14} />} onClick={() => setBulkAction('assign')}>
          Assign
        </Button>
        <Button variant="secondary" size="sm" leftIcon={<ArrowUp size={14} />} onClick={() => setBulkAction('priority')}>
          Change Priority
        </Button>
        <Button variant="secondary" size="sm" leftIcon={<Bell size={14} />} onClick={() => setBulkAction('escalate')}>
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

      {/* SECTION 4 — MY TICKET QUEUE TABLE */}
      {filteredTickets.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Table
            columns={columns}
            data={filteredTickets}
            keyExtractor={t => t.id}
            selectedIds={selectedTicketIds}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            onRowClick={item => onNavigateToTicketDetail(item.id)}
          />

          {/* SECTION 5 — PAGINATION */}
          <Pagination
            currentPage={currentPage}
            totalPages={1}
            pageSize={pageSize}
            totalItems={12}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        /* NO WORK STATE */
        <EmptyState
          icon={<Ticket size={24} />}
          title="You're all caught up"
          description="There are no tickets currently assigned to you."
          action={
            <Button variant="secondary" onClick={handleClearFilters}>
              Clear Workload Filters
            </Button>
          }
        />
      )}

      {/* QUICK REPLY MODAL */}
      <Modal
        isOpen={!!replyTargetTicket}
        onClose={() => setReplyTargetTicket(null)}
        title={`Add Reply to ${replyTargetTicket?.id}`}
        subtitle={`Replying to ${replyTargetTicket?.requester} on "${replyTargetTicket?.subject}"`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReplyTargetTicket(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!quickReplyText.trim()}
              onClick={() => {
                onShowToast('success', 'Reply Added', `Reply posted to ${replyTargetTicket?.id}.`);
                setReplyTargetTicket(null);
                setQuickReplyText('');
              }}
            >
              Send Reply
            </Button>
          </>
        }
      >
        <FormField label="Reply Message" required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <QuickReplyPicker
              replyScope="public"
              onInsert={text => setQuickReplyText(prev => (prev.trim() ? `${prev.trim()}\n\n${text}` : text))}
              variables={{
                requester: replyTargetTicket?.requester || 'Employee',
                ticketId: replyTargetTicket?.id || '',
                agent: 'Rahul Sharma'
              }}
            />
            <textarea
              className="input-control"
              style={{ height: '90px', padding: '8px' }}
              value={quickReplyText}
              onChange={e => setQuickReplyText(e.target.value)}
              placeholder="Type your response to the employee..."
            />
          </div>
        </FormField>
      </Modal>

      {/* BULK LEAD OPS MODALS */}
      <Modal
        isOpen={bulkAction === 'assign'}
        onClose={clearBulkModal}
        title={`Assign ${selectedTicketIds.length} Tickets`}
        subtitle="Reassign selected tickets to another specialist."
        footer={
          <>
            <Button variant="secondary" onClick={clearBulkModal}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmBulkAction}>Assign Selected</Button>
          </>
        }
      >
        <FormField label="Assign to">
          <SelectInput value={bulkAssignAgent} onChange={e => setBulkAssignAgent(e.target.value)}>
            <option value="Priya Shah">Priya Shah (Payroll Ops Lead)</option>
            <option value="Elena Rostova">Elena Rostova (HR Partner)</option>
            <option value="Michael Chen">Michael Chen (IT Support)</option>
            <option value="Rahul Sharma">Rahul Sharma (HR Support Lead)</option>
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
