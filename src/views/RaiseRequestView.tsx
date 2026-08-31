import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { FormField, TextInput, SelectInput, TextareaInput } from '../components/ui/FormControls';
import { StatusBadge } from '../components/ui/Badge';
import { Paperclip, User, Clock, FileText, Send, CheckCircle2, Trash2, HelpCircle, ArrowRight, X } from 'lucide-react';
import { getCompanyById, HELPDESK_COMPANIES } from '../data/companies';
import { GENERAL_SETTINGS_UPDATED_EVENT, getGeneralSettings } from '../data/generalSettings';
import { employeesForCompany } from '../data/directory';
import './RaiseRequestView.css';

export interface RaiseRequestViewProps {
  companyId: string;
  onCompanyChange?: (companyId: string) => void;
  initialCategory?: string;
  onCancel: () => void;
  onSubmitSuccessNavigate: (ticketId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
}

const CATEGORIES_BY_COMPANY: Record<string, { value: string; label: string }[]> = {
  'co-acme': [
    { value: 'attendance', label: 'Attendance' },
    { value: 'leave', label: 'Leave' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'hr', label: 'HR' },
    { value: 'it', label: 'IT' },
    { value: 'administration', label: 'Administration' }
  ],
  'co-northwind': [
    { value: 'fleet', label: 'Fleet Support' },
    { value: 'warehouse', label: 'Warehouse Ops' }
  ],
  'co-contoso': [
    { value: 'store', label: 'Store Operations' },
    { value: 'retail-hr', label: 'Retail HR' }
  ]
};

export const RaiseRequestView: React.FC<RaiseRequestViewProps> = ({
  companyId,
  onCompanyChange,
  initialCategory,
  onCancel,
  onSubmitSuccessNavigate
}) => {
  const company = getCompanyById(companyId);
  const categoryOptions = CATEGORIES_BY_COMPANY[companyId] || CATEGORIES_BY_COMPANY['co-acme'];
  const initial =
    categoryOptions.find(c => c.value === (initialCategory || '').toLowerCase())?.value ||
    categoryOptions[0]?.value ||
    'attendance';

  const [category, setCategory] = useState(initial);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [enableAutoAssignment, setEnableAutoAssignment] = useState(
    () => getGeneralSettings(companyId).enableAutoAssignment
  );
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; subject: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const teamMembers = useMemo(() => employeesForCompany(companyId), [companyId]);
  const selectedAssignee = teamMembers.find(member => member.id === assigneeId);

  const filteredAssignees = teamMembers.filter(member => {
    if (member.id === assigneeId) return false;
    const q = assigneeQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      member.name.toLowerCase().includes(q) ||
      member.department.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const refresh = () => setEnableAutoAssignment(getGeneralSettings(companyId).enableAutoAssignment);
    refresh();
    window.addEventListener(GENERAL_SETTINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(GENERAL_SETTINGS_UPDATED_EVENT, refresh);
  }, [companyId]);

  // Keep category valid when company switches
  React.useEffect(() => {
    const opts = CATEGORIES_BY_COMPANY[companyId] || CATEGORIES_BY_COMPANY['co-acme'];
    if (!opts.some(o => o.value === category)) {
      setCategory(opts[0]?.value || '');
    }
    setAssigneeId('');
    setAssigneeQuery('');
    setEnableAutoAssignment(getGeneralSettings(companyId).enableAutoAssignment);
  }, [companyId, category]);

  const handleSelectShortcut = (catKey: string) => {
    setCategory(catKey);
    setErrors(prev => ({ ...prev, category: '' }));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!category) newErrors.category = 'Please select a category';
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!description.trim()) newErrors.description = 'Please describe your request details';
    if (!enableAutoAssignment && !assigneeId) {
      newErrors.assignee = 'Please select a team member to assign this request to';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedId = `TKT-${Math.floor(4000 + Math.random() * 900)}`;
      setSubmittedTicket({ id: generatedId, subject: subject.trim() });
    }, 450);
  };

  const handleAddSampleAttachment = () => {
    const sampleFiles = [
      { name: 'attendance_log_aug14.pdf', size: '1.2 MB' },
      { name: 'payslip_june_screenshot.png', size: '840 KB' },
      { name: 'doctor_note_leave.pdf', size: '2.1 MB' }
    ];
    const fileToAdd = sampleFiles[attachments.length % sampleFiles.length];
    setAttachments(prev => [...prev, fileToAdd]);
  };

  if (submittedTicket) {
    return (
      <div className="raise-request-container">
        <PageHeader
          breadcrumbs={[
            { label: 'Sixtifi WFM' },
            { label: 'Helpdesk' },
            { label: 'My Requests', onClick: onCancel },
            { label: 'Submission Success' }
          ]}
          title="Request Submitted"
          subtitle="Your request has been logged successfully and routed to the support team."
        />

        <div className="submit-success-card">
          <div className="success-icon-badge">
            <CheckCircle2 size={32} />
          </div>

          <h2 className="text-h2" style={{ marginBottom: '4px' }}>Request Submitted</h2>
          <p className="text-subtitle" style={{ maxWidth: '420px', margin: '0 auto' }}>
            Your workforce request <strong>"{submittedTicket.subject}"</strong> has been logged in Sixtifi Helpdesk for{' '}
            {company.name}.
          </p>

          <div className="success-ticket-box">
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Ticket ID
              </div>
              <div className="table-cell-id" style={{ fontSize: '16px', fontWeight: 700 }}>
                {submittedTicket.id}
              </div>
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-default)' }} />

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                Initial Status
              </div>
              <StatusBadge status="Open" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={onCancel}>
              Back to My Requests
            </Button>
            <Button
              variant="primary"
              rightIcon={<ArrowRight size={15} />}
              onClick={() => onSubmitSuccessNavigate(submittedTicket.id)}
            >
              View Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="raise-request-container">
      <PageHeader
        breadcrumbs={[
          { label: 'Sixtifi WFM' },
          { label: 'Helpdesk' },
          { label: 'Raise Request' }
        ]}
        title="Raise a Request"
        subtitle={`Tell us what you need. We’ll route it for ${company.name}.`}
      />

      <div className="raise-request-layout">
        <form onSubmit={handleSubmit} className="raise-request-form-card">
          <div>
            <div className="form-section-header">
              <h3 className="form-section-title">
                <FileText size={18} style={{ color: 'var(--color-primary-600)' }} />
                1. What is this about?
              </h3>
              <p className="form-section-subtitle">Pick the company and category that fits best.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <FormField label="Company" required hint="Where this request should be logged">
                <SelectInput
                  value={companyId}
                  onChange={e => onCompanyChange?.(e.target.value)}
                  style={{ maxWidth: 360 }}
                >
                  {HELPDESK_COMPANIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField label="Category" required hint="e.g. Attendance, Payroll, IT" error={errors.category}>
                <SelectInput
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  hasError={!!errors.category}
                  style={{ maxWidth: 360 }}
                >
                  {categoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
            </div>
          </div>

          <div>
            <div className="form-section-header">
              <h3 className="form-section-title">
                <Clock size={18} style={{ color: 'var(--color-primary-600)' }} />
                2. Tell us more
              </h3>
              <p className="form-section-subtitle">A short subject and a bit of detail help us help you faster.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <FormField label="Subject" required hint="One short line" error={errors.subject}>
                <TextInput
                  value={subject}
                  onChange={e => {
                    setSubject(e.target.value);
                    if (e.target.value.trim()) setErrors(prev => ({ ...prev, subject: '' }));
                  }}
                  placeholder="e.g. Missing punch on Aug 17"
                  hasError={!!errors.subject}
                />
              </FormField>

              <FormField label="Details" required hint="What happened, and what do you need?" error={errors.description}>
                <TextareaInput
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    if (e.target.value.trim()) setErrors(prev => ({ ...prev, description: '' }));
                  }}
                  placeholder="Add any dates, names, or steps you’ve already tried..."
                  rows={5}
                  hasError={!!errors.description}
                />
                <div className="char-counter">{description.length} / 1000 characters</div>
              </FormField>
            </div>
          </div>

          <div>
            <div className="form-section-header">
              <h3 className="form-section-title">
                <Paperclip size={18} style={{ color: 'var(--color-primary-600)' }} />
                3. Attachments (optional)
              </h3>
              <p className="form-section-subtitle">Screenshots or files that help explain the issue.</p>
            </div>

            <div
              style={{
                padding: 'var(--space-5)',
                border: '1px dashed var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-subtle)',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onClick={handleAddSampleAttachment}
            >
              <Paperclip size={20} style={{ color: 'var(--text-muted)', marginBottom: '4px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Drag and drop files here, or browse
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Supported formats: PNG, JPG, PDF, DOCX (Max 15MB)
              </div>
            </div>

            {attachments.map((file, idx) => (
              <div key={idx} className="uploaded-attachment-row">
                <div className="attachment-info-left">
                  <Paperclip size={14} style={{ color: 'var(--color-primary-600)' }} />
                  <span>{file.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({file.size})</span>
                </div>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div>
            <div className="form-section-header">
              <h3 className="form-section-title">4. Priority</h3>
            </div>

            <FormField label="How urgent is this?" hint="Pick High only if work is blocked.">
              <SelectInput value={priority} onChange={e => setPriority(e.target.value)} style={{ width: '240px' }}>
                <option value="Low">Low</option>
                <option value="Medium">Medium (usual)</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </SelectInput>
            </FormField>
          </div>

          {!enableAutoAssignment && (
            <div>
              <div className="form-section-header">
                <h3 className="form-section-title">
                  <User size={18} style={{ color: 'var(--color-primary-600)' }} />
                  5. Assign to team member
                </h3>
                <p className="form-section-subtitle">
                  Auto-assignment is off for {company.name}. Choose who should handle this request.
                </p>
              </div>

              <FormField
                label="Assignee"
                required
                hint="Search and select a team member from this company"
                error={errors.assignee}
              >
                <div className="raise-assignee-picker">
                  <div className={`raise-assignee-search ${errors.assignee ? 'has-error' : ''}`}>
                    {selectedAssignee && (
                      <span className="raise-assignee-chip">
                        <span className="raise-assignee-avatar">{selectedAssignee.initials}</span>
                        {selectedAssignee.name}
                        <button
                          type="button"
                          className="raise-assignee-remove"
                          onClick={() => {
                            setAssigneeId('');
                            setAssigneeQuery('');
                            setErrors(prev => ({ ...prev, assignee: '' }));
                          }}
                          aria-label={`Remove ${selectedAssignee.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {!selectedAssignee && (
                      <input
                        className="raise-assignee-input"
                        value={assigneeQuery}
                        onChange={e => {
                          setAssigneeQuery(e.target.value);
                          setAssigneeDropdownOpen(true);
                          if (errors.assignee) setErrors(prev => ({ ...prev, assignee: '' }));
                        }}
                        onFocus={() => setAssigneeDropdownOpen(true)}
                        onBlur={() => window.setTimeout(() => setAssigneeDropdownOpen(false), 150)}
                        placeholder="Search team members..."
                        autoComplete="off"
                      />
                    )}
                  </div>
                  {assigneeDropdownOpen && !selectedAssignee && filteredAssignees.length > 0 && (
                    <div className="raise-assignee-dropdown">
                      {filteredAssignees.map(member => (
                        <button
                          key={member.id}
                          type="button"
                          className="raise-assignee-option"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            setAssigneeId(member.id);
                            setAssigneeQuery('');
                            setAssigneeDropdownOpen(false);
                            setErrors(prev => ({ ...prev, assignee: '' }));
                          }}
                        >
                          <span className="raise-assignee-avatar">{member.initials}</span>
                          <span>
                            {member.name}
                            <span className="raise-assignee-meta">{member.department}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {assigneeDropdownOpen && !selectedAssignee && assigneeQuery && filteredAssignees.length === 0 && (
                    <div className="raise-assignee-dropdown">
                      <div className="raise-assignee-empty">No team members match your search.</div>
                    </div>
                  )}
                </div>
              </FormField>
            </div>
          )}

          <div>
            <div className="form-section-header">
              <h3 className="form-section-title">
                <User size={18} style={{ color: 'var(--color-primary-600)' }} />
                {enableAutoAssignment ? '5. Your details' : '6. Your details'}
              </h3>
              <p className="form-section-subtitle">Filled in from your Sixtifi profile.</p>
            </div>

            <div className="requester-info-grid">
              <div className="requester-info-item">
                <span className="requester-info-label">Requester</span>
                <span className="requester-info-value">Alex Rivera</span>
              </div>
              <div className="requester-info-item">
                <span className="requester-info-label">Company</span>
                <span className="requester-info-value">{company.name}</span>
              </div>
              <div className="requester-info-item">
                <span className="requester-info-label">Department</span>
                <span className="requester-info-value">Human Resources</span>
              </div>
              <div className="requester-info-item">
                <span className="requester-info-label">Location</span>
                <span className="requester-info-value">New York</span>
              </div>
            </div>
          </div>

          <div className="form-actions-bar">
            <Button variant="secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} leftIcon={<Send size={15} />}>
              Submit Request
            </Button>
          </div>
        </form>

        <div className="sidebar-cards-column">
          <div className="guidance-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} style={{ color: 'var(--color-primary-600)' }} />
              <h3 className="text-h3" style={{ fontSize: '15px' }}>Need help deciding where to start?</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {categoryOptions.map(opt => (
                <div
                  key={opt.value}
                  className="guidance-shortcut-item"
                  onClick={() => handleSelectShortcut(opt.value)}
                >
                  <span className="guidance-shortcut-title">{opt.label}</span>
                  <span className="guidance-shortcut-desc">Raise a request under {opt.label} for {company.shortName}.</span>
                </div>
              ))}
            </div>
          </div>

          <div className="process-card">
            <h3 className="text-h3" style={{ fontSize: '15px' }}>What happens next?</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="process-step-item">
                <div className="process-step-number">1</div>
                <span className="process-step-text">Submit your request</span>
              </div>
              <div className="process-step-item">
                <div className="process-step-number">2</div>
                <span className="process-step-text">Your request is routed to the right team</span>
              </div>
              <div className="process-step-item">
                <div className="process-step-number">3</div>
                <span className="process-step-text">A team member reviews it</span>
              </div>
              <div className="process-step-item">
                <div className="process-step-number">4</div>
                <span className="process-step-text">You can follow the conversation</span>
              </div>
              <div className="process-step-item">
                <div className="process-step-number">5</div>
                <span className="process-step-text">The request is resolved and closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
