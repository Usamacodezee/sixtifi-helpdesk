export type ClosingReasonContext = 'resolve' | 'close' | 'spam' | 'duplicate';

export interface ClosingReason {
  id: string;
  label: string;
  description?: string;
  context: ClosingReasonContext;
  requiresComment: boolean;
  status: 'Active' | 'Inactive';
}

export const CLOSING_REASONS_UPDATED_EVENT = 'sixtifi-closing-reasons-updated';
const STORAGE_KEY = 'sixtifi-helpdesk-closing-reasons';

export const DEFAULT_CLOSING_REASONS: ClosingReason[] = [
  {
    id: 'cr-resolve-fixed',
    label: 'Fixed / Issue corrected',
    description: 'Issue was corrected and verified.',
    context: 'resolve',
    requiresComment: true,
    status: 'Active'
  },
  {
    id: 'cr-resolve-info',
    label: 'Information provided',
    description: 'Employee question answered with sufficient detail.',
    context: 'resolve',
    requiresComment: true,
    status: 'Active'
  },
  {
    id: 'cr-resolve-policy',
    label: 'Policy clarified',
    description: 'Workforce policy or process was explained.',
    context: 'resolve',
    requiresComment: false,
    status: 'Active'
  },
  {
    id: 'cr-resolve-completed',
    label: 'Request completed',
    description: 'Requested action was completed successfully.',
    context: 'resolve',
    requiresComment: true,
    status: 'Active'
  },
  {
    id: 'cr-close-no-action',
    label: 'Closed — no action required',
    description: 'Ticket closed without further work needed.',
    context: 'close',
    requiresComment: false,
    status: 'Active'
  },
  {
    id: 'cr-close-cancelled',
    label: 'Cancelled by requester',
    description: 'Employee withdrew or cancelled the request.',
    context: 'close',
    requiresComment: false,
    status: 'Active'
  },
  {
    id: 'cr-close-no-response',
    label: 'No response from employee',
    description: 'Closed after waiting for employee reply.',
    context: 'close',
    requiresComment: true,
    status: 'Active'
  },
  {
    id: 'cr-spam',
    label: 'Spam / invalid request',
    description: 'Not a valid helpdesk request.',
    context: 'spam',
    requiresComment: false,
    status: 'Active'
  },
  {
    id: 'cr-duplicate',
    label: 'Duplicate ticket',
    description: 'Same issue tracked on another ticket.',
    context: 'duplicate',
    requiresComment: false,
    status: 'Active'
  }
];

export function getClosingReasons(): ClosingReason[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CLOSING_REASONS;
    const parsed = JSON.parse(raw) as ClosingReason[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CLOSING_REASONS;
  } catch {
    return DEFAULT_CLOSING_REASONS;
  }
}

export function saveClosingReasons(reasons: ClosingReason[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reasons));
  window.dispatchEvent(new CustomEvent(CLOSING_REASONS_UPDATED_EVENT));
}

export function getClosingReasonById(id: string): ClosingReason | undefined {
  return getClosingReasons().find(item => item.id === id);
}

export function getClosingReasonsByContext(context: ClosingReasonContext): ClosingReason[] {
  return getClosingReasons().filter(item => item.status === 'Active' && item.context === context);
}

export function getDefaultClosingReasonId(context: ClosingReasonContext): string {
  return getClosingReasonsByContext(context)[0]?.id || '';
}

export function isClosingCommentRequired(reasonId: string): boolean {
  const reason = getClosingReasonById(reasonId);
  return reason?.requiresComment ?? true;
}
