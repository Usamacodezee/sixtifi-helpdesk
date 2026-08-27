import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { SearchInput, SelectInput, FormField, TextInput, TextareaInput } from '../components/ui/FormControls';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import {
  Plus,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Eye,
  Edit
} from 'lucide-react';
import { HELPDESK_COMPANIES, getCompanyById } from '../data/companies';
import './TeamsView.css';

export interface HelpdeskTeam {
  id: string;
  companyId: string;
  name: string;
  description: string;
  membersCount: number;
  memberAvatars: string[];
  categories: string[];
  openTickets: number;
  teamLead: string;
  status: 'Active' | 'Inactive';
  lastUpdated: string;
  slaAtRisk?: number;
  slaBreached?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  assignedTickets: number;
  openCount: number;
  slaRiskCount: number;
  status: 'Active' | 'On Leave';
}

export interface TeamsViewProps {
  companyId: string;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onNavigateToAllTicketsWithFilter: (teamName: string) => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  companyId,
  onShowToast,
  onNavigateToAllTicketsWithFilter
}) => {
  const headerCompany = getCompanyById(companyId);

  // Navigation Mode ('list' | 'create' | 'detail' | 'edit')
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'detail' | 'edit'>('list');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('team-hr');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'members' | 'categories' | 'tickets' | 'activity'>('overview');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Row Action Dropdown Menu & Modals
  const [activeMenuTeamId, setActiveMenuTeamId] = useState<string | null>(null);
  const [deactivateModalTeam, setDeactivateModalTeam] = useState<HelpdeskTeam | null>(null);

  // Form State for Create / Edit Team
  const [formCompanyId, setFormCompanyId] = useState(companyId);
  const [formTeamName, setFormTeamName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTeamLead, setFormTeamLead] = useState('Priya Shah');
  const [formCategories, setFormCategories] = useState<string[]>(['HR', 'Attendance', 'Leave']);
  const [formMembers, setFormMembers] = useState<string[]>(['Alex Rivera', 'Rahul Sharma', 'Elena Rostova', 'Priya Shah']);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  // Sample Helpdesk Teams List
  const [teams, setTeams] = useState<HelpdeskTeam[]>([
    {
      id: 'team-hr',
      companyId: 'co-acme',
      name: 'HR Support',
      description: 'Handles general HR and workforce-related employee requests',
      membersCount: 6,
      memberAvatars: ['PS', 'RS', 'ER', 'AR'],
      categories: ['HR', 'Attendance', 'Leave'],
      openTickets: 18,
      teamLead: 'Priya Shah',
      status: 'Active',
      lastUpdated: 'Today',
      slaAtRisk: 2,
      slaBreached: 1
    },
    {
      id: 'team-payroll',
      companyId: 'co-acme',
      name: 'Payroll Support',
      description: 'Handles payroll, tax, bonus and payslip related requests',
      membersCount: 4,
      memberAvatars: ['MC', 'RS', 'PS'],
      categories: ['Payroll'],
      openTickets: 9,
      teamLead: 'Rahul Sharma',
      status: 'Active',
      lastUpdated: 'Yesterday',
      slaAtRisk: 1,
      slaBreached: 0
    },
    {
      id: 'team-it',
      companyId: 'co-acme',
      name: 'IT Support',
      description: 'Handles system, hardware and software access requests',
      membersCount: 5,
      memberAvatars: ['DM', 'MC', 'SJ'],
      categories: ['IT'],
      openTickets: 12,
      teamLead: 'David Miller',
      status: 'Active',
      lastUpdated: 'Aug 16',
      slaAtRisk: 0,
      slaBreached: 0
    },
    {
      id: 'team-admin',
      companyId: 'co-acme',
      name: 'Administration Support',
      description: 'Handles facilities, transport and administrative requests',
      membersCount: 3,
      memberAvatars: ['EW', 'AR'],
      categories: ['Administration'],
      openTickets: 5,
      teamLead: 'Emma Wilson',
      status: 'Active',
      lastUpdated: 'Aug 14',
      slaAtRisk: 0,
      slaBreached: 0
    },
    {
      id: 'team-nw-ops',
      companyId: 'co-northwind',
      name: 'Northwind Ops Desk',
      description: 'Logistics and fleet support for Northwind',
      membersCount: 4,
      memberAvatars: ['NW', 'RS'],
      categories: ['IT', 'Administration'],
      openTickets: 7,
      teamLead: 'Rahul Sharma',
      status: 'Active',
      lastUpdated: 'Aug 20',
      slaAtRisk: 1,
      slaBreached: 0
    },
    {
      id: 'team-contoso-hr',
      companyId: 'co-contoso',
      name: 'Contoso People Ops',
      description: 'Retail HR and attendance support',
      membersCount: 3,
      memberAvatars: ['CT', 'PS'],
      categories: ['HR', 'Attendance', 'Leave'],
      openTickets: 4,
      teamLead: 'Priya Shah',
      status: 'Active',
      lastUpdated: 'Aug 19',
      slaAtRisk: 0,
      slaBreached: 0
    }
  ]);

  // Sample Members List for Team Detail view
  const teamMembersList: TeamMember[] = [
    { id: 'm-1', name: 'Priya Shah', role: 'Team Lead', assignedTickets: 8, openCount: 5, slaRiskCount: 1, status: 'Active' },
    { id: 'm-2', name: 'Rahul Sharma', role: 'Support Specialist', assignedTickets: 6, openCount: 4, slaRiskCount: 1, status: 'Active' },
    { id: 'm-3', name: 'Elena Rostova', role: 'HR Partner', assignedTickets: 4, openCount: 3, slaRiskCount: 0, status: 'Active' },
    { id: 'm-4', name: 'Alex Rivera', role: 'HR & IT Ops Lead', assignedTickets: 5, openCount: 3, slaRiskCount: 0, status: 'Active' },
    { id: 'm-5', name: 'Marcus Chen', role: 'Payroll Specialist', assignedTickets: 3, openCount: 2, slaRiskCount: 0, status: 'Active' },
    { id: 'm-6', name: 'Sarah Jenkins', role: 'Support Agent', assignedTickets: 2, openCount: 1, slaRiskCount: 0, status: 'On Leave' }
  ];

  // Filtering Logic
  const companyTeams = teams.filter(t => t.companyId === companyId);
  const filteredTeams = companyTeams.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teamLead.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter;
    const matchesCategory = categoryFilter === 'all' || t.categories.some(c => c.toLowerCase() === categoryFilter);

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || companyTeams[0] || teams[0];

  // Open Create Team Full-Page Form
  const handleOpenCreateForm = () => {
    setFormCompanyId(companyId);
    setFormTeamName('');
    setFormDescription('');
    setFormTeamLead('Priya Shah');
    setFormCategories(['HR', 'Attendance']);
    setFormMembers(['Alex Rivera', 'Priya Shah']);
    setFormStatus('Active');
    setViewMode('create');
  };

  // Open Edit Team Full-Page Form
  const handleOpenEditForm = (team: HelpdeskTeam) => {
    setSelectedTeamId(team.id);
    setFormCompanyId(team.companyId);
    setFormTeamName(team.name);
    setFormDescription(team.description);
    setFormTeamLead(team.teamLead);
    setFormCategories(team.categories);
    setFormStatus(team.status);
    setViewMode('edit');
  };

  const CATEGORY_OPTIONS = ['Attendance', 'Leave', 'Payroll', 'HR', 'IT', 'Administration'];

  /** Another active team in the same company that already owns this category. */
  const getCategoryOwner = (categoryName: string, excludeTeamId?: string) =>
    teams.find(
      t =>
        t.companyId === formCompanyId &&
        t.status === 'Active' &&
        t.id !== excludeTeamId &&
        t.categories.includes(categoryName)
    );

  const handleToggleCategory = (cat: string, checked: boolean) => {
    if (!checked) {
      setFormCategories(formCategories.filter(c => c !== cat));
      return;
    }

    const owner = getCategoryOwner(cat, viewMode === 'edit' ? selectedTeamId : undefined);
    if (owner) {
      onShowToast(
        'warning',
        'Category already assigned',
        `"${cat}" is handled by ${owner.name}. Each category can belong to only one team. Saving will move it here.`
      );
    }
    if (!formCategories.includes(cat)) setFormCategories([...formCategories, cat]);
  };

  // Submit Create or Edit Team — strip claimed categories from other teams in the same company
  const handleSaveTeamForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeamName.trim()) return;
    if (formCategories.length === 0) {
      onShowToast('warning', 'Categories required', 'Assign at least one category. Each category can have only one handling team.');
      return;
    }

    const teamId = viewMode === 'create' ? `team-${Date.now()}` : selectedTeamId;
    const teamName = formTeamName.trim();
    const claimed = new Set(formCategories);

    const reassignOthers = (list: HelpdeskTeam[]) =>
      list.map(t => {
        if (t.companyId !== formCompanyId || t.id === teamId) return t;
        const nextCats = t.categories.filter(c => !claimed.has(c));
        if (nextCats.length === t.categories.length) return t;
        return { ...t, categories: nextCats, lastUpdated: 'Just now' };
      });

    if (viewMode === 'create') {
      const newTeam: HelpdeskTeam = {
        id: teamId,
        companyId: formCompanyId,
        name: teamName,
        description: formDescription.trim() || 'Custom Helpdesk support team',
        membersCount: formMembers.length,
        memberAvatars: ['AR', 'PS'],
        categories: formCategories,
        openTickets: 0,
        teamLead: formTeamLead,
        status: formStatus,
        lastUpdated: 'Just now'
      };
      setTeams(prev => reassignOthers([...prev, newTeam]));
      onShowToast(
        'success',
        'Team Created',
        `"${newTeam.name}" is the exclusive handling team for: ${formCategories.join(', ')}.`
      );
    } else {
      setTeams(prev =>
        reassignOthers(
          prev.map(t =>
            t.id === selectedTeamId
              ? {
                  ...t,
                  companyId: formCompanyId,
                  name: teamName,
                  description: formDescription.trim(),
                  teamLead: formTeamLead,
                  categories: formCategories,
                  status: formStatus,
                  lastUpdated: 'Just now'
                }
              : t
          )
        )
      );
      onShowToast(
        'success',
        'Team Updated',
        `"${teamName}" exclusively handles: ${formCategories.join(', ')}.`
      );
    }

    setViewMode('list');
  };

  // Deactivate Team Action
  const handleConfirmDeactivate = () => {
    if (!deactivateModalTeam) return;

    setTeams(prev =>
      prev.map(t => (t.id === deactivateModalTeam.id ? { ...t, status: 'Inactive', lastUpdated: 'Just now' } : t))
    );

    setDeactivateModalTeam(null);
    onShowToast('warning', 'Team Deactivated', `Team "${deactivateModalTeam.name}" deactivated.`);
  };

  // Render Status Badge
  const renderTeamStatusBadge = (status: 'Active' | 'Inactive') => {
    if (status === 'Active') {
      return (
        <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}>
          <span className="badge-dot" style={{ backgroundColor: '#10B981' }} />
          <span>Active</span>
        </span>
      );
    }
    return (
      <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', borderColor: '#E5E7EB' }}>
        <span className="badge-dot" style={{ backgroundColor: '#9CA3AF' }} />
        <span>Inactive</span>
      </span>
    );
  };

  // Columns Definition for Teams List Table
  const columns: Column<HelpdeskTeam>[] = [
    {
      key: 'name',
      header: 'Team Name',
      sortable: true,
      render: item => (
        <div>
          <span
            className="table-cell-id"
            style={{ fontWeight: 700, cursor: 'pointer' }}
            onClick={e => {
              e.stopPropagation();
              setSelectedTeamId(item.id);
              setViewMode('detail');
            }}
          >
            {item.name}
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.description}</div>
        </div>
      )
    },
    {
      key: 'membersCount',
      header: 'Members',
      sortable: true,
      width: '130px',
      render: item => (
        <div className="members-avatar-stack">
          <div className="avatar-stack-group">
            {item.memberAvatars.slice(0, 3).map((av, i) => (
              <div key={i} className="avatar-stack-circle">
                {av}
              </div>
            ))}
          </div>
          <span className="more-members-badge">{item.membersCount} members</span>
        </div>
      )
    },
    {
      key: 'categories',
      header: 'Categories Handled',
      render: item => (
        <div className="categories-badges-group">
          {item.categories.map(c => (
            <span key={c} className="category-tag-pill">
              {c}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'openTickets',
      header: 'Open Tickets',
      sortable: true,
      width: '110px',
      render: item => (
        <span
          className="table-cell-id"
          style={{ fontWeight: 700, cursor: 'pointer' }}
          onClick={e => {
            e.stopPropagation();
            onNavigateToAllTicketsWithFilter(item.name);
          }}
        >
          {item.openTickets} tickets
        </span>
      )
    },
    {
      key: 'teamLead',
      header: 'Team Lead',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.teamLead}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: item => renderTeamStatusBadge(item.status)
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
            onClick={() => setActiveMenuTeamId(activeMenuTeamId === item.id ? null : item.id)}
          />

          {activeMenuTeamId === item.id && (
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
                minWidth: '160px',
                padding: '4px 0'
              }}
            >
              <button
                style={{ width: '100%', padding: '6px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setActiveMenuTeamId(null);
                  setSelectedTeamId(item.id);
                  setViewMode('detail');
                }}
              >
                <Eye size={13} />
                View Team
              </button>

              <button
                style={{ width: '100%', padding: '6px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setActiveMenuTeamId(null);
                  handleOpenEditForm(item);
                }}
              >
                <Edit size={13} />
                Edit Team
              </button>

              {item.status === 'Active' ? (
                <button
                  style={{ width: '100%', padding: '6px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', color: 'var(--color-primary-600)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    setActiveMenuTeamId(null);
                    setDeactivateModalTeam(item);
                  }}
                >
                  <Shield size={13} />
                  Deactivate Team
                </button>
              ) : (
                <button
                  style={{ width: '100%', padding: '6px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', color: '#10B981', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    setActiveMenuTeamId(null);
                    setTeams(prev => prev.map(t => (t.id === item.id ? { ...t, status: 'Active' } : t)));
                    onShowToast('success', 'Team Activated', `Team "${item.name}" reactivated.`);
                  }}
                >
                  <CheckCircle2 size={13} />
                  Activate Team
                </button>
              )}
            </div>
          )}
        </div>
      )
    }
  ];

  // Members Table Columns for Team Detail View
  const memberColumns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: 'Member Name',
      sortable: true,
      render: item => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
      )
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.role}</span>
    },
    {
      key: 'assignedTickets',
      header: 'Assigned Tickets',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.assignedTickets}</span>
    },
    {
      key: 'openCount',
      header: 'Open',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', color: '#1E40AF', fontWeight: 600 }}>{item.openCount}</span>
    },
    {
      key: 'slaRiskCount',
      header: 'SLA At Risk',
      sortable: true,
      render: item => (
        item.slaRiskCount > 0 ? (
          <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} />
            {item.slaRiskCount} at risk
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>0</span>
        )
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: item => <StatusBadge status={item.status === 'Active' ? 'Open' : 'Closed'} />
    }
  ];

  // RENDER FULL-PAGE CREATE / EDIT FORM
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="teams-container">
        <PageHeader
          breadcrumbs={[
            { label: 'Sixtifi WFM' },
            { label: 'Helpdesk' },
            { label: 'Teams', onClick: () => setViewMode('list') },
            { label: viewMode === 'create' ? 'Add Team' : 'Edit Team' }
          ]}
          title={viewMode === 'create' ? 'Create Helpdesk Team' : `Edit Team — ${formTeamName}`}
          subtitle="Configure company, support team details, team leads, members and request categories."
        />

        <div className="team-form-layout">
          <form onSubmit={handleSaveTeamForm} className="team-form-card">
            <FormField label="Company" required hint="Team belongs to this company for routing and visibility">
              <SelectInput value={formCompanyId} onChange={e => setFormCompanyId(e.target.value)}>
                {HELPDESK_COMPANIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField label="Team Name" required hint="Unique operational support team identifier">
              <TextInput
                value={formTeamName}
                onChange={e => setFormTeamName(e.target.value)}
                placeholder="e.g. HR Support, IT Operations, Payroll Desk"
              />
            </FormField>

            <FormField label="Description" hint="Describe team responsibilities and scope">
              <TextareaInput
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Handles employee HR and workforce-related requests..."
                rows={3}
              />
            </FormField>

            <FormField label="Team Lead" required hint="Select primary supervisor for SLA escalation and workload oversight">
              <SelectInput value={formTeamLead} onChange={e => setFormTeamLead(e.target.value)}>
                <option value="Priya Shah">Priya Shah (HR Operations Manager)</option>
                <option value="Rahul Sharma">Rahul Sharma (HR Support Lead)</option>
                <option value="Elena Rostova">Elena Rostova (Senior HR Partner)</option>
                <option value="David Miller">David Miller (IT Support Lead)</option>
              </SelectInput>
            </FormField>

            <FormField label="Team Members" required hint="Select specialists assigned to this support team">
              <div className="members-checkbox-grid">
                {['Priya Shah', 'Rahul Sharma', 'Elena Rostova', 'Alex Rivera', 'Marcus Chen', 'Sarah Jenkins', 'David Miller', 'Emma Wilson'].map(m => (
                  <label key={m} className="member-checkbox-item">
                    <input
                      type="checkbox"
                      checked={formMembers.includes(m)}
                      onChange={e => {
                        if (e.target.checked) setFormMembers([...formMembers, m]);
                        else setFormMembers(formMembers.filter(name => name !== m));
                      }}
                    />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            </FormField>

            <FormField
              label="Categories Handled"
              required
              hint="One category → one team only. Claiming a category moves it away from any other team in this company."
            >
              <div className="team-category-exclusive-grid">
                {CATEGORY_OPTIONS.map(cat => {
                  const owner = getCategoryOwner(cat, viewMode === 'edit' ? selectedTeamId : undefined);
                  const checked = formCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`team-category-option ${checked ? 'is-selected' : ''} ${owner && !checked ? 'is-owned' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => handleToggleCategory(cat, e.target.checked)}
                      />
                      <span className="team-category-option-label">{cat}</span>
                      {owner && !checked && (
                        <span className="team-category-owner">Owned by {owner.name}</span>
                      )}
                      {checked && <span className="team-category-owner is-mine">Exclusive to this team</span>}
                    </label>
                  );
                })}
              </div>
            </FormField>

            <FormField label="Status">
              <SelectInput value={formStatus} onChange={e => setFormStatus(e.target.value as 'Active' | 'Inactive')} style={{ width: '180px' }}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </SelectInput>
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)' }}>
              <Button variant="secondary" type="button" onClick={() => setViewMode('list')}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={!formTeamName.trim()}>
                {viewMode === 'create' ? 'Create Team' : 'Save Changes'}
              </Button>
            </div>
          </form>

          {/* RIGHT GUIDANCE PANEL */}
          <div className="sidebar-info-card">
            <div className="sidebar-card-header">
              <span className="sidebar-card-title">Team Configuration Rules</span>
              <Shield size={16} style={{ color: 'var(--color-primary-600)' }} />
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: 1.4 }}>
              <div>
                <strong>Exclusive ownership:</strong> Each category is handled by exactly one team. Saving moves selected categories to this team and removes them from others.
              </div>
              <div>
                <strong>Auto Routing:</strong> New tickets in these categories route only to this team.
              </div>
              <div>
                <strong>Inactive Teams:</strong> Inactive teams do not receive new auto-assigned tickets.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER FULL-PAGE TEAM DETAIL SCREEN
  if (viewMode === 'detail') {
    return (
      <div className="teams-container">
        {/* PAGE HEADER */}
        <PageHeader
          breadcrumbs={[
            { label: 'Sixtifi WFM' },
            { label: 'Helpdesk' },
            { label: 'Teams', onClick: () => setViewMode('list') },
            { label: selectedTeam.name }
          ]}
          title={selectedTeam.name}
          badge={renderTeamStatusBadge(selectedTeam.status)}
          actions={
            <div style={{ display: 'flex', gap: 'var(--space-2-5)' }}>
              <Button variant="outline" onClick={() => handleOpenEditForm(selectedTeam)}>
                Edit Team
              </Button>
              <Button variant="secondary" onClick={() => setDeactivateModalTeam(selectedTeam)}>
                Deactivate Team
              </Button>
              <Button variant="secondary" onClick={() => setViewMode('list')}>
                Back to Teams
              </Button>
            </div>
          }
        />

        {/* TEAM SUMMARY KPI CARDS */}
        <div className="teams-kpi-grid">
          <div className="teams-kpi-card">
            <span className="teams-kpi-title">Team Lead</span>
            <span className="teams-kpi-val" style={{ fontSize: '18px' }}>{selectedTeam.teamLead}</span>
          </div>

          <div className="teams-kpi-card" onClick={() => setActiveDetailTab('members')}>
            <span className="teams-kpi-title">Members</span>
            <span className="teams-kpi-val">{selectedTeam.membersCount}</span>
          </div>

          <div className="teams-kpi-card" onClick={() => onNavigateToAllTicketsWithFilter(selectedTeam.name)}>
            <span className="teams-kpi-title">Open Tickets</span>
            <span className="teams-kpi-val" style={{ color: '#1E40AF' }}>{selectedTeam.openTickets}</span>
          </div>

          <div className="teams-kpi-card">
            <span className="teams-kpi-title">SLA Attention</span>
            <span className="teams-kpi-val" style={{ color: '#D97706' }}>
              {(selectedTeam.slaAtRisk || 0) + (selectedTeam.slaBreached || 0)}
            </span>
          </div>
        </div>

        {/* TEAM DETAIL TABS */}
        <div className="team-detail-tabs-bar">
          <button className={`team-tab-btn ${activeDetailTab === 'overview' ? 'is-active' : ''}`} onClick={() => setActiveDetailTab('overview')}>
            Overview
          </button>
          <button className={`team-tab-btn ${activeDetailTab === 'members' ? 'is-active' : ''}`} onClick={() => setActiveDetailTab('members')}>
            Members ({selectedTeam.membersCount})
          </button>
          <button className={`team-tab-btn ${activeDetailTab === 'categories' ? 'is-active' : ''}`} onClick={() => setActiveDetailTab('categories')}>
            Categories ({selectedTeam.categories.length})
          </button>
          <button className={`team-tab-btn ${activeDetailTab === 'tickets' ? 'is-active' : ''}`} onClick={() => onNavigateToAllTicketsWithFilter(selectedTeam.name)}>
            Tickets ({selectedTeam.openTickets})
          </button>
          <button className={`team-tab-btn ${activeDetailTab === 'activity' ? 'is-active' : ''}`} onClick={() => setActiveDetailTab('activity')}>
            Activity History
          </button>
        </div>

        {/* TAB CONTENT PANELS */}
        {activeDetailTab === 'overview' && (
          <div className="team-detail-content-panel">
            <div className="sidebar-info-card">
              <h3 className="text-h3">Team Overview</h3>
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>{selectedTeam.description}</p>

              <div className="meta-rows-list" style={{ marginTop: '12px' }}>
                <div className="meta-row-item">
                  <span className="meta-label">Team Lead</span>
                  <span className="meta-value">{selectedTeam.teamLead}</span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">Handled Categories</span>
                  <span className="meta-value">{selectedTeam.categories.join(', ')}</span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">Total Assigned Members</span>
                  <span className="meta-value">{selectedTeam.membersCount} Specialists</span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">Current Workload</span>
                  <span className="meta-value">{selectedTeam.openTickets} Open Requests</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDetailTab === 'members' && (
          <div className="team-detail-content-panel">
            <Table
              columns={memberColumns}
              data={teamMembersList}
              keyExtractor={m => m.id}
            />
          </div>
        )}

        {activeDetailTab === 'categories' && (
          <div className="team-detail-content-panel">
            <div className="sidebar-info-card">
              <h3 className="text-h3">Auto-Routed Request Categories</h3>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {selectedTeam.categories.map(c => (
                  <span key={c} className="category-tag-pill" style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600 }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeDetailTab === 'activity' && (
          <div className="team-detail-content-panel">
            <div className="sidebar-info-card">
              <h3 className="text-h3">Team Configuration History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', fontSize: '12px' }}>
                <div>• <strong>Team Lead Assigned:</strong> Priya Shah appointed as Team Lead (Aug 01, 2026)</div>
                <div>• <strong>Category Added:</strong> Attendance and Leave categories auto-routed (Aug 05, 2026)</div>
                <div>• <strong>Member Added:</strong> Rahul Sharma added to HR Support team (Aug 10, 2026)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER TEAMS LIST TABLE VIEW (DEFAULT)
  return (
    <div className="teams-container">
      {/* PAGE HEADER */}
      <PageHeader
        breadcrumbs={[
          { label: 'Sixtifi WFM' },
          { label: 'Helpdesk' },
          { label: 'Teams' }
        ]}
        title="Helpdesk Teams"
        subtitle={`Organize support teams for ${headerCompany.name}. Switch company in the header to manage other companies.`}
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={handleOpenCreateForm}
          >
            + Add Team
          </Button>
        }
      />

      {/* SECTION 2 — SEARCH & FILTERS */}
      <div className="table-filter-toolbar">
        <div className="filter-controls-left">
          <div style={{ width: '280px' }}>
            <SearchInput
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search teams..."
            />
          </div>

          <div style={{ width: '130px' }}>
            <SelectInput value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </SelectInput>
          </div>

          <div style={{ width: '150px' }}>
            <SelectInput value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="attendance">Attendance</option>
              <option value="leave">Leave</option>
              <option value="payroll">Payroll</option>
              <option value="hr">HR</option>
              <option value="it">IT</option>
              <option value="administration">Administration</option>
            </SelectInput>
          </div>

          {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); }}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* SECTION 3 — ENTERPRISE TEAMS LIST TABLE */}
      <Table
        columns={columns}
        data={filteredTeams}
        keyExtractor={t => t.id}
        onRowClick={item => {
          setSelectedTeamId(item.id);
          setViewMode('detail');
        }}
      />

      {/* DEACTIVATE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deactivateModalTeam}
        onClose={() => setDeactivateModalTeam(null)}
        title={`Deactivate ${deactivateModalTeam?.name}?`}
        subtitle="This team will no longer receive new automatically routed tickets."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeactivateModalTeam(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmDeactivate}>
              Deactivate Team
            </Button>
          </>
        }
      >
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Existing tickets assigned to <strong>{deactivateModalTeam?.name}</strong> will remain available for staff review.
        </p>
      </Modal>
    </div>
  );
};
