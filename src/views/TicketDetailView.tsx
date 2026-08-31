import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { StatusBadge, PriorityBadge, TicketStatus, TicketPriority, getPlainStatusLabel } from '../components/ui/Badge';
import { FormField, SelectInput, TextareaInput } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { QuickReplyPicker } from '../components/helpdesk/QuickReplyPicker';
import { ClosingReasonFields, canSubmitClosingReason } from '../components/helpdesk/ClosingReasonFields';
import {
  getClosingReasonById,
  getDefaultClosingReasonId
} from '../data/closingReasons';
import {
  Send,
  Paperclip,
  Clock,
  RotateCcw,
  CheckCircle2,
  Lock,
  MoreVertical,
  Download,
  Eye,
  ArrowLeft,
  UserCheck,
  ShieldAlert,
  User
} from 'lucide-react';
import './TicketDetailView.css';

export interface TicketMessage {
  id: string;
  author: string;
  role: string;
  isAgent: boolean;
  isInternalNote?: boolean;
  timestamp: string;
  text: string;
  attachment?: { name: string; size: string };
}

export interface ActivityEvent {
  id: string;
  title: string;
  timestamp: string;
  actor?: string;
  isInternalOnly?: boolean;
}

const CURRENT_ACTOR = {
  agent: 'Rahul Sharma',
  employee: 'Alex Rivera'
};

export interface TicketDetailViewProps {
  ticketId?: string;
  onBack: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  backLabel?: string;
  focusComment?: boolean;
}

export const TicketDetailView: React.FC<TicketDetailViewProps> = ({
  ticketId = 'TKT-4089',
  onBack,
  onShowToast,
  backLabel,
  focusComment = false
}) => {
  // Role Perspective Context Switcher ('employee' vs 'agent')
  const [userRole, setUserRole] = useState<'employee' | 'agent'>('agent');

  // Ticket Metadata State
  const [status, setStatus] = useState<TicketStatus>('In Progress');
  const [priority, setPriority] = useState<TicketPriority>('High');
  const assignedTeam = 'HR Support';
  const [assignedAgent, setAssignedAgent] = useState('Rahul Sharma');

  // Dropdown menus & Modals
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

  // Form states for modals
  const [resolveReasonId, setResolveReasonId] = useState(() => getDefaultClosingReasonId('resolve'));
  const [resolveComment, setResolveComment] = useState('');
  const [closeReasonId, setCloseReasonId] = useState(() => getDefaultClosingReasonId('close'));
  const [closeComment, setCloseComment] = useState('');
  const [recordedClosingReason, setRecordedClosingReason] = useState<string | null>(null);
  const [recordedClosingNote, setRecordedClosingNote] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [newAgentSelection, setNewAgentSelection] = useState('Rahul Sharma');

  // Reply Input State & Ref
  const [replyType, setReplyType] = useState<'public' | 'internal'>('public');
  const [replyText, setReplyText] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (focusComment && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [focusComment]);

  // Chronological Conversation Messages
  const [messages, setMessages] = useState<TicketMessage[]>([
    {
      id: 'msg-1',
      author: 'Alex Rivera',
      role: 'Employee (Requester)',
      isAgent: false,
      timestamp: 'Aug 17, 2026 · 10:24 AM',
      text: 'My attendance for August 17 is showing as absent even though I worked the full shift. Please check the attendance record.',
      attachment: { name: 'attendance-aug17.png', size: '245 KB' }
    },
    {
      id: 'msg-2',
      author: 'Rahul Sharma',
      role: 'HR Support',
      isAgent: true,
      timestamp: 'Aug 17, 2026 · 11:05 AM',
      text: 'Thanks for reporting this. We are checking the attendance record and shift details with the site supervisor.'
    },
    {
      id: 'msg-3',
      author: 'Alex Rivera',
      role: 'Employee (Requester)',
      isAgent: false,
      timestamp: 'Aug 17, 2026 · 11:18 AM',
      text: 'Thank you.'
    },
    {
      id: 'msg-4',
      author: 'Rahul Sharma',
      role: 'HR Support Lead',
      isAgent: true,
      isInternalNote: true,
      timestamp: 'Aug 17, 2026 · 11:30 AM',
      text: 'Biometric log at Surat site verified against security badge swipes. Regularizing shift hours to 8 hours.'
    }
  ]);

  // Operational Activity Timeline (who + when)
  const [activityHistory, setActivityHistory] = useState<ActivityEvent[]>([
    { id: 'act-1', title: `Ticket ${ticketId} created`, timestamp: 'Aug 17, 2026 · 10:24 AM', actor: 'Alex Rivera' },
    { id: 'act-2', title: 'Assigned to HR Support team', timestamp: 'Aug 17, 2026 · 10:27 AM', actor: 'System Auto-Route' },
    { id: 'act-3', title: 'Assigned to Rahul Sharma', timestamp: 'Aug 17, 2026 · 10:28 AM', actor: 'Priya Shah' },
    {
      id: 'act-4',
      title: `Status changed: ${getPlainStatusLabel('Open')} → ${getPlainStatusLabel('In Progress')}`,
      timestamp: 'Aug 17, 2026 · 11:02 AM',
      actor: 'Rahul Sharma'
    },
    { id: 'act-5', title: 'Priority changed: Medium → High', timestamp: 'Aug 17, 2026 · 11:03 AM', actor: 'Rahul Sharma' }
  ]);

  const appendAudit = (title: string, actor?: string, isInternalOnly?: boolean) => {
    setActivityHistory(prev => [
      ...prev,
      {
        id: `act-${Date.now()}`,
        title,
        timestamp: 'Just now',
        actor: actor || (userRole === 'agent' ? CURRENT_ACTOR.agent : CURRENT_ACTOR.employee),
        isInternalOnly
      }
    ]);
  };

  const appendReplyText = (text: string) => {
    setReplyText(prev => (prev.trim() ? `${prev.trim()}\n\n${text}` : text));
    replyInputRef.current?.focus();
  };

  const quickReplyVariables = {
    requester: 'Alex Rivera',
    ticketId,
    agent: 'Rahul Sharma'
  };

  // Handle Reply or Internal Note Submit
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const isNote = userRole === 'agent' && replyType === 'internal';

    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      author: userRole === 'agent' ? 'Rahul Sharma' : 'Alex Rivera',
      role: userRole === 'agent' ? 'HR Support' : 'Employee (Requester)',
      isAgent: userRole === 'agent',
      isInternalNote: isNote,
      timestamp: 'Just now',
      text: replyText.trim(),
      attachment: attachedFile || undefined
    };

    setMessages(prev => [...prev, newMsg]);
    appendAudit(
      isNote ? 'Added an internal note' : 'Replied to conversation',
      newMsg.author,
      isNote
    );

    setReplyText('');
    setAttachedFile(null);
    onShowToast('success', isNote ? 'Internal Note Added' : 'Reply Sent', isNote ? 'Visible only to Helpdesk/HR staff.' : 'Message added to ticket thread.');
  };

  // Handle Modal Resolve Confirmation
  const handleConfirmResolve = () => {
    if (!canSubmitClosingReason(resolveReasonId, resolveComment)) return;

    const reason = getClosingReasonById(resolveReasonId);
    const reasonLabel = reason?.label || 'Resolved';

    setStatus('Resolved');
    setIsResolveModalOpen(false);
    setRecordedClosingReason(reasonLabel);
    setRecordedClosingNote(resolveComment.trim() || null);

    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        author: 'Rahul Sharma',
        role: 'HR Support',
        isAgent: true,
        timestamp: 'Just now',
        text: `Resolution (${reasonLabel}): ${resolveComment.trim() || 'Ticket resolved.'}`
      }
    ]);

    appendAudit(`Ticket resolved — ${reasonLabel}`, CURRENT_ACTOR.agent);

    onShowToast('success', 'Ticket Resolved', `Ticket ${ticketId} status updated to Resolved.`);
    setResolveComment('');
  };

  const handleConfirmClose = () => {
    if (!canSubmitClosingReason(closeReasonId, closeComment)) return;

    const reason = getClosingReasonById(closeReasonId);
    const reasonLabel = reason?.label || 'Closed';

    setStatus('Closed');
    setIsCloseModalOpen(false);
    setRecordedClosingReason(reasonLabel);
    setRecordedClosingNote(closeComment.trim() || null);

    appendAudit(`Ticket closed — ${reasonLabel}`, CURRENT_ACTOR.agent);
    onShowToast('info', 'Ticket Closed', `Ticket ${ticketId} closed with reason: ${reasonLabel}.`);
    setCloseComment('');
  };

  // Handle Reopen Confirmation
  const handleConfirmReopen = () => {
    setStatus('Reopened');
    setIsReopenModalOpen(false);

    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        author: 'Alex Rivera',
        role: 'Employee (Requester)',
        isAgent: false,
        timestamp: 'Just now',
        text: `Reopened Request Reason: ${reopenReason.trim() || 'Issue still requires attention.'}`
      }
    ]);

    appendAudit('Ticket reopened', CURRENT_ACTOR.employee);

    onShowToast('info', 'Ticket Reopened', `Ticket ${ticketId} status changed to Reopened.`);
    setReopenReason('');
  };

  // Handle Agent Reassignment
  const handleConfirmReassign = () => {
    const previousAgent = assignedAgent;
    setAssignedAgent(newAgentSelection);
    setIsReassignModalOpen(false);
    appendAudit(`Reassigned: ${previousAgent} → ${newAgentSelection}`, CURRENT_ACTOR.agent);
    onShowToast('info', 'Agent Reassigned', `Ticket ${ticketId} reassigned to ${newAgentSelection}.`);
  };

  // Filter messages based on employee view (hide internal notes from employee)
  const visibleMessages = messages.filter(msg => {
    if (userRole === 'employee' && msg.isInternalNote) return false;
    return true;
  });

  // Filter activity log based on employee view
  const visibleActivities = activityHistory.filter(act => {
    if (userRole === 'employee' && act.isInternalOnly) return false;
    return true;
  });

  return (
    <div className="ticket-detail-container">
      {/* PAGE HEADER */}
      <PageHeader
        breadcrumbs={[
          { label: 'Sixtifi WFM' },
          { label: 'Helpdesk' },
          { label: backLabel || (userRole === 'employee' ? 'My Requests' : 'All Tickets'), onClick: onBack },
          { label: ticketId }
        ]}
        title="Missing attendance punch for Aug 17"
        subtitle={`Ticket ${ticketId} · Created Aug 17, 2026 at 10:24 AM`}
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={status} />
            <PriorityBadge priority={priority} />
          </div>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft size={14} />}
              onClick={onBack}
            >
              {backLabel ? `Back to ${backLabel}` : userRole === 'employee' ? 'Back to My Requests' : 'Back to Tickets'}
            </Button>

            {status !== 'Resolved' && status !== 'Closed' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 size={15} />}
                onClick={() => {
                  setResolveReasonId(getDefaultClosingReasonId('resolve'));
                  setResolveComment('');
                  setIsResolveModalOpen(true);
                }}
              >
                Resolve Ticket
              </Button>
            )}

            {(status === 'Resolved' || status === 'Closed') && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw size={14} />}
                onClick={() => setIsReopenModalOpen(true)}
              >
                Reopen Ticket
              </Button>
            )}

            {/* MORE ACTION MENU */}
            <div style={{ position: 'relative' }}>
              <IconButton
                icon={<MoreVertical size={16} />}
                ariaLabel="More Actions"
                variant="ghost"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              />

              {isMoreMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '36px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 60,
                    minWidth: '170px',
                    padding: '4px 0'
                  }}
                  onClick={() => setIsMoreMenuOpen(false)}
                >
                  {userRole === 'agent' && (
                    <>
                      <button
                        style={{ width: '100%', padding: '6px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                        onClick={() => {
                          const nextPriority = priority === 'High' ? 'Medium' : priority === 'Medium' ? 'Urgent' : 'High';
                          appendAudit(`Priority changed: ${priority} → ${nextPriority}`);
                          setPriority(nextPriority);
                          onShowToast('info', 'Priority Changed', `Priority updated to ${nextPriority}.`);
                        }}
                      >
                        Change Priority
                      </button>

                      <button
                        style={{ width: '100%', padding: '6px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                        onClick={() => setIsReassignModalOpen(true)}
                      >
                        Reassign Agent
                      </button>

                      <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                    </>
                  )}

                  <button
                    style={{ width: '100%', padding: '6px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', color: 'var(--color-primary-600)', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => {
                      setCloseReasonId(getDefaultClosingReasonId('close'));
                      setCloseComment('');
                      setIsCloseModalOpen(true);
                    }}
                  >
                    Close Ticket
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* 2-COLUMN FULL-PAGE WORKSPACE LAYOUT (65% / 35%) */}
      <div className="ticket-detail-layout">
        {/* LEFT COLUMN: CONVERSATION & WORK AREA */}
        <div className="ticket-main-panel">
          <div className="conversation-card">
            <div className="conversation-card-header">
              <div>
                <h3 className="text-h3">Conversation</h3>
                <p className="text-caption">Chronological request thread and support history</p>
              </div>

              <span className="text-caption" style={{ color: 'var(--text-muted)' }}>
                {visibleMessages.length} Messages
              </span>
            </div>

            {/* CHRONOLOGICAL THREAD */}
            <div className="conversation-messages-list">
              {visibleMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`message-bubble ${
                    msg.isInternalNote
                      ? 'is-internal-note'
                      : msg.isAgent
                      ? 'is-agent'
                      : 'is-employee'
                  }`}
                >
                  <div className="message-header-bar">
                    <div className="message-author-group">
                      <div className="author-avatar-circle">
                        {msg.author.split(' ').map(n => n[0]).join('')}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="author-meta-name">{msg.author}</span>
                          {msg.isInternalNote && (
                            <span className="internal-note-badge">
                              <Lock size={10} />
                              Internal Note
                            </span>
                          )}
                        </div>
                        <span className="author-meta-role">{msg.role}</span>
                      </div>
                    </div>

                    <span className="message-timestamp-text">{msg.timestamp}</span>
                  </div>

                  <div className="message-body-text">{msg.text}</div>

                  {msg.attachment && (
                    <div className="message-attachments-container">
                      <div
                        className="message-attachment-chip"
                        onClick={() => onShowToast('info', 'Downloading File', `Downloading ${msg.attachment?.name}...`)}
                      >
                        <Paperclip size={13} />
                        <span>{msg.attachment.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({msg.attachment.size})</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* BOTTOM REPLY AREA */}
            <form onSubmit={handleSendReply} className="reply-area-box">
              {/* Public Reply vs Internal Note Tabs (For Agent View) */}
              {userRole === 'agent' ? (
                <div className="reply-type-tabs">
                  <button
                    type="button"
                    className={`reply-tab-btn ${replyType === 'public' ? 'is-active' : ''}`}
                    onClick={() => setReplyType('public')}
                  >
                    <Send size={13} />
                    Public Reply
                  </button>
                  <button
                    type="button"
                    className={`reply-tab-btn ${replyType === 'internal' ? 'is-internal-active' : ''}`}
                    onClick={() => setReplyType('internal')}
                  >
                    <Lock size={13} />
                    Internal Note (HR / Support Only)
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Add Reply
                </div>
              )}

              <TextareaInput
                ref={replyInputRef as any}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={
                  replyType === 'internal' && userRole === 'agent'
                    ? 'Write an internal note (only visible to HR/Support staff)...'
                    : 'Write a reply...'
                }
                rows={3}
                style={{
                  backgroundColor: replyType === 'internal' && userRole === 'agent' ? '#FFFBEB' : 'var(--bg-surface)',
                  borderColor: replyType === 'internal' && userRole === 'agent' ? '#FDE68A' : undefined
                }}
              />

              {attachedFile && (
                <div style={{ fontSize: '12px', color: 'var(--color-primary-600)', fontWeight: 500 }}>
                  Attached: {attachedFile.name} ({attachedFile.size})
                </div>
              )}

              <div className="reply-actions-bar">
                {userRole === 'agent' && (
                  <QuickReplyPicker
                    replyScope={replyType === 'internal' ? 'internal' : 'public'}
                    onInsert={appendReplyText}
                    variables={quickReplyVariables}
                  />
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<Paperclip size={14} />}
                  onClick={() => setAttachedFile({ name: 'attendance-proof-attachment.pdf', size: '310 KB' })}
                >
                  Attach File
                </Button>

                <div style={{ marginLeft: 'auto' }}>
                  <Button
                    type="submit"
                    variant={replyType === 'internal' && userRole === 'agent' ? 'secondary' : 'primary'}
                    size="sm"
                    leftIcon={replyType === 'internal' && userRole === 'agent' ? <Lock size={14} /> : <Send size={14} />}
                    disabled={!replyText.trim()}
                  >
                    {replyType === 'internal' && userRole === 'agent' ? 'Add Internal Note' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: METADATA & OPERATIONAL CARDS */}
        <div className="ticket-sidebar-panel">
          {/* DEMO TOOL: ROLE PERSPECTIVE SWITCHER */}
          <div className="role-switcher-card">
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                View Context
              </div>
              <div className="role-switcher-text">
                {userRole === 'agent' ? 'HR Support Agent View' : 'Employee Self-Service View'}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserRole(userRole === 'agent' ? 'employee' : 'agent')}
            >
              Switch to {userRole === 'agent' ? 'Employee' : 'Agent'} View
            </Button>
          </div>

          {/* CARD 1: TICKET INFORMATION */}
          <div className="sidebar-info-card">
            <div className="sidebar-card-header">
              <span className="sidebar-card-title">Ticket Information</span>
              <User size={15} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="meta-rows-list">
              <div className="meta-row-item">
                <span className="meta-label">Requester</span>
                <span
                  className="meta-value clickable-link"
                  onClick={() => onShowToast('info', 'Employee Profile', 'Opening Alex Rivera employee profile...')}
                >
                  Alex Rivera
                </span>
              </div>

              <div className="meta-row-item">
                <span className="meta-label">Employee ID</span>
                <span className="meta-value">EMP-10248</span>
              </div>

              <div className="meta-row-item">
                <span className="meta-label">Department</span>
                <span className="meta-value">Human Resources</span>
              </div>

              <div className="meta-row-item">
                <span className="meta-label">Location</span>
                <span className="meta-value">New York</span>
              </div>

              <div className="meta-row-item">
                <span className="meta-label">Category</span>
                <span className="meta-value">Attendance</span>
              </div>

              <div className="meta-row-item">
                <span className="meta-label">Company</span>
                <span className="meta-value">Acme Corp (HQ)</span>
              </div>

              <div className="meta-row-item">
                <span className="meta-label">Created</span>
                <span className="meta-value">Aug 17, 2026 · 10:24 AM</span>
              </div>

              <div className="meta-row-item">
                <span className="meta-label">Last Updated</span>
                <span className="meta-value">Aug 17, 2026 · 11:18 AM</span>
              </div>

              {(status === 'Resolved' || status === 'Closed') && recordedClosingReason && (
                <>
                  <div className="meta-row-item">
                    <span className="meta-label">Closing Reason</span>
                    <span className="meta-value">{recordedClosingReason}</span>
                  </div>
                  {recordedClosingNote && (
                    <div className="meta-row-item">
                      <span className="meta-label">Closing Note</span>
                      <span className="meta-value" style={{ fontWeight: 500, lineHeight: 1.4 }}>
                        {recordedClosingNote}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* CARD 2: ASSIGNMENT CARD */}
          <div className="sidebar-info-card">
            <div className="sidebar-card-header">
              <span className="sidebar-card-title">Assignment</span>
              <UserCheck size={15} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="meta-rows-list">
              <div className="meta-row-item">
                <span className="meta-label">Assigned Team</span>
                <span className="meta-value">{assignedTeam}</span>
              </div>

              <div className="meta-row-item">
                <span className="meta-label">Assigned Agent</span>
                <span className="meta-value">{assignedAgent}</span>
              </div>

              <div className="meta-row-item">
                <span className="meta-label">Team Lead</span>
                <span className="meta-value">Priya Shah</span>
              </div>
            </div>

            {userRole === 'agent' && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  style={{ width: '100%' }}
                  onClick={() => setIsReassignModalOpen(true)}
                >
                  Reassign agent
                </Button>
              </div>
            )}
          </div>

          {/* CARD 3: SLA CARD */}
          <div className="sidebar-info-card">
            <div className="sidebar-card-header">
              <span className="sidebar-card-title">SLA Operational Target</span>
              <Clock size={15} style={{ color: 'var(--color-primary-600)' }} />
            </div>

            {userRole === 'agent' ? (
              <div className="meta-rows-list">
                <div className="meta-row-item">
                  <span className="meta-label">Response Target</span>
                  <span className="meta-value">4 hours</span>
                </div>

                <div className="meta-row-item">
                  <span className="meta-label">Resolution Target</span>
                  <span className="meta-value">1 working day</span>
                </div>

                <div className="meta-row-item">
                  <span className="meta-label">Target Due</span>
                  <span className="meta-value">Aug 18, 2026 — 10:24 AM</span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#1E40AF', marginTop: '4px' }}>
                    <span>SLA Status</span>
                    <span>2h 14m remaining</span>
                  </div>
                  <div className="sla-progress-bar-bg">
                    <div className="sla-progress-fill" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>
            ) : (
              /* Simplified SLA for Employee View */
              <div className="meta-rows-list">
                <div className="meta-row-item">
                  <span className="meta-label">Expected Response</span>
                  <span className="meta-value">Within 4 hours</span>
                </div>
                <div className="meta-row-item">
                  <span className="meta-label">Expected Resolution</span>
                  <span className="meta-value">Within 1 working day</span>
                </div>
              </div>
            )}
          </div>

          {/* CARD 4: ATTACHMENTS CARD */}
          <div className="sidebar-info-card">
            <div className="sidebar-card-header">
              <span className="sidebar-card-title">Attachments</span>
              <Paperclip size={15} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div className="compact-attachment-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Paperclip size={13} style={{ color: 'var(--color-primary-600)' }} />
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>attendance-aug17.png</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>(245 KB)</span>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <IconButton
                    icon={<Eye size={13} />}
                    ariaLabel="Preview"
                    variant="ghost"
                    size="sm"
                    onClick={() => onShowToast('info', 'Previewing File', 'Previewing attendance-aug17.png')}
                  />
                  <IconButton
                    icon={<Download size={13} />}
                    ariaLabel="Download"
                    variant="ghost"
                    size="sm"
                    onClick={() => onShowToast('info', 'Downloading File', 'Downloading attendance-aug17.png')}
                  />
                </div>
              </div>

              <div className="compact-attachment-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Paperclip size={13} style={{ color: 'var(--color-primary-600)' }} />
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>attendance-record.pdf</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>(182 KB)</span>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <IconButton
                    icon={<Eye size={13} />}
                    ariaLabel="Preview"
                    variant="ghost"
                    size="sm"
                    onClick={() => onShowToast('info', 'Previewing File', 'Previewing attendance-record.pdf')}
                  />
                  <IconButton
                    icon={<Download size={13} />}
                    ariaLabel="Download"
                    variant="ghost"
                    size="sm"
                    onClick={() => onShowToast('info', 'Downloading File', 'Downloading attendance-record.pdf')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 5: ACTIVITY HISTORY AUDIT TIMELINE */}
          <div className="sidebar-info-card">
            <div className="sidebar-card-header">
              <span className="sidebar-card-title">Change History</span>
              <ShieldAlert size={15} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="timeline-audit-list">
              {[...visibleActivities].reverse().map(act => (
                <div key={act.id} className="timeline-audit-item">
                  <div className="timeline-dot-icon" />
                  <div>
                    <div className="timeline-audit-text">{act.title}</div>
                    <div className="timeline-audit-meta">
                      {act.actor && <span className="timeline-audit-actor">{act.actor}</span>}
                      <span className="timeline-audit-time">{act.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RESOLVE CONFIRMATION MODAL */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Resolve Ticket ${ticketId}`}
        subtitle="Select a closing reason and confirm resolution details."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsResolveModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleConfirmResolve}
              disabled={!canSubmitClosingReason(resolveReasonId, resolveComment)}
            >
              Resolve Ticket
            </Button>
          </>
        }
      >
        <ClosingReasonFields
          context="resolve"
          selectedReasonId={resolveReasonId}
          onReasonChange={setResolveReasonId}
          comment={resolveComment}
          onCommentChange={setResolveComment}
          commentLabel="Resolution details"
          commentPlaceholder="Describe how this request was resolved..."
        />
      </Modal>

      {/* CLOSE TICKET MODAL */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title={`Close Ticket ${ticketId}`}
        subtitle="Select why this ticket is being closed without resolving."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCloseModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleConfirmClose}
              disabled={!canSubmitClosingReason(closeReasonId, closeComment)}
            >
              Close Ticket
            </Button>
          </>
        }
      >
        <ClosingReasonFields
          context="close"
          selectedReasonId={closeReasonId}
          onReasonChange={setCloseReasonId}
          comment={closeComment}
          onCommentChange={setCloseComment}
          commentLabel="Closing note"
          commentPlaceholder="Explain why this ticket is being closed..."
        />
      </Modal>

      {/* REOPEN CONFIRMATION MODAL */}
      <Modal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        title={`Reopen Ticket ${ticketId}`}
        subtitle="Specify the reason why this ticket needs to be reopened."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReopenModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmReopen}>Reopen Ticket</Button>
          </>
        }
      >
        <FormField label="Reason for Reopening" required>
          <TextareaInput
            value={reopenReason}
            onChange={e => setReopenReason(e.target.value)}
            placeholder="Explain what additional work or verification is required..."
            rows={3}
          />
        </FormField>
      </Modal>

      {/* REASSIGN AGENT MODAL */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title={`Reassign Ticket ${ticketId}`}
        subtitle="Select a new support agent for this request."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReassignModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmReassign}>Confirm Reassign</Button>
          </>
        }
      >
        <FormField label="Select Agent">
          <SelectInput value={newAgentSelection} onChange={e => setNewAgentSelection(e.target.value)}>
            <option value="Rahul Sharma">Rahul Sharma (HR Support Lead)</option>
            <option value="Priya Shah">Priya Shah (HR Support Agent)</option>
            <option value="Vikram Malhotra">Vikram Malhotra (Payroll Specialist)</option>
            <option value="Ananya Roy">Ananya Roy (IT Support Lead)</option>
          </SelectInput>
        </FormField>
      </Modal>
    </div>
  );
};
