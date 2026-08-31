import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { PriorityBadge, TicketPriority } from '../components/ui/Badge';
import { SelectInput, FormField, TextInput } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import {
  Save,
  Clock,
  Bell,
  Sliders,
  Edit,
  History,
  User,
  Info
} from 'lucide-react';
import {
  SLA_HOURS_UPDATED_EVENT,
  getSlaHoursMode,
  getSlaHoursModeDescription,
  getSlaHoursModeLabel,
  SlaHoursMode
} from '../data/slaHoursSettings';
import { getCompanyById, HELPDESK_COMPANIES } from '../data/companies';
import { DirectoryPerson, employeesForCompany } from '../data/directory';
import './SlaEscalationView.css';

const SLA_ADMIN_ACTOR = 'Priya Shah (Helpdesk Admin)';

const formatConfigTimestamp = () => {
  const now = new Date();
  return now.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export type SlaTimeUnit = 'Minutes' | 'Hours' | 'Days';

export interface SlaPolicyRule {
  id: string;
  priority: TicketPriority;
  firstReplyValue: number;
  firstReplyUnit: SlaTimeUnit;
  resolveValue: number;
  resolveUnit: SlaTimeUnit;
}

function formatSlaTarget(value: number, unit: SlaTimeUnit): string {
  const label = value === 1 ? unit.replace(/s$/, '') : unit;
  return `${value} ${label}`;
}

export type EscalationNotifyKind = 'assignee' | 'team-lead' | 'employee';

export interface EscalationLevel {
  id: string;
  level: 1 | 2 | 3;
  trigger: string;
  /** Who receives this escalation */
  notifyKind: EscalationNotifyKind;
  /** Set when notifyKind === 'employee' */
  notifyPersonId: string;
  notifyPersonName: string;
  channel: 'In-app' | 'Email' | 'In-app + Email';
}

export interface SlaException {
  id: string;
  priority: TicketPriority;
  category: string;
  customResolutionTarget: string;
  status: 'Active' | 'Inactive';
}

export interface SlaConfigChange {
  id: string;
  summary: string;
  detail: string;
  changedBy: string;
  changedAt: string;
}

const THRESHOLD_OPTIONS = ['50%', '60%', '70%', '75%', '80%', '85%', '90%', '95%', '99%'] as const;

function parseThresholdPercent(value: string): number {
  const n = parseInt(value.replace('%', ''), 10);
  return Number.isFinite(n) ? Math.min(99, Math.max(1, n)) : 80;
}

function getCriticalThresholdOptions(atRiskThreshold: string): string[] {
  const atRisk = parseThresholdPercent(atRiskThreshold);
  return THRESHOLD_OPTIONS.filter(opt => parseThresholdPercent(opt) > atRisk);
}

function pickValidCriticalThreshold(atRiskThreshold: string, currentCritical: string): string {
  const options = getCriticalThresholdOptions(atRiskThreshold);
  if (options.includes(currentCritical)) return currentCritical;
  return options[options.length - 1] || '95%';
}

function buildEscalationTriggers(
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

function defaultEscalationLevels(
  people: DirectoryPerson[],
  atRiskThreshold: string,
  criticalThreshold: string
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

function syncEscalationTriggers(
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

function notifyDisplayLabel(esc: EscalationLevel): string {
  if (esc.notifyKind === 'assignee') return 'Assignee';
  if (esc.notifyKind === 'team-lead') return 'Team Lead';
  return esc.notifyPersonName || 'Employee';
}

export interface SlaEscalationViewProps {
  companyId: string;
  onCompanyChange: (companyId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
}

export const SlaEscalationView: React.FC<SlaEscalationViewProps> = ({
  companyId,
  onCompanyChange,
  onShowToast
}) => {
  const company = getCompanyById(companyId);
  const companyPeople = useMemo(() => employeesForCompany(companyId), [companyId]);

  const [slaHoursMode, setSlaHoursMode] = useState<SlaHoursMode>(() => getSlaHoursMode(companyId));

  useEffect(() => {
    const refresh = () => setSlaHoursMode(getSlaHoursMode(companyId));
    refresh();
    window.addEventListener(SLA_HOURS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(SLA_HOURS_UPDATED_EVENT, refresh);
  }, [companyId]);

  // Default SLA Policies — warning thresholds are global (SLA Defaults), not per priority
  const [slaRules, setSlaRules] = useState<SlaPolicyRule[]>([
    { id: 'sla-urgent', priority: 'Urgent', firstReplyValue: 1, firstReplyUnit: 'Hours', resolveValue: 4, resolveUnit: 'Hours' },
    { id: 'sla-high', priority: 'High', firstReplyValue: 4, firstReplyUnit: 'Hours', resolveValue: 1, resolveUnit: 'Days' },
    { id: 'sla-medium', priority: 'Medium', firstReplyValue: 8, firstReplyUnit: 'Hours', resolveValue: 2, resolveUnit: 'Days' },
    { id: 'sla-low', priority: 'Low', firstReplyValue: 12, firstReplyUnit: 'Hours', resolveValue: 4, resolveUnit: 'Days' }
  ]);

  const [warningThreshold, setWarningThreshold] = useState('80%');
  const [criticalThreshold, setCriticalThreshold] = useState('90%');

  const criticalThresholdOptions = useMemo(
    () => getCriticalThresholdOptions(warningThreshold),
    [warningThreshold]
  );

  // Fixed escalation levels (cannot add/remove) — enable/disable is per category
  const [escalationLevels, setEscalationLevels] = useState<EscalationLevel[]>(() =>
    defaultEscalationLevels(employeesForCompany(companyId), '80%', '90%')
  );

  useEffect(() => {
    setEscalationLevels(prev =>
      syncEscalationTriggers(
        defaultEscalationLevels(employeesForCompany(companyId), warningThreshold, criticalThreshold).map(
          (defaults, index) => ({
            ...defaults,
            notifyKind: prev[index]?.notifyKind ?? defaults.notifyKind,
            notifyPersonId: prev[index]?.notifyPersonId ?? defaults.notifyPersonId,
            notifyPersonName: prev[index]?.notifyPersonName ?? defaults.notifyPersonName,
            channel: prev[index]?.channel ?? defaults.channel
          })
        ),
        warningThreshold,
        criticalThreshold
      )
    );
  }, [companyId]);

  const applyThresholdSync = (atRisk: string, critical: string) => {
    setEscalationLevels(prev => syncEscalationTriggers(prev, atRisk, critical));
  };

  const handleAtRiskThresholdChange = (next: string) => {
    const nextCritical = pickValidCriticalThreshold(next, criticalThreshold);
    setWarningThreshold(next);
    setCriticalThreshold(nextCritical);
    applyThresholdSync(next, nextCritical);
  };

  const updateSlaRule = (id: string, patch: Partial<SlaPolicyRule>) => {
    setSlaRules(prev => prev.map(rule => (rule.id === id ? { ...rule, ...patch } : rule)));
  };

  const handleCriticalThresholdChange = (next: string) => {
    if (parseThresholdPercent(next) <= parseThresholdPercent(warningThreshold)) {
      onShowToast(
        'warning',
        'Invalid critical threshold',
        'Critical must be higher than at-risk and below 100%.'
      );
      return;
    }
    setCriticalThreshold(next);
    applyThresholdSync(warningThreshold, next);
  };

  // Admin config change history (who changed SLA targets, when)
  const [configChangeLog, setConfigChangeLog] = useState<SlaConfigChange[]>([
    {
      id: 'cfg-1',
      summary: 'Updated High priority SLA targets',
      detail: 'First reply: 4 Hours · Resolve: 1 Day',
      changedBy: 'Priya Shah (Helpdesk Admin)',
      changedAt: '22 Aug 2026, 2:14 PM'
    },
    {
      id: 'cfg-2',
      summary: 'Updated Level 3 escalation notify target',
      detail: 'Trigger: SLA Breached · Notify: Employee',
      changedBy: 'Rahul Sharma (Team Lead)',
      changedAt: '18 Aug 2026, 11:05 AM'
    },
    {
      id: 'cfg-3',
      summary: 'Published default SLA policy pack',
      detail: 'Urgent / High / Medium / Low priorities activated for company calendar (IST)',
      changedBy: 'Elena Rostova (HR Admin)',
      changedAt: '12 Aug 2026, 9:40 AM'
    }
  ]);

  const appendConfigChange = (summary: string, detail: string) => {
    setConfigChangeLog(prev => [
      {
        id: `cfg-${Date.now()}`,
        summary,
        detail,
        changedBy: SLA_ADMIN_ACTOR,
        changedAt: formatConfigTimestamp()
      },
      ...prev
    ]);
  };

  const [editingRule, setEditingRule] = useState<SlaPolicyRule | null>(null);
  const [editFirstReplyValue, setEditFirstReplyValue] = useState(1);
  const [editFirstReplyUnit, setEditFirstReplyUnit] = useState<SlaTimeUnit>('Hours');
  const [editResolveValue, setEditResolveValue] = useState(1);
  const [editResolveUnit, setEditResolveUnit] = useState<SlaTimeUnit>('Days');

  const [editingEscalation, setEditingEscalation] = useState<EscalationLevel | null>(null);
  const [editEscNotifyKind, setEditEscNotifyKind] = useState<EscalationNotifyKind>('assignee');
  const [editEscPersonId, setEditEscPersonId] = useState('');
  const [editEscChannel, setEditEscChannel] = useState<'In-app' | 'Email' | 'In-app + Email'>('In-app + Email');

  const handleOpenEditRule = (rule: SlaPolicyRule) => {
    setEditingRule(rule);
    setEditFirstReplyValue(rule.firstReplyValue);
    setEditFirstReplyUnit(rule.firstReplyUnit);
    setEditResolveValue(rule.resolveValue);
    setEditResolveUnit(rule.resolveUnit);
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    updateSlaRule(editingRule.id, {
      firstReplyValue: editFirstReplyValue,
      firstReplyUnit: editFirstReplyUnit,
      resolveValue: editResolveValue,
      resolveUnit: editResolveUnit
    });

    appendConfigChange(
      `Updated ${editingRule.priority} priority SLA targets`,
      `First reply: ${formatSlaTarget(editFirstReplyValue, editFirstReplyUnit)} · Resolve: ${formatSlaTarget(editResolveValue, editResolveUnit)}`
    );

    setEditingRule(null);
    onShowToast('success', 'SLA Target Updated', `SLA targets updated for ${editingRule.priority} priority.`);
  };

  const handleOpenEditEscalation = (esc: EscalationLevel) => {
    setEditingEscalation(esc);
    setEditEscNotifyKind(esc.notifyKind);
    setEditEscPersonId(esc.notifyPersonId || companyPeople[0]?.id || '');
    setEditEscChannel(esc.channel);
  };

  const handleSaveEscalation = () => {
    if (!editingEscalation) return;

    let notifyPersonId = '';
    let notifyPersonName = '';
    if (editEscNotifyKind === 'employee') {
      const person = companyPeople.find(p => p.id === editEscPersonId) || companyPeople[0];
      if (!person) {
        onShowToast('warning', 'Pick a person', 'Choose an employee from this company.');
        return;
      }
      notifyPersonId = person.id;
      notifyPersonName = person.name;
    }

    setEscalationLevels(prev =>
      prev.map(e =>
        e.id === editingEscalation.id
          ? {
              ...e,
              notifyKind: editEscNotifyKind,
              notifyPersonId,
              notifyPersonName,
              channel: editEscChannel
            }
          : e
      )
    );

    const label =
      editEscNotifyKind === 'assignee'
        ? 'Assignee'
        : editEscNotifyKind === 'team-lead'
          ? 'Team Lead'
          : notifyPersonName;

    appendConfigChange(
      `Updated Level ${editingEscalation.level} notify target`,
      `Trigger: ${editingEscalation.trigger} · Notify: ${label} · Channel: ${editEscChannel}`
    );
    setEditingEscalation(null);
    onShowToast('success', 'Escalation Updated', `Level ${editingEscalation.level} now notifies ${label}.`);
  };

  return (
    <div className="sla-container">
      {/* PAGE HEADER */}
      <PageHeader
        breadcrumbs={[
          { label: 'Sixtifi WFM' },
          { label: 'Helpdesk' },
          { label: 'SLA & Escalation' }
        ]}
        title="SLA & Escalation"
        subtitle={`Reply and resolve targets for ${company.name}. Notify people from this company when SLAs are at risk.`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 200 }}>
              <SelectInput
                value={companyId}
                onChange={e => onCompanyChange(e.target.value)}
                aria-label="Company"
              >
                {HELPDESK_COMPANIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </div>
            <Button
              variant="primary"
              leftIcon={<Save size={16} />}
              onClick={() => {
                appendConfigChange(
                  'Published SLA configuration changes',
                  `Company: ${company.name} · Hours mode: ${getSlaHoursModeLabel(slaHoursMode)} · At risk: ${warningThreshold} · Critical: ${criticalThreshold} · Targets: ${slaRules
                    .map(
                      r =>
                        `${r.priority} ${formatSlaTarget(r.firstReplyValue, r.firstReplyUnit)} / ${formatSlaTarget(r.resolveValue, r.resolveUnit)}`
                    )
                    .join('; ')}`
                );
                onShowToast('success', 'Changes Saved', `SLA configuration saved for ${company.name}.`);
              }}
            >
              Save Changes
            </Button>
          </div>
        }
      />

      {/* SECTION 1 — SLA OVERVIEW (4 KPI Cards) */}
      <div className="sla-kpi-grid">
        <div className="sla-kpi-card">
          <span className="sla-kpi-title">Active SLA Policies</span>
          <span className="sla-kpi-val">4</span>
        </div>

        <div className="sla-kpi-card">
          <span className="sla-kpi-title">Tickets Under SLA</span>
          <span className="sla-kpi-val" style={{ color: '#1E40AF' }}>96</span>
        </div>

        <div className="sla-kpi-card">
          <span className="sla-kpi-title">SLA At Risk</span>
          <span className="sla-kpi-val" style={{ color: '#D97706' }}>8</span>
        </div>

        <div className="sla-kpi-card">
          <span className="sla-kpi-title">SLA Breached</span>
          <span className="sla-kpi-val" style={{ color: '#DC2626' }}>3</span>
        </div>
      </div>

      {/* SECTION 7 — SLA HEALTH DISTRIBUTION BAR */}
      <div className="sla-config-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="sla-card-title">SLA Status Distribution</span>
            <div className="sla-card-subtitle">Real-time status of 107 active employee requests</div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ color: '#10B981' }}>On Track: 96 (89%)</span>
            <span style={{ color: '#D97706' }}>At Risk: 8 (7%)</span>
            <span style={{ color: '#DC2626' }}>Breached: 3 (4%)</span>
          </div>
        </div>

        <div className="health-distribution-bar">
          <div className="health-seg-ontrack" style={{ width: '89%' }} />
          <div className="health-seg-atrisk" style={{ width: '7%' }} />
          <div className="health-seg-breached" style={{ width: '4%' }} />
        </div>
      </div>

      {/* SECTION 2 — SLA HOURS CONSIDERATION (from General Settings) */}
      <div className="sla-config-card">
        <div className="sla-card-header">
          <div>
            <div className="sla-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={18} style={{ color: 'var(--color-primary-600)' }} />
              SLA hours consideration
            </div>
            <div className="sla-card-subtitle">
              Countdown mode is set in Helpdesk Settings → General for {company.name}.
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '14px 16px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Info size={16} style={{ color: 'var(--color-primary-600)', marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Active mode: {getSlaHoursModeLabel(slaHoursMode)}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {getSlaHoursModeDescription(slaHoursMode)}
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '26px' }}>
            When requester and assignee follow different department shifts, this mode decides whose schedule pauses the
            clock. Change it under Settings → General for this company.
          </p>
        </div>
      </div>

      {/* SECTION — SLA WARNING DEFAULT */}
      <div className="sla-config-card">
        <div className="sla-card-header">
          <div>
            <div className="sla-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={18} style={{ color: 'var(--color-primary-600)' }} />
              SLA Defaults
            </div>
            <div className="sla-card-subtitle">Configure when tickets enter at-risk and critical states.</div>
          </div>
        </div>

        <div className="sla-defaults-form-grid">
          <FormField
            label="At risk threshold"
            hint="Level 1 escalation fires when this much SLA time is used"
          >
            <SelectInput
              value={warningThreshold}
              onChange={e => handleAtRiskThresholdChange(e.target.value)}
            >
              {THRESHOLD_OPTIONS.filter(
                opt => parseThresholdPercent(opt) < parseThresholdPercent(criticalThreshold)
              ).map(opt => (
                <option key={opt} value={opt}>
                  {opt} of SLA time used
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField
            label="Critical threshold"
            hint="Level 2 escalation fires here — must be above at-risk and below 100%"
          >
            <SelectInput
              value={criticalThreshold}
              onChange={e => handleCriticalThresholdChange(e.target.value)}
            >
              {criticalThresholdOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt} of SLA time used
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </div>

      {/* SECTION 3 — DEFAULT SLA POLICY BY PRIORITY */}
      <div className="sla-config-card">
        <div className="sla-card-header">
          <div>
            <div className="sla-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={18} style={{ color: 'var(--color-primary-600)' }} />
              Reply & resolve times by priority
            </div>
            <div className="sla-card-subtitle">
              Default first-reply and resolution targets for Urgent, High, Medium, and Low. At-risk and critical
              thresholds are managed globally above.
            </div>
          </div>
        </div>

        <div className="sla-priority-list">
          {slaRules.map(rule => (
            <div key={rule.id} className="sla-priority-list-item">
              <div className="sla-priority-col-priority">
                <PriorityBadge priority={rule.priority} />
              </div>

              <div className="sla-priority-col-metric">
                <span className="sla-priority-list-meta">First reply</span>
                <span className="sla-priority-list-value">
                  {formatSlaTarget(rule.firstReplyValue, rule.firstReplyUnit)}
                </span>
              </div>

              <div className="sla-priority-col-metric">
                <span className="sla-priority-list-meta">Resolve</span>
                <span className="sla-priority-list-value">
                  {formatSlaTarget(rule.resolveValue, rule.resolveUnit)}
                </span>
              </div>

              <div className="sla-priority-col-action">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit size={13} />}
                  onClick={() => handleOpenEditRule(rule)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4 — SLA WARNING */}
      <div className="sla-config-card">
        <div className="sla-card-header">
          <div>
            <div className="sla-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={18} style={{ color: '#D97706' }} />
              SLA Threshold Timeline
            </div>
            <div className="sla-card-subtitle">Visual guide for at-risk, critical, and breach escalation levels.</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>At risk:</span>
              <TextInput value={warningThreshold} style={{ width: '72px', textAlign: 'center' }} readOnly />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Critical:</span>
              <TextInput value={criticalThreshold} style={{ width: '72px', textAlign: 'center' }} readOnly />
            </div>
          </div>
        </div>

        <div className="sla-warning-diagram">
          <div className="diagram-markers-row">
            <span>0% — SLA Started</span>
            <span style={{ color: '#D97706', fontWeight: 700 }}>↑ {warningThreshold} — At Risk (Level 1)</span>
            <span style={{ color: '#EA580C', fontWeight: 700 }}>↑ {criticalThreshold} — Critical (Level 2)</span>
            <span style={{ color: '#DC2626', fontWeight: 700 }}>100% — Breached (Level 3)</span>
          </div>

          <div className="diagram-track-bar">
            <div className="diagram-track-fill" />
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            At <strong>{warningThreshold}</strong> of the target resolution time, the ticket status changes to{' '}
            <span style={{ color: '#D97706', fontWeight: 700 }}>SLA At Risk</span> and triggers Level 1 notifications.
            Level 2 fires at <strong>{criticalThreshold}</strong> (critical warning). Level 3 fires at breach (100%).
          </div>
        </div>
      </div>

      {/* SECTION 5 — ESCALATION (3 fixed levels) */}
      <div className="sla-config-card">
        <div className="sla-card-header">
          <div>
            <div className="sla-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={18} style={{ color: 'var(--color-primary-600)' }} />
              Escalation Notifications
            </div>
            <div className="sla-card-subtitle">
              Three fixed levels for {company.shortName}. Who to notify is set here; turn escalation on or off per
              category.
            </div>
          </div>
        </div>

        <div className="escalation-levels-list">
          {escalationLevels.map(esc => (
            <div key={esc.id} className="escalation-level-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="escalation-level-badge">Level {esc.level}</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{esc.trigger}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Notify: </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{notifyDisplayLabel(esc)}</span>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Channel: </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{esc.channel}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit size={13} />}
                onClick={() => handleOpenEditEscalation(esc)}
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION — ADMIN CONFIG CHANGE HISTORY */}
      <div className="sla-config-card">
        <div className="sla-card-header">
          <div>
            <div className="sla-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={18} style={{ color: 'var(--color-primary-600)' }} />
              Configuration Change History
            </div>
            <div className="sla-card-subtitle">Who changed SLA targets and when — retained for audit.</div>
          </div>
        </div>

        <div className="sla-config-history-list">
          {configChangeLog.map(entry => (
            <div key={entry.id} className="sla-config-history-item">
              <div className="sla-config-history-main">
                <span className="sla-config-history-summary">{entry.summary}</span>
                <span className="sla-config-history-detail">{entry.detail}</span>
              </div>
              <div className="sla-config-history-meta">
                <span className="sla-config-history-actor">
                  <User size={12} />
                  {entry.changedBy}
                </span>
                <span className="sla-config-history-time">{entry.changedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT SINGLE PRIORITY SLA TARGET */}
      <Modal
        isOpen={!!editingRule}
        onClose={() => setEditingRule(null)}
        title={`Edit ${editingRule?.priority ?? ''} priority targets`}
        subtitle="Update first-reply and resolution times for this priority. Warning thresholds stay global."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingRule(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveRule}>Save Target</Button>
          </>
        }
      >
        <div className="sla-priority-dialog">
          {editingRule && (
            <div className="sla-priority-dialog-badge">
              <PriorityBadge priority={editingRule.priority} />
              <span className="sla-priority-dialog-hint">
                Targets apply to all tickets with this priority under the company SLA hours mode.
              </span>
            </div>
          )}

          <div className="sla-priority-dialog-grid">
            <div className="sla-priority-field">
              <span className="sla-priority-field-label">First reply within</span>
              <div className="sla-priority-inputs">
                <TextInput
                  type="number"
                  value={String(editFirstReplyValue)}
                  onChange={e => setEditFirstReplyValue(Math.max(0, Number(e.target.value) || 0))}
                />
                <SelectInput
                  value={editFirstReplyUnit}
                  onChange={e => setEditFirstReplyUnit(e.target.value as SlaTimeUnit)}
                >
                  <option value="Minutes">Minutes</option>
                  <option value="Hours">Hours</option>
                  <option value="Days">Days</option>
                </SelectInput>
              </div>
            </div>

            <div className="sla-priority-field">
              <span className="sla-priority-field-label">Resolve within</span>
              <div className="sla-priority-inputs">
                <TextInput
                  type="number"
                  value={String(editResolveValue)}
                  onChange={e => setEditResolveValue(Math.max(0, Number(e.target.value) || 0))}
                />
                <SelectInput
                  value={editResolveUnit}
                  onChange={e => setEditResolveUnit(e.target.value as SlaTimeUnit)}
                >
                  <option value="Minutes">Minutes</option>
                  <option value="Hours">Hours</option>
                  <option value="Days">Days</option>
                </SelectInput>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* EDIT ESCALATION NOTIFY TARGET */}
      <Modal
        isOpen={!!editingEscalation}
        onClose={() => setEditingEscalation(null)}
        title={`Edit Level ${editingEscalation?.level ?? ''} notify target`}
        subtitle={
          editingEscalation
            ? `Trigger is fixed: ${editingEscalation.trigger}. Choose who to notify.`
            : ''
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingEscalation(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveEscalation}>Save</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="When (fixed)">
            <TextInput value={editingEscalation?.trigger || ''} readOnly />
          </FormField>

          <FormField label="Notify" hint="Assignee, team lead, or a specific person in this company">
            <SelectInput
              value={editEscNotifyKind}
              onChange={e => setEditEscNotifyKind(e.target.value as EscalationNotifyKind)}
            >
              <option value="assignee">Assignee (ticket owner)</option>
              <option value="team-lead">Team Lead</option>
              <option value="employee">Other employee</option>
            </SelectInput>
          </FormField>

          {editEscNotifyKind === 'employee' && (
            <FormField label="Employee" hint={`People in ${company.name}`}>
              <SelectInput value={editEscPersonId} onChange={e => setEditEscPersonId(e.target.value)}>
                {companyPeople.length === 0 ? (
                  <option value="">No people in this company</option>
                ) : (
                  companyPeople.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.department})
                    </option>
                  ))
                )}
              </SelectInput>
            </FormField>
          )}

          <FormField label="Channel">
            <SelectInput value={editEscChannel} onChange={e => setEditEscChannel(e.target.value as any)}>
              <option value="In-app + Email">In-app + Email</option>
              <option value="In-app">In-app Only</option>
              <option value="Email">Email Only</option>
            </SelectInput>
          </FormField>
        </div>
      </Modal>
    </div>
  );
};
