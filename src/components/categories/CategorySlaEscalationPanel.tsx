import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { PriorityBadge } from '../ui/Badge';
import { SelectInput, FormField, TextInput, ToggleSwitch } from '../ui/FormControls';
import { Modal } from '../ui/Modal';
import { Bell, Edit, Sliders } from 'lucide-react';
import { PRIORITY_LEVELS, TicketPriorityLevel } from '../../data/categoryTypes';
import { employeesForCompany } from '../../data/directory';
import {
  CategorySlaSettings,
  EscalationLevel,
  EscalationNotifyKind,
  SlaPolicyRule,
  SlaTimeUnit,
  THRESHOLD_OPTIONS,
  formatSlaTarget,
  getCriticalThresholdOptions,
  parseThresholdPercent,
  pickValidCriticalThreshold,
  syncEscalationTriggers
} from '../../data/categoryConfig';
import '../../views/SlaEscalationView.css';

function notifyDisplayLabel(esc: EscalationLevel): string {
  if (esc.notifyKind === 'assignee') return 'Assignee';
  if (esc.notifyKind === 'team-lead') return 'Team Lead';
  return esc.notifyPersonName || 'Employee';
}

export interface CategorySlaEscalationPanelProps {
  sla: CategorySlaSettings;
  onChange: (sla: CategorySlaSettings) => void;
  companyId: string;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
}

export const CategorySlaEscalationPanel: React.FC<CategorySlaEscalationPanelProps> = ({
  sla,
  onChange,
  companyId,
  onShowToast
}) => {
  const companyPeople = employeesForCompany(companyId);

  const [editingRule, setEditingRule] = useState<SlaPolicyRule | null>(null);
  const [editFirstReplyValue, setEditFirstReplyValue] = useState(1);
  const [editFirstReplyUnit, setEditFirstReplyUnit] = useState<SlaTimeUnit>('Hours');
  const [editResolveValue, setEditResolveValue] = useState(1);
  const [editResolveUnit, setEditResolveUnit] = useState<SlaTimeUnit>('Days');

  const [editingEscalation, setEditingEscalation] = useState<EscalationLevel | null>(null);
  const [editEscNotifyKind, setEditEscNotifyKind] = useState<EscalationNotifyKind>('assignee');
  const [editEscPersonId, setEditEscPersonId] = useState('');
  const [editEscChannel, setEditEscChannel] = useState<'In-app' | 'Email' | 'In-app + Email'>('In-app + Email');

  const patchSla = (patch: Partial<CategorySlaSettings>) => onChange({ ...sla, ...patch });

  const applyThresholdSync = (atRisk: string, critical: string) => {
    patchSla({ escalationLevels: syncEscalationTriggers(sla.escalationLevels, atRisk, critical) });
  };

  const handleAtRiskThresholdChange = (next: string) => {
    const nextCritical = pickValidCriticalThreshold(next, sla.criticalThreshold);
    patchSla({ warningThreshold: next, criticalThreshold: nextCritical });
    applyThresholdSync(next, nextCritical);
  };

  const handleCriticalThresholdChange = (next: string) => {
    if (parseThresholdPercent(next) <= parseThresholdPercent(sla.warningThreshold)) {
      onShowToast('warning', 'Invalid critical threshold', 'Critical must be higher than at-risk and below 100%.');
      return;
    }
    patchSla({ criticalThreshold: next });
    applyThresholdSync(sla.warningThreshold, next);
  };

  const criticalThresholdOptions = getCriticalThresholdOptions(sla.warningThreshold);

  return (
    <div className="cat-sla-escalation-panel">
      <div className="sla-config-card">
        <div className="sla-card-header">
          <div>
            <div className="sla-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sliders size={18} style={{ color: 'var(--color-primary-600)' }} />
              SLA thresholds
            </div>
            <div className="sla-card-subtitle">When tickets enter at-risk and critical states.</div>
          </div>
        </div>
        <div className="sla-defaults-form-grid">
          <FormField label="At risk threshold">
            <SelectInput value={sla.warningThreshold} onChange={e => handleAtRiskThresholdChange(e.target.value)}>
              {THRESHOLD_OPTIONS.filter(
                opt => parseThresholdPercent(opt) < parseThresholdPercent(sla.criticalThreshold)
              ).map(opt => (
                <option key={opt} value={opt}>
                  {opt} of SLA time used
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Critical threshold">
            <SelectInput value={sla.criticalThreshold} onChange={e => handleCriticalThresholdChange(e.target.value)}>
              {criticalThresholdOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt} of SLA time used
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </div>

      <div className="cat-form-section cat-sla-section">
        <ToggleSwitch
          checked={sla.prioritisationEnabled}
          onChange={enabled => patchSla({ prioritisationEnabled: enabled })}
          label="Enable ticket prioritisation"
        />
        {sla.prioritisationEnabled ? (
          <>
            <div className="sla-priority-list" style={{ marginTop: 12 }}>
              {sla.slaRules.map(rule => (
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
                      onClick={() => {
                        setEditingRule(rule);
                        setEditFirstReplyValue(rule.firstReplyValue);
                        setEditFirstReplyUnit(rule.firstReplyUnit);
                        setEditResolveValue(rule.resolveValue);
                        setEditResolveUnit(rule.resolveUnit);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <span className="cat-form-label">Default priority for new requests</span>
              <div className="cat-radio-row" style={{ marginTop: 8 }}>
                {PRIORITY_LEVELS.map(p => (
                  <label key={p} className="cat-radio-option">
                    <input
                      type="radio"
                      name="default-priority-sla"
                      checked={sla.defaultPriority === p}
                      onChange={() => patchSla({ defaultPriority: p as TicketPriorityLevel })}
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="cat-sla-flat" style={{ marginTop: 12 }}>
            <div className="cat-sla-row cat-sla-row-flat">
              <div className="cat-sla-field">
                <span className="cat-sla-field-label">First reply within</span>
                <div className="cat-sla-inputs">
                  <TextInput
                    type="number"
                    value={String(sla.flatSla.firstReplyValue)}
                    onChange={e =>
                      patchSla({
                        flatSla: { ...sla.flatSla, firstReplyValue: Math.max(0, Number(e.target.value) || 0) }
                      })
                    }
                  />
                  <SelectInput
                    value={sla.flatSla.firstReplyUnit}
                    onChange={e =>
                      patchSla({ flatSla: { ...sla.flatSla, firstReplyUnit: e.target.value as SlaTimeUnit } })
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
                    value={String(sla.flatSla.resolveValue)}
                    onChange={e =>
                      patchSla({
                        flatSla: { ...sla.flatSla, resolveValue: Math.max(0, Number(e.target.value) || 0) }
                      })
                    }
                  />
                  <SelectInput
                    value={sla.flatSla.resolveUnit}
                    onChange={e =>
                      patchSla({ flatSla: { ...sla.flatSla, resolveUnit: e.target.value as SlaTimeUnit } })
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

      <div className="sla-config-card">
        <div className="sla-card-header">
          <div>
            <div className="sla-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={18} style={{ color: 'var(--color-primary-600)' }} />
              Escalation
            </div>
          </div>
        </div>
        <ToggleSwitch
          checked={!sla.slaExempt}
          onChange={enabled =>
            patchSla({
              slaExempt: !enabled,
              escalateOnResponseBreach: enabled ? sla.escalateOnResponseBreach : false,
              escalateOnResolutionBreach: enabled ? sla.escalateOnResolutionBreach : false
            })
          }
          label="Enable SLA escalation"
        />
        {!sla.slaExempt && (
          <>
            <div className="cat-escalation-list" style={{ margin: '12px 0 16px' }}>
              <div className="cat-follower-row">
                <ToggleSwitch
                  checked={sla.escalateOnResponseBreach}
                  onChange={v => patchSla({ escalateOnResponseBreach: v })}
                />
                <span>Escalate if the first reply is late</span>
              </div>
              <div className="cat-follower-row">
                <ToggleSwitch
                  checked={sla.escalateOnResolutionBreach}
                  onChange={v => patchSla({ escalateOnResolutionBreach: v })}
                />
                <span>Escalate if the request is not resolved in time</span>
              </div>
            </div>
            <div className="escalation-levels-list">
              {sla.escalationLevels.map(esc => (
                <div key={esc.id} className="escalation-level-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="escalation-level-badge">Level {esc.level}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{esc.trigger}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
                    <span>
                      Notify: <strong>{notifyDisplayLabel(esc)}</strong>
                    </span>
                    <span>Channel: <strong>{esc.channel}</strong></span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Edit size={13} />}
                    onClick={() => {
                      setEditingEscalation(esc);
                      setEditEscNotifyKind(esc.notifyKind);
                      setEditEscPersonId(esc.notifyPersonId || companyPeople[0]?.id || '');
                      setEditEscChannel(esc.channel);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={!!editingRule}
        onClose={() => setEditingRule(null)}
        title={`Edit ${editingRule?.priority ?? ''} targets`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingRule(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!editingRule) return;
                patchSla({
                  slaRules: sla.slaRules.map(rule =>
                    rule.id === editingRule.id
                      ? {
                          ...rule,
                          firstReplyValue: editFirstReplyValue,
                          firstReplyUnit: editFirstReplyUnit,
                          resolveValue: editResolveValue,
                          resolveUnit: editResolveUnit
                        }
                      : rule
                  )
                });
                setEditingRule(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="sla-priority-dialog-grid">
          <FormField label="First reply within">
            <div className="sla-priority-inputs">
              <TextInput type="number" value={String(editFirstReplyValue)} onChange={e => setEditFirstReplyValue(Math.max(0, Number(e.target.value) || 0))} />
              <SelectInput value={editFirstReplyUnit} onChange={e => setEditFirstReplyUnit(e.target.value as SlaTimeUnit)}>
                <option value="Minutes">Minutes</option>
                <option value="Hours">Hours</option>
                <option value="Days">Days</option>
              </SelectInput>
            </div>
          </FormField>
          <FormField label="Resolve within">
            <div className="sla-priority-inputs">
              <TextInput type="number" value={String(editResolveValue)} onChange={e => setEditResolveValue(Math.max(0, Number(e.target.value) || 0))} />
              <SelectInput value={editResolveUnit} onChange={e => setEditResolveUnit(e.target.value as SlaTimeUnit)}>
                <option value="Minutes">Minutes</option>
                <option value="Hours">Hours</option>
                <option value="Days">Days</option>
              </SelectInput>
            </div>
          </FormField>
        </div>
      </Modal>

      <Modal
        isOpen={!!editingEscalation}
        onClose={() => setEditingEscalation(null)}
        title={`Edit Level ${editingEscalation?.level ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingEscalation(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
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
                patchSla({
                  escalationLevels: sla.escalationLevels.map(e =>
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
                });
                setEditingEscalation(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <FormField label="When (fixed)">
          <TextInput value={editingEscalation?.trigger || ''} readOnly />
        </FormField>
        <FormField label="Notify">
          <SelectInput value={editEscNotifyKind} onChange={e => setEditEscNotifyKind(e.target.value as EscalationNotifyKind)}>
            <option value="assignee">Assignee</option>
            <option value="team-lead">Team Lead</option>
            <option value="employee">Other employee</option>
          </SelectInput>
        </FormField>
        {editEscNotifyKind === 'employee' && (
          <FormField label="Employee">
            <SelectInput value={editEscPersonId} onChange={e => setEditEscPersonId(e.target.value)}>
              {companyPeople.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectInput>
          </FormField>
        )}
        <FormField label="Channel">
          <SelectInput value={editEscChannel} onChange={e => setEditEscChannel(e.target.value as typeof editEscChannel)}>
            <option value="In-app + Email">In-app + Email</option>
            <option value="In-app">In-app Only</option>
            <option value="Email">Email Only</option>
          </SelectInput>
        </FormField>
      </Modal>
    </div>
  );
};
