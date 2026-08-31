import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { PriorityBadge } from '../components/ui/Badge';
import { SelectInput, FormField, TextInput, TextareaInput } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import {
  Save,
  Clock,
  Bell,
  Sliders,
  Edit,
  History,
  User,
  Info,
  GitBranch,
  Eye
} from 'lucide-react';
import {
  SLA_HOURS_UPDATED_EVENT,
  getSlaHoursMode,
  getSlaHoursModeDescription,
  getSlaHoursModeLabel,
  SlaHoursMode
} from '../data/slaHoursSettings';
import { getCompanyById, HELPDESK_COMPANIES } from '../data/companies';
import { employeesForCompany } from '../data/directory';
import {
  EscalationLevel,
  EscalationNotifyKind,
  SlaConfigChange,
  SlaEscalationSnapshot,
  SlaEscalationVersion,
  SlaPolicyRule,
  SlaTimeUnit,
  THRESHOLD_OPTIONS,
  formatSlaTarget,
  getActiveSlaVersion,
  getSlaEscalationState,
  parseThresholdPercent,
  pickValidCriticalThreshold,
  publishSlaEscalationVersion,
  saveSlaEscalationDraft,
  snapshotsEqual,
  syncEscalationTriggers,
  getCriticalThresholdOptions
} from '../data/slaEscalationConfig';
import './SlaEscalationView.css';

const SLA_ADMIN_ACTOR = 'Priya Shah (Helpdesk Admin)';

export type { SlaTimeUnit, SlaPolicyRule, EscalationNotifyKind, EscalationLevel };

export interface SlaException {
  id: string;
  priority: import('../components/ui/Badge').TicketPriority;
  category: string;
  customResolutionTarget: string;
  status: 'Active' | 'Inactive';
}

function notifyDisplayLabel(esc: EscalationLevel): string {
  if (esc.notifyKind === 'assignee') return 'Assignee';
  if (esc.notifyKind === 'team-lead') return 'Team Lead';
  return esc.notifyPersonName || 'Employee';
}

function applySnapshotToState(
  snapshot: SlaEscalationSnapshot,
  setters: {
    setSlaRules: React.Dispatch<React.SetStateAction<SlaPolicyRule[]>>;
    setWarningThreshold: React.Dispatch<React.SetStateAction<string>>;
    setCriticalThreshold: React.Dispatch<React.SetStateAction<string>>;
    setEscalationLevels: React.Dispatch<React.SetStateAction<EscalationLevel[]>>;
  }
) {
  setters.setSlaRules(snapshot.slaRules);
  setters.setWarningThreshold(snapshot.warningThreshold);
  setters.setCriticalThreshold(snapshot.criticalThreshold);
  setters.setEscalationLevels(snapshot.escalationLevels);
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
  const [slaRules, setSlaRules] = useState<SlaPolicyRule[]>([]);
  const [warningThreshold, setWarningThreshold] = useState('80%');
  const [criticalThreshold, setCriticalThreshold] = useState('90%');
  const [escalationLevels, setEscalationLevels] = useState<EscalationLevel[]>([]);
  const [configChangeLog, setConfigChangeLog] = useState<SlaConfigChange[]>([]);
  const [versions, setVersions] = useState<SlaEscalationVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<SlaEscalationVersion | undefined>();
  const [viewingVersion, setViewingVersion] = useState<SlaEscalationVersion | null>(null);
  const [publishNote, setPublishNote] = useState('');
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const hydratedRef = useRef(false);
  const skipPersistRef = useRef(false);

  const loadCompanyState = useCallback((targetCompanyId: string) => {
    const state = getSlaEscalationState(targetCompanyId);
    skipPersistRef.current = true;
    applySnapshotToState(state.draft, {
      setSlaRules,
      setWarningThreshold,
      setCriticalThreshold,
      setEscalationLevels
    });
    setConfigChangeLog(state.configChangeLog);
    setVersions(state.versions);
    setActiveVersion(getActiveSlaVersion(targetCompanyId));
    hydratedRef.current = true;
    window.setTimeout(() => {
      skipPersistRef.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    loadCompanyState(companyId);
  }, [companyId, loadCompanyState]);

  useEffect(() => {
    const refresh = () => setSlaHoursMode(getSlaHoursMode(companyId));
    refresh();
    window.addEventListener(SLA_HOURS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(SLA_HOURS_UPDATED_EVENT, refresh);
  }, [companyId]);

  const currentSnapshot = useMemo<SlaEscalationSnapshot>(
    () => ({
      warningThreshold,
      criticalThreshold,
      slaRules,
      escalationLevels
    }),
    [warningThreshold, criticalThreshold, slaRules, escalationLevels]
  );

  const hasUnpublishedChanges = useMemo(() => {
    if (!activeVersion) return false;
    return !snapshotsEqual(currentSnapshot, activeVersion.snapshot);
  }, [activeVersion, currentSnapshot]);

  const supersededWithOpenTickets = useMemo(
    () => versions.filter(v => v.status === 'superseded' && v.openTicketsOnVersion > 0),
    [versions]
  );

  useEffect(() => {
    if (!hydratedRef.current || skipPersistRef.current) return;
    saveSlaEscalationDraft(companyId, currentSnapshot);
  }, [companyId, currentSnapshot]);

  const criticalThresholdOptions = useMemo(
    () => getCriticalThresholdOptions(warningThreshold),
    [warningThreshold]
  );

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

  const handlePublishVersion = () => {
    const version = publishSlaEscalationVersion(companyId, SLA_ADMIN_ACTOR, publishNote);
    setPublishNote('');
    setPublishModalOpen(false);
    loadCompanyState(companyId);
    onShowToast(
      'success',
      'New version published',
      `${version.label} is now active. Open tickets keep their existing SLA version until closed.`
    );
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

    setEditingRule(null);
    onShowToast('success', 'Draft updated', `SLA targets updated for ${editingRule.priority} priority. Publish to apply to new tickets.`);
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

    setEditingEscalation(null);
    onShowToast('success', 'Draft updated', `Level ${editingEscalation.level} now notifies ${label}. Publish to apply to new tickets.`);
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
              disabled={!hasUnpublishedChanges}
              onClick={() => setPublishModalOpen(true)}
            >
              Publish new version
            </Button>
          </div>
        }
      />

      <div className={`sla-version-banner${hasUnpublishedChanges ? ' has-draft' : ''}`}>
        <div className="sla-version-banner-main">
          <GitBranch size={18} className="sla-version-banner-icon" />
          <div>
            <div className="sla-version-banner-title">
              Active version: {activeVersion?.label ?? '—'}
              {hasUnpublishedChanges && <span className="sla-version-draft-badge">Unpublished draft</span>}
            </div>
            <p className="sla-version-banner-text">
              Open tickets keep the SLA version they were created under until closed. New tickets use the active
              published version after you publish.
            </p>
          </div>
        </div>
        {supersededWithOpenTickets.length > 0 && (
          <div className="sla-version-open-tickets">
            {supersededWithOpenTickets.map(v => (
              <span key={v.id} className="sla-version-open-ticket-pill">
                {v.openTicketsOnVersion} open on {v.label}
              </span>
            ))}
          </div>
        )}
      </div>

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

      {/* SECTION — VERSION HISTORY */}
      <div className="sla-config-card">
        <div className="sla-card-header">
          <div>
            <div className="sla-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GitBranch size={18} style={{ color: 'var(--color-primary-600)' }} />
              Version history
            </div>
            <div className="sla-card-subtitle">
              Published SLA & escalation snapshots. Older versions remain in effect for open tickets.
            </div>
          </div>
        </div>

        <div className="sla-version-history-list">
          {[...versions].reverse().map(version => (
            <div key={version.id} className="sla-version-history-item">
              <div className="sla-version-history-main">
                <div className="sla-version-history-title-row">
                  <span className="sla-version-history-label">{version.label}</span>
                  <span className={`sla-version-status-badge is-${version.status}`}>
                    {version.status === 'active' ? 'Active' : 'Superseded'}
                  </span>
                </div>
                {version.changeNote && (
                  <span className="sla-version-history-note">{version.changeNote}</span>
                )}
                <span className="sla-version-history-detail">
                  At risk {version.snapshot.warningThreshold} · Critical {version.snapshot.criticalThreshold}
                  {version.openTicketsOnVersion > 0 && version.status === 'superseded'
                    ? ` · ${version.openTicketsOnVersion} open tickets still on this version`
                    : ''}
                </span>
              </div>
              <div className="sla-version-history-actions">
                <span className="sla-config-history-time">{version.publishedAt}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Eye size={13} />}
                  onClick={() => setViewingVersion(version)}
                >
                  View
                </Button>
              </div>
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

      <Modal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish new SLA version"
        subtitle="Creates a new active version for new tickets. Open tickets keep their current version."
        footer={
          <>
            <Button variant="secondary" onClick={() => setPublishModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handlePublishVersion}>Publish version</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="Change note (optional)" hint="Shown in version history for audit">
            <TextareaInput
              value={publishNote}
              onChange={e => setPublishNote(e.target.value)}
              placeholder="e.g. Tightened High priority first-reply target"
              rows={3}
            />
          </FormField>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Publishing will supersede <strong>{activeVersion?.label}</strong>.{' '}
            {supersededWithOpenTickets.reduce((sum, v) => sum + v.openTicketsOnVersion, 0) +
              (activeVersion?.openTicketsOnVersion ?? 96)}{' '}
            open tickets will continue using their assigned version.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={!!viewingVersion}
        onClose={() => setViewingVersion(null)}
        title={viewingVersion ? `View ${viewingVersion.label}` : 'View version'}
        subtitle="Read-only snapshot — open tickets on this version use these rules."
        footer={
          <Button variant="secondary" onClick={() => setViewingVersion(null)}>Close</Button>
        }
      >
        {viewingVersion && (
          <div className="sla-version-view-panel">
            <div className="sla-version-view-meta">
              <span>Published {viewingVersion.publishedAt}</span>
              <span>by {viewingVersion.publishedBy}</span>
            </div>
            <div className="sla-version-view-thresholds">
              <span>At risk: {viewingVersion.snapshot.warningThreshold}</span>
              <span>Critical: {viewingVersion.snapshot.criticalThreshold}</span>
            </div>
            <div className="sla-priority-list">
              {viewingVersion.snapshot.slaRules.map(rule => (
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
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
