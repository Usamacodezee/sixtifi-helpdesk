import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import {
  SearchInput,
  SelectInput,
  FormField,
  TextInput,
  TextareaInput,
  Checkbox,
  ToggleSwitch
} from '../components/ui/FormControls';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import {
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Shield,
  ArrowRight,
  CheckCircle2,
  Info,
  X,
  Users,
  UserRound,
  Building2,
  Bell
} from 'lucide-react';
import {
  CategoryAssignee,
  CategoryAudience,
  CategoryAudienceConfig,
  CategoryBusinessHoursMode,
  CategoryNotificationRules,
  CATEGORY_BUSINESS_HOURS_OPTIONS,
  DEFAULT_CATEGORY_NOTIFICATIONS,
  DEFAULT_CATEGORY_SLA,
  DEFAULT_PRIORITY_SLA,
  HelpdeskCategory,
  NotificationChannel,
  PRIORITY_LEVELS,
  PrioritySlaConfig,
  SlaTimeUnit,
  TicketPriorityLevel,
  audienceLabel,
  businessHoursLabel,
  notificationChannelLabel
} from '../data/categoryTypes';
import { getCompanyById, HELPDESK_COMPANIES } from '../data/companies';
import { handlingTeamsForCompany } from '../data/helpdeskTeams';
import {
  DirectoryGroup,
  DirectoryGroupKind,
  DirectoryPerson,
  employeesForCompany,
  groupsForCompany,
  DIRECTORY_GROUP_KIND_LABEL,
  DIRECTORY_GROUP_KIND_SHORT
} from '../data/directory';
import './CategoriesView.css';

const EMPLOYEE_OPTIONS: CategoryAssignee[] = [
  { id: 'emp-ashish', name: 'Ashish Kapoor', type: 'employee', initials: 'AK' },
  { id: 'emp-rahul', name: 'Rahul Sharma', type: 'employee', initials: 'RS' },
  { id: 'emp-priya', name: 'Priya Shah', type: 'employee', initials: 'PS' },
  { id: 'emp-neha', name: 'Neha Patel', type: 'employee', initials: 'NP' }
];

const AUDIENCE_OPTIONS: {
  value: CategoryAudience;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'all',
    title: 'Everyone',
    description: 'Anyone in this company can raise a request.',
    icon: <Building2 size={18} />
  },
  {
    value: 'employees',
    title: 'Selected people',
    description: 'Only the people you choose can raise a request.',
    icon: <UserRound size={18} />
  },
  {
    value: 'groups',
    title: 'Selected groups',
    description: 'Limit by department, sub-department, business unit, or location.',
    icon: <Users size={18} />
  }
];

const InfoHint: React.FC<{ text: string }> = ({ text }) => (
  <span className="cat-info-hint" title={text} aria-label={text}>
    <Info size={13} />
  </span>
);

export interface CategoriesViewProps {
  companyId: string;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onNavigateToAllTicketsWithCategoryFilter: (categoryName: string) => void;
}

const normalizeBusinessHours = (value: string): CategoryBusinessHoursMode =>
  value === '24-hour' || value === 'shift-hours'
    ? value
    : value.toLowerCase().includes('24')
      ? '24-hour'
      : 'shift-hours';

const normalizeNotifications = (
  notifications?: Partial<CategoryNotificationRules>
): CategoryNotificationRules => ({
  ...DEFAULT_CATEGORY_NOTIFICATIONS,
  ...(notifications || {}),
  notifyEmpOnCreate: notifications?.enabled !== false,
  notifyEmpOnReply: notifications?.enabled !== false,
  notifyEmpOnResolve: notifications?.enabled !== false,
  notifyAgentOnAssign: notifications?.enabled !== false
});

const emptyAudience = (): CategoryAudienceConfig => ({
  type: 'all',
  employeeIds: [],
  groupIds: []
});

const ORG_GROUP_KINDS: DirectoryGroupKind[] = [
  'department',
  'sub-department',
  'business-unit',
  'location'
];

const emptyGroupQueries = (): Record<DirectoryGroupKind, string> => ({
  department: '',
  'sub-department': '',
  'business-unit': '',
  location: ''
});

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  companyId,
  onShowToast,
  onNavigateToAllTicketsWithCategoryFilter
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'detail' | 'edit'>('list');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-attendance');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'notifications' | 'tickets' | 'activity'>(
    'overview'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeMenuCatId, setActiveMenuCatId] = useState<string | null>(null);
  const [deactivateModalCat, setDeactivateModalCat] = useState<HelpdeskCategory | null>(null);

  const [formCategoryName, setFormCategoryName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCompanyId, setFormCompanyId] = useState(companyId);
  const [formAudience, setFormAudience] = useState<CategoryAudienceConfig>(emptyAudience());
  const [formAudienceQuery, setFormAudienceQuery] = useState('');
  const [formGroupQueries, setFormGroupQueries] = useState(emptyGroupQueries);
  const [formGroupDropdownOpen, setFormGroupDropdownOpen] = useState<
    Partial<Record<DirectoryGroupKind, boolean>>
  >({});
  const [formBusinessHours, setFormBusinessHours] = useState<CategoryBusinessHoursMode>('shift-hours');
  const [formEnableOnHold, setFormEnableOnHold] = useState(false);
  const [formAllowReopen, setFormAllowReopen] = useState(false);
  const [formPriorityChangeBy, setFormPriorityChangeBy] = useState({
    assignee: true,
    employee: false
  });
  const [formSlaExempt, setFormSlaExempt] = useState(false);
  const [formPrioritisationEnabled, setFormPrioritisationEnabled] = useState(true);
  const [formPrioritySla, setFormPrioritySla] = useState(DEFAULT_PRIORITY_SLA);
  const [formCategorySla, setFormCategorySla] = useState<PrioritySlaConfig>({ ...DEFAULT_CATEGORY_SLA });
  const [formDefaultPriority, setFormDefaultPriority] = useState<TicketPriorityLevel>('Medium');
  const [formEscalateResponse, setFormEscalateResponse] = useState(false);
  const [formEscalateResolution, setFormEscalateResolution] = useState(false);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formDefaultTeam, setFormDefaultTeam] = useState('HR Support');
  const [formNotifications, setFormNotifications] =
    useState<CategoryNotificationRules>(DEFAULT_CATEGORY_NOTIFICATIONS);

  const company = getCompanyById(companyId);
  const formCompany = getCompanyById(formCompanyId);
  const directoryCompanyId =
    viewMode === 'create' || viewMode === 'edit' ? formCompanyId : companyId;
  const companyEmployees = useMemo(
    () => employeesForCompany(directoryCompanyId),
    [directoryCompanyId]
  );
  const companyGroups = useMemo(
    () => groupsForCompany(directoryCompanyId),
    [directoryCompanyId]
  );

  const categoryConfigDefaults = {
    audience: emptyAudience(),
    businessHours: 'shift-hours' as CategoryBusinessHoursMode,
    enableOnHold: false,
    allowEmployeeReopen: false,
    priorityChangeBy: { assignee: true, employee: false },
    categoryAssignees: [] as CategoryAssignee[],
    addAssigneesAsFollowers: false,
    prioritisationEnabled: true,
    slaExempt: false,
    prioritySla: DEFAULT_PRIORITY_SLA,
    categorySla: { ...DEFAULT_CATEGORY_SLA },
    defaultPriority: 'Medium' as TicketPriorityLevel,
    escalateOnResponseBreach: false,
    escalateOnResolutionBreach: false,
    notifications: { ...DEFAULT_CATEGORY_NOTIFICATIONS }
  };

  const withCategoryDefaults = (
    partial: Pick<
      HelpdeskCategory,
      'id' | 'companyId' | 'name' | 'description' | 'totalTickets' | 'openTickets' | 'assignedTeam' | 'status' | 'lastUpdated'
    > &
      Partial<HelpdeskCategory>
  ): HelpdeskCategory => ({
    ...categoryConfigDefaults,
    ...partial,
    audience: partial.audience || emptyAudience(),
    notifications: { ...DEFAULT_CATEGORY_NOTIFICATIONS, ...(partial.notifications || {}) }
  });

  const [categories, setCategories] = useState<HelpdeskCategory[]>([
    withCategoryDefaults({
      id: 'cat-attendance',
      companyId: 'co-acme',
      name: 'Attendance',
      description: 'Attendance and time tracking related requests',
      assignedTeam: 'Attendance Desk',
      totalTickets: 42,
      openTickets: 18,
      status: 'Active',
      lastUpdated: 'Today',
      allowEmployeeReopen: true,
      audience: { type: 'all', employeeIds: [], groupIds: [] }
    }),
    withCategoryDefaults({
      id: 'cat-leave',
      companyId: 'co-acme',
      name: 'Leave',
      description: 'Leave and leave balance related requests',
      assignedTeam: 'HR Support',
      totalTickets: 28,
      openTickets: 10,
      status: 'Active',
      lastUpdated: 'Today',
      audience: { type: 'groups', employeeIds: [], groupIds: ['grp-hr'] }
    }),
    withCategoryDefaults({
      id: 'cat-payroll',
      companyId: 'co-acme',
      name: 'Payroll',
      description: 'Salary, payslip and payroll related requests',
      assignedTeam: 'Payroll Support',
      enableOnHold: true,
      totalTickets: 31,
      openTickets: 12,
      status: 'Active',
      lastUpdated: 'Yesterday',
      audience: { type: 'groups', employeeIds: [], groupIds: ['grp-payroll', 'grp-hr'] }
    }),
    withCategoryDefaults({
      id: 'cat-hr',
      companyId: 'co-acme',
      name: 'HR',
      description: 'General employee and HR related requests',
      assignedTeam: 'HR Support',
      totalTickets: 18,
      openTickets: 8,
      status: 'Active',
      lastUpdated: 'Aug 15'
    }),
    withCategoryDefaults({
      id: 'cat-it',
      companyId: 'co-acme',
      name: 'IT',
      description: 'System, access and technology requests',
      assignedTeam: 'IT Support',
      escalateOnResponseBreach: true,
      totalTickets: 24,
      openTickets: 10,
      status: 'Active',
      lastUpdated: 'Aug 14',
      audience: { type: 'employees', employeeIds: ['emp-neha', 'emp-rahul'], groupIds: [] }
    }),
    withCategoryDefaults({
      id: 'cat-admin',
      companyId: 'co-acme',
      name: 'Administration',
      description: 'Facilities and general administration requests',
      assignedTeam: 'Administration Support',
      totalTickets: 11,
      openTickets: 5,
      status: 'Active',
      lastUpdated: 'Aug 12'
    }),
    withCategoryDefaults({
      id: 'cat-fleet',
      companyId: 'co-northwind',
      name: 'Fleet Support',
      description: 'Vehicle, route, and driver support requests',
      assignedTeam: 'Northwind Fleet Desk',
      totalTickets: 19,
      openTickets: 7,
      status: 'Active',
      lastUpdated: 'Today',
      audience: { type: 'groups', employeeIds: [], groupIds: ['grp-drivers', 'grp-warehouse'] }
    }),
    withCategoryDefaults({
      id: 'cat-warehouse',
      companyId: 'co-northwind',
      name: 'Warehouse Ops',
      description: 'Floor, inventory, and shift coverage requests',
      assignedTeam: 'Northwind Ops Desk',
      totalTickets: 14,
      openTickets: 4,
      status: 'Active',
      lastUpdated: 'Yesterday',
      audience: { type: 'all', employeeIds: [], groupIds: [] }
    }),
    withCategoryDefaults({
      id: 'cat-store',
      companyId: 'co-contoso',
      name: 'Store Operations',
      description: 'POS, schedule, and store facility requests',
      assignedTeam: 'Contoso People Ops',
      totalTickets: 22,
      openTickets: 9,
      status: 'Active',
      lastUpdated: 'Today',
      audience: { type: 'groups', employeeIds: [], groupIds: ['grp-store'] }
    }),
    withCategoryDefaults({
      id: 'cat-retail-hr',
      companyId: 'co-contoso',
      name: 'Retail HR',
      description: 'People policies and frontline HR for stores',
      assignedTeam: 'Contoso Retail HR',
      totalTickets: 8,
      openTickets: 3,
      status: 'Active',
      lastUpdated: 'Aug 16',
      audience: { type: 'employees', employeeIds: ['emp-mia', 'emp-dev'], groupIds: [] }
    })
  ]);

  const companyCategories = categories.filter(c => c.companyId === companyId);

  const filteredCategories = companyCategories.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedCategory =
    companyCategories.find(c => c.id === selectedCategoryId) || companyCategories[0];

  const handlingTeamOptions = useMemo(
    () => handlingTeamsForCompany(formCompanyId),
    [formCompanyId]
  );

  const pickDefaultHandlingTeam = (targetCompanyId: string, preferred?: string) => {
    const options = handlingTeamsForCompany(targetCompanyId);
    if (preferred && options.includes(preferred)) return preferred;
    return options[0] || '';
  };

  const renderCategoryStatusBadge = (status: 'Active' | 'Inactive') => {
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

  const resetForm = () => {
    setFormCompanyId(companyId);
    setFormCategoryName('');
    setFormDescription('');
    setFormAudience(emptyAudience());
    setFormAudienceQuery('');
    setFormGroupQueries(emptyGroupQueries());
    setFormGroupDropdownOpen({});
    setFormBusinessHours('shift-hours');
    setFormEnableOnHold(false);
    setFormAllowReopen(false);
    setFormPriorityChangeBy({ assignee: true, employee: false });
    setFormSlaExempt(false);
    setFormPrioritisationEnabled(true);
    setFormPrioritySla(DEFAULT_PRIORITY_SLA);
    setFormCategorySla({ ...DEFAULT_CATEGORY_SLA });
    setFormDefaultPriority('Medium');
    setFormEscalateResponse(false);
    setFormEscalateResolution(false);
    setFormStatus('Active');
    setFormDefaultTeam(pickDefaultHandlingTeam(companyId));
    setFormNotifications({ ...DEFAULT_CATEGORY_NOTIFICATIONS });
  };

  const handleOpenCreateForm = () => {
    resetForm();
    setViewMode('create');
  };

  const handleOpenEditForm = (cat: HelpdeskCategory) => {
    setSelectedCategoryId(cat.id);
    setFormCompanyId(cat.companyId);
    setFormCategoryName(cat.name);
    setFormDescription(cat.description);
    setFormAudience({ ...cat.audience, employeeIds: [...cat.audience.employeeIds], groupIds: [...cat.audience.groupIds] });
    setFormAudienceQuery('');
    setFormGroupQueries(emptyGroupQueries());
    setFormGroupDropdownOpen({});
    setFormBusinessHours(normalizeBusinessHours(cat.businessHours));
    setFormEnableOnHold(cat.enableOnHold);
    setFormAllowReopen(cat.allowEmployeeReopen);
    setFormPriorityChangeBy({ ...cat.priorityChangeBy });
    setFormSlaExempt(cat.slaExempt);
    setFormPrioritisationEnabled(cat.prioritisationEnabled);
    setFormPrioritySla({ ...DEFAULT_PRIORITY_SLA, ...cat.prioritySla });
    setFormCategorySla({ ...(cat.categorySla || DEFAULT_CATEGORY_SLA) });
    setFormDefaultPriority(cat.defaultPriority);
    setFormEscalateResponse(cat.escalateOnResponseBreach);
    setFormEscalateResolution(cat.escalateOnResolutionBreach);
    setFormStatus(cat.status);
    setFormDefaultTeam(cat.assignedTeam);
    setFormNotifications(normalizeNotifications(cat.notifications));
    setViewMode('edit');
  };

  const setAudienceType = (type: CategoryAudience) => {
    setFormAudience(prev => ({
      type,
      employeeIds: type === 'employees' ? prev.employeeIds : [],
      groupIds: type === 'groups' ? prev.groupIds : []
    }));
    setFormAudienceQuery('');
    setFormGroupQueries(emptyGroupQueries());
    setFormGroupDropdownOpen({});
  };

  const handleSaveCategoryForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategoryName.trim()) return;

    if (
      formAudience.type === 'employees' &&
      formAudience.employeeIds.length === 0
    ) {
      onShowToast('warning', 'Audience incomplete', 'Select at least one employee, or switch to Everyone.');
      return;
    }
    if (formAudience.type === 'groups' && formAudience.groupIds.length === 0) {
      onShowToast('warning', 'Audience incomplete', 'Select at least one group, or switch to Everyone.');
      return;
    }
    if (!formDefaultTeam) {
      onShowToast('warning', 'Handling team required', 'Select a team to route new requests in this category.');
      return;
    }

    const notifications: CategoryNotificationRules = formNotifications.enabled
      ? {
          enabled: true,
          channel: formNotifications.channel,
          notifyEmpOnCreate: true,
          notifyEmpOnReply: true,
          notifyEmpOnResolve: true,
          notifyAgentOnAssign: true
        }
      : {
          enabled: false,
          channel: formNotifications.channel,
          notifyEmpOnCreate: false,
          notifyEmpOnReply: false,
          notifyEmpOnResolve: false,
          notifyAgentOnAssign: false
        };

    const sharedFields = {
      name: formCategoryName.trim(),
      description: formDescription.trim() || 'Custom Helpdesk request category',
      assignedTeam: formDefaultTeam,
      status: formStatus,
      lastUpdated: 'Just now',
      audience: { ...formAudience },
      businessHours: formBusinessHours,
      enableOnHold: formEnableOnHold,
      allowEmployeeReopen: formAllowReopen,
      priorityChangeBy: { ...formPriorityChangeBy },
      categoryAssignees: [],
      addAssigneesAsFollowers: false,
      slaExempt: formSlaExempt,
      prioritisationEnabled: formPrioritisationEnabled,
      prioritySla: Object.fromEntries(
        PRIORITY_LEVELS.map(p => [p, { ...formPrioritySla[p], enabled: true }])
      ) as Record<TicketPriorityLevel, PrioritySlaConfig>,
      categorySla: { ...formCategorySla, enabled: true },
      defaultPriority: formDefaultPriority,
      escalateOnResponseBreach: formSlaExempt ? false : formEscalateResponse,
      escalateOnResolutionBreach: formSlaExempt ? false : formEscalateResolution,
      notifications
    };

    if (viewMode === 'create') {
      const newCat: HelpdeskCategory = {
        id: `cat-${Date.now()}`,
        companyId: formCompanyId,
        totalTickets: 0,
        openTickets: 0,
        ...sharedFields
      };
      setCategories(prev => [...prev, newCat]);
      onShowToast(
        'success',
        'Category Created',
        `"${newCat.name}" created for ${getCompanyById(formCompanyId).name}.`
      );
    } else {
      setCategories(prev =>
        prev.map(c =>
          c.id === selectedCategoryId ? { ...c, companyId: formCompanyId, ...sharedFields } : c
        )
      );
      onShowToast('success', 'Category Updated', `Category "${formCategoryName}" updated.`);
    }

    setViewMode('list');
  };

  const filteredAudienceEmployees = companyEmployees.filter(
    e =>
      (e.name.toLowerCase().includes(formAudienceQuery.toLowerCase()) ||
        e.department.toLowerCase().includes(formAudienceQuery.toLowerCase())) &&
      !formAudience.employeeIds.includes(e.id)
  );

  const filterGroupsByKind = (kind: DirectoryGroupKind) => {
    const q = formGroupQueries[kind].toLowerCase().trim();
    return companyGroups.filter(g => {
      if (g.kind !== kind || formAudience.groupIds.includes(g.id)) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      );
    });
  };

  const addGroupToAudience = (groupId: string, kind: DirectoryGroupKind) => {
    setFormAudience(prev =>
      prev.groupIds.includes(groupId)
        ? prev
        : { ...prev, groupIds: [...prev.groupIds, groupId] }
    );
    setFormGroupQueries(prev => ({ ...prev, [kind]: '' }));
  };

  const removeGroupFromAudience = (groupId: string) => {
    setFormAudience(prev => ({
      ...prev,
      groupIds: prev.groupIds.filter(x => x !== groupId)
    }));
  };
  const updatePrioritySla = (priority: TicketPriorityLevel, patch: Partial<PrioritySlaConfig>) => {
    setFormPrioritySla(prev => ({
      ...prev,
      [priority]: { ...prev[priority], ...patch }
    }));
  };

  const updateCategorySla = (patch: Partial<PrioritySlaConfig>) => {
    setFormCategorySla(prev => ({ ...prev, ...patch }));
  };

  const updateNotification = (patch: Partial<CategoryNotificationRules>) => {
    setFormNotifications(prev => ({ ...prev, ...patch }));
  };

  const personById = (id: string): DirectoryPerson | undefined =>
    companyEmployees.find(e => e.id === id) || EMPLOYEE_OPTIONS.find(e => e.id === id) as unknown as DirectoryPerson;

  const groupById = (id: string): DirectoryGroup | undefined => companyGroups.find(g => g.id === id);

  const handleConfirmDeactivate = () => {
    if (!deactivateModalCat) return;
    setCategories(prev =>
      prev.map(c => (c.id === deactivateModalCat.id ? { ...c, status: 'Inactive', lastUpdated: 'Just now' } : c))
    );
    setDeactivateModalCat(null);
    onShowToast('warning', 'Category Deactivated', `Category "${deactivateModalCat.name}" set to Inactive.`);
  };

  const columns: Column<HelpdeskCategory>[] = [
    {
      key: 'name',
      header: 'Category',
      sortable: true,
      render: item => (
        <div>
          <span
            className="table-cell-id"
            style={{ fontWeight: 700, cursor: 'pointer' }}
            onClick={e => {
              e.stopPropagation();
              setSelectedCategoryId(item.id);
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
      key: 'audience',
      header: 'Who can raise',
      render: item => (
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {audienceLabel(item.audience)}
        </span>
      )
    },
    {
      key: 'totalTickets',
      header: 'Tickets',
      sortable: true,
      width: '100px',
      render: item => (
        <span
          className="table-cell-id"
          style={{ fontWeight: 700, cursor: 'pointer' }}
          onClick={e => {
            e.stopPropagation();
            onNavigateToAllTicketsWithCategoryFilter(item.name);
          }}
        >
          {item.totalTickets} tickets
        </span>
      )
    },
    {
      key: 'assignedTeam',
      header: 'Handling Team',
      sortable: true,
      render: item => (
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.assignedTeam}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: item => renderCategoryStatusBadge(item.status)
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
            onClick={() => setActiveMenuCatId(activeMenuCatId === item.id ? null : item.id)}
          />
          {activeMenuCatId === item.id && (
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
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  setActiveMenuCatId(null);
                  setSelectedCategoryId(item.id);
                  setViewMode('detail');
                }}
              >
                <Eye size={13} />
                View Category
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  setActiveMenuCatId(null);
                  handleOpenEditForm(item);
                }}
              >
                <Edit size={13} />
                Edit Category
              </button>
              {item.status === 'Active' ? (
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
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => {
                    setActiveMenuCatId(null);
                    setDeactivateModalCat(item);
                  }}
                >
                  <Shield size={13} />
                  Deactivate Category
                </button>
              ) : (
                <button
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: '#10B981',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => {
                    setActiveMenuCatId(null);
                    setCategories(prev => prev.map(c => (c.id === item.id ? { ...c, status: 'Active' } : c)));
                    onShowToast('success', 'Category Activated', `Category "${item.name}" reactivated.`);
                  }}
                >
                  <CheckCircle2 size={13} />
                  Activate Category
                </button>
              )}
            </div>
          )}
        </div>
      )
    }
  ];

  const renderAudiencePicker = () => (
    <div className="cat-form-section">
      <div className="cat-form-label-row">
        <span className="cat-form-label">Who can raise requests?</span>
        <InfoHint text="Choose who is allowed to create requests in this category" />
      </div>
      <p className="cat-checkbox-desc" style={{ marginBottom: '12px' }}>
        Applies to people in <strong>{formCompany.name}</strong>.
      </p>

      <div className="cat-audience-cards" role="radiogroup" aria-label="Category audience">
        {AUDIENCE_OPTIONS.map(option => {
          const selected = formAudience.type === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`cat-audience-card ${selected ? 'is-selected' : ''}`}
              onClick={() => setAudienceType(option.value)}
            >
              <span className="cat-audience-card-icon">{option.icon}</span>
              <span className="cat-audience-card-body">
                <span className="cat-audience-card-title">{option.title}</span>
                <span className="cat-audience-card-desc">{option.description}</span>
              </span>
              <span className={`cat-audience-radio ${selected ? 'is-on' : ''}`} />
            </button>
          );
        })}
      </div>

      {formAudience.type === 'employees' && (
        <div className="cat-audience-picker">
          <div className="cat-form-label-row">
            <span className="cat-form-label">Select employees</span>
            <span className="cat-audience-count">{formAudience.employeeIds.length} selected</span>
          </div>
          <div className="cat-chip-search">
            {formAudience.employeeIds.map(id => {
              const person = personById(id);
              if (!person) return null;
              return (
                <span key={id} className="cat-assignee-chip">
                  <span className="cat-assignee-avatar">{person.initials}</span>
                  {person.name}
                  <button
                    type="button"
                    className="cat-assignee-remove"
                    onClick={() =>
                      setFormAudience(prev => ({
                        ...prev,
                        employeeIds: prev.employeeIds.filter(x => x !== id)
                      }))
                    }
                    aria-label={`Remove ${person.name}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            <input
              className="cat-chip-search-input"
              value={formAudienceQuery}
              onChange={e => setFormAudienceQuery(e.target.value)}
              placeholder="Search people in this company"
            />
          </div>
          {formAudienceQuery && filteredAudienceEmployees.length > 0 && (
            <div className="cat-search-dropdown">
              {filteredAudienceEmployees.map(emp => (
                <button
                  key={emp.id}
                  type="button"
                  className="cat-search-option"
                  onClick={() => {
                    setFormAudience(prev => ({
                      ...prev,
                      employeeIds: [...prev.employeeIds, emp.id]
                    }));
                    setFormAudienceQuery('');
                  }}
                >
                  <span className="cat-assignee-avatar">{emp.initials}</span>
                  <span>
                    {emp.name}
                    <span className="cat-search-option-meta">{emp.department}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {formAudience.type === 'groups' && (
        <div className="cat-audience-picker">
          <div className="cat-form-label-row">
            <span className="cat-form-label">Select groups</span>
            <span className="cat-audience-count">{formAudience.groupIds.length} selected</span>
          </div>
          <p className="cat-checkbox-desc" style={{ marginTop: 0 }}>
            Pick one or more from each type. Multiple selections are allowed.
          </p>
          <div className="cat-org-groups-grid">
            {ORG_GROUP_KINDS.map(kind => {
              const selectedForKind = formAudience.groupIds
                .map(id => groupById(id))
                .filter((g): g is DirectoryGroup => !!g && g.kind === kind);
              const options = filterGroupsByKind(kind);
              const isOpen = !!formGroupDropdownOpen[kind];
              const label = DIRECTORY_GROUP_KIND_LABEL[kind];

              return (
                <div key={kind} className="cat-org-group-field">
                  <div className="cat-form-label-row">
                    <span className="cat-form-label">{label}</span>
                    <span className="cat-audience-count">{selectedForKind.length} selected</span>
                  </div>
                  <div className="cat-chip-search">
                    {selectedForKind.map(group => (
                      <span key={group.id} className="cat-assignee-chip">
                        <span className="cat-assignee-avatar">{DIRECTORY_GROUP_KIND_SHORT[group.kind]}</span>
                        {group.name}
                        <button
                          type="button"
                          className="cat-assignee-remove"
                          onClick={() => removeGroupFromAudience(group.id)}
                          aria-label={`Remove ${group.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input
                      className="cat-chip-search-input"
                      value={formGroupQueries[kind]}
                      onChange={e => {
                        setFormGroupQueries(prev => ({ ...prev, [kind]: e.target.value }));
                        setFormGroupDropdownOpen(prev => ({ ...prev, [kind]: true }));
                      }}
                      onFocus={() => setFormGroupDropdownOpen(prev => ({ ...prev, [kind]: true }))}
                      onBlur={() => {
                        window.setTimeout(
                          () => setFormGroupDropdownOpen(prev => ({ ...prev, [kind]: false })),
                          150
                        );
                      }}
                      placeholder={`Search ${label.toLowerCase()}…`}
                      autoComplete="off"
                    />
                  </div>
                  {isOpen && options.length > 0 && (
                    <div className="cat-search-dropdown">
                      {options.map(group => (
                        <button
                          key={group.id}
                          type="button"
                          className="cat-search-option"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            addGroupToAudience(group.id, kind);
                            setFormGroupDropdownOpen(prev => ({ ...prev, [kind]: true }));
                          }}
                        >
                          <span className="cat-assignee-avatar">
                            {DIRECTORY_GROUP_KIND_SHORT[group.kind]}
                          </span>
                          <span>
                            {group.name}
                            <span className="cat-search-option-meta">
                              {group.memberCount} people
                              {group.description ? ` · ${group.description}` : ''}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="cat-form-section cat-notifications-section">
      <div className="cat-form-label-row">
        <span className="cat-form-label">
          <Bell size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          Email & in-app alerts
        </span>
        <InfoHint text="Only for requests in this category. SLA warning and breach alerts are managed under SLA & Escalation." />
      </div>

      <div className="cat-follower-row" style={{ marginBottom: '12px' }}>
        <ToggleSwitch
          checked={formNotifications.enabled}
          onChange={enabled => updateNotification({ enabled })}
          label="Enable notifications for this category"
        />
      </div>

      {formNotifications.enabled && (
        <>
          <FormField label="Delivery channel" hint="How alerts are sent when events occur">
            <SelectInput
              value={formNotifications.channel}
              onChange={e => updateNotification({ channel: e.target.value as NotificationChannel })}
            >
              <option value="in-app">In-app only</option>
              <option value="email">Email only</option>
              <option value="both">In-app and email</option>
            </SelectInput>
          </FormField>

          <p className="cat-checkbox-desc" style={{ margin: '12px 0' }}>
            The following alerts are always sent when notifications are enabled:
          </p>

          <div className="cat-notif-grid">
            <div className="cat-notif-group">
              <span className="cat-notif-group-title">For the requester</span>
              <div className="cat-notif-readonly">When the request is submitted</div>
              <div className="cat-notif-readonly">When someone replies</div>
              <div className="cat-notif-readonly">When the request is resolved</div>
            </div>
            <div className="cat-notif-group">
              <span className="cat-notif-group-title">For agents</span>
              <div className="cat-notif-readonly">When a ticket is assigned</div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="categories-container">
        <PageHeader
          breadcrumbs={[
            { label: 'Sixtifi WFM' },
            { label: 'Helpdesk' },
            { label: 'Categories', onClick: () => setViewMode('list') },
            { label: viewMode === 'create' ? 'Add Category' : 'Edit Category' }
          ]}
          title={viewMode === 'create' ? 'Add Category' : `Edit — ${formCategoryName || 'Untitled'}`}
          subtitle="Set who can raise requests, who handles them, and how quickly they should be answered."
        />

        <div className="category-form-layout">
          <form onSubmit={handleSaveCategoryForm} className="category-form-card keka-category-form">
            <FormField label="Company" required hint="This category only applies to the selected company">
              <SelectInput
                value={formCompanyId}
                onChange={e => {
                  const nextCompanyId = e.target.value;
                  setFormCompanyId(nextCompanyId);
                  setFormAudience(emptyAudience());
                  setFormAudienceQuery('');
                  setFormGroupQueries(emptyGroupQueries());
                  setFormGroupDropdownOpen({});
                  setFormDefaultTeam(pickDefaultHandlingTeam(nextCompanyId, formDefaultTeam));
                }}
              >
                {HELPDESK_COMPANIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField label="Name" required hint="Short name people will see when raising a request">
              <TextInput
                value={formCategoryName}
                onChange={e => setFormCategoryName(e.target.value)}
                placeholder="e.g. Attendance, Payroll, IT Support"
              />
            </FormField>

            <FormField label="Description" hint="Optional — up to 250 characters">
              <TextareaInput
                value={formDescription}
                onChange={e => setFormDescription(e.target.value.slice(0, 250))}
                placeholder="Briefly explain what this category is for"
                rows={3}
              />
            </FormField>

            {renderAudiencePicker()}

            <FormField
              label="Working hours"
              hint="When the SLA clock runs for tickets in this category"
            >
              <SelectInput
                value={formBusinessHours}
                onChange={e => setFormBusinessHours(e.target.value as CategoryBusinessHoursMode)}
              >
                {CATEGORY_BUSINESS_HOURS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <div className="cat-checkbox-block">
              <Checkbox
                checked={formEnableOnHold}
                onChange={e => setFormEnableOnHold(e.target.checked)}
                label="Allow On Hold"
              />
              <p className="cat-checkbox-desc">
                Agents can pause a ticket while waiting on someone else (for example, more info from the employee).
              </p>
            </div>

            <div className="cat-checkbox-block">
              <Checkbox
                checked={formAllowReopen}
                onChange={e => setFormAllowReopen(e.target.checked)}
                label="Allow employees to reopen closed requests"
              />
              <p className="cat-checkbox-desc">
                Useful if something was closed too early and still needs help.
              </p>
            </div>

            {formPrioritisationEnabled && (
              <div className="cat-form-section">
                <span className="cat-form-label">Who can change priority?</span>
                <div className="cat-checkbox-row">
                  <Checkbox
                    checked={formPriorityChangeBy.assignee}
                    onChange={e => setFormPriorityChangeBy(prev => ({ ...prev, assignee: e.target.checked }))}
                    label="Assigned agent"
                  />
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={formPriorityChangeBy.employee}
                      onChange={e => setFormPriorityChangeBy(prev => ({ ...prev, employee: e.target.checked }))}
                    />
                    <span>Requester</span>
                    <InfoHint text="Let the person who raised the request change its priority" />
                  </label>
                </div>
              </div>
            )}

            {renderNotificationsSection()}

            <div className="cat-form-section cat-sla-section">
              <div className="cat-follower-row" style={{ marginBottom: '14px' }}>
                <ToggleSwitch
                  checked={formPrioritisationEnabled}
                  onChange={setFormPrioritisationEnabled}
                  label="Use priority levels (Urgent / High / Medium / Low)"
                />
              </div>

              {formPrioritisationEnabled ? (
                <>
                  <p className="cat-checkbox-desc" style={{ marginBottom: '12px' }}>
                    Set how quickly each priority should get a first reply and a full resolution.
                  </p>
                  <div className="cat-sla-matrix">
                  {PRIORITY_LEVELS.map(priority => {
                    const row = formPrioritySla[priority];
                    return (
                      <div key={priority} className="cat-sla-row">
                        <span className="cat-sla-priority-label">{priority}</span>
                        <div className="cat-sla-field">
                          <span className="cat-sla-field-label">First reply within</span>
                          <div className="cat-sla-inputs">
                            <TextInput
                              type="number"
                              value={String(row.firstResponseValue)}
                              onChange={e =>
                                updatePrioritySla(priority, {
                                  firstResponseValue: Math.max(0, Number(e.target.value) || 0)
                                })
                              }
                            />
                            <SelectInput
                              value={row.firstResponseUnit}
                              onChange={e =>
                                updatePrioritySla(priority, {
                                  firstResponseUnit: e.target.value as SlaTimeUnit
                                })
                              }
                            >
                              <option value="Minutes">Minutes</option>
                              <option value="Hours">Hours</option>
                              <option value="Days">Days</option>
                            </SelectInput>
                          </div>
                        </div>
                        <div className="cat-sla-field">
                          <span className="cat-sla-field-label">Resolve within</span>
                          <div className="cat-sla-inputs">
                            <TextInput
                              type="number"
                              value={String(row.resolutionValue)}
                              onChange={e =>
                                updatePrioritySla(priority, {
                                  resolutionValue: Math.max(0, Number(e.target.value) || 0)
                                })
                              }
                            />
                            <SelectInput
                              value={row.resolutionUnit}
                              onChange={e =>
                                updatePrioritySla(priority, {
                                  resolutionUnit: e.target.value as SlaTimeUnit
                                })
                              }
                            >
                              <option value="Minutes">Minutes</option>
                              <option value="Hours">Hours</option>
                              <option value="Days">Days</option>
                            </SelectInput>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </>
              ) : (
                <div className="cat-sla-flat">
                  <p className="cat-checkbox-desc" style={{ marginBottom: '12px' }}>
                    Priority is turned off. Every request in this category uses the same reply and resolve times below.
                  </p>
                  <div className="cat-sla-row cat-sla-row-flat">
                    <div className="cat-sla-field">
                      <span className="cat-sla-field-label">First reply within</span>
                      <div className="cat-sla-inputs">
                        <TextInput
                          type="number"
                          value={String(formCategorySla.firstResponseValue)}
                          onChange={e =>
                            updateCategorySla({
                              firstResponseValue: Math.max(0, Number(e.target.value) || 0)
                            })
                          }
                        />
                        <SelectInput
                          value={formCategorySla.firstResponseUnit}
                          onChange={e =>
                            updateCategorySla({ firstResponseUnit: e.target.value as SlaTimeUnit })
                          }
                        >
                          <option value="Minutes">Minutes</option>
                          <option value="Hours">Hours</option>
                          <option value="Days">Days</option>
                        </SelectInput>
                      </div>
                    </div>
                    <div className="cat-sla-field">
                      <span className="cat-sla-field-label">Resolve within</span>
                      <div className="cat-sla-inputs">
                        <TextInput
                          type="number"
                          value={String(formCategorySla.resolutionValue)}
                          onChange={e =>
                            updateCategorySla({
                              resolutionValue: Math.max(0, Number(e.target.value) || 0)
                            })
                          }
                        />
                        <SelectInput
                          value={formCategorySla.resolutionUnit}
                          onChange={e =>
                            updateCategorySla({ resolutionUnit: e.target.value as SlaTimeUnit })
                          }
                        >
                          <option value="Minutes">Minutes</option>
                          <option value="Hours">Hours</option>
                          <option value="Days">Days</option>
                        </SelectInput>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {formPrioritisationEnabled && (
              <div className="cat-form-section">
                <span className="cat-form-label">Default priority for new requests</span>
                <div className="cat-radio-row" style={{ marginTop: '8px' }}>
                  {PRIORITY_LEVELS.map(p => (
                    <label key={p} className="cat-radio-option">
                      <input
                        type="radio"
                        name="default-priority"
                        checked={formDefaultPriority === p}
                        onChange={() => setFormDefaultPriority(p)}
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="cat-form-section">
              <div className="cat-follower-row" style={{ marginBottom: '8px' }}>
                <ToggleSwitch
                  checked={!formSlaExempt}
                  onChange={enabled => setFormSlaExempt(!enabled)}
                  label="Enable SLA Escalation"
                />
              </div>
              <p className="cat-checkbox-desc" style={{ marginBottom: formSlaExempt ? 0 : '12px' }}>
                {formSlaExempt
                  ? 'Escalation is off for this category. Priority and reply/resolve times above still apply.'
                  : 'Uses the three escalation levels from SLA & Escalation. Choose when to escalate below.'}
              </p>
              {!formSlaExempt && (
                <div className="cat-escalation-list">
                  <div className="cat-follower-row">
                    <ToggleSwitch checked={formEscalateResponse} onChange={setFormEscalateResponse} />
                    <span>Escalate if the first reply is late</span>
                  </div>
                  <div className="cat-follower-row">
                    <ToggleSwitch checked={formEscalateResolution} onChange={setFormEscalateResolution} />
                    <span>Escalate if the request is not resolved in time</span>
                  </div>
                </div>
              )}
            </div>

            <div className="cat-form-two-col">
              <FormField
                label="Handling team"
                required
                hint="A team can handle multiple categories. New tickets route to this team."
              >
                <SelectInput value={formDefaultTeam} onChange={e => setFormDefaultTeam(e.target.value)}>
                  {handlingTeamOptions.length === 0 ? (
                    <option value="">No teams for this company</option>
                  ) : (
                    handlingTeamOptions.map(teamName => (
                      <option key={teamName} value={teamName}>
                        {teamName}
                      </option>
                    ))
                  )}
                </SelectInput>
              </FormField>
              <FormField label="Status" hint="Inactive categories are hidden when raising a request">
                <SelectInput value={formStatus} onChange={e => setFormStatus(e.target.value as 'Active' | 'Inactive')}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </SelectInput>
              </FormField>
            </div>

            <div className="cat-form-footer">
              <Button variant="secondary" type="button" onClick={() => setViewMode('list')}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!formCategoryName.trim() || !formDefaultTeam}
              >
                Save Category
              </Button>
            </div>
          </form>

          <div className="sidebar-info-card">
            <div className="sidebar-card-header">
              <span className="sidebar-card-title">Quick tips</span>
              <Shield size={16} style={{ color: 'var(--color-primary-600)' }} />
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                lineHeight: 1.45
              }}
            >
              <div>
                <strong>Handling team</strong> — assign here; the same team can handle multiple categories.
              </div>
              <div>
                <strong>Who can raise</strong> — everyone, selected people, or groups.
              </div>
              <div>
                <strong>Alerts</strong> — choose what people get notified about.
              </div>
              <div>
                <strong>Enable SLA Escalation</strong> — turn on per category; notify targets come from SLA &amp;
                Escalation. Off keeps reply/resolve times but never escalates.
              </div>
              <div>
                <strong>Reply & resolve times</strong> — by priority if enabled, or one shared time if not.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'detail' && selectedCategory) {
    const notif = selectedCategory.notifications;
    return (
      <div className="categories-container">
        <PageHeader
          breadcrumbs={[
            { label: 'Sixtifi WFM' },
            { label: 'Helpdesk' },
            { label: 'Categories', onClick: () => setViewMode('list') },
            { label: selectedCategory.name }
          ]}
          title={selectedCategory.name}
          badge={renderCategoryStatusBadge(selectedCategory.status)}
          actions={
            <div style={{ display: 'flex', gap: 'var(--space-2-5)' }}>
              <Button variant="outline" onClick={() => handleOpenEditForm(selectedCategory)}>
                Edit Category
              </Button>
              <Button variant="secondary" onClick={() => setDeactivateModalCat(selectedCategory)}>
                Deactivate Category
              </Button>
              <Button variant="secondary" onClick={() => setViewMode('list')}>
                Back to Categories
              </Button>
            </div>
          }
        />

        <div className="categories-kpi-grid">
          <div className="categories-kpi-card" onClick={() => setActiveDetailTab('notifications')}>
            <span className="categories-kpi-title">Notifications</span>
            <span className="categories-kpi-val" style={{ fontSize: '18px' }}>
              Category rules
            </span>
          </div>
          <div
            className="categories-kpi-card"
            onClick={() => onNavigateToAllTicketsWithCategoryFilter(selectedCategory.name)}
          >
            <span className="categories-kpi-title">Open Tickets</span>
            <span className="categories-kpi-val" style={{ color: '#1E40AF' }}>
              {selectedCategory.openTickets}
            </span>
          </div>
          <div
            className="categories-kpi-card"
            onClick={() => onNavigateToAllTicketsWithCategoryFilter(selectedCategory.name)}
          >
            <span className="categories-kpi-title">Total Tickets</span>
            <span className="categories-kpi-val">{selectedCategory.totalTickets}</span>
          </div>
          <div className="categories-kpi-card">
            <span className="categories-kpi-title">Handling Team</span>
            <span className="categories-kpi-val" style={{ fontSize: '18px' }}>
              {selectedCategory.assignedTeam}
            </span>
          </div>
        </div>

        <div className="category-detail-tabs-bar">
          <button
            className={`cat-tab-btn ${activeDetailTab === 'overview' ? 'is-active' : ''}`}
            onClick={() => setActiveDetailTab('overview')}
          >
            Overview
          </button>
          <button
            className={`cat-tab-btn ${activeDetailTab === 'notifications' ? 'is-active' : ''}`}
            onClick={() => setActiveDetailTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`cat-tab-btn ${activeDetailTab === 'tickets' ? 'is-active' : ''}`}
            onClick={() => onNavigateToAllTicketsWithCategoryFilter(selectedCategory.name)}
          >
            Tickets ({selectedCategory.totalTickets})
          </button>
          <button
            className={`cat-tab-btn ${activeDetailTab === 'activity' ? 'is-active' : ''}`}
            onClick={() => setActiveDetailTab('activity')}
          >
            Activity History
          </button>
        </div>

        {activeDetailTab === 'overview' && (
          <div className="category-detail-content-panel">
            <div className="sidebar-info-card">
              <h3 className="text-h3">Category Details</h3>
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                {selectedCategory.description}
              </p>

              <div className="meta-rows-list" style={{ marginTop: '12px' }}>
                <div className="meta-row-item">
                  <span className="meta-label">Company</span>
                  <span className="meta-value">{company.name}</span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">Handling Team</span>
                  <span className="meta-value">{selectedCategory.assignedTeam}</span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">Who can raise</span>
                  <span className="meta-value">{audienceLabel(selectedCategory.audience)}</span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">Business Hours</span>
                  <span className="meta-value">{businessHoursLabel(normalizeBusinessHours(selectedCategory.businessHours))}</span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">Escalation</span>
                  <span className="meta-value">
                    {selectedCategory.slaExempt ? 'Off for this category' : 'On'}
                  </span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">Prioritisation</span>
                  <span className="meta-value">
                    {selectedCategory.prioritisationEnabled ? 'Enabled' : 'Disabled (flat SLA)'}
                  </span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">
                    {selectedCategory.prioritisationEnabled ? 'Default Priority' : 'Category SLA'}
                  </span>
                  <span className="meta-value">
                    {selectedCategory.prioritisationEnabled
                      ? selectedCategory.defaultPriority
                      : `${selectedCategory.categorySla?.firstResponseValue ?? 8}${String(selectedCategory.categorySla?.firstResponseUnit ?? 'Hours').charAt(0).toLowerCase()} / ${selectedCategory.categorySla?.resolutionValue ?? 2}${String(selectedCategory.categorySla?.resolutionUnit ?? 'Days').charAt(0).toLowerCase()}`}
                  </span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">Employee Reopen</span>
                  <span className="meta-value">
                    {selectedCategory.allowEmployeeReopen ? 'Allowed' : 'Not allowed'}
                  </span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">Total Ticket Volume</span>
                  <span className="meta-value">{selectedCategory.totalTickets} Requests Logged</span>
                </div>
              </div>
            </div>

            <div className="routing-pipeline-card">
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Configured Automation Pipeline
              </div>
              <div className="pipeline-flow-steps">
                <div className="pipeline-step-box">
                  <span className="pipeline-step-title">Company</span>
                  <span className="pipeline-step-val">{company.shortName}</span>
                </div>
                <ArrowRight size={16} className="pipeline-arrow" />
                <div className="pipeline-step-box">
                  <span className="pipeline-step-title">Category</span>
                  <span className="pipeline-step-val">{selectedCategory.name}</span>
                </div>
                <ArrowRight size={16} className="pipeline-arrow" />
                <div className="pipeline-step-box">
                  <span className="pipeline-step-title">Handling Team</span>
                  <span className="pipeline-step-val">{selectedCategory.assignedTeam}</span>
                </div>
                <ArrowRight size={16} className="pipeline-arrow" />
                <div className="pipeline-step-box">
                  <span className="pipeline-step-title">SLA Rule</span>
                  <span className="pipeline-step-val">
                    {selectedCategory.slaExempt
                      ? 'Targets apply · escalation off'
                      : '4h Resolution Target'}
                  </span>
                </div>
                <ArrowRight size={16} className="pipeline-arrow" />
                <div className="pipeline-step-box">
                  <span className="pipeline-step-title">Auto Assignment</span>
                  <span className="pipeline-step-val">Round Robin</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDetailTab === 'notifications' && (
          <div className="category-detail-content-panel">
            <div className="sidebar-info-card">
              <h3 className="text-h3">Notification rules</h3>
              <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
                These alerts fire only for tickets in <strong>{selectedCategory.name}</strong> under{' '}
                <strong>{company.name}</strong>. SLA warning and breach alerts are configured under SLA & Escalation.
              </p>
              <div className="meta-rows-list" style={{ marginBottom: 16 }}>
                <div className="meta-row-item">
                  <span className="meta-label">Status</span>
                  <span className="meta-value">{notif.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                {notif.enabled && (
                  <div className="meta-row-item">
                    <span className="meta-label">Channel</span>
                    <span className="meta-value">{notificationChannelLabel(notif.channel)}</span>
                  </div>
                )}
              </div>
              {notif.enabled && (
                <div className="cat-notif-grid">
                  <div className="cat-notif-group">
                    <span className="cat-notif-group-title">Requester</span>
                    <div className="cat-notif-readonly">When the request is submitted</div>
                    <div className="cat-notif-readonly">When someone replies</div>
                    <div className="cat-notif-readonly">When the request is resolved</div>
                  </div>
                  <div className="cat-notif-group">
                    <span className="cat-notif-group-title">Agents</span>
                    <div className="cat-notif-readonly">When a ticket is assigned</div>
                  </div>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <Button variant="outline" size="sm" onClick={() => handleOpenEditForm(selectedCategory)}>
                  Edit notification rules
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeDetailTab === 'activity' && (
          <div className="category-detail-content-panel">
            <div className="sidebar-info-card">
              <h3 className="text-h3">Configuration Audit Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', fontSize: '12px' }}>
                <div>
                  • <strong>Category Created:</strong> {selectedCategory.name} initialized for {company.name}
                </div>
                <div>
                  • <strong>Handling Team:</strong> {selectedCategory.assignedTeam}
                </div>
                <div>
                  • <strong>Audience Updated:</strong> {audienceLabel(selectedCategory.audience)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="categories-container">
      <PageHeader
        breadcrumbs={[{ label: 'Sixtifi WFM' }, { label: 'Helpdesk' }, { label: 'Categories' }]}
        title="Helpdesk Categories"
        subtitle={`Configure request categories for ${company.name}. Audience and notifications are set per category.`}
        actions={
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleOpenCreateForm}>
            + Add Category
          </Button>
        }
      />

      <div className="table-filter-toolbar">
        <div className="filter-controls-left">
          <div style={{ width: '310px' }}>
            <SearchInput
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search categories..."
            />
          </div>
          <div style={{ width: '130px' }}>
            <SelectInput value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </SelectInput>
          </div>
          {(searchQuery || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredCategories}
        keyExtractor={c => c.id}
        onRowClick={item => {
          setSelectedCategoryId(item.id);
          setActiveDetailTab('overview');
          setViewMode('detail');
        }}
      />

      <Modal
        isOpen={!!deactivateModalCat}
        onClose={() => setDeactivateModalCat(null)}
        title={`Deactivate ${deactivateModalCat?.name}?`}
        subtitle="Employees will no longer be able to select this category for new requests."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeactivateModalCat(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmDeactivate}>
              Deactivate Category
            </Button>
          </>
        }
      >
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Existing tickets associated with <strong>{deactivateModalCat?.name}</strong> will remain unchanged.
        </p>
      </Modal>
    </div>
  );
};
