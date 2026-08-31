export type QuickReplyScope = 'public' | 'internal' | 'both';
export type QuickReplyCategory = 'General' | 'Attendance' | 'Payroll' | 'Leave' | 'HR' | 'IT' | 'Administration';

export interface QuickReply {
  id: string;
  title: string;
  body: string;
  category: QuickReplyCategory;
  scope: QuickReplyScope;
  status: 'Active' | 'Inactive';
}

export const QUICK_REPLIES_UPDATED_EVENT = 'sixtifi-quick-replies-updated';
const STORAGE_KEY = 'sixtifi-helpdesk-quick-replies';
/** Legacy key — migrated once on first read */
const LEGACY_STORAGE_KEY = 'sixtifi-helpdesk-canned-responses';

export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    id: 'qr-1',
    title: 'Acknowledge receipt',
    body: 'Hi {{requester}}, thank you for raising this request. We have received ticket {{ticketId}} and a support agent is reviewing it now.',
    category: 'General',
    scope: 'public',
    status: 'Active'
  },
  {
    id: 'qr-2',
    title: 'Request more details',
    body: 'Hi {{requester}}, to proceed with ticket {{ticketId}}, please share the date, shift timing, and any supporting details or screenshots.',
    category: 'General',
    scope: 'public',
    status: 'Active'
  },
  {
    id: 'qr-3',
    title: 'Missing punch — next steps',
    body: 'Hi {{requester}}, we are checking your attendance record for the date mentioned. If approved, the punch will be regularized within 1 working day.',
    category: 'Attendance',
    scope: 'public',
    status: 'Active'
  },
  {
    id: 'qr-4',
    title: 'Payroll query timeline',
    body: 'Hi {{requester}}, payroll queries are typically resolved within 2 working days. We will update you on ticket {{ticketId}} once verification is complete.',
    category: 'Payroll',
    scope: 'public',
    status: 'Active'
  },
  {
    id: 'qr-5',
    title: 'Waiting on employee reply',
    body: 'Hi {{requester}}, we need your reply on ticket {{ticketId}} before we can continue. Please respond at your earliest convenience.',
    category: 'General',
    scope: 'public',
    status: 'Active'
  },
  {
    id: 'qr-6',
    title: 'Internal — verified with site',
    body: 'Verified attendance logs with site supervisor. Proceeding with regularization on ticket {{ticketId}}.',
    category: 'Attendance',
    scope: 'internal',
    status: 'Active'
  },
  {
    id: 'qr-7',
    title: 'Internal — escalate to payroll',
    body: 'Escalating to Payroll Ops for deduction review. Hold public reply until payroll confirms.',
    category: 'Payroll',
    scope: 'internal',
    status: 'Active'
  }
];

export function getQuickReplies(): QuickReply[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return DEFAULT_QUICK_REPLIES;
    const parsed = JSON.parse(raw) as QuickReply[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return DEFAULT_QUICK_REPLIES;
  } catch {
    return DEFAULT_QUICK_REPLIES;
  }
}

export function saveQuickReplies(replies: QuickReply[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(replies));
  window.dispatchEvent(new CustomEvent(QUICK_REPLIES_UPDATED_EVENT));
}

export function notifyQuickRepliesUpdated(): void {
  window.dispatchEvent(new CustomEvent(QUICK_REPLIES_UPDATED_EVENT));
}

export function applyQuickReplyVariables(
  body: string,
  variables: Record<string, string>
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`);
}

export function filterQuickReplies(
  replies: QuickReply[],
  replyScope: 'public' | 'internal',
  searchQuery = ''
): QuickReply[] {
  const query = searchQuery.trim().toLowerCase();

  return replies.filter(item => {
    if (item.status !== 'Active') return false;
    if (item.scope !== 'both' && item.scope !== replyScope) return false;
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      item.body.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });
}
