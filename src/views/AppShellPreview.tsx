import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { FormField, TextInput, SelectInput, SearchInput } from '../components/ui/FormControls';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';
import {
  Ticket,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Download,
  MoreVertical
} from 'lucide-react';

export interface AppShellPreviewProps {
  activeNavId: string;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onOpenCreateDrawer: () => void;
}

interface TicketRecord {
  id: string;
  subject: string;
  category: string;
  department: string;
  requester: { name: string; email: string; initials: string };
  assignee: { name: string; avatar: string };
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed' | 'Reopened';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  created: string;
  slaDueDate: string;
  isSlaWarning?: boolean;
}

export const AppShellPreview: React.FC<AppShellPreviewProps> = ({
  activeNavId,
  onShowToast,
  onOpenCreateDrawer
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Inspection Drawer
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const tickets: TicketRecord[] = [
    {
      id: 'TKT-4089',
      subject: 'MacBook Pro M3 Max display glitch after OS patch',
      category: 'IT Hardware',
      department: 'Engineering',
      requester: { name: 'Sarah Jenkins', email: 's.jenkins@sixtifi.com', initials: 'SJ' },
      assignee: { name: 'Alex Rivera', avatar: 'AR' },
      status: 'Open',
      priority: 'High',
      created: '12m ago',
      slaDueDate: '2h remaining',
      isSlaWarning: false
    },
    {
      id: 'TKT-4088',
      subject: 'Discrepancy in annual performance bonus calculation',
      category: 'Payroll & Tax',
      department: 'Product Management',
      requester: { name: 'Marcus Chen', email: 'm.chen@sixtifi.com', initials: 'MC' },
      assignee: { name: 'Elena Rostova', avatar: 'ER' },
      status: 'In Progress',
      priority: 'Urgent',
      created: '45m ago',
      slaDueDate: '15m remaining',
      isSlaWarning: true
    },
    {
      id: 'TKT-4087',
      subject: 'Request attendance regularization for field work on Aug 14',
      category: 'Attendance & Leave',
      department: 'Sales & Growth',
      requester: { name: 'Priya Sharma', email: 'p.sharma@sixtifi.com', initials: 'PS' },
      assignee: { name: 'Alex Rivera', avatar: 'AR' },
      status: 'Assigned',
      priority: 'Medium',
      created: '1h ago',
      slaDueDate: '5h remaining',
      isSlaWarning: false
    },
    {
      id: 'TKT-4086',
      subject: 'New employee onboarding hardware provisioning request',
      category: 'IT Procurement',
      department: 'Human Resources',
      requester: { name: 'David Miller', email: 'd.miller@sixtifi.com', initials: 'DM' },
      assignee: { name: 'Neha Patel', avatar: 'NP' },
      status: 'Open',
      priority: 'High',
      created: '2h ago',
      slaDueDate: '4h remaining',
      isSlaWarning: false
    },
    {
      id: 'TKT-4085',
      subject: 'Maternity leave policy confirmation & benefit claims',
      category: 'HR Benefits',
      department: 'Customer Support',
      requester: { name: 'Amanda Lewis', email: 'a.lewis@sixtifi.com', initials: 'AL' },
      assignee: { name: 'Elena Rostova', avatar: 'ER' },
      status: 'Resolved',
      priority: 'Low',
      created: '1d ago',
      slaDueDate: 'Completed',
      isSlaWarning: false
    },
    {
      id: 'TKT-4084',
      subject: 'Reopened: Access token renewal for staging API environment',
      category: 'IT Systems',
      department: 'DevOps',
      requester: { name: 'Vikram Patel', email: 'v.patel@sixtifi.com', initials: 'VP' },
      assignee: { name: 'Alex Rivera', avatar: 'AR' },
      status: 'Reopened',
      priority: 'Urgent',
      created: '1d ago',
      slaDueDate: '1h remaining',
      isSlaWarning: true
    },
    {
      id: 'TKT-4083',
      subject: 'Building access card upgrade for new branch office',
      category: 'Administration',
      department: 'Operations',
      requester: { name: 'Carlos Gomez', email: 'c.gomez@sixtifi.com', initials: 'CG' },
      assignee: { name: 'Admin Team', avatar: 'AT' },
      status: 'Closed',
      priority: 'Low',
      created: '3d ago',
      slaDueDate: 'Closed',
      isSlaWarning: false
    }
  ];

  // Filtering Logic
  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.requester.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status.toLowerCase().replace(/\s+/g, '') === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority.toLowerCase() === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || t.category.toLowerCase().includes(categoryFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const columns: Column<TicketRecord>[] = [
    {
      key: 'id',
      header: 'Ticket ID',
      sortable: true,
      width: '110px',
      render: item => <span className="table-cell-id">{item.id}</span>
    },
    {
      key: 'subject',
      header: 'Subject & Category',
      sortable: true,
      render: item => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.subject}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
            <span>{item.category}</span>
            <span>•</span>
            <span>{item.department}</span>
          </div>
        </div>
      )
    },
    {
      key: 'requester',
      header: 'Requester',
      render: item => (
        <div className="table-user-cell">
          <div className="user-avatar-sm">{item.requester.initials}</div>
          <div>
            <div className="user-meta-name">{item.requester.name}</div>
            <div className="user-meta-sub">{item.requester.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: item => <StatusBadge status={item.status} />
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: item => <PriorityBadge priority={item.priority} />
    },
    {
      key: 'slaDueDate',
      header: 'SLA Due',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: item.isSlaWarning ? '#B91C1C' : 'var(--text-secondary)', fontWeight: item.isSlaWarning ? 600 : 400 }}>
          <Clock size={13} style={{ color: item.isSlaWarning ? '#EF4444' : 'var(--text-muted)' }} />
          <span>{item.slaDueDate}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      render: item => (
        <IconButton
          icon={<MoreVertical size={16} />}
          ariaLabel="Ticket options"
          variant="ghost"
          onClick={e => {
            e.stopPropagation();
            setSelectedTicket(item);
            setIsDetailDrawerOpen(true);
          }}
        />
      )
    }
  ];

  // Dynamic Page Title based on navigation selection
  const getNavTitle = () => {
    switch (activeNavId) {
      case 'dashboard': return 'Helpdesk Overview & Analytics';
      case 'my-requests': return 'My Workforce Requests';
      case 'my-assigned': return 'My Assigned Ticket Queue';
      case 'teams': return 'Helpdesk Support Teams';
      case 'categories': return 'Request Categories & Routing';
      case 'sla-escalation': return 'SLA & Escalation Policies';
      case 'reports':
      case 'dashboard': return 'Helpdesk Dashboard';
      case 'settings': return 'Helpdesk Module Settings';
      default: return 'All Tickets Overview';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Sixtifi WFM' },
          { label: 'Helpdesk' },
          { label: getNavTitle() }
        ]}
        title={getNavTitle()}
        subtitle="Manage, route, and resolve internal employee support tickets across HR, IT, Attendance, and Payroll."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2-5)' }}>
            <Button
              variant="secondary"
              leftIcon={<Download size={15} />}
              onClick={() => onShowToast('info', 'Exporting Data', 'Generating CSV export for current ticket view...')}
            >
              Export Report
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={onOpenCreateDrawer}
            >
              + Create Ticket
            </Button>
          </div>
        }
      />

      {/* Metric Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Open Queue</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--status-open-bg)', color: 'var(--status-open-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ticket size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>24</div>
          <div style={{ fontSize: '12px', color: 'var(--status-open-text)', marginTop: '4px', fontWeight: 500 }}>+3 new tickets today</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>In Progress</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--status-inprogress-bg)', color: 'var(--status-inprogress-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>18</div>
          <div style={{ fontSize: '12px', color: 'var(--status-inprogress-text)', marginTop: '4px', fontWeight: 500 }}>8 assigned to Tier-1 IT</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>SLA At Risk</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--priority-urgent-bg)', color: 'var(--priority-urgent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#B91C1C', lineHeight: 1.1 }}>3</div>
          <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '4px', fontWeight: 500 }}>Requires immediate triage</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resolved Today</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--status-resolved-bg)', color: 'var(--status-resolved-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>14</div>
          <div style={{ fontSize: '12px', color: 'var(--status-resolved-text)', marginTop: '4px', fontWeight: 500 }}>98.2% SLA compliance rate</div>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: '300px' }}>
          <div style={{ width: '280px' }}>
            <SearchInput
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search by ID, subject, requester..."
            />
          </div>

          <div style={{ width: '150px' }}>
            <SelectInput value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="inprogress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="reopened">Reopened</option>
            </SelectInput>
          </div>

          <div style={{ width: '150px' }}>
            <SelectInput value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </SelectInput>
          </div>

          <div style={{ width: '170px' }}>
            <SelectInput value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="it">IT Support</option>
              <option value="payroll">Payroll & Tax</option>
              <option value="attendance">Attendance & Leave</option>
              <option value="hr">HR Policy</option>
              <option value="admin">Administration</option>
            </SelectInput>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary-600)' }}>
              {selectedIds.length} selected
            </span>
            <Button variant="secondary" size="sm" onClick={() => setIsReassignModalOpen(true)}>
              Bulk Reassign
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedIds([]);
                onShowToast('success', 'Bulk Resolution', `${selectedIds.length} tickets marked as Resolved.`);
              }}
            >
              Mark Resolved
            </Button>
          </div>
        )}
      </div>

      {/* Enterprise Data Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Table
          columns={columns}
          data={filteredTickets}
          keyExtractor={t => t.id}
          selectedIds={selectedIds}
          onSelectRow={(id, checked) => {
            if (checked) setSelectedIds([...selectedIds, id]);
            else setSelectedIds(selectedIds.filter(i => i !== id));
          }}
          onSelectAll={checked => {
            if (checked) setSelectedIds(filteredTickets.map(t => t.id));
            else setSelectedIds([]);
          }}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={key => {
            if (sortColumn === key) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            else { setSortColumn(key); setSortDirection('asc'); }
          }}
          onRowClick={item => {
            setSelectedTicket(item);
            setIsDetailDrawerOpen(true);
          }}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={4}
          pageSize={pageSize}
          totalItems={filteredTickets.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* DETAIL INSPECTION DRAWER */}
      {selectedTicket && (
        <Drawer
          isOpen={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          title={`Ticket ${selectedTicket.id}`}
          subtitle={selectedTicket.subject}
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsDetailDrawerOpen(false)}>Close</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsDetailDrawerOpen(false);
                  onShowToast('success', 'Changes Saved', `Ticket ${selectedTicket.id} updated successfully.`);
                }}
              >
                Save Ticket Updates
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <StatusBadge status={selectedTicket.status} />
              <PriorityBadge priority={selectedTicket.priority} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <FormField label="Category">
                <SelectInput defaultValue={selectedTicket.category.toLowerCase().includes('it') ? 'it' : 'payroll'}>
                  <option value="it">IT Support</option>
                  <option value="payroll">Payroll & Tax</option>
                  <option value="attendance">Attendance & Leave</option>
                </SelectInput>
              </FormField>

              <FormField label="SLA Status">
                <TextInput value={selectedTicket.slaDueDate} readOnly />
              </FormField>
            </div>

            <FormField label="Requester Information">
              <div className="table-user-cell" style={{ padding: 'var(--space-3)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                <div className="user-avatar-sm">{selectedTicket.requester.initials}</div>
                <div>
                  <div className="user-meta-name">{selectedTicket.requester.name}</div>
                  <div className="user-meta-sub">{selectedTicket.requester.email}</div>
                </div>
              </div>
            </FormField>

            <FormField label="Assigned Support Specialist">
              <SelectInput defaultValue="alex">
                <option value="alex">Alex Rivera (HR & IT Ops Lead)</option>
                <option value="elena">Elena Rostova (Payroll Specialist)</option>
              </SelectInput>
            </FormField>

            <FormField label="Internal Resolution Comment">
              <textarea
                className="input-control"
                style={{ height: '90px', padding: '8px' }}
                placeholder="Enter private resolution note for support staff..."
              />
            </FormField>
          </div>
        </Drawer>
      )}

      {/* BULK REASSIGN MODAL */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title="Bulk Reassign Tickets"
        subtitle={`Reassigning ${selectedIds.length} selected workforce tickets`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReassignModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsReassignModalOpen(false);
                setSelectedIds([]);
                onShowToast('success', 'Bulk Reassign Complete', `${selectedIds.length} tickets reassigned successfully.`);
              }}
            >
              Reassign Tickets
            </Button>
          </>
        }
      >
        <FormField label="Target Team / Specialist" required>
          <SelectInput>
            <option value="tier1">IT Helpdesk Tier-1 Support</option>
            <option value="hr-ops">HR Operations Team</option>
            <option value="finance">Finance & Payroll Specialists</option>
          </SelectInput>
        </FormField>
      </Modal>
    </div>
  );
};
