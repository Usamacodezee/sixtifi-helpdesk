export type CannedResponseScope = 'public' | 'internal' | 'both';
export type CannedResponseCategory = 'General' | 'Attendance' | 'Payroll' | 'Leave' | 'HR' | 'IT' | 'Administration';

export interface CannedResponse {
  id: string;
  title: string;
  body: string;
  category: CannedResponseCategory;
  scope: CannedResponseScope;
  status: 'Active' | 'Inactive';
}

export const CANNED_RESPONSES_UPDATED_EVENT = 'sixtifi-canned-responses-updated';
const STORAGE_KEY = 'sixtifi-helpdesk-canned-responses';

export const DEFAULT_CANNED_RESPONSES: CannedResponse[] = [
  {
    id: 'cr-1',
    title: 'Acknowledge receipt',
    body: 'Hi {{requester}}, thank you for raising this request. We have received ticket {{ticketId}} and a support agent is reviewing it now.',
    category: 'General',
    scope: 'public',
    status: 'Active'
  },
  {
    id: 'cr-2',
    title: 'Request more details',
    body: 'Hi {{requester}}, to proceed with ticket {{ticketId}}, please share the date, shift timing, and any supporting details or screenshots.',
    category: 'General',
    scope: 'public',
    status: 'Active'
  },
  {
    id: 'cr-3',
    title: 'Missing punch — next steps',
    body: 'Hi {{requester}}, we are checking your attendance record for the date mentioned. If approved, the punch will be regularized within 1 working day.',
    category: 'Attendance',
    scope: 'public',
    status: 'Active'
  },
  {
    id: 'cr-4',
    title: 'Payroll query timeline',
    body: 'Hi {{requester}}, payroll queries are typically resolved within 2 working days. We will update you on ticket {{ticketId}} once verification is complete.',
    category: 'Payroll',
    scope: 'public',
    status: 'Active'
  },
  {
    id: 'cr-5',
    title: 'Waiting on employee reply',
    body: 'Hi {{requester}}, we need your reply on ticket {{ticketId}} before we can continue. Please respond at your earliest convenience.',
    category: 'General',
    scope: 'public',
    status: 'Active'
  },
  {
    id: 'cr-6',
    title: 'Internal — verified with site',
    body: 'Verified attendance logs with site supervisor. Proceeding with regularization on ticket {{ticketId}}.',
    category: 'Attendance',
    scope: 'internal',
    status: 'Active'
  },
  {
    id: 'cr-7',
    title: 'Internal — escalate to payroll',
    body: 'Escalating to Payroll Ops for deduction review. Hold public reply until payroll confirms.',
    category: 'Payroll',
    scope: 'internal',
    status: 'Active'
  }
];

export function getCannedResponses(): CannedResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CANNED_RESPONSES;
    const parsed = JSON.parse(raw) as CannedResponse[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CANNED_RESPONSES;
  } catch {
    return DEFAULT_CANNED_RESPONSES;
  }
}

export function saveCannedResponses(responses: CannedResponse[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
  window.dispatchEvent(new CustomEvent(CANNED_RESPONSES_UPDATED_EVENT));
}

export function notifyCannedResponsesUpdated(): void {
  window.dispatchEvent(new CustomEvent(CANNED_RESPONSES_UPDATED_EVENT));
}

export function applyCannedResponseVariables(
  body: string,
  variables: Record<string, string>
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`);
}

export function filterCannedResponses(
  responses: CannedResponse[],
  replyScope: 'public' | 'internal',
  searchQuery = ''
): CannedResponse[] {
  const query = searchQuery.trim().toLowerCase();

  return responses.filter(item => {
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
