import { TicketPriority } from '../components/ui/Badge';
import {
  CategoryAudienceConfig,
  CategoryBusinessHoursMode,
  CategoryNotificationRules,
  DEFAULT_CATEGORY_NOTIFICATIONS,
  TicketPriorityLevel
} from './categoryTypes';
import { DirectoryPerson } from './directory';

export type SlaTimeUnit = 'Minutes' | 'Hours' | 'Days';
export type EscalationNotifyKind = 'assignee' | 'team-lead' | 'employee';
export type EscalationChannel = 'In-app' | 'Email' | 'In-app + Email';

export interface SlaPolicyRule {
  id: string;
  priority: TicketPriority;
  firstReplyValue: number;
  firstReplyUnit: SlaTimeUnit;
  resolveValue: number;
  resolveUnit: SlaTimeUnit;
}

export interface EscalationLevel {
  id: string;
  level: 1 | 2 | 3;
  trigger: string;
  notifyKind: EscalationNotifyKind;
  notifyPersonId: string;
  notifyPersonName: string;
  channel: EscalationChannel;
}

export interface CategoryFlatSla {
  firstReplyValue: number;
  firstReplyUnit: SlaTimeUnit;
  resolveValue: number;
  resolveUnit: SlaTimeUnit;
}

export interface CategorySlaSettings {
  prioritisationEnabled: boolean;
  defaultPriority: TicketPriorityLevel;
  flatSla: CategoryFlatSla;
  slaRules: SlaPolicyRule[];
  slaExempt: boolean;
  escalateOnResponseBreach: boolean;
  escalateOnResolutionBreach: boolean;
  warningThreshold: string;
  criticalThreshold: string;
  escalationLevels: EscalationLevel[];
}

/** Full versioned category configuration (routing, audience, notifications, SLA). */
export interface CategoryConfigSnapshot {
  name: string;
  description: string;
  assignedTeam: string;
  audience: CategoryAudienceConfig;
  businessHours: CategoryBusinessHoursMode;
  allowEmployeeReopen: boolean;
  priorityChangeBy: {
    assignee: boolean;
    employee: boolean;
  };
  notifications: CategoryNotificationRules;
  sla: CategorySlaSettings;
}

export interface CategoryVersion {
  id: string;
  versionNumber: number;
  label: string;
  publishedAt: string;
  publishedBy: string;
  changeNote?: string;
  snapshot: CategoryConfigSnapshot;
  status: 'active' | 'superseded';
  openTicketsOnVersion: number;
}

export interface CategoryConfigChange {
  id: string;
  summary: string;
  detail: string;
  changedBy: string;
  changedAt: string;
  versionId?: string;
}

export interface CategoryVersionState {
  categoryId: string;
  companyId: string;
  activeVersionId: string;
  draft: CategoryConfigSnapshot;
  versions: CategoryVersion[];
  configChangeLog: CategoryConfigChange[];
}

export const CATEGORY_CONFIG_UPDATED_EVENT = 'sixtifi-category-config-updated';
const STORAGE_KEY = 'sixtifi-helpdesk-category-config-by-id';
const LEGACY_SLA_KEY = 'sixtifi-helpdesk-category-sla-by-id';

export const THRESHOLD_OPTIONS = ['50%', '60%', '70%', '75%', '80%', '85%', '90%', '95%', '99%'] as const;

const CATEGORY_SEEDS: Record<string, Partial<CategoryConfigSnapshot> & { companyId: string }> = {
  'cat-attendance': {
    companyId: 'co-acme',
    name: 'Attendance',
    description: 'Attendance and time tracking related requests',
    assignedTeam: 'Attendance Desk',
    allowEmployeeReopen: true,
    audience: { type: 'all', employeeIds: [], groupIds: [] }
  },
  'cat-leave': {
    companyId: 'co-acme',
    name: 'Leave',
    description: 'Leave and leave balance related requests',
    assignedTeam: 'HR Support',
    audience: { type: 'groups', employeeIds: [], groupIds: ['grp-hr'] }
  },
  'cat-payroll': {
    companyId: 'co-acme',
    name: 'Payroll',
    description: 'Salary, payslip and payroll related requests',
    assignedTeam: 'Payroll Support',
    audience: { type: 'groups', employeeIds: [], groupIds: ['grp-payroll', 'grp-hr'] }
  },
  'cat-hr': {
    companyId: 'co-acme',
    name: 'HR',
    description: 'General employee and HR related requests',
    assignedTeam: 'HR Support'
  },
  'cat-it': {
    companyId: 'co-acme',
    name: 'IT',
    description: 'System, access and technology requests',
    assignedTeam: 'IT Support',
    audience: { type: 'employees', employeeIds: ['emp-neha', 'emp-rahul'], groupIds: [] }
  },
  'cat-admin': {
    companyId: 'co-acme',
    name: 'Administration',
    description: 'Facilities and general administration requests',
    assignedTeam: 'Administration Support'
  },
  'cat-fleet': {
    companyId: 'co-northwind',
    name: 'Fleet Support',
    description: 'Vehicle, route, and driver support requests',
    assignedTeam: 'Northwind Fleet Desk',
    audience: { type: 'groups', employeeIds: [], groupIds: ['grp-drivers', 'grp-warehouse'] }
  },
  'cat-warehouse': {
    companyId: 'co-northwind',
    name: 'Warehouse Ops',
    description: 'Floor, inventory, and shift coverage requests',
    assignedTeam: 'Northwind Ops Desk',
    audience: { type: 'all', employeeIds: [], groupIds: [] }
  },
  'cat-store': {
    companyId: 'co-contoso',
    name: 'Store Operations',
    description: 'POS, schedule, and store facility requests',
    assignedTeam: 'Contoso People Ops',
    audience: { type: 'groups', employeeIds: [], groupIds: ['grp-store'] }
  },
  'cat-retail-hr': {
    companyId: 'co-contoso',
    name: 'Retail HR',
    description: 'Retail people policies and frontline HR for stores',
    assignedTeam: 'Contoso Retail HR',
    audience: { type: 'employees', employeeIds: ['emp-mia', 'emp-dev'], groupIds: [] }
  }
};

export function parseThresholdPercent(value: string): number {
  const n = parseInt(value.replace('%', ''), 10);
  return Number.isFinite(n) ? Math.min(99, Math.max(1, n)) : 80;
}

export function getCriticalThresholdOptions(atRiskThreshold: string): string[] {
  const atRisk = parseThresholdPercent(atRiskThreshold);
  return THRESHOLD_OPTIONS.filter(opt => parseThresholdPercent(opt) > atRisk);
}

export function pickValidCriticalThreshold(atRiskThreshold: string, currentCritical: string): string {
  const options = getCriticalThresholdOptions(atRiskThreshold);
  if (options.includes(currentCritical)) return currentCritical;
  return options[options.length - 1] || '95%';
}

export function buildEscalationTriggers(
  atRiskThreshold: string,
  criticalThreshold: string
): Record<1 | 2 | 3, string> {
  const atRisk = parseThresholdPercent(atRiskThreshold);
  const critical = parseThresholdPercent(criticalThreshold);
  return {
    1: `${atRisk}% SLA At Risk`,
    2: `${critical}% SLA Critical`,
    3: 'SLA Breached (100%)'
  };
}

export function formatSlaTarget(value: number, unit: SlaTimeUnit): string {
  const label = value === 1 ? unit.replace(/s$/, '') : unit;
  return `${value} ${label}`;
}

export function defaultSlaRules(): SlaPolicyRule[] {
  return [
    { id: 'sla-urgent', priority: 'Urgent', firstReplyValue: 1, firstReplyUnit: 'Hours', resolveValue: 4, resolveUnit: 'Hours' },
    { id: 'sla-high', priority: 'High', firstReplyValue: 4, firstReplyUnit: 'Hours', resolveValue: 1, resolveUnit: 'Days' },
    { id: 'sla-medium', priority: 'Medium', firstReplyValue: 8, firstReplyUnit: 'Hours', resolveValue: 2, resolveUnit: 'Days' },
    { id: 'sla-low', priority: 'Low', firstReplyValue: 12, firstReplyUnit: 'Hours', resolveValue: 4, resolveUnit: 'Days' }
  ];
}

export function defaultFlatSla(): CategoryFlatSla {
  return { firstReplyValue: 8, firstReplyUnit: 'Hours', resolveValue: 2, resolveUnit: 'Days' };
}

export function defaultSlaSettings(people: DirectoryPerson[] = []): CategorySlaSettings {
  return {
    prioritisationEnabled: true,
    defaultPriority: 'Medium',
    flatSla: defaultFlatSla(),
    slaRules: defaultSlaRules(),
    slaExempt: false,
    escalateOnResponseBreach: false,
    escalateOnResolutionBreach: false,
    warningThreshold: '80%',
    criticalThreshold: '90%',
    escalationLevels: defaultEscalationLevels(people)
  };
}

export function defaultEscalationLevels(
  people: DirectoryPerson[],
  atRiskThreshold = '80%',
  criticalThreshold = '90%'
): EscalationLevel[] {
  const triggers = buildEscalationTriggers(atRiskThreshold, criticalThreshold);
  const first = people[0];
  return [
    { id: 'esc-1', level: 1, trigger: triggers[1], notifyKind: 'assignee', notifyPersonId: '', notifyPersonName: '', channel: 'In-app + Email' },
    { id: 'esc-2', level: 2, trigger: triggers[2], notifyKind: 'team-lead', notifyPersonId: '', notifyPersonName: '', channel: 'In-app + Email' },
    {
      id: 'esc-3',
      level: 3,
      trigger: triggers[3],
      notifyKind: first ? 'employee' : 'assignee',
      notifyPersonId: first?.id || '',
      notifyPersonName: first?.name || '',
      channel: 'In-app + Email'
    }
  ];
}

export function defaultCategorySnapshot(
  people: DirectoryPerson[] = [],
  partial?: Partial<CategoryConfigSnapshot>
): CategoryConfigSnapshot {
  const slaPartial = partial?.sla;
  const baseSla = defaultSlaSettings(people);
  return {
    name: partial?.name || 'New Category',
    description: partial?.description || 'Custom Helpdesk request category',
    assignedTeam: partial?.assignedTeam || '',
    audience: partial?.audience || { type: 'all', employeeIds: [], groupIds: [] },
    businessHours: partial?.businessHours || 'shift-hours',
    allowEmployeeReopen: partial?.allowEmployeeReopen ?? false,
    priorityChangeBy: partial?.priorityChangeBy || { assignee: true, employee: false },
    notifications: { ...DEFAULT_CATEGORY_NOTIFICATIONS, ...(partial?.notifications || {}) },
    sla: { ...baseSla, ...(slaPartial || {}) }
  };
}

export function syncEscalationTriggers(
  levels: EscalationLevel[],
  atRiskThreshold: string,
  criticalThreshold: string
): EscalationLevel[] {
  const triggers = buildEscalationTriggers(atRiskThreshold, criticalThreshold);
  return levels.map(level => ({ ...level, trigger: triggers[level.level] }));
}

function cloneSnapshot(snapshot: CategoryConfigSnapshot): CategoryConfigSnapshot {
  return JSON.parse(JSON.stringify(snapshot));
}

function readAll(): Record<string, CategoryVersionState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, CategoryVersionState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(CATEGORY_CONFIG_UPDATED_EVENT));
}

function formatVersionLabel(versionNumber: number, date = new Date()): string {
  const formatted = date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `v${versionNumber} — ${formatted}`;
}

function tryMigrateLegacySla(categoryId: string): CategorySlaSettings | undefined {
  try {
    const raw = localStorage.getItem(LEGACY_SLA_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    const legacy = parsed?.[categoryId];
    if (!legacy?.draft) return undefined;
    return legacy.draft as CategorySlaSettings;
  } catch {
    return undefined;
  }
}

function buildSeedState(categoryId: string, people: DirectoryPerson[] = []): CategoryVersionState {
  const seed = CATEGORY_SEEDS[categoryId];
  const legacySla = tryMigrateLegacySla(categoryId);
  const snapshot = defaultCategorySnapshot(people, {
    ...seed,
    sla: legacySla || undefined
  });
  if (categoryId === 'cat-it') {
    snapshot.sla.escalateOnResponseBreach = true;
  }
  const v1Id = `cat-ver-${categoryId}-1`;
  const openTickets =
    categoryId === 'cat-attendance' ? 18 : categoryId === 'cat-hr' ? 8 : categoryId === 'cat-payroll' ? 12 : 0;

  return {
    categoryId,
    companyId: seed?.companyId || 'co-acme',
    activeVersionId: v1Id,
    draft: cloneSnapshot(snapshot),
    versions: [
      {
        id: v1Id,
        versionNumber: 1,
        label: formatVersionLabel(1, new Date('2026-08-12')),
        publishedAt: '12 Aug 2026, 9:40 AM',
        publishedBy: 'Helpdesk Admin',
        changeNote: 'Initial category configuration',
        snapshot: cloneSnapshot(snapshot),
        status: 'active',
        openTicketsOnVersion: openTickets
      }
    ],
    configChangeLog: [
      {
        id: `cfg-cat-${categoryId}-1`,
        summary: 'Published category version v1',
        detail: `Initial config for ${snapshot.name}`,
        changedBy: 'Helpdesk Admin',
        changedAt: '12 Aug 2026, 9:40 AM',
        versionId: v1Id
      }
    ]
  };
}

export function getCategoryConfigState(
  categoryId: string,
  companyId = 'co-acme',
  people: DirectoryPerson[] = []
): CategoryVersionState {
  const all = readAll();
  if (!all[categoryId]) {
    all[categoryId] = buildSeedState(categoryId, people);
    if (!CATEGORY_SEEDS[categoryId]) {
      all[categoryId].companyId = companyId;
    }
    writeAll(all);
  }
  return all[categoryId];
}

export function initCategoryConfigState(
  categoryId: string,
  companyId: string,
  people: DirectoryPerson[] = [],
  partial?: Partial<CategoryConfigSnapshot>
): CategoryVersionState {
  const all = readAll();
  if (!all[categoryId]) {
    const snapshot = defaultCategorySnapshot(people, partial);
    const v1Id = `cat-ver-${categoryId}-1`;
    all[categoryId] = {
      categoryId,
      companyId,
      activeVersionId: v1Id,
      draft: cloneSnapshot(snapshot),
      versions: [],
      configChangeLog: []
    };
    writeAll(all);
  }
  return all[categoryId];
}

export function saveCategoryDraft(categoryId: string, draft: CategoryConfigSnapshot): void {
  const all = readAll();
  const state = all[categoryId] || buildSeedState(categoryId);
  all[categoryId] = { ...state, draft: cloneSnapshot(draft) };
  writeAll(all);
}

export function getActiveCategoryVersion(categoryId: string): CategoryVersion | undefined {
  const state = getCategoryConfigState(categoryId);
  return state.versions.find(v => v.id === state.activeVersionId);
}

export function publishCategoryVersion(
  categoryId: string,
  publishedBy: string,
  changeNote?: string
): CategoryVersion {
  const all = readAll();
  const state = all[categoryId] || buildSeedState(categoryId);
  const nextVersionNumber = Math.max(0, ...state.versions.map(v => v.versionNumber)) + 1;
  const now = new Date();
  const versionId = `cat-ver-${categoryId}-${nextVersionNumber}-${now.getTime()}`;
  const snapshot = cloneSnapshot(state.draft);

  const previousActive = state.versions.find(v => v.id === state.activeVersionId);
  const carriedOpenCount = previousActive?.openTicketsOnVersion ?? 0;

  const supersededVersions = state.versions.map(v =>
    v.status === 'active' ? { ...v, status: 'superseded' as const } : v
  );

  const newVersion: CategoryVersion = {
    id: versionId,
    versionNumber: nextVersionNumber,
    label: formatVersionLabel(nextVersionNumber, now),
    publishedAt: now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }),
    publishedBy,
    changeNote: changeNote?.trim() || undefined,
    snapshot,
    status: 'active',
    openTicketsOnVersion: 0
  };

  const updatedVersions = [
    ...supersededVersions.map(v =>
      v.id === previousActive?.id ? { ...v, openTicketsOnVersion: carriedOpenCount } : v
    ),
    newVersion
  ];

  const logEntry: CategoryConfigChange = {
    id: `cfg-${now.getTime()}`,
    summary: `Published category version v${nextVersionNumber}`,
    detail: changeNote?.trim() || `${snapshot.name} · ${snapshot.assignedTeam}`,
    changedBy: publishedBy,
    changedAt: newVersion.publishedAt,
    versionId
  };

  all[categoryId] = {
    ...state,
    activeVersionId: versionId,
    draft: cloneSnapshot(snapshot),
    versions: updatedVersions,
    configChangeLog: [logEntry, ...state.configChangeLog]
  };

  writeAll(all);
  return newVersion;
}

export function snapshotsEqual(a: CategoryConfigSnapshot, b: CategoryConfigSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function getSlaSummaryLabel(sla: CategorySlaSettings): string {
  if (sla.slaExempt) return 'Targets apply · escalation off';
  if (!sla.prioritisationEnabled) {
    return `${formatSlaTarget(sla.flatSla.firstReplyValue, sla.flatSla.firstReplyUnit)} / ${formatSlaTarget(sla.flatSla.resolveValue, sla.flatSla.resolveUnit)}`;
  }
  const medium = sla.slaRules.find(r => r.priority === 'Medium');
  if (!medium) return 'Priority-based SLA';
  return `${formatSlaTarget(medium.firstReplyValue, medium.firstReplyUnit)} / ${formatSlaTarget(medium.resolveValue, medium.resolveUnit)} (Medium)`;
}

export function shellFieldsFromSnapshot(snapshot: CategoryConfigSnapshot) {
  return {
    name: snapshot.name,
    description: snapshot.description,
    assignedTeam: snapshot.assignedTeam
  };
}
