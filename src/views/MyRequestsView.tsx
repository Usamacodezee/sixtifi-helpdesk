import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { StatusBadge, PriorityBadge, getPlainStatusLabel } from '../components/ui/Badge';
import { SearchInput, SelectInput } from '../components/ui/FormControls';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import {
  Ticket,
  Plus,
  MoreVertical,
  MessageSquare,
  RotateCcw,
  Eye
} from 'lucide-react';
import { HELPDESK_COMPANIES, getCompanyById } from '../data/companies';
import './MyRequestsView.css';

export interface MyRequestsViewProps {
  companyId: string;
  onCompanyChange: (companyId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onOpenRaiseRequest: (preselectedCategory?: string) => void;
  onNavigateToTicketDetail: (ticketId: string, focusComment?: boolean) => void;
}

export interface EmployeeTicket {
  id: string;
  companyId: string;
  subject: string;
  category: 'Attendance' | 'Payroll' | 'Leave' | 'HR' | 'IT' | 'Administration' | 'Fleet Support' | 'Warehouse Ops' | 'Store Operations' | 'Retail HR';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed' | 'Reopened';
  createdDate: string;
  lastUpdated: string;
  assignedAgent?: string;
  resolutionNote?: string;
}

export const MyRequestsView: React.FC<MyRequestsViewProps> = ({
  companyId,
  onCompanyChange,
  onShowToast,
  onOpenRaiseRequest,
  onNavigateToTicketDetail
}) => {
  const company = getCompanyById(companyId);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modal & Menu States
  const [reopenTargetTicket, setReopenTargetTicket] = useState<EmployeeTicket | null>(null);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [activeMenuTicketId, setActiveMenuTicketId] = useState<string | null>(null);

  // Sample Employee Requests Data
  const employeeTickets: EmployeeTicket[] = [
    {
      id: 'TKT-4089',
      companyId: 'co-acme',
      subject: 'Missing attendance punch for Aug 17',
      category: 'Attendance',
      priority: 'High',
      status: 'In Progress',
      createdDate: 'Aug 17, 2026',
      lastUpdated: 'Today',
      assignedAgent: 'Alex Rivera (IT & HR Ops)'
    },
    {
      id: 'TKT-4084',
      companyId: 'co-acme',
      subject: 'June payslip not visible',
      category: 'Payroll',
      priority: 'Urgent',
      status: 'Open',
      createdDate: 'Aug 16, 2026',
      lastUpdated: 'Yesterday',
      assignedAgent: 'Priya Shah'
    },
    {
      id: 'TKT-4079',
      companyId: 'co-acme',
      subject: 'Leave balance discrepancy',
      category: 'Leave',
      priority: 'Medium',
      status: 'Resolved',
      createdDate: 'Aug 12, 2026',
      lastUpdated: 'Aug 14',
      assignedAgent: 'Rahul Sharma',
      resolutionNote: 'Balance corrected'
    },
    {
      id: 'TKT-4075',
      companyId: 'co-acme',
      subject: 'Policy clarification on WFH',
      category: 'HR',
      priority: 'Low',
      status: 'Closed',
      createdDate: 'Aug 08, 2026',
      lastUpdated: 'Aug 10',
      assignedAgent: 'Elena Rostova'
    },
    {
      id: 'TKT-4068',
      companyId: 'co-acme',
      subject: 'Laptop charger replacement',
      category: 'IT',
      priority: 'Medium',
      status: 'In Progress',
      createdDate: 'Aug 05, 2026',
      lastUpdated: 'Today',
      assignedAgent: 'David Miller'
    },
    {
      id: 'TKT-5102',
      companyId: 'co-northwind',
      subject: 'Fleet GPS offline — truck 14',
      category: 'Fleet Support',
      priority: 'High',
      status: 'In Progress',
      createdDate: 'Aug 20, 2026',
      lastUpdated: 'Today',
      assignedAgent: 'Rahul Sharma'
    },
    {
      id: 'TKT-5098',
      companyId: 'co-northwind',
      subject: 'Warehouse scanner sync failure',
      category: 'Warehouse Ops',
      priority: 'Urgent',
      status: 'Open',
      createdDate: 'Aug 19, 2026',
      lastUpdated: 'Yesterday'
    },
    {
      id: 'TKT-6201',
      companyId: 'co-contoso',
      subject: 'POS till mismatch — Store 08',
      category: 'Store Operations',
      priority: 'High',
      status: 'Assigned',
      createdDate: 'Aug 21, 2026',
      lastUpdated: 'Today',
      assignedAgent: 'Priya Shah'
    },
    {
      id: 'TKT-6195',
      companyId: 'co-contoso',
      subject: 'Part-time shift swap approval',
      category: 'Retail HR',
      priority: 'Low',
      status: 'Resolved',
      createdDate: 'Aug 18, 2026',
      lastUpdated: 'Aug 19',
      assignedAgent: 'Elena Rostova',
      resolutionNote: 'Swap approved'
    }
  ];

  // Filtering Logic
  const filteredTickets = employeeTickets.filter(ticket => {
    if (ticket.companyId !== companyId) return false;

    const matchesSearch =
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || ticket.status.toLowerCase().replace(/\s+/g, '') === statusFilter;
    const matchesCategory =
      categoryFilter === 'all' || ticket.category.toLowerCase() === categoryFilter;
    const matchesPriority =
      priorityFilter === 'all' || ticket.priority.toLowerCase() === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  // Table Columns
  const columns: Column<EmployeeTicket>[] = [
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
      key: 'category',
      header: 'Category',
      sortable: true,
      render: item => (
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {item.category}
        </span>
      )
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
      key: 'createdDate',
      header: 'Created',
      sortable: true,
      render: item => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{item.createdDate}</span>
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      sortable: true,
      render: item => <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>{item.lastUpdated}</span>
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      render: item => (
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <IconButton
            icon={<MoreVertical size={16} />}
            ariaLabel="Options"
            variant="ghost"
            onClick={() => setActiveMenuTicketId(activeMenuTicketId === item.id ? null : item.id)}
          />

          {/* Row Actions Dropdown Menu */}
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
                zIndex: 50,
                minWidth: '150px',
                padding: '4px 0'
              }}
            >
              <button
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setActiveMenuTicketId(null);
                  onNavigateToTicketDetail(item.id);
                }}
              >
                <Eye size={13} />
                View Request
              </button>

              <button
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setActiveMenuTicketId(null);
                  onNavigateToTicketDetail(item.id, true);
                }}
              >
                <MessageSquare size={13} />
                Add Comment
              </button>

              {(item.status === 'Resolved' || item.status === 'Closed') && (
                <button
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: 'var(--color-primary-600)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setReopenTargetTicket(item);
                    setIsReopenModalOpen(true);
                    setActiveMenuTicketId(null);
                  }}
                >
                  <RotateCcw size={13} />
                  Reopen Request
                </button>
              )}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="my-requests-container">
      {/* PAGE HEADER */}
      <PageHeader
        breadcrumbs={[
          { label: 'Sixtifi WFM' },
          { label: 'Helpdesk' },
          { label: 'My Requests' }
        ]}
        title="My Requests"
        subtitle={`Track requests you raised for ${company.name}.`}
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => onOpenRaiseRequest()}
          >
            Raise a Request
          </Button>
        }
      />

      {/* SECTION 2 — REQUEST LIST TOOLBAR & TABLE */}
      <div className="table-filter-toolbar">
        <div className="filter-controls-left">
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

          <div style={{ width: '280px' }}>
            <SearchInput
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search by ticket ID or subject..."
            />
          </div>

          <div style={{ width: '170px' }}>
            <SelectInput value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="open">{getPlainStatusLabel('Open')}</option>
              <option value="assigned">{getPlainStatusLabel('Assigned')}</option>
              <option value="inprogress">{getPlainStatusLabel('In Progress')}</option>
              <option value="resolved">{getPlainStatusLabel('Resolved')}</option>
              <option value="closed">{getPlainStatusLabel('Closed')}</option>
              <option value="reopened">{getPlainStatusLabel('Reopened')}</option>
            </SelectInput>
          </div>

          <div style={{ width: '150px' }}>
            <SelectInput value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="attendance">Attendance</option>
              <option value="payroll">Payroll</option>
              <option value="leave">Leave</option>
              <option value="hr">HR Policy</option>
              <option value="it">IT Support</option>
            </SelectInput>
          </div>

          <div style={{ width: '140px' }}>
            <SelectInput value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </SelectInput>
          </div>

          <div style={{ width: '140px' }}>
            <SelectInput value={dateRangeFilter} onChange={e => setDateRangeFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
            </SelectInput>
          </div>
        </div>
      </div>

      {/* SECTION 2 & 4: TABLE OR EMPTY STATE */}
      {filteredTickets.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Table
            columns={columns}
            data={filteredTickets}
            keyExtractor={t => t.id}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={key => {
              if (sortColumn === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortColumn(key); setSortDirection('desc'); }
            }}
            onRowClick={item => {
              onNavigateToTicketDetail(item.id);
            }}
          />

          {/* SECTION 5 — PAGINATION */}
          <Pagination
            currentPage={currentPage}
            totalPages={3}
            pageSize={pageSize}
            totalItems={24}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        /* SECTION 4 — EMPTY STATE */
        <EmptyState
          icon={<Ticket size={24} />}
          title="No requests yet"
          description="You haven't raised any Helpdesk requests yet."
          action={
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => onOpenRaiseRequest()}
            >
              + Raise Request
            </Button>
          }
        />
      )}

      {/* REOPEN REQUEST CONFIRMATION MODAL */}
      <Modal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        title="Reopen Helpdesk Request"
        subtitle={`Reopening request ${reopenTargetTicket?.id}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReopenModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsReopenModalOpen(false);
                onShowToast('info', 'Request Reopened', `Request ${reopenTargetTicket?.id} status changed to Reopened.`);
              }}
            >
              Confirm Reopen
            </Button>
          </>
        }
      >
        <p className="text-body" style={{ marginBottom: '12px' }}>
          If your issue is unresolved or has recurred, reopening will notify your assigned support agent immediately.
        </p>
        <textarea
          className="input-control"
          style={{ height: '70px', padding: '8px' }}
          placeholder="Reason for reopening (optional)..."
        />
      </Modal>
    </div>
  );
};
