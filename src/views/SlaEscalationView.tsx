import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { PriorityBadge, TicketPriority } from '../components/ui/Badge';
import { SelectInput, FormField, TextInput } from '../components/ui/FormControls';
import { Table, Column } from '../components/ui/Table';
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

export interface SlaPolicyRule {
  id: string;
  priority: TicketPriority;
  responseTarget: string;
  resolutionTarget: string;
  warningThreshold: string;
  status: 'Active' | 'Inactive';
}

export type EscalationNotifyKind = 'assignee' | 'team-lead' | 'employee';

export interface EscalationLevel {
  id: string;
  level: 1 | 2 | 3;
  trigger: '80% SLA At Risk' | '100% SLA Reached' | 'SLA Breached';
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

const FIXED_TRIGGERS: Record<1 | 2 | 3, EscalationLevel['trigger']> = {
  1: '80% SLA At Risk',
  2: '100% SLA Reached',
  3: 'SLA Breached'
};

function notifyDisplayLabel(esc: EscalationLevel): string {
  if (esc.notifyKind === 'assignee') return 'Assignee';
  if (esc.notifyKind === 'team-lead') return 'Team Lead';
  return esc.notifyPersonName || 'Employee';
}

function defaultEscalationLevels(people: DirectoryPerson[]): EscalationLevel[] {
  const first = people[0];
  return [
    {
      id: 'esc-1',
      level: 1,
      trigger: FIXED_TRIGGERS[1],
      notifyKind: 'assignee',
      notifyPersonId: '',
      notifyPersonName: '',
      channel: 'In-app + Email'
    },
    {
      id: 'esc-2',
      level: 2,
      trigger: FIXED_TRIGGERS[2],
      notifyKind: 'team-lead',
      notifyPersonId: '',
      notifyPersonName: '',
      channel: 'In-app + Email'
    },
    {
      id: 'esc-3',
      level: 3,
      trigger: FIXED_TRIGGERS[3],
      notifyKind: first ? 'employee' : 'assignee',
      notifyPersonId: first?.id || '',
      notifyPersonName: first?.name || '',
      channel: 'In-app + Email'
    }
  ];
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

  // Default SLA Policies
  const [slaRules, setSlaRules] = useState<SlaPolicyRule[]>([
    { id: 'sla-urgent', priority: 'Urgent', responseTarget: '1 Working Hour', resolutionTarget: '4 Working Hours', warningThreshold: '80%', status: 'Active' },
    { id: 'sla-high', priority: 'High', responseTarget: '4 Working Hours', resolutionTarget: '1 Working Day', warningThreshold: '80%', status: 'Active' },
    { id: 'sla-medium', priority: 'Medium', responseTarget: '8 Working Hours', resolutionTarget: '2 Working Days', warningThreshold: '80%', status: 'Active' },
    { id: 'sla-low', priority: 'Low', responseTarget: '1 Working Day', resolutionTarget: '3 Working Days', warningThreshold: '80%', status: 'Active' }
  ]);

  // Fixed escalation levels (cannot add/remove) — enable/disable is per category
  const [escalationLevels, setEscalationLevels] = useState<EscalationLevel[]>(() =>
    defaultEscalationLevels(employeesForCompany(companyId))
  );

  useEffect(() => {
    setEscalationLevels(defaultEscalationLevels(employeesForCompany(companyId)));
  }, [companyId]);

  // Default SLA warning threshold
  const [warningThreshold, setWarningThreshold] = useState('80%');

  // Admin config change history (who changed SLA targets, when)
  const [configChangeLog, setConfigChangeLog] = useState<SlaConfigChange[]>([
    {
      id: 'cfg-1',
      summary: 'Updated High priority SLA targets',
      detail: 'Response: 4 Working Hours · Resolution: 1 Working Day · Warning: 80%',
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

  // Modal States
  const [editingRule, setEditingRule] = useState<SlaPolicyRule | null>(null);
  const [editResponseTarget, setEditResponseTarget] = useState('');
  const [editResolutionTarget, setEditResolutionTarget] = useState('');
  const [editWarningThreshold, setEditWarningThreshold] = useState('80%');

  const [editingEscalation, setEditingEscalation] = useState<EscalationLevel | null>(null);
  const [editEscNotifyKind, setEditEscNotifyKind] = useState<EscalationNotifyKind>('assignee');
  const [editEscPersonId, setEditEscPersonId] = useState('');
  const [editEscChannel, setEditEscChannel] = useState<'In-app' | 'Email' | 'In-app + Email'>('In-app + Email');

  // Open Edit SLA Rule Modal
  const handleOpenEditModal = (rule: SlaPolicyRule) => {
    setEditingRule(rule);
    setEditResponseTarget(rule.responseTarget);
    setEditResolutionTarget(rule.resolutionTarget);
    setEditWarningThreshold(rule.warningThreshold);
  };

  // Save SLA Rule Changes
  const handleSaveRule = () => {
    if (!editingRule) return;

    setSlaRules(prev =>
      prev.map(r =>
        r.id === editingRule.id
          ? {
              ...r,
              responseTarget: editResponseTarget,
              resolutionTarget: editResolutionTarget,
              warningThreshold: editWarningThreshold
            }
          : r
      )
    );

    appendConfigChange(
      `Updated ${editingRule.priority} priority SLA targets`,
      `Response: ${editResponseTarget} · Resolution: ${editResolutionTarget} · Warning: ${editWarningThreshold}`
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

  // Columns for Default SLA Policy Table
  const slaColumns: Column<SlaPolicyRule>[] = [
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: item => <PriorityBadge priority={item.priority} />
    },
    {
      key: 'responseTarget',
      header: 'Response Target',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.responseTarget}</span>
    },
    {
      key: 'resolutionTarget',
      header: 'Resolution Target',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.resolutionTarget}</span>
    },
    {
      key: 'warningThreshold',
      header: 'Warning At',
      sortable: true,
      render: item => (
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          {item.warningThreshold}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: () => (
        <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}>
          <span className="badge-dot" style={{ backgroundColor: '#10B981' }} />
          <span>Active</span>
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'right',
      render: item => (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Edit size={13} />}
          onClick={() => handleOpenEditModal(item)}
        >
          Edit
        </Button>
      )
    }
  ];

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
                  `Company: ${company.name} · Hours mode: ${getSlaHoursModeLabel(slaHoursMode)} · Warning: ${warningThreshold} · Active policies: ${slaRules.length}`
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
            <div className="sla-card-subtitle">Warn teams before a request runs out of time.</div>
          </div>
        </div>

        <div className="sla-defaults-form-grid">
          <FormField label="Warn at" hint="e.g. 80% means warn when 80% of the time limit is used">
            <TextInput
              value={warningThreshold}
              onChange={e => setWarningThreshold(e.target.value)}
            />
          </FormField>
        </div>
      </div>

      {/* SECTION 3 — DEFAULT SLA POLICY TABLE */}
      <div className="sla-config-card">
        <div className="sla-card-header">
          <div>
            <div className="sla-card-title">Reply & resolve times by priority</div>
            <div className="sla-card-subtitle">Default targets for Urgent, High, Medium, and Low.</div>
          </div>
        </div>

        <Table
          columns={slaColumns}
          data={slaRules}
          keyExtractor={r => r.id}
        />
      </div>

      {/* SECTION 4 — SLA WARNING */}
      <div className="sla-config-card">
        <div className="sla-card-header">
          <div>
            <div className="sla-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={18} style={{ color: '#D97706' }} />
              SLA Warning Threshold
            </div>
            <div className="sla-card-subtitle">Notify support teams before a ticket reaches its SLA limit.</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Warning Threshold:</span>
            <TextInput value={warningThreshold} style={{ width: '80px', textAlign: 'center' }} readOnly />
          </div>
        </div>

        <div className="sla-warning-diagram">
          <div className="diagram-markers-row">
            <span>0% — SLA Started</span>
            <span style={{ color: '#D97706', fontWeight: 700 }}>↑ {warningThreshold} — At Risk</span>
            <span style={{ color: '#DC2626', fontWeight: 700 }}>100% — SLA Breached</span>
          </div>

          <div className="diagram-track-bar">
            <div className="diagram-track-fill" />
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            At <strong>{warningThreshold}</strong> of the target resolution time, the ticket status indicator changes to <span style={{ color: '#D97706', fontWeight: 700 }}>SLA At Risk</span> and triggers Level 1 notifications.
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

      {/* EDIT SLA RULE MODAL */}
      <Modal
        isOpen={!!editingRule}
        onClose={() => setEditingRule(null)}
        title={`Edit SLA Target — ${editingRule?.priority} Priority`}
        subtitle="Configure response and resolution targets for this priority tier."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingRule(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveRule}>Save Target</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="Priority Tier">
            <TextInput value={editingRule?.priority || ''} readOnly />
          </FormField>

          <FormField label="Response Target" required hint="Time until first meaningful agent response">
            <TextInput
              value={editResponseTarget}
              onChange={e => setEditResponseTarget(e.target.value)}
              placeholder="e.g. 1 Working Hour, 4 Hours..."
            />
          </FormField>

          <FormField label="Resolution Target" required hint="Total working time target to resolve request">
            <TextInput
              value={editResolutionTarget}
              onChange={e => setEditResolutionTarget(e.target.value)}
              placeholder="e.g. 4 Working Hours, 1 Working Day..."
            />
          </FormField>

          <FormField label="Warning Threshold">
            <TextInput
              value={editWarningThreshold}
              onChange={e => setEditWarningThreshold(e.target.value)}
            />
          </FormField>
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
