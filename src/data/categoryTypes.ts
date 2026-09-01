export type CategoryAudience = 'all' | 'employees' | 'groups';
export type TicketPriorityLevel = 'Urgent' | 'High' | 'Medium' | 'Low';
export type CategoryBusinessHoursMode = 'shift-hours' | '24-hour';
export type NotificationChannel = 'in-app' | 'email' | 'both';

export interface CategoryAssignee {
  id: string;
  name: string;
  type: 'employee' | 'role';
  initials: string;
}

/** Per-category notification rules (company-scoped via the parent category). */
export interface CategoryNotificationRules {
  enabled: boolean;
  channel: NotificationChannel;
  notifyEmpOnCreate: boolean;
  notifyEmpOnReply: boolean;
  notifyEmpOnResolve: boolean;
  notifyAgentOnAssign: boolean;
}

export interface CategoryAudienceConfig {
  type: CategoryAudience;
  employeeIds: string[];
  groupIds: string[];
}

/** List/shell record — full config lives in categoryConfig versioning store. */
export interface HelpdeskCategory {
  id: string;
  companyId: string;
  name: string;
  description: string;
  totalTickets: number;
  openTickets: number;
  assignedTeam: string;
  status: 'Active' | 'Inactive';
  lastUpdated: string;
}

export const PRIORITY_LEVELS: TicketPriorityLevel[] = ['Urgent', 'High', 'Medium', 'Low'];

export const DEFAULT_CATEGORY_NOTIFICATIONS: CategoryNotificationRules = {
  enabled: true,
  channel: 'both',
  notifyEmpOnCreate: true,
  notifyEmpOnReply: true,
  notifyEmpOnResolve: true,
  notifyAgentOnAssign: true
};

export const CATEGORY_BUSINESS_HOURS_OPTIONS: Array<{
  value: CategoryBusinessHoursMode;
  label: string;
  description: string;
}> = [
  {
    value: 'shift-hours',
    label: 'Working hours only',
    description: 'SLA clock pauses outside the assigned agent’s working hours.'
  },
  {
    value: '24-hour',
    label: 'Full day (24 hour)',
    description: 'SLA clock runs continuously, including nights and weekends.'
  }
];

export const businessHoursLabel = (mode: CategoryBusinessHoursMode): string =>
  CATEGORY_BUSINESS_HOURS_OPTIONS.find(o => o.value === mode)?.label || mode;

export const notificationChannelLabel = (channel: NotificationChannel): string => {
  if (channel === 'in-app') return 'In-app only';
  if (channel === 'email') return 'Email only';
  return 'In-app and email';
};

export const audienceLabel = (audience: CategoryAudienceConfig): string => {
  if (audience.type === 'all') return 'Everyone in this company';
  if (audience.type === 'employees') {
    const n = audience.employeeIds.length;
    return n === 0 ? 'Selected employees (none yet)' : `${n} selected employee${n === 1 ? '' : 's'}`;
  }
  const n = audience.groupIds.length;
  return n === 0 ? 'Selected groups (none yet)' : `${n} selected group${n === 1 ? '' : 's'}`;
};
