import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { StatusBadge, PriorityBadge, Badge } from '../components/ui/Badge';
import { FormField, TextInput, SelectInput, TextareaInput, SearchInput, Checkbox, ToggleSwitch } from '../components/ui/FormControls';
import { Table, Column } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTable } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { Plus, Filter, Download, Trash2, Mail, Sparkles, Ticket } from 'lucide-react';

export interface DesignSystemShowcaseProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
}

interface DemoTicket {
  id: string;
  title: string;
  category: string;
  requestedBy: { name: string; email: string; initials: string };
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed' | 'Reopened';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  createdAt: string;
}

export const DesignSystemShowcase: React.FC<DesignSystemShowcaseProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'buttons' | 'badges' | 'forms' | 'tables' | 'overlays' | 'feedback'>('tokens');
  
  // Interactive Form States
  const [inputText, setInputText] = useState('John Doe');
  const [inputError, setInputError] = useState('');
  const [toggleVal, setToggleVal] = useState(true);
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  // Interactive Modal & Drawer States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Table State
  const [selectedIds, setSelectedIds] = useState<string[]>(['TKT-102']);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const demoTickets: DemoTicket[] = [
    {
      id: 'TKT-101',
      title: 'MacBook Pro screen flickering after macOS Sonoma update',
      category: 'IT Hardware',
      requestedBy: { name: 'Sarah Jenkins', email: 'sarah.j@sixtifi.com', initials: 'SJ' },
      status: 'Open',
      priority: 'High',
      createdAt: '10 mins ago'
    },
    {
      id: 'TKT-102',
      title: 'Payroll tax deduction discrepancy for Q3 bonus payout',
      category: 'Payroll & Finance',
      requestedBy: { name: 'Michael Chen', email: 'm.chen@sixtifi.com', initials: 'MC' },
      status: 'Assigned',
      priority: 'Urgent',
      createdAt: '25 mins ago'
    },
    {
      id: 'TKT-103',
      title: 'Annual leave balance not updating after approved request',
      category: 'Leave & Attendance',
      requestedBy: { name: 'Elena Rostova', email: 'elena.r@sixtifi.com', initials: 'ER' },
      status: 'In Progress',
      priority: 'Medium',
      createdAt: '1 hour ago'
    },
    {
      id: 'TKT-104',
      title: 'Request for VPN access credentials during remote work',
      category: 'IT Support',
      requestedBy: { name: 'David Kim', email: 'd.kim@sixtifi.com', initials: 'DK' },
      status: 'Resolved',
      priority: 'Low',
      createdAt: '3 hours ago'
    },
    {
      id: 'TKT-105',
      title: 'Office keycard access badge renewal request',
      category: 'Administration',
      requestedBy: { name: 'Amara Okafor', email: 'amara.o@sixtifi.com', initials: 'AO' },
      status: 'Closed',
      priority: 'Low',
      createdAt: '1 day ago'
    },
    {
      id: 'TKT-106',
      title: 'Reopened: Health insurance claim verification pending',
      category: 'HR Benefits',
      requestedBy: { name: 'Carlos Mendez', email: 'carlos.m@sixtifi.com', initials: 'CM' },
      status: 'Reopened',
      priority: 'High',
      createdAt: '2 days ago'
    }
  ];

  const columns: Column<DemoTicket>[] = [
    {
      key: 'id',
      header: 'Ticket ID',
      sortable: true,
      width: '100px',
      render: item => <span className="table-cell-id">{item.id}</span>
    },
    {
      key: 'title',
      header: 'Subject / Summary',
      sortable: true,
      render: item => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.category}</div>
        </div>
      )
    },
    {
      key: 'requestedBy',
      header: 'Requested By',
      render: item => (
        <div className="table-user-cell">
          <div className="user-avatar-sm">{item.requestedBy.initials}</div>
          <div>
            <div className="user-meta-name">{item.requestedBy.name}</div>
            <div className="user-meta-sub">{item.requestedBy.email}</div>
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
      key: 'createdAt',
      header: 'Created',
      render: item => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{item.createdAt}</span>
    }
  ];

  const tabs = [
    { id: 'tokens', label: 'Typography & Colors' },
    { id: 'badges', label: 'Status & Priority System' },
    { id: 'buttons', label: 'Buttons & Actions' },
    { id: 'forms', label: 'Form Controls' },
    { id: 'tables', label: 'Enterprise Table' },
    { id: 'overlays', label: 'Modals & Drawers' },
    { id: 'feedback', label: 'Toasts & States' }
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Helpdesk' }, { label: 'Design System Foundation' }]}
        title="Helpdesk Design System Foundation"
        subtitle="Reusable visual components, design tokens, and application shell standards for Sixtifi Helpdesk"
        badge={<Badge variant="brand">v1.0 Core System</Badge>}
        actions={
          <Button
            variant="primary"
            leftIcon={<Sparkles size={16} />}
            onClick={() => onShowToast('success', 'Design Tokens Validated', 'All Sixtifi Helpdesk design variables loaded successfully.')}
          >
            Test Design System Toast
          </Button>
        }
      />

      {/* Sub-nav Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '1px solid var(--border-default)', marginBottom: 'var(--space-6)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--color-primary-600)' : '2px solid transparent',
              color: activeTab === t.id ? 'var(--color-primary-600)' : 'var(--text-secondary)',
              fontWeight: activeTab === t.id ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: TYPOGRAPHY & COLORS */}
      {activeTab === 'tokens' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <h3 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>Typography Hierarchy</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <span className="text-caption">Page Title (h1 - 24px/SemiBold)</span>
                <h1 className="text-h1">Workforce Helpdesk Dashboard</h1>
              </div>

              <div>
                <span className="text-caption">Section Heading (h2 - 20px/SemiBold)</span>
                <h2 className="text-h2">Ticket Details & SLA Escalation Timeline</h2>
              </div>

              <div>
                <span className="text-caption">Card / Subsection Heading (h3 - 18px/SemiBold)</span>
                <h3 className="text-h3">Assigned Queue Statistics</h3>
              </div>

              <div>
                <span className="text-caption">Subtitle / Descriptive Text (14px/Regular)</span>
                <p className="text-subtitle">Manage internal workforce support tickets for HR, Attendance, Payroll, and IT.</p>
              </div>

              <div>
                <span className="text-caption">Body Text (14px/Regular)</span>
                <p className="text-body">The employee requested an urgent update regarding their monthly attendance regularization approval before payroll processing cycle cutoff.</p>
              </div>

              <div>
                <span className="text-caption">Caption & Monospace (12px Mono)</span>
                <p className="text-caption">Reference Code: <span style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-primary-600)' }}>TKT-2026-8941-X</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATUS & PRIORITY BADGES */}
      {activeTab === 'badges' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Status System Card */}
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <h3 className="text-h2" style={{ marginBottom: 'var(--space-2)' }}>Helpdesk Status System</h3>
            <p className="text-subtitle" style={{ marginBottom: 'var(--space-5)' }}>The 6 official lifecycle statuses for workforce tickets.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-body" style={{ fontWeight: 500 }}>Open</span>
                <StatusBadge status="Open" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-body" style={{ fontWeight: 500 }}>Assigned</span>
                <StatusBadge status="Assigned" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-body" style={{ fontWeight: 500 }}>In Progress</span>
                <StatusBadge status="In Progress" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-body" style={{ fontWeight: 500 }}>Resolved</span>
                <StatusBadge status="Resolved" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-body" style={{ fontWeight: 500 }}>Closed</span>
                <StatusBadge status="Closed" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-body" style={{ fontWeight: 500 }}>Reopened</span>
                <StatusBadge status="Reopened" />
              </div>
            </div>
          </div>

          {/* Priority System Card */}
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <h3 className="text-h2" style={{ marginBottom: 'var(--space-2)' }}>Priority Rating System</h3>
            <p className="text-subtitle" style={{ marginBottom: 'var(--space-5)' }}>The 4 standardized priority tiers with clear visual icons.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-body" style={{ fontWeight: 500 }}>Low Priority</span>
                <PriorityBadge priority="Low" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-body" style={{ fontWeight: 500 }}>Medium Priority</span>
                <PriorityBadge priority="Medium" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-body" style={{ fontWeight: 500 }}>High Priority</span>
                <PriorityBadge priority="High" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-body" style={{ fontWeight: 500 }}>Urgent Escalation</span>
                <PriorityBadge priority="Urgent" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUTTONS */}
      {activeTab === 'buttons' && (
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div>
            <h3 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>Standard Button Variants</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Action</Button>
            </div>
          </div>

          <div>
            <h3 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>Icons & Loading States</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
              <Button variant="primary" leftIcon={<Plus size={16} />}>Create Ticket</Button>
              <Button variant="secondary" leftIcon={<Filter size={16} />}>Filter List</Button>
              <Button variant="secondary" rightIcon={<Download size={16} />}>Export CSV</Button>
              <Button variant="primary" isLoading>Processing...</Button>
              <IconButton icon={<Trash2 size={16} />} ariaLabel="Delete item" variant="ghost" />
              <IconButton icon={<Filter size={16} />} ariaLabel="Filter" variant="secondary" />
            </div>
          </div>

          <div>
            <h3 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>Button Sizes</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Button variant="primary" size="sm">Small (30px)</Button>
              <Button variant="primary" size="md">Medium (36px)</Button>
              <Button variant="primary" size="lg">Large (42px)</Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FORMS */}
      {activeTab === 'forms' && (
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
          <h3 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>Standard Form Inputs</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
            <FormField label="Requester Full Name" required hint="Employee name as displayed on HRMS profile">
              <TextInput
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Enter full name..."
              />
            </FormField>

            <FormField label="Corporate Email Address" required error={inputError}>
              <TextInput
                leftIcon={<Mail size={16} />}
                value="john.doe@sixtifi.com"
                onChange={e => {
                  if (!e.target.value.includes('@')) setInputError('Please enter a valid email address');
                  else setInputError('');
                }}
              />
            </FormField>

            <FormField label="Ticket Category" required>
              <SelectInput>
                <option value="hr">HR & Employee Relations</option>
                <option value="attendance">Attendance & Regularization</option>
                <option value="payroll">Payroll & Tax Deductions</option>
                <option value="it">IT Hardware & Software</option>
                <option value="admin">Administration & Office Logistics</option>
              </SelectInput>
            </FormField>

            <FormField label="Assignee Department">
              <SelectInput>
                <option value="tier1">IT Helpdesk Tier-1 Support</option>
                <option value="hr-ops">HR Operations Team</option>
                <option value="finance">Finance & Payroll Specialists</option>
              </SelectInput>
            </FormField>

            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="Detailed Issue Description" required hint="Include error messages, steps to reproduce, or relevant links">
                <TextareaInput
                  placeholder="Describe your issue or workforce request in detail..."
                  rows={3}
                />
              </FormField>
            </div>

            <div>
              <FormField label="Global Search Control">
                <SearchInput
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  onClear={() => setSearchValue('')}
                />
              </FormField>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <Checkbox
                label="Send SMS notification on status updates"
                checked={checkboxVal}
                onChange={e => setCheckboxVal(e.target.checked)}
              />

              <ToggleSwitch
                label="Enable automatic SLA escalation warnings"
                checked={toggleVal}
                onChange={setToggleVal}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TABLES */}
      {activeTab === 'tables' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Table
            columns={columns}
            data={demoTickets}
            keyExtractor={t => t.id}
            selectedIds={selectedIds}
            onSelectRow={(id, checked) => {
              if (checked) setSelectedIds([...selectedIds, id]);
              else setSelectedIds(selectedIds.filter(i => i !== id));
            }}
            onSelectAll={checked => {
              if (checked) setSelectedIds(demoTickets.map(t => t.id));
              else setSelectedIds([]);
            }}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={key => {
              if (sortColumn === key) {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                setSortColumn(key);
                setSortDirection('asc');
              }
            }}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={3}
            pageSize={pageSize}
            totalItems={28}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* TAB 6: OVERLAYS (MODALS & DRAWERS) */}
      {activeTab === 'overlays' && (
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <h3 className="text-h2">Modal & Side-Drawer Patterns</h3>
          <p className="text-subtitle">Interactive overlay panels for ticket creation, quick inspection, and confirmation dialogs.</p>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Button variant="primary" onClick={() => setIsDrawerOpen(true)}>
              Open Ticket Quick View Drawer
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              Open Reassign Confirmation Modal
            </Button>
          </div>
        </div>
      )}

      {/* TAB 7: FEEDBACK (TOASTS & ZERO STATES) */}
      {activeTab === 'feedback' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <h3 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>Toast Notification Banners</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Button
                variant="secondary"
                onClick={() => onShowToast('success', 'Ticket Resolved', 'Ticket TKT-104 has been marked as resolved.')}
              >
                Trigger Success Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => onShowToast('info', 'New Comment Added', 'Alex Rivera commented on your request.')}
              >
                Trigger Info Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => onShowToast('warning', 'SLA Warning', 'Ticket TKT-102 is 15 minutes away from SLA breach.')}
              >
                Trigger Warning Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => onShowToast('error', 'Update Failed', 'Unable to reassign ticket due to network error.')}
              >
                Trigger Error Toast
              </Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
            <div>
              <h3 className="text-h3" style={{ marginBottom: 'var(--space-3)' }}>Empty State Card</h3>
              <EmptyState
                icon={<Ticket size={24} />}
                title="No Assigned Tickets"
                description="You currently have zero tickets in your assigned queue. All clear!"
                action={<Button variant="primary" size="sm">View All Tickets</Button>}
              />
            </div>

            <div>
              <h3 className="text-h3" style={{ marginBottom: 'var(--space-3)' }}>Skeleton Shimmer Loading</h3>
              <SkeletonTable rows={3} />
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE DRAWER DEMO */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Ticket TKT-102 Details"
        subtitle="Payroll tax deduction discrepancy for Q3 bonus payout"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Close</Button>
            <Button variant="primary" onClick={() => { setIsDrawerOpen(false); onShowToast('success', 'Ticket Updated', 'Changes saved to TKT-102'); }}>Save Updates</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <StatusBadge status="Assigned" />
            <PriorityBadge priority="Urgent" />
          </div>

          <FormField label="Ticket Category">
            <SelectInput defaultValue="payroll">
              <option value="payroll">Payroll & Tax Deductions</option>
              <option value="hr">HR & Employee Relations</option>
            </SelectInput>
          </FormField>

          <FormField label="Assigned Specialist">
            <SelectInput defaultValue="alex">
              <option value="alex">Alex Rivera (HR & IT Ops Lead)</option>
              <option value="elena">Elena Rostova (Payroll Specialist)</option>
            </SelectInput>
          </FormField>

          <FormField label="Internal Resolution Note">
            <TextareaInput placeholder="Add private resolution notes for the support team..." rows={4} />
          </FormField>
        </div>
      </Drawer>

      {/* INTERACTIVE MODAL DEMO */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Ticket Reassignment"
        subtitle="Reassigning 1 ticket to Finance & Payroll Specialists team"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false);
                onShowToast('success', 'Reassigned Successfully', 'Ticket reassigned to Finance & Payroll Specialists.');
              }}
            >
              Confirm Reassign
            </Button>
          </>
        }
      >
        <p className="text-body">
          Are you sure you want to reassign ticket <strong>TKT-102</strong>? The new team will receive an email notification and SLA ownership will transfer immediately.
        </p>
      </Modal>
    </div>
  );
};
