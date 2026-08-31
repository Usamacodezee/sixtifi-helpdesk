import { TicketPriority } from '../components/ui/Badge';
import { DirectoryPerson } from './directory';

export type SlaTimeUnit = 'Minutes' | 'Hours' | 'Days';

export type EscalationNotifyKind = 'assignee' | 'team-lead' | 'employee';

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
  channel: 'In-app' | 'Email' | 'In-app + Email';
}

export interface SlaEscalationSnapshot {
  warningThreshold: string;
  criticalThreshold: string;
  slaRules: SlaPolicyRule[];
  escalationLevels: EscalationLevel[];
}

export interface SlaEscalationVersion {
  id: string;
  versionNumber: number;
  label: string;
  publishedAt: string;
  publishedBy: string;
  changeNote?: string;
  snapshot: SlaEscalationSnapshot;
  status: 'active' | 'superseded';
  /** Demo metric — tickets still evaluated against this version */
  openTicketsOnVersion: number;
}

export interface SlaConfigChange {
  id: string;
  summary: string;
  detail: string;
  changedBy: string;
  changedAt: string;
  versionId?: string;
}

export interface CompanySlaEscalationState {
  companyId: string;
  activeVersionId: string;
  draft: SlaEscalationSnapshot;
  versions: SlaEscalationVersion[];
  configChangeLog: SlaConfigChange[];
}

export const SLA_ESCALATION_UPDATED_EVENT = 'sixtifi-sla-escalation-updated';
const STORAGE_KEY = 'sixtifi-helpdesk-sla-escalation-by-company';

export const THRESHOLD_OPTIONS = ['50%', '60%', '70%', '75%', '80%', '85%', '90%', '95%', '99%'] as const;

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

export function defaultEscalationLevels(
  people: DirectoryPerson[],
  atRiskThreshold = '80%',
  criticalThreshold = '90%'
): EscalationLevel[] {
  const triggers = buildEscalationTriggers(atRiskThreshold, criticalThreshold);
  const first = people[0];
  return [
    {
      id: 'esc-1',
      level: 1,
      trigger: triggers[1],
      notifyKind: 'assignee',
      notifyPersonId: '',
      notifyPersonName: '',
      channel: 'In-app + Email'
    },
    {
      id: 'esc-2',
      level: 2,
      trigger: triggers[2],
      notifyKind: 'team-lead',
      notifyPersonId: '',
      notifyPersonName: '',
      channel: 'In-app + Email'
    },
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

export function defaultSnapshot(people: DirectoryPerson[] = []): SlaEscalationSnapshot {
  return {
    warningThreshold: '80%',
    criticalThreshold: '90%',
    slaRules: defaultSlaRules(),
    escalationLevels: defaultEscalationLevels(people)
  };
}

export function syncEscalationTriggers(
  levels: EscalationLevel[],
  atRiskThreshold: string,
  criticalThreshold: string
): EscalationLevel[] {
  const triggers = buildEscalationTriggers(atRiskThreshold, criticalThreshold);
  return levels.map(level => ({
    ...level,
    trigger: triggers[level.level]
  }));
}

function cloneSnapshot(snapshot: SlaEscalationSnapshot): SlaEscalationSnapshot {
  return JSON.parse(JSON.stringify(snapshot));
}

function readAll(): Record<string, CompanySlaEscalationState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, CompanySlaEscalationState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(SLA_ESCALATION_UPDATED_EVENT));
}

function formatVersionLabel(versionNumber: number, date = new Date()): string {
  const formatted = date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  return `v${versionNumber} — ${formatted}`;
}

function buildSeedState(companyId: string): CompanySlaEscalationState {
  const snapshot = defaultSnapshot();
  const v1Id = `sla-ver-${companyId}-1`;
  const v2Id = `sla-ver-${companyId}-2`;

  const v1Snapshot: SlaEscalationSnapshot = {
    ...cloneSnapshot(snapshot),
    slaRules: snapshot.slaRules.map(rule =>
      rule.priority === 'High'
        ? { ...rule, firstReplyValue: 6, firstReplyUnit: 'Hours' as SlaTimeUnit }
        : rule
    )
  };

  const v2Snapshot = cloneSnapshot(snapshot);

  return {
    companyId,
    activeVersionId: v2Id,
    draft: cloneSnapshot(v2Snapshot),
    versions: [
      {
        id: v1Id,
        versionNumber: 1,
        label: formatVersionLabel(1, new Date('2026-08-12')),
        publishedAt: '12 Aug 2026, 9:40 AM',
        publishedBy: 'Elena Rostova (HR Admin)',
        changeNote: 'Initial SLA policy pack',
        snapshot: v1Snapshot,
        status: 'superseded',
        openTicketsOnVersion: 24
      },
      {
        id: v2Id,
        versionNumber: 2,
        label: formatVersionLabel(2, new Date('2026-08-22')),
        publishedAt: '22 Aug 2026, 2:14 PM',
        publishedBy: 'Priya Shah (Helpdesk Admin)',
        changeNote: 'Tightened High priority first-reply target',
        snapshot: v2Snapshot,
        status: 'active',
        openTicketsOnVersion: 96
      }
    ],
    configChangeLog: [
      {
        id: 'cfg-seed-2',
        summary: 'Published SLA version v2',
        detail: 'High first reply: 4 Hours · At risk: 80% · Critical: 90%',
        changedBy: 'Priya Shah (Helpdesk Admin)',
        changedAt: '22 Aug 2026, 2:14 PM',
        versionId: v2Id
      },
      {
        id: 'cfg-seed-1',
        summary: 'Published SLA version v1',
        detail: 'Default Urgent / High / Medium / Low policy pack',
        changedBy: 'Elena Rostova (HR Admin)',
        changedAt: '12 Aug 2026, 9:40 AM',
        versionId: v1Id
      }
    ]
  };
}

export function getSlaEscalationState(companyId: string): CompanySlaEscalationState {
  const all = readAll();
  if (!all[companyId]) {
    all[companyId] = buildSeedState(companyId);
    writeAll(all);
  }
  return all[companyId];
}

export function saveSlaEscalationDraft(companyId: string, draft: SlaEscalationSnapshot): void {
  const all = readAll();
  const state = all[companyId] || buildSeedState(companyId);
  all[companyId] = { ...state, draft: cloneSnapshot(draft) };
  writeAll(all);
}

export function getActiveSlaVersion(companyId: string): SlaEscalationVersion | undefined {
  const state = getSlaEscalationState(companyId);
  return state.versions.find(v => v.id === state.activeVersionId);
}

export function getSupersededVersions(companyId: string): SlaEscalationVersion[] {
  return getSlaEscalationState(companyId).versions.filter(v => v.status === 'superseded');
}

export function publishSlaEscalationVersion(
  companyId: string,
  publishedBy: string,
  changeNote?: string
): SlaEscalationVersion {
  const all = readAll();
  const state = all[companyId] || buildSeedState(companyId);
  const nextVersionNumber = Math.max(0, ...state.versions.map(v => v.versionNumber)) + 1;
  const now = new Date();
  const versionId = `sla-ver-${companyId}-${nextVersionNumber}-${now.getTime()}`;
  const snapshot = cloneSnapshot(state.draft);

  const supersededVersions = state.versions.map(v =>
    v.status === 'active' ? { ...v, status: 'superseded' as const } : v
  );

  const newVersion: SlaEscalationVersion = {
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

  const previousActive = state.versions.find(v => v.id === state.activeVersionId);
  const updatedVersions = [
    ...supersededVersions.map(v =>
      v.id === previousActive?.id
        ? { ...v, openTicketsOnVersion: previousActive.openTicketsOnVersion || 96 }
        : v
    ),
    newVersion
  ];

  const logEntry: SlaConfigChange = {
    id: `cfg-${now.getTime()}`,
    summary: `Published SLA version v${nextVersionNumber}`,
    detail: changeNote?.trim() || `At risk ${snapshot.warningThreshold} · Critical ${snapshot.criticalThreshold}`,
    changedBy: publishedBy,
    changedAt: newVersion.publishedAt,
    versionId
  };

  all[companyId] = {
    ...state,
    activeVersionId: versionId,
    draft: cloneSnapshot(snapshot),
    versions: updatedVersions,
    configChangeLog: [logEntry, ...state.configChangeLog]
  };

  writeAll(all);
  return newVersion;
}

export function snapshotsEqual(a: SlaEscalationSnapshot, b: SlaEscalationSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
