import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { TextInput, SelectInput, FormField, ToggleSwitch, TextareaInput } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import {
  Save,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  MessageSquareQuote,
  Tag,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import {
  CannedResponse,
  CannedResponseCategory,
  CannedResponseScope,
  getCannedResponses,
  saveCannedResponses
} from '../data/cannedResponses';
import {
  ClosingReason,
  ClosingReasonContext,
  getClosingReasons,
  saveClosingReasons
} from '../data/closingReasons';
import {
  SlaHoursMode,
  SLA_HOURS_MODE_OPTIONS,
  getSlaHoursModeDescription
} from '../data/slaHoursSettings';
import { getGeneralSettings, saveGeneralSettings } from '../data/generalSettings';
import { getCompanyById, HELPDESK_COMPANIES } from '../data/companies';
import './SettingsView.css';

export interface SettingsViewProps {
  companyId: string;
  onCompanyChange: (companyId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
}

type SettingsTab = 'general' | 'permissions' | 'canned-responses' | 'closing-reasons';

export const SettingsView: React.FC<SettingsViewProps> = ({
  companyId,
  onCompanyChange,
  onShowToast
}) => {
  const company = getCompanyById(companyId);

  // Settings Tab State
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Form State (company-scoped)
  const [ticketPrefix, setTicketPrefix] = useState('TKT-');
  const [autoCloseDays, setAutoCloseDays] = useState('7');
  const [allowReopenDays, setAllowReopenDays] = useState('14');
  const [slaHoursMode, setSlaHoursMode] = useState<SlaHoursMode>('shift-hours');

  // Auto-assignment (General)
  const [enableAutoAssignment, setEnableAutoAssignment] = useState(true);
  const [assignmentAlgorithm, setAssignmentAlgorithm] = useState('Round Robin (Load Balanced)');

  // Dirty state tracker & Modal
  const [isDirty, setIsDirty] = useState(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [pendingTabSwitch, setPendingTabSwitch] = useState<SettingsTab | null>(null);
  const [pendingCompanyId, setPendingCompanyId] = useState<string | null>(null);

  const loadCompanySettings = (id: string) => {
    const s = getGeneralSettings(id);
    setTicketPrefix(s.ticketPrefix);
    setAutoCloseDays(s.autoCloseDays);
    setAllowReopenDays(s.allowReopenDays);
    setSlaHoursMode(s.slaHoursMode);
    setEnableAutoAssignment(s.enableAutoAssignment);
    setAssignmentAlgorithm(s.assignmentAlgorithm);
    setIsDirty(false);
  };

  useEffect(() => {
    loadCompanySettings(companyId);
  }, [companyId]);

  // Canned responses management
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>(() => getCannedResponses());
  const [editingCanned, setEditingCanned] = useState<CannedResponse | null>(null);
  const [isCannedModalOpen, setIsCannedModalOpen] = useState(false);
  const [cannedFormTitle, setCannedFormTitle] = useState('');
  const [cannedFormBody, setCannedFormBody] = useState('');
  const [cannedFormCategory, setCannedFormCategory] = useState<CannedResponseCategory>('General');
  const [cannedFormScope, setCannedFormScope] = useState<CannedResponseScope>('public');
  const [cannedFormStatus, setCannedFormStatus] = useState<'Active' | 'Inactive'>('Active');

  // Closing reasons management
  const [closingReasons, setClosingReasons] = useState<ClosingReason[]>(() => getClosingReasons());
  const [editingClosingReason, setEditingClosingReason] = useState<ClosingReason | null>(null);
  const [isClosingReasonModalOpen, setIsClosingReasonModalOpen] = useState(false);
  const [closingFormLabel, setClosingFormLabel] = useState('');
  const [closingFormDescription, setClosingFormDescription] = useState('');
  const [closingFormContext, setClosingFormContext] = useState<ClosingReasonContext>('resolve');
  const [closingFormRequiresComment, setClosingFormRequiresComment] = useState(true);
  const [closingFormStatus, setClosingFormStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setIsDirty(true);
  };

  const handleTabClick = (tab: SettingsTab) => {
    if (isDirty && tab !== 'canned-responses' && tab !== 'closing-reasons') {
      setPendingTabSwitch(tab);
      setIsUnsavedModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const openCannedModal = (item?: CannedResponse) => {
    if (item) {
      setEditingCanned(item);
      setCannedFormTitle(item.title);
      setCannedFormBody(item.body);
      setCannedFormCategory(item.category);
      setCannedFormScope(item.scope);
      setCannedFormStatus(item.status);
    } else {
      setEditingCanned(null);
      setCannedFormTitle('');
      setCannedFormBody('');
      setCannedFormCategory('General');
      setCannedFormScope('public');
      setCannedFormStatus('Active');
    }
    setIsCannedModalOpen(true);
  };

  const closeCannedModal = () => {
    setIsCannedModalOpen(false);
    setEditingCanned(null);
  };

  const handleSaveCannedResponse = () => {
    if (!cannedFormTitle.trim() || !cannedFormBody.trim()) return;

    const payload: CannedResponse = {
      id: editingCanned?.id || `cr-${Date.now()}`,
      title: cannedFormTitle.trim(),
      body: cannedFormBody.trim(),
      category: cannedFormCategory,
      scope: cannedFormScope,
      status: cannedFormStatus
    };

    const next = editingCanned
      ? cannedResponses.map(item => (item.id === editingCanned.id ? payload : item))
      : [...cannedResponses, payload];

    setCannedResponses(next);
    saveCannedResponses(next);
    closeCannedModal();
    onShowToast(
      'success',
      editingCanned ? 'Template Updated' : 'Template Added',
      `"${payload.title}" is now available to agents.`
    );
  };

  const handleDeleteCannedResponse = (id: string) => {
    const next = cannedResponses.filter(item => item.id !== id);
    setCannedResponses(next);
    saveCannedResponses(next);
    onShowToast('info', 'Template Removed', 'Canned response deleted.');
  };

  const handleToggleCannedStatus = (id: string) => {
    const next = cannedResponses.map(item =>
      item.id === id
        ? { ...item, status: item.status === 'Active' ? 'Inactive' as const : 'Active' as const }
        : item
    );
    setCannedResponses(next);
    saveCannedResponses(next);
  };

  const openClosingReasonModal = (item?: ClosingReason) => {
    if (item) {
      setEditingClosingReason(item);
      setClosingFormLabel(item.label);
      setClosingFormDescription(item.description || '');
      setClosingFormContext(item.context);
      setClosingFormRequiresComment(item.requiresComment);
      setClosingFormStatus(item.status);
    } else {
      setEditingClosingReason(null);
      setClosingFormLabel('');
      setClosingFormDescription('');
      setClosingFormContext('resolve');
      setClosingFormRequiresComment(true);
      setClosingFormStatus('Active');
    }
    setIsClosingReasonModalOpen(true);
  };

  const closeClosingReasonModal = () => {
    setIsClosingReasonModalOpen(false);
    setEditingClosingReason(null);
  };

  const handleSaveClosingReason = () => {
    if (!closingFormLabel.trim()) return;

    const payload: ClosingReason = {
      id: editingClosingReason?.id || `cr-custom-${Date.now()}`,
      label: closingFormLabel.trim(),
      description: closingFormDescription.trim() || undefined,
      context: closingFormContext,
      requiresComment: closingFormRequiresComment,
      status: closingFormStatus
    };

    const next = editingClosingReason
      ? closingReasons.map(item => (item.id === editingClosingReason.id ? payload : item))
      : [...closingReasons, payload];

    setClosingReasons(next);
    saveClosingReasons(next);
    closeClosingReasonModal();
    onShowToast(
      'success',
      editingClosingReason ? 'Closing Reason Updated' : 'Closing Reason Added',
      `"${payload.label}" is now available when closing tickets.`
    );
  };

  const handleDeleteClosingReason = (id: string) => {
    const next = closingReasons.filter(item => item.id !== id);
    setClosingReasons(next);
    saveClosingReasons(next);
    onShowToast('info', 'Reason Removed', 'Closing reason deleted.');
  };

  const handleToggleClosingReasonStatus = (id: string) => {
    const next = closingReasons.map(item =>
      item.id === id
        ? { ...item, status: item.status === 'Active' ? 'Inactive' as const : 'Active' as const }
        : item
    );
    setClosingReasons(next);
    saveClosingReasons(next);
  };

  const handleSaveSettings = () => {
    saveGeneralSettings(companyId, {
      ticketPrefix,
      autoCloseDays,
      allowReopenDays,
      slaHoursMode,
      enableAutoAssignment,
      assignmentAlgorithm
    });
    setIsDirty(false);
    onShowToast(
      'success',
      'Settings Saved',
      `General settings updated for ${company.name}.`
    );
  };

  const requestCompanyChange = (nextId: string) => {
    if (nextId === companyId) return;
    if (isDirty) {
      setPendingCompanyId(nextId);
      setIsUnsavedModalOpen(true);
      return;
    }
    onCompanyChange(nextId);
  };

  return (
    <div className="settings-container">
      {/* PAGE HEADER */}
      <PageHeader
        breadcrumbs={[
          { label: 'Sixtifi WFM' },
          { label: 'Helpdesk' },
          { label: 'Settings' }
        ]}
        title="Helpdesk Settings"
        subtitle={`General rules for ${company.name}. Switch company to edit another workspace.`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 200 }}>
              <SelectInput
                value={companyId}
                onChange={e => requestCompanyChange(e.target.value)}
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
              onClick={handleSaveSettings}
            >
              Save Settings
            </Button>
          </div>
        }
      />

      {/* SETTINGS NAVIGATION TABS */}
      <div className="queue-tabs-bar">
        <button
          className={`queue-tab-btn ${activeTab === 'general' ? 'is-active' : ''}`}
          onClick={() => handleTabClick('general')}
        >
          <Sliders size={14} style={{ marginRight: '6px' }} />
          General Settings
        </button>

        <button
          className={`queue-tab-btn ${activeTab === 'canned-responses' ? 'is-active' : ''}`}
          onClick={() => handleTabClick('canned-responses')}
        >
          <MessageSquareQuote size={14} style={{ marginRight: '6px' }} />
          Canned Responses
        </button>

        <button
          className={`queue-tab-btn ${activeTab === 'closing-reasons' ? 'is-active' : ''}`}
          onClick={() => handleTabClick('closing-reasons')}
        >
          <Tag size={14} style={{ marginRight: '6px' }} />
          Closing Reasons
        </button>

        <button
          className={`queue-tab-btn ${activeTab === 'permissions' ? 'is-active' : ''}`}
          onClick={() => handleTabClick('permissions')}
        >
          <ShieldCheck size={14} style={{ marginRight: '6px' }} />
          Role Permissions
        </button>
      </div>

      {/* TAB 1: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <span className="settings-card-title">General — {company.shortName}</span>
              <div className="settings-card-subtitle">
                These defaults apply only to {company.name}.
              </div>
            </div>
          </div>

          <div className="settings-form-grid">
            <FormField label="Ticket ID prefix" required hint="Shown at the start of every ticket number, e.g. TKT-4089">
              <TextInput
                value={ticketPrefix}
                onChange={e => handleFieldChange(setTicketPrefix, e.target.value)}
              />
            </FormField>

            <FormField label="Auto-close resolved tickets after" hint="Resolved tickets move to Closed after this many days">
              <SelectInput
                value={autoCloseDays}
                onChange={e => handleFieldChange(setAutoCloseDays, e.target.value)}
              >
                <option value="3">3 days</option>
                <option value="7">7 days (recommended)</option>
                <option value="14">14 days</option>
              </SelectInput>
            </FormField>

            <FormField label="Employees can reopen for" hint="How long after resolve an employee can reopen the request">
              <SelectInput
                value={allowReopenDays}
                onChange={e => handleFieldChange(setAllowReopenDays, e.target.value)}
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </SelectInput>
            </FormField>

            <FormField
              label="How SLA time is counted"
              required
              hint="Choose calendar time or working/shift hours"
            >
              <SelectInput
                value={slaHoursMode}
                onChange={e => handleFieldChange(setSlaHoursMode, e.target.value as SlaHoursMode)}
              >
                {SLA_HOURS_MODE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            {enableAutoAssignment ? (
              <FormField label="How to auto-assign" hint="Used when auto-assign is turned on">
                <SelectInput
                  value={assignmentAlgorithm}
                  onChange={e => handleFieldChange(setAssignmentAlgorithm, e.target.value)}
                >
                  <option value="Round Robin (Load Balanced)">Evenly (round robin)</option>
                  <option value="Lowest Active Workload">Least busy agent</option>
                  <option value="Category Specialist Preferred">Category specialist first</option>
                </SelectInput>
              </FormField>
            ) : (
              <div />
            )}
          </div>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <ToggleSwitch
              checked={enableAutoAssignment}
              onChange={val => handleFieldChange(setEnableAutoAssignment, val)}
              label="Auto-assign agents when a ticket is created"
            />
          </div>

          <div
            style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-4)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              About SLA time counting
            </div>
            <p style={{ margin: '0 0 10px' }}>{getSlaHoursModeDescription(slaHoursMode)}</p>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                <strong>24 hour</strong> — counts all day and night.
              </li>
              <li>
                <strong>Shift hours</strong> — pauses when the assigned agent is off shift.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: ROLE PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <span className="settings-card-title">Role Access Matrix</span>
              <div className="settings-card-subtitle">Read-only preview of enterprise permissions across Helpdesk user roles.</div>
            </div>
          </div>

          <table className="permissions-matrix-table">
            <thead>
              <tr>
                <th>Capability / Action</th>
                <th>Employee</th>
                <th>Support Agent</th>
                <th>Team Lead</th>
                <th>HR / Admin</th>
                <th>Super Admin</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Raise Request</td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
              </tr>
              <tr>
                <td>View Own Requests</td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
              </tr>
              <tr>
                <td>View & Work Assigned Queue</td>
                <td>—</td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
              </tr>
              <tr>
                <td>Post Internal Agent Notes</td>
                <td>—</td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
              </tr>
              <tr>
                <td>Reassign Ticket / Change Priority</td>
                <td>—</td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
              </tr>
              <tr>
                <td>Manage Teams & Categories</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
              </tr>
              <tr>
                <td>Configure SLA & System Settings</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td><CheckCircle2 size={15} style={{ color: '#10B981', margin: 'auto' }} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: CANNED RESPONSES */}
      {activeTab === 'canned-responses' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <span className="settings-card-title">Canned Response Templates</span>
              <div className="settings-card-subtitle">
                Pre-written replies agents can insert when responding to tickets. Use placeholders like {'{{requester}}'}, {'{{ticketId}}'}, {'{{agent}}'}.
              </div>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => openCannedModal()}>
              Add Template
            </Button>
          </div>

          <table className="permissions-matrix-table canned-responses-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Scope</th>
                <th>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cannedResponses.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '420px' }}>
                      {item.body.length > 90 ? `${item.body.slice(0, 90)}…` : item.body}
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.scope}</td>
                  <td>
                    <button
                      type="button"
                      className={`canned-status-pill ${item.status === 'Active' ? 'is-active' : ''}`}
                      onClick={() => handleToggleCannedStatus(item.id)}
                    >
                      {item.status}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <IconButton
                        icon={<Edit size={14} />}
                        ariaLabel="Edit template"
                        variant="ghost"
                        size="sm"
                        onClick={() => openCannedModal(item)}
                      />
                      <IconButton
                        icon={<Trash2 size={14} />}
                        ariaLabel="Delete template"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCannedResponse(item.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: CLOSING REASONS */}
      {activeTab === 'closing-reasons' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <span className="settings-card-title">Closing Reason Catalog</span>
              <div className="settings-card-subtitle">
                Configure structured reasons shown when resolving, closing, or bulk-closing tickets as spam or duplicate.
              </div>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => openClosingReasonModal()}>
              Add Reason
            </Button>
          </div>

          <table className="permissions-matrix-table canned-responses-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Context</th>
                <th>Comment</th>
                <th>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {closingReasons.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{item.label}</div>
                    {item.description && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '420px' }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{item.context}</td>
                  <td>{item.requiresComment ? 'Required' : 'Optional'}</td>
                  <td>
                    <button
                      type="button"
                      className={`canned-status-pill ${item.status === 'Active' ? 'is-active' : ''}`}
                      onClick={() => handleToggleClosingReasonStatus(item.id)}
                    >
                      {item.status}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <IconButton
                        icon={<Edit size={14} />}
                        ariaLabel="Edit closing reason"
                        variant="ghost"
                        size="sm"
                        onClick={() => openClosingReasonModal(item)}
                      />
                      <IconButton
                        icon={<Trash2 size={14} />}
                        ariaLabel="Delete closing reason"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClosingReason(item.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* UNSAVED CHANGES MODAL */}
      <Modal
        isOpen={isUnsavedModalOpen}
        onClose={() => {
          setIsUnsavedModalOpen(false);
          setPendingTabSwitch(null);
          setPendingCompanyId(null);
        }}
        title="Unsaved Changes"
        subtitle="You have unsaved changes for this company."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsUnsavedModalOpen(false);
                setIsDirty(false);
                if (pendingTabSwitch) {
                  setActiveTab(pendingTabSwitch);
                  setPendingTabSwitch(null);
                }
                if (pendingCompanyId) {
                  onCompanyChange(pendingCompanyId);
                  setPendingCompanyId(null);
                }
              }}
            >
              Leave Without Saving
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsUnsavedModalOpen(false);
                handleSaveSettings();
                if (pendingTabSwitch) {
                  setActiveTab(pendingTabSwitch);
                  setPendingTabSwitch(null);
                }
                if (pendingCompanyId) {
                  onCompanyChange(pendingCompanyId);
                  setPendingCompanyId(null);
                }
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Are you sure you want to navigate to another tab? Any unsaved modifications to the module configuration will be lost.
        </div>
      </Modal>

      {/* CANNED RESPONSE EDITOR MODAL */}
      <Modal
        isOpen={isCannedModalOpen}
        onClose={closeCannedModal}
        title={editingCanned ? 'Edit Canned Response' : 'Add Canned Response'}
        subtitle="Templates appear in the ticket reply composer for agents."
        footer={
          <>
            <Button variant="secondary" onClick={closeCannedModal}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!cannedFormTitle.trim() || !cannedFormBody.trim()}
              onClick={handleSaveCannedResponse}
            >
              {editingCanned ? 'Save Template' : 'Add Template'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="Template Title" required>
            <TextInput
              value={cannedFormTitle}
              onChange={e => setCannedFormTitle(e.target.value)}
              placeholder="e.g. Acknowledge receipt"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="Category">
              <SelectInput
                value={cannedFormCategory}
                onChange={e => setCannedFormCategory(e.target.value as CannedResponseCategory)}
              >
                <option value="General">General</option>
                <option value="Attendance">Attendance</option>
                <option value="Payroll">Payroll</option>
                <option value="Leave">Leave</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
                <option value="Administration">Administration</option>
              </SelectInput>
            </FormField>

            <FormField label="Reply Scope">
              <SelectInput
                value={cannedFormScope}
                onChange={e => setCannedFormScope(e.target.value as CannedResponseScope)}
              >
                <option value="public">Public reply</option>
                <option value="internal">Internal note</option>
                <option value="both">Both</option>
              </SelectInput>
            </FormField>

            <FormField label="Status">
              <SelectInput
                value={cannedFormStatus}
                onChange={e => setCannedFormStatus(e.target.value as 'Active' | 'Inactive')}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </SelectInput>
            </FormField>
          </div>

          <FormField
            label="Message Body"
            required
            hint="Placeholders: {{requester}}, {{ticketId}}, {{agent}}"
          >
            <TextareaInput
              value={cannedFormBody}
              onChange={e => setCannedFormBody(e.target.value)}
              rows={5}
              placeholder="Hi {{requester}}, we received your request..."
            />
          </FormField>
        </div>
      </Modal>

      {/* CLOSING REASON EDITOR MODAL */}
      <Modal
        isOpen={isClosingReasonModalOpen}
        onClose={closeClosingReasonModal}
        title={editingClosingReason ? 'Edit Closing Reason' : 'Add Closing Reason'}
        subtitle="Reasons appear in resolve, close, and bulk-close workflows based on context."
        footer={
          <>
            <Button variant="secondary" onClick={closeClosingReasonModal}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!closingFormLabel.trim()}
              onClick={handleSaveClosingReason}
            >
              {editingClosingReason ? 'Save Reason' : 'Add Reason'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <FormField label="Reason Label" required>
            <TextInput
              value={closingFormLabel}
              onChange={e => setClosingFormLabel(e.target.value)}
              placeholder="e.g. Fixed / Issue corrected"
            />
          </FormField>

          <FormField label="Description" hint="Shown as helper text in the closing reason dropdown">
            <TextInput
              value={closingFormDescription}
              onChange={e => setClosingFormDescription(e.target.value)}
              placeholder="Brief explanation for agents"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="Context">
              <SelectInput
                value={closingFormContext}
                onChange={e => setClosingFormContext(e.target.value as ClosingReasonContext)}
              >
                <option value="resolve">Resolve</option>
                <option value="close">Close</option>
                <option value="spam">Spam</option>
                <option value="duplicate">Duplicate</option>
              </SelectInput>
            </FormField>

            <FormField label="Comment Field">
              <SelectInput
                value={closingFormRequiresComment ? 'required' : 'optional'}
                onChange={e => setClosingFormRequiresComment(e.target.value === 'required')}
              >
                <option value="required">Required</option>
                <option value="optional">Optional</option>
              </SelectInput>
            </FormField>

            <FormField label="Status">
              <SelectInput
                value={closingFormStatus}
                onChange={e => setClosingFormStatus(e.target.value as 'Active' | 'Inactive')}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </SelectInput>
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
};
